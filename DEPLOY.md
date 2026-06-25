# Companion — Deployment Runbook

How the app is deployed and how to ship updates. There is no CI/CD; the
frontend auto-deploys via Vercel's GitHub integration, the backend is a manual
Docker → Azure flow.

## Architecture

| Tier | Platform | Identifier |
|------|----------|-----------|
| Frontend | Vercel (Hobby) | `companion-lime.vercel.app` · root `companion-frontend` · branch `main` (auto-deploy on push) |
| Backend | Azure Container Apps | `companion-backend` · RG `companion-rg` · East Asia · scale-to-zero |
| Registry | Azure Container Registry | `companionregistry01.azurecr.io` |
| Database | Azure PostgreSQL Flexible | `companion-db-01` / db `companion_db` / user `companionadmin` |

Backend URL: `https://companion-backend.ambitiousisland-bb0c2789.eastasia.azurecontainerapps.io`

## Prerequisites
- Docker Desktop **running** (builds target `linux/amd64`).
- `az login` (the *Azure for Students* subscription that owns `companion-rg`).
- `psql` client (for DB migrations).

---

## Frontend — automatic
Push to `main` → Vercel builds and deploys. Verify under **Vercel → Companion → Deployments**
(latest commit should go **Ready**). No new env vars unless you add one;
`NEXT_PUBLIC_API_URL` already points at the backend URL.

## Backend — manual
```bash
cd companion-backend
./mvnw clean package -DskipTests        # produces target/backend-0.0.1-SNAPSHOT.jar

az acr login --name companionregistry01

# Bump the tag — check the current live one, then increment (v1, v2, v3, v4, …)
az containerapp show -n companion-backend -g companion-rg \
  --query "properties.template.containers[0].image" -o tsv

docker build --platform linux/amd64 --provenance=false \
  -t companionregistry01.azurecr.io/companion-backend:vN .
docker push companionregistry01.azurecr.io/companion-backend:vN

az containerapp update -n companion-backend -g companion-rg \
  --image companionregistry01.azurecr.io/companion-backend:vN
```
**Gotchas**
- `--platform linux/amd64 --provenance=false` is **mandatory** — Azure Container Apps
  rejects multi-platform manifest lists with "invalid operating system".
- Each `update` creates a new **revision** (~60s). Scale-to-zero means the first
  request after idle **cold-starts** (a few seconds).

## DB migrations
Azure PostgreSQL Flexible has **no Portal query editor** — use **Azure Cloud Shell**
(the `>_` icon in the portal; it runs from Azure IPs, so enable
*"Allow public access from any Azure service"* on the server's Networking), or run
locally behind a temporary firewall rule:
```bash
MYIP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create -g companion-rg --name companion-db-01 \
  --rule-name temp --start-ip-address "$MYIP" --end-ip-address "$MYIP"

psql "host=companion-db-01.postgres.database.azure.com port=5432 dbname=companion_db user=companionadmin sslmode=require" \
  -c "<SQL>"

az postgres flexible-server firewall-rule delete -g companion-rg --name companion-db-01 \
  --rule-name temp --yes
```
Hibernate `ddl-auto: update` adds new **columns/tables** automatically on startup.
For a column that gates existing users, pre-add it with a safe default to avoid a
lockout window, e.g.:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT true;
```

## Backend env vars (set on the Container App)
`DB_URL` · `DB_USERNAME` · `DB_PASSWORD` · `JWT_SECRET` · `MAIL_HOST` · `MAIL_PORT` ·
`MAIL_USERNAME` · `MAIL_PASSWORD` · `FRONTEND_BASE_URL` · `CORS_ALLOWED_ORIGINS`
(must include the Vercel prod URL). `MAIL_*` must be a real Gmail address + app
password or verification emails won't send.

## Smoke tests
```bash
BASE=https://companion-backend.ambitiousisland-bb0c2789.eastasia.azurecontainerapps.io
curl -i "$BASE/api/auth/verify-email?token=bogus"   # 400 = backend up & new code live
```

## Deploy order
When a change spans both tiers (e.g. the frontend calls a new backend endpoint),
deploy/migrate the **backend first** (or together) so the live frontend never calls
a missing endpoint.

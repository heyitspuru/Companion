# Companion — The Fireteam Pivot

> **One sentence:** Companion is a *fireteam* for your goals — a small, hand-picked
> unit (≤5) on a shared mission, where you carry each other and **leave no one behind.**

This document is the product spec + phased roadmap for turning the current
"gamified accountability group" into a high-trust squad. It supersedes the
competitive framing (leaderboards, single-winner badges) described in `README.md`.

---

## 1. The thesis

Accountability dies in a crowd (diffusion of responsibility) and is fragile in a
pair (one drop = collapse). It *thrives* in a small, chosen unit — the military
fireteam: 4–5 people, redundant, with a shared identity. People don't push
through for a badge; they push through so they don't let the three people next
to them down.

The current product is built on **competition** (rank your buddies, crown one
winner). For a trust unit that is backwards. We rebuild on **cohesion**:
win together, lose together, and — the real magic — **rally before anyone breaks.**

## 2. What we are saying NO to (the cut list)

| Cut | Why | Code touched |
|-----|-----|--------------|
| Leaderboard ranking squadmates | Ranking divides a trust unit | `LeaderboardEntry`, `CircleService` leaderboard/stats, `getCircleLeaderboard`/`getCircleStats`, `circle/[id]` UI |
| Weekly badge to the single top performer | Crowns one, shames four | `BadgeService` winner logic, `Badge`, `BadgeController`, profile/circle badge UI |
| Circles up to 20 | A mob — no one feels responsible | cap → **5** (`CircleService` join, `CreateCircleRequest`) |
| Completion thresholds / custom % / 7–365 ranges | Project-management cosplay | `CompletionThreshold`, `CreateCircleRequest` fields |

We are not adding features. We are carving away everything that isn't *the squad*
until only the squad is left.

## 3. Vocabulary (the words are the product)

| Now | Becomes | Notes |
|-----|---------|-------|
| App name | **Companion** | unchanged |
| Circle | **Squad** | user-facing; internal entity can stay `Circle` to limit churn |
| Member | **Squadmate / buddy** | |
| Goal | **Mission** | the shared objective |
| Check-in | **Report in** | military cadence; "did you, and show them" |
| Leaderboard | **Squad Status** | who's in, who's at risk, the collective streak |

## 4. The core daily loop

```
Every day:
  1. Each squadmate REPORTS IN (with proof their squad can see).
  2. Squad Status shows the unit: ✓ in today, ⏳ not yet, ⚠ at risk.
  3. As the day's cutoff nears, anyone not in is flagged AT RISK.
  4. The squad RALLIES — one tap: "I've got you." The at-risk buddy is nudged.
  5. If the whole unit reports in → the SQUAD STREAK advances by one.
     If someone is left behind → the streak breaks for everyone.
```

The product is not the check-in. It's **step 4** — the moment your buddies notice
you're slipping and reach back.

## 5. The three mechanics (rules)

### 5a. Collective streak (shared fate)
- One streak **per squad**, not per person.
- A "squad day" is **complete** when **every active squadmate** reports in before
  the squad's daily cutoff. (v1 rule = unanimous. A softer "N-1" rule is an open
  question — see §9.)
- Squad streak = consecutive complete squad days. Track `current` + `longest`.
- Persist on the squad (new `SquadStreak` or fields on `Circle`); updated by the
  last report-in of the day and/or a daily rollover job.

### 5b. The rally (leave no one behind)
- **At-risk** = active squadmate who hasn't reported in AND `now >= cutoff - window`
  (e.g., within 2h of the daily cutoff), in the squad's timezone.
- When someone goes at-risk, the **rest of the squad** is notified: "Jordan's
  about to drop. Go get him."
- A squadmate taps **"I've got you"** → the at-risk member gets a nudge
  (notification) + a visible "Maya has your back" on their screen.
- Design rule: **emphasize the rally (prevent the break), not the punishment
  (shared loss).** A streak that just shatters breeds resentment; a streak the
  squad fought to save breeds cohesion. New entity: `Rally` (from, to, circle, date).

### 5c. Witnessed report-in (no lie button)
- `CheckIn` gains **proof**: a photo and/or a short note, visible to the squad.
- Optional v2: squadmates can **acknowledge** ("seen ✓"). No proof = the report
  doesn't count, or counts as "unverified" (open question §9).
- Requires blob storage (Azure Blob) + capture/view UI.

## 6. Data model changes (Flyway V3+)

- `Circle`: drop/ignore `completion_threshold`, `custom_threshold_percent`; cap
  members at 5; add `timezone` (IANA, e.g. `Asia/Kolkata`) and `daily_cutoff`
  (local time, default 21:00).
- New `squad_streak`: `circle_id`, `current_streak`, `longest_streak`,
  `last_complete_date`. (Or columns on `circle`.)
- `check_in`: add `proof_url` (nullable), `note` (nullable). Keep `completed`.
- New `rally`: `id`, `circle_id`, `from_user_id`, `to_user_id`, `rally_date`, `created_at`.
- Deprecate `badge` + `leaderboard_entry` (keep tables until UI is removed, then
  drop in a later migration).

Each step ships its own versioned migration (`V3__…`, `V4__…`) — they run on
deploy (Flyway baseline already set).

## 7. Phased roadmap

> Each phase is independently shippable and reuses the existing check-in/streak
> spine. Build order is chosen so the cheapest changes prove the thesis first.

### Phase 0 — Reframe (cheap, sets the tone)
- Cap squads at **5**; simplify mission creation to one field + dates.
- Rename Circle→Squad, Goal→Mission, etc. in the UI only.
- **Done when:** you can't create a 6-person squad and the app reads like a fireteam.

### Phase 1 — The cohesion flip
- Remove leaderboard + winner-badge (backend endpoints + UI).
- Add the **collective squad streak** (entity + update on report-in).
- Build the **Squad Status** view: today's ✓/⏳, the shared streak, mission dates.
- **Done when:** the unit wins/loses *together*; no squadmate is ranked against another.

### Phase 2 — The rally (the emotional core)
- Per-squad **timezone + daily cutoff** (fixes the latent server-time bug, §8).
- **At-risk** detection + notify the squad.
- **"I've got you"** action + nudge to the at-risk buddy (`Rally` entity).
- **Done when:** at 8pm, a slipping buddy gets pulled back by their squad.

### Phase 3 — Witnessed report-in
- Azure Blob Storage; `proof_url`/`note` on check-in; capture + squad view UI.
- Optional "seen ✓" acknowledgement.
- **Done when:** a report-in is something your squad *saw*, not a button you tapped.

### Phase 4 — Cold-start / recruiting (the real growth wall)
- Frictionless squad creation + **shareable invite links** (extends existing
  invite-code join).
- Empty/"recruiting" states: "Your fireteam: 2/5. Pull in the rest."
- **Done when:** standing up a real squad with friends takes under 2 minutes.

### Phase 5 — (later) Shared wins
- Replace individual badges with **squad milestones** earned together
  (e.g., "30-day unit streak"), and a mission-complete moment for the whole unit.

## 8. Cross-cutting concerns

- **Timezone (must-fix):** check-ins/streaks currently use server `LocalDate.now()`
  (`CheckInService`). For a daily-habit product across timezones this is a real
  correctness bug — "today" and "8pm cutoff" are undefined without a timezone.
  Phase 2 introduces per-squad timezone; do not ship the rally without it.
- **Notifications:** the rally needs a channel. Start with **email** (existing
  `JavaMailSender`) + **in-app**; add **web push (PWA)** later for the 8pm nudge.
- **Storage:** witnessed proof → Azure Blob Storage (new infra, IAM, signed URLs).
- **Cold-start:** the hardest non-code problem. A solo app works alone tonight; a
  fireteam needs you to recruit 4 trusted people. Phase 4 is where the product
  earns its keep — make squad setup and invites effortless.

## 9. Open questions (decide before/within each phase)

1. **Streak rule:** unanimous ("all 5 in") or forgiving ("N-1 in")? Unanimous is
   higher-stakes and more cohesive but punishes the group for one flake — which is
   exactly why the *rally* must come first. Lean unanimous + strong rally.
2. **No-proof report-in:** doesn't count, or counts as "unverified"? (Phase 3.)
3. **Rename depth:** rename `Circle`→`Squad` only in UI, or also in code/DB? (UI-only
   first to limit churn.)
4. **Squad size floor:** does a 1-person squad make sense, or is the minimum 2–3?
5. **Missed-day grace:** any "freeze"/rest-day mechanic, or is the streak unforgiving?
```

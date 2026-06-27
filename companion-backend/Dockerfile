# syntax=docker/dockerfile:1
# ── Build stage ─────────────────────────────────────────────────────────────
# Compiles the jar INSIDE the image so `docker build` alone always ships current
# code. (The old single-stage Dockerfile COPY'd a pre-built target/*.jar, which
# silently shipped a stale jar whenever you forgot to run `mvnw package` first.)
# Maven + JDK 21 build; bytecode targets Java 17 (pom java.version), so it runs
# fine on the JRE 19 runtime below.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

# The --mount=type=cache keeps the Maven repo (~/.m2) across builds, so
# dependencies download once and subsequent builds are fast — without a separate
# brittle `dependency:go-offline` layer. A transient download failure just
# re-resolves the missing artifact on the next run instead of failing the whole
# dependency set. Tests run in CI / locally (`./mvnw test`); skipped here to keep
# image builds fast and deterministic.
RUN --mount=type=cache,target=/root/.m2 mvn -B -q clean package -DskipTests

# ── Runtime stage ───────────────────────────────────────────────────────────
# Slim JRE-only image — no Maven, no JDK, no source.
FROM eclipse-temurin:19-jre-alpine
WORKDIR /app

# Wildcard so a version bump in pom.xml doesn't require editing this line.
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

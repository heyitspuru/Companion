package com.companion.backend.common;

/**
 * Resolves the single frontend origin used to build links in emails.
 *
 * FRONTEND_BASE_URL is sometimes (mis)configured with the same comma-separated
 * value as CORS_ALLOWED_ORIGINS. Since this gets concatenated into a clickable
 * link, a list would produce a malformed URL whose embedded second origin — a
 * pinned/stale deployment — is what email clients linkify, sending users to the
 * old build. Defensively take only the first entry and strip any trailing slash.
 */
public final class AppUrls {

    private AppUrls() {}

    public static String frontendBaseUrl() {
        String raw = System.getenv().getOrDefault("FRONTEND_BASE_URL", "http://localhost:3000");
        String first = raw.split(",")[0].trim();
        if (first.endsWith("/")) {
            first = first.substring(0, first.length() - 1);
        }
        return first;
    }
}

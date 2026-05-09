package com.companion.backend.auth;

public class AuthResponse {

    private String token;
    private String username;
    private String email;

    public AuthResponse() {}

    public AuthResponse(String token, String username, String email) {
        this.token = token;
        this.username = username;
        this.email = email;
    }

    // Getters
    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }

    // Setters
    public void setToken(String token) { this.token = token; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String token;
        private String username;
        private String email;

        public Builder token(String token) { this.token = token; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder email(String email) { this.email = email; return this; }

        public AuthResponse build() {
            return new AuthResponse(token, username, email);
        }
    }
}
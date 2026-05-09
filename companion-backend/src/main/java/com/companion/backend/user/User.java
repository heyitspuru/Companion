package com.companion.backend.user;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_admin", nullable = false, columnDefinition = "boolean default false")
    private boolean admin = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isAdmin() { return admin; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setAdmin(boolean admin) { this.admin = admin; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String username;
        private String email;
        private String password;
        private boolean admin = false;

        public Builder username(String username) { this.username = username; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder admin(boolean admin) { this.admin = admin; return this; }

        public User build() {
            User user = new User();
            user.setUsername(this.username);
            user.setEmail(this.email);
            user.setPassword(this.password);
            user.setAdmin(this.admin);
            return user;
        }
    }
}
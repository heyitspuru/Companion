package com.companion.backend.circle;

import com.companion.backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "circle_members")
public class CircleMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "circle_id", nullable = false)
    private Circle circle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Circle getCircle() { return circle; }
    public User getUser() { return user; }
    public LocalDateTime getJoinedAt() { return joinedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setCircle(Circle circle) { this.circle = circle; }
    public void setUser(User user) { this.user = user; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Circle circle;
        private User user;

        public Builder circle(Circle circle) { this.circle = circle; return this; }
        public Builder user(User user) { this.user = user; return this; }

        public CircleMember build() {
            CircleMember member = new CircleMember();
            member.setCircle(this.circle);
            member.setUser(this.user);
            return member;
        }
    }
}
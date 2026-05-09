package com.companion.backend.checkin;

import com.companion.backend.circle.Circle;
import com.companion.backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "streaks",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "circle_id"}
        ))
public class Streak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "circle_id", nullable = false)
    private Circle circle;

    @Column(name = "current_streak", nullable = false)
    private Integer currentStreak = 0;

    @Column(name = "longest_streak", nullable = false)
    private Integer longestStreak = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Circle getCircle() { return circle; }
    public Integer getCurrentStreak() { return currentStreak; }
    public Integer getLongestStreak() { return longestStreak; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setCircle(Circle circle) { this.circle = circle; }
    public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }
    public void setLongestStreak(Integer longestStreak) { this.longestStreak = longestStreak; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User user;
        private Circle circle;
        private Integer currentStreak = 0;
        private Integer longestStreak = 0;

        public Builder user(User user) { this.user = user; return this; }
        public Builder circle(Circle circle) { this.circle = circle; return this; }
        public Builder currentStreak(Integer currentStreak) { this.currentStreak = currentStreak; return this; }
        public Builder longestStreak(Integer longestStreak) { this.longestStreak = longestStreak; return this; }

        public Streak build() {
            Streak s = new Streak();
            s.setUser(this.user);
            s.setCircle(this.circle);
            s.setCurrentStreak(this.currentStreak);
            s.setLongestStreak(this.longestStreak);
            return s;
        }
    }
}
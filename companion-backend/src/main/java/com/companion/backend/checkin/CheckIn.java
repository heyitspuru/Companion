package com.companion.backend.checkin;

import com.companion.backend.circle.Circle;
import com.companion.backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "checkins",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "circle_id", "checkin_date"}
        ))
public class CheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "circle_id", nullable = false)
    private Circle circle;

    @Column(name = "checkin_date", nullable = false)
    private LocalDate checkinDate;

    @Column(nullable = false)
    private Boolean completed;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Circle getCircle() { return circle; }
    public LocalDate getCheckinDate() { return checkinDate; }
    public Boolean getCompleted() { return completed; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setCircle(Circle circle) { this.circle = circle; }
    public void setCheckinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; }
    public void setCompleted(Boolean completed) { this.completed = completed; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User user;
        private Circle circle;
        private LocalDate checkinDate;
        private Boolean completed;

        public Builder user(User user) { this.user = user; return this; }
        public Builder circle(Circle circle) { this.circle = circle; return this; }
        public Builder checkinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; return this; }
        public Builder completed(Boolean completed) { this.completed = completed; return this; }

        public CheckIn build() {
            CheckIn c = new CheckIn();
            c.setUser(this.user);
            c.setCircle(this.circle);
            c.setCheckinDate(this.checkinDate);
            c.setCompleted(this.completed);
            return c;
        }
    }
}
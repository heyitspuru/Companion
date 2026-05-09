package com.companion.backend.badge;

import com.companion.backend.circle.Circle;
import com.companion.backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "badges")
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "circle_id", nullable = false)
    private Circle circle;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "week_end", nullable = false)
    private LocalDate weekEnd;

    @Column(name = "checkin_count", nullable = false)
    private Integer checkinCount;

    @Column(name = "awarded_at")
    private LocalDateTime awardedAt;

    @PrePersist
    protected void onCreate() {
        awardedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Circle getCircle() { return circle; }
    public LocalDate getWeekStart() { return weekStart; }
    public LocalDate getWeekEnd() { return weekEnd; }
    public Integer getCheckinCount() { return checkinCount; }
    public LocalDateTime getAwardedAt() { return awardedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setCircle(Circle circle) { this.circle = circle; }
    public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }
    public void setWeekEnd(LocalDate weekEnd) { this.weekEnd = weekEnd; }
    public void setCheckinCount(Integer checkinCount) { this.checkinCount = checkinCount; }
    public void setAwardedAt(LocalDateTime awardedAt) { this.awardedAt = awardedAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User user;
        private Circle circle;
        private LocalDate weekStart;
        private LocalDate weekEnd;
        private Integer checkinCount;

        public Builder user(User user) { this.user = user; return this; }
        public Builder circle(Circle circle) { this.circle = circle; return this; }
        public Builder weekStart(LocalDate weekStart) { this.weekStart = weekStart; return this; }
        public Builder weekEnd(LocalDate weekEnd) { this.weekEnd = weekEnd; return this; }
        public Builder checkinCount(Integer checkinCount) { this.checkinCount = checkinCount; return this; }

        public Badge build() {
            Badge b = new Badge();
            b.setUser(this.user);
            b.setCircle(this.circle);
            b.setWeekStart(this.weekStart);
            b.setWeekEnd(this.weekEnd);
            b.setCheckinCount(this.checkinCount);
            return b;
        }
    }
}
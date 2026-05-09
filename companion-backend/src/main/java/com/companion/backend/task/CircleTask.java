package com.companion.backend.task;

import com.companion.backend.circle.Circle;
import com.companion.backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "circle_tasks")
public class CircleTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "circle_id", nullable = false)
    private Circle circle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Circle getCircle() { return circle; }
    public User getUser() { return user; }
    public String getTitle() { return title; }
    public Integer getDisplayOrder() { return displayOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setCircle(Circle circle) { this.circle = circle; }
    public void setUser(User user) { this.user = user; }
    public void setTitle(String title) { this.title = title; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Circle circle;
        private User user;
        private String title;
        private Integer displayOrder;

        public Builder circle(Circle circle) { this.circle = circle; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder displayOrder(Integer displayOrder) { this.displayOrder = displayOrder; return this; }

        public CircleTask build() {
            CircleTask t = new CircleTask();
            t.setCircle(this.circle);
            t.setUser(this.user);
            t.setTitle(this.title);
            t.setDisplayOrder(this.displayOrder);
            return t;
        }
    }
}
package com.companion.backend.task;

import com.companion.backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_checkins",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"task_id", "user_id", "checkin_date"}
        ))
public class TaskCheckin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private CircleTask task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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
    public CircleTask getTask() { return task; }
    public User getUser() { return user; }
    public LocalDate getCheckinDate() { return checkinDate; }
    public Boolean getCompleted() { return completed; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setTask(CircleTask task) { this.task = task; }
    public void setUser(User user) { this.user = user; }
    public void setCheckinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; }
    public void setCompleted(Boolean completed) { this.completed = completed; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private CircleTask task;
        private User user;
        private LocalDate checkinDate;
        private Boolean completed;

        public Builder task(CircleTask task) { this.task = task; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder checkinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; return this; }
        public Builder completed(Boolean completed) { this.completed = completed; return this; }

        public TaskCheckin build() {
            TaskCheckin tc = new TaskCheckin();
            tc.setTask(this.task);
            tc.setUser(this.user);
            tc.setCheckinDate(this.checkinDate);
            tc.setCompleted(this.completed);
            return tc;
        }
    }
}
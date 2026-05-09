package com.companion.backend.circle;

import com.companion.backend.goal.Goal;
import com.companion.backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "circles")
public class Circle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "circle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CircleMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "circle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Goal> goals = new ArrayList<>();

    @Column(name = "invite_code", unique = true)
    private String inviteCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "completion_threshold", nullable = false)
    private CompletionThreshold completionThreshold = CompletionThreshold.ANY_TASK;

    @Column(name = "custom_threshold_percent")
    private Integer customThresholdPercent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CircleStatus status = CircleStatus.ACTIVE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public User getCreatedBy() { return createdBy; }
    public List<CircleMember> getMembers() { return members; }
    public List<Goal> getGoals() { return goals; }
    public String getInviteCode() { return inviteCode; }
    public CompletionThreshold getCompletionThreshold() { return completionThreshold; }
    public Integer getCustomThresholdPercent() { return customThresholdPercent; }
    public CircleStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public void setMembers(List<CircleMember> members) { this.members = members; }
    public void setGoals(List<Goal> goals) { this.goals = goals; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
    public void setCompletionThreshold(CompletionThreshold completionThreshold) { this.completionThreshold = completionThreshold; }
    public void setCustomThresholdPercent(Integer customThresholdPercent) { this.customThresholdPercent = customThresholdPercent; }
    public void setStatus(CircleStatus status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String name;
        private User createdBy;
        private String inviteCode;
        private CompletionThreshold completionThreshold = CompletionThreshold.ANY_TASK;
        private Integer customThresholdPercent;
        private CircleStatus status = CircleStatus.ACTIVE;

        public Builder name(String name) { this.name = name; return this; }
        public Builder createdBy(User createdBy) { this.createdBy = createdBy; return this; }
        public Builder inviteCode(String inviteCode) { this.inviteCode = inviteCode; return this; }
        public Builder completionThreshold(CompletionThreshold t) { this.completionThreshold = t; return this; }
        public Builder customThresholdPercent(Integer p) { this.customThresholdPercent = p; return this; }
        public Builder status(CircleStatus s) { this.status = s; return this; }

        public Circle build() {
            Circle circle = new Circle();
            circle.setName(this.name);
            circle.setCreatedBy(this.createdBy);
            circle.setInviteCode(this.inviteCode);
            circle.setCompletionThreshold(this.completionThreshold);
            circle.setCustomThresholdPercent(this.customThresholdPercent);
            circle.setStatus(this.status);
            return circle;
        }
    }
}
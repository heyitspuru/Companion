package com.companion.backend.circle;

import com.companion.backend.goal.GoalCategory;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class CircleResponse {

    private Long id;
    private String name;
    private String inviteCode;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<MemberInfo> members;
    private CircleStatus status;

    // Goal info
    private String goalTitle;
    private String goalDescription;
    private GoalCategory goalCategory;
    private LocalDate goalStartDate;
    private LocalDate goalEndDate;
    private CompletionThreshold completionThreshold;
    private Integer customThresholdPercent;

    // Collective squad streak (live values — see CircleService#buildCircleResponse)
    private int squadCurrentStreak;
    private int squadLongestStreak;
    private boolean squadCompleteToday;

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getInviteCode() { return inviteCode; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<MemberInfo> getMembers() { return members; }
    public CircleStatus getStatus() { return status; }
    public String getGoalTitle() { return goalTitle; }
    public String getGoalDescription() { return goalDescription; }
    public GoalCategory getGoalCategory() { return goalCategory; }
    public LocalDate getGoalStartDate() { return goalStartDate; }
    public LocalDate getGoalEndDate() { return goalEndDate; }
    public CompletionThreshold getCompletionThreshold() { return completionThreshold; }
    public Integer getCustomThresholdPercent() { return customThresholdPercent; }
    public int getSquadCurrentStreak() { return squadCurrentStreak; }
    public int getSquadLongestStreak() { return squadLongestStreak; }
    public boolean isSquadCompleteToday() { return squadCompleteToday; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setMembers(List<MemberInfo> members) { this.members = members; }
    public void setStatus(CircleStatus status) { this.status = status; }
    public void setGoalTitle(String goalTitle) { this.goalTitle = goalTitle; }
    public void setGoalDescription(String goalDescription) { this.goalDescription = goalDescription; }
    public void setGoalCategory(GoalCategory goalCategory) { this.goalCategory = goalCategory; }
    public void setGoalStartDate(LocalDate goalStartDate) { this.goalStartDate = goalStartDate; }
    public void setGoalEndDate(LocalDate goalEndDate) { this.goalEndDate = goalEndDate; }
    public void setCompletionThreshold(CompletionThreshold completionThreshold) { this.completionThreshold = completionThreshold; }
    public void setCustomThresholdPercent(Integer customThresholdPercent) { this.customThresholdPercent = customThresholdPercent; }
    public void setSquadCurrentStreak(int v) { this.squadCurrentStreak = v; }
    public void setSquadLongestStreak(int v) { this.squadLongestStreak = v; }
    public void setSquadCompleteToday(boolean v) { this.squadCompleteToday = v; }

    // Nested MemberInfo class
    public static class MemberInfo {
        private String username;
        private String email;
        private LocalDateTime joinedAt;

        public MemberInfo(String username, String email, LocalDateTime joinedAt) {
            this.username = username;
            this.email = email;
            this.joinedAt = joinedAt;
        }

        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public LocalDateTime getJoinedAt() { return joinedAt; }
    }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String name;
        private String inviteCode;
        private String createdBy;
        private LocalDateTime createdAt;
        private List<MemberInfo> members;
        private CircleStatus status;
        private String goalTitle;
        private String goalDescription;
        private GoalCategory goalCategory;
        private LocalDate goalStartDate;
        private LocalDate goalEndDate;
        private CompletionThreshold completionThreshold;
        private Integer customThresholdPercent;
        private int squadCurrentStreak;
        private int squadLongestStreak;
        private boolean squadCompleteToday;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder inviteCode(String inviteCode) { this.inviteCode = inviteCode; return this; }
        public Builder createdBy(String createdBy) { this.createdBy = createdBy; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder members(List<MemberInfo> members) { this.members = members; return this; }
        public Builder status(CircleStatus status) { this.status = status; return this; }
        public Builder goalTitle(String goalTitle) { this.goalTitle = goalTitle; return this; }
        public Builder goalDescription(String goalDescription) { this.goalDescription = goalDescription; return this; }
        public Builder goalCategory(GoalCategory goalCategory) { this.goalCategory = goalCategory; return this; }
        public Builder goalStartDate(LocalDate goalStartDate) { this.goalStartDate = goalStartDate; return this; }
        public Builder goalEndDate(LocalDate goalEndDate) { this.goalEndDate = goalEndDate; return this; }
        public Builder completionThreshold(CompletionThreshold t) { this.completionThreshold = t; return this; }
        public Builder customThresholdPercent(Integer p) { this.customThresholdPercent = p; return this; }
        public Builder squadCurrentStreak(int v) { this.squadCurrentStreak = v; return this; }
        public Builder squadLongestStreak(int v) { this.squadLongestStreak = v; return this; }
        public Builder squadCompleteToday(boolean v) { this.squadCompleteToday = v; return this; }

        public CircleResponse build() {
            CircleResponse r = new CircleResponse();
            r.setId(this.id);
            r.setName(this.name);
            r.setInviteCode(this.inviteCode);
            r.setCreatedBy(this.createdBy);
            r.setCreatedAt(this.createdAt);
            r.setMembers(this.members);
            r.setStatus(this.status);
            r.setGoalTitle(this.goalTitle);
            r.setGoalDescription(this.goalDescription);
            r.setGoalCategory(this.goalCategory);
            r.setGoalStartDate(this.goalStartDate);
            r.setGoalEndDate(this.goalEndDate);
            r.setCompletionThreshold(this.completionThreshold);
            r.setCustomThresholdPercent(this.customThresholdPercent);
            r.setSquadCurrentStreak(this.squadCurrentStreak);
            r.setSquadLongestStreak(this.squadLongestStreak);
            r.setSquadCompleteToday(this.squadCompleteToday);
            return r;
        }
    }
}
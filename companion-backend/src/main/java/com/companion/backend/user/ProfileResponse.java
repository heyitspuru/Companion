package com.companion.backend.user;

import java.time.LocalDateTime;
import java.util.List;

public class ProfileResponse {

    private String username;
    private String email;
    private LocalDateTime memberSince;
    private Integer totalCircles;
    private Integer totalBadges;
    private Integer longestStreakEver;
    private Integer totalTasksCompleted;
    private List<CircleStat> circleStats;
    private List<BadgeStat> recentBadges;

    // Getters
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public LocalDateTime getMemberSince() { return memberSince; }
    public Integer getTotalCircles() { return totalCircles; }
    public Integer getTotalBadges() { return totalBadges; }
    public Integer getLongestStreakEver() { return longestStreakEver; }
    public Integer getTotalTasksCompleted() { return totalTasksCompleted; }
    public List<CircleStat> getCircleStats() { return circleStats; }
    public List<BadgeStat> getRecentBadges() { return recentBadges; }

    // Setters
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setMemberSince(LocalDateTime memberSince) { this.memberSince = memberSince; }
    public void setTotalCircles(Integer totalCircles) { this.totalCircles = totalCircles; }
    public void setTotalBadges(Integer totalBadges) { this.totalBadges = totalBadges; }
    public void setLongestStreakEver(Integer longestStreakEver) { this.longestStreakEver = longestStreakEver; }
    public void setTotalTasksCompleted(Integer totalTasksCompleted) { this.totalTasksCompleted = totalTasksCompleted; }
    public void setCircleStats(List<CircleStat> circleStats) { this.circleStats = circleStats; }
    public void setRecentBadges(List<BadgeStat> recentBadges) { this.recentBadges = recentBadges; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String username;
        private String email;
        private LocalDateTime memberSince;
        private Integer totalCircles;
        private Integer totalBadges;
        private Integer longestStreakEver;
        private Integer totalTasksCompleted;
        private List<CircleStat> circleStats;
        private List<BadgeStat> recentBadges;

        public Builder username(String u) { this.username = u; return this; }
        public Builder email(String e) { this.email = e; return this; }
        public Builder memberSince(LocalDateTime m) { this.memberSince = m; return this; }
        public Builder totalCircles(Integer t) { this.totalCircles = t; return this; }
        public Builder totalBadges(Integer t) { this.totalBadges = t; return this; }
        public Builder longestStreakEver(Integer l) { this.longestStreakEver = l; return this; }
        public Builder totalTasksCompleted(Integer t) { this.totalTasksCompleted = t; return this; }
        public Builder circleStats(List<CircleStat> c) { this.circleStats = c; return this; }
        public Builder recentBadges(List<BadgeStat> b) { this.recentBadges = b; return this; }

        public ProfileResponse build() {
            ProfileResponse r = new ProfileResponse();
            r.setUsername(this.username);
            r.setEmail(this.email);
            r.setMemberSince(this.memberSince);
            r.setTotalCircles(this.totalCircles);
            r.setTotalBadges(this.totalBadges);
            r.setLongestStreakEver(this.longestStreakEver);
            r.setTotalTasksCompleted(this.totalTasksCompleted);
            r.setCircleStats(this.circleStats);
            r.setRecentBadges(this.recentBadges);
            return r;
        }
    }

    // Nested classes
    public static class CircleStat {
        private Long circleId;
        private String circleName;
        private String goalTitle;
        private String goalCategory;
        private Integer currentStreak;
        private Integer longestStreak;
        private Integer progressPercent;
        private Integer daysLeft;

        public CircleStat(Long circleId, String circleName, String goalTitle,
                          String goalCategory, Integer currentStreak,
                          Integer longestStreak, Integer progressPercent, Integer daysLeft) {
            this.circleId = circleId;
            this.circleName = circleName;
            this.goalTitle = goalTitle;
            this.goalCategory = goalCategory;
            this.currentStreak = currentStreak;
            this.longestStreak = longestStreak;
            this.progressPercent = progressPercent;
            this.daysLeft = daysLeft;
        }

        public Long getCircleId() { return circleId; }
        public String getCircleName() { return circleName; }
        public String getGoalTitle() { return goalTitle; }
        public String getGoalCategory() { return goalCategory; }
        public Integer getCurrentStreak() { return currentStreak; }
        public Integer getLongestStreak() { return longestStreak; }
        public Integer getProgressPercent() { return progressPercent; }
        public Integer getDaysLeft() { return daysLeft; }
    }

    public static class BadgeStat {
        private String circleName;
        private String weekStart;
        private Integer checkinCount;

        public BadgeStat(String circleName, String weekStart, Integer checkinCount) {
            this.circleName = circleName;
            this.weekStart = weekStart;
            this.checkinCount = checkinCount;
        }

        public String getCircleName() { return circleName; }
        public String getWeekStart() { return weekStart; }
        public Integer getCheckinCount() { return checkinCount; }
    }
}
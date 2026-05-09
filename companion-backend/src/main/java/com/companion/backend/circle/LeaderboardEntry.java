package com.companion.backend.circle;

public class LeaderboardEntry {
    private Integer rank;
    private String username;
    private Integer currentStreak;
    private Integer longestStreak;
    private Integer todayCompletionPercent;
    private Integer totalBadges;
    private Boolean thresholdMetToday;

    public LeaderboardEntry(Integer rank, String username, Integer currentStreak,
                            Integer longestStreak, Integer todayCompletionPercent,
                            Integer totalBadges, Boolean thresholdMetToday) {
        this.rank = rank;
        this.username = username;
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
        this.todayCompletionPercent = todayCompletionPercent;
        this.totalBadges = totalBadges;
        this.thresholdMetToday = thresholdMetToday;
    }

    public Integer getRank() { return rank; }
    public String getUsername() { return username; }
    public Integer getCurrentStreak() { return currentStreak; }
    public Integer getLongestStreak() { return longestStreak; }
    public Integer getTodayCompletionPercent() { return todayCompletionPercent; }
    public Integer getTotalBadges() { return totalBadges; }
    public Boolean getThresholdMetToday() { return thresholdMetToday; }
}
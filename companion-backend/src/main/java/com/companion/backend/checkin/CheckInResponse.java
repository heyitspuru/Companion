package com.companion.backend.checkin;

import java.time.LocalDate;

public class CheckInResponse {

    private Long id;
    private String username;
    private Long circleId;
    private LocalDate checkinDate;
    private Boolean completed;
    private Integer currentStreak;
    private Integer longestStreak;

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public Long getCircleId() { return circleId; }
    public LocalDate getCheckinDate() { return checkinDate; }
    public Boolean getCompleted() { return completed; }
    public Integer getCurrentStreak() { return currentStreak; }
    public Integer getLongestStreak() { return longestStreak; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setCircleId(Long circleId) { this.circleId = circleId; }
    public void setCheckinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; }
    public void setCompleted(Boolean completed) { this.completed = completed; }
    public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }
    public void setLongestStreak(Integer longestStreak) { this.longestStreak = longestStreak; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String username;
        private Long circleId;
        private LocalDate checkinDate;
        private Boolean completed;
        private Integer currentStreak;
        private Integer longestStreak;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder circleId(Long circleId) { this.circleId = circleId; return this; }
        public Builder checkinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; return this; }
        public Builder completed(Boolean completed) { this.completed = completed; return this; }
        public Builder currentStreak(Integer currentStreak) { this.currentStreak = currentStreak; return this; }
        public Builder longestStreak(Integer longestStreak) { this.longestStreak = longestStreak; return this; }

        public CheckInResponse build() {
            CheckInResponse r = new CheckInResponse();
            r.setId(this.id);
            r.setUsername(this.username);
            r.setCircleId(this.circleId);
            r.setCheckinDate(this.checkinDate);
            r.setCompleted(this.completed);
            r.setCurrentStreak(this.currentStreak);
            r.setLongestStreak(this.longestStreak);
            return r;
        }
    }
}
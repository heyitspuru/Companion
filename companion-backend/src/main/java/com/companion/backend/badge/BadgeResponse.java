package com.companion.backend.badge;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class BadgeResponse {

    private Long id;
    private String username;
    private Long circleId;
    private String circleName;
    private LocalDate weekStart;
    private LocalDate weekEnd;
    private Integer checkinCount;
    private LocalDateTime awardedAt;

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public Long getCircleId() { return circleId; }
    public String getCircleName() { return circleName; }
    public LocalDate getWeekStart() { return weekStart; }
    public LocalDate getWeekEnd() { return weekEnd; }
    public Integer getCheckinCount() { return checkinCount; }
    public LocalDateTime getAwardedAt() { return awardedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setCircleId(Long circleId) { this.circleId = circleId; }
    public void setCircleName(String circleName) { this.circleName = circleName; }
    public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }
    public void setWeekEnd(LocalDate weekEnd) { this.weekEnd = weekEnd; }
    public void setCheckinCount(Integer checkinCount) { this.checkinCount = checkinCount; }
    public void setAwardedAt(LocalDateTime awardedAt) { this.awardedAt = awardedAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private String username;
        private Long circleId;
        private String circleName;
        private LocalDate weekStart;
        private LocalDate weekEnd;
        private Integer checkinCount;
        private LocalDateTime awardedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder circleId(Long circleId) { this.circleId = circleId; return this; }
        public Builder circleName(String circleName) { this.circleName = circleName; return this; }
        public Builder weekStart(LocalDate weekStart) { this.weekStart = weekStart; return this; }
        public Builder weekEnd(LocalDate weekEnd) { this.weekEnd = weekEnd; return this; }
        public Builder checkinCount(Integer checkinCount) { this.checkinCount = checkinCount; return this; }
        public Builder awardedAt(LocalDateTime awardedAt) { this.awardedAt = awardedAt; return this; }

        public BadgeResponse build() {
            BadgeResponse r = new BadgeResponse();
            r.setId(this.id);
            r.setUsername(this.username);
            r.setCircleId(this.circleId);
            r.setCircleName(this.circleName);
            r.setWeekStart(this.weekStart);
            r.setWeekEnd(this.weekEnd);
            r.setCheckinCount(this.checkinCount);
            r.setAwardedAt(this.awardedAt);
            return r;
        }
    }
}
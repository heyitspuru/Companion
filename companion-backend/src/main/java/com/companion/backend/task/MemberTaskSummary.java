package com.companion.backend.task;

public class MemberTaskSummary {
    private String username;
    private Integer completedTasks;
    private Integer totalTasks;
    private Integer completionPercent;
    private Boolean thresholdMet;

    public MemberTaskSummary(String username, Integer completedTasks,
                             Integer totalTasks, Integer completionPercent,
                             Boolean thresholdMet) {
        this.username = username;
        this.completedTasks = completedTasks;
        this.totalTasks = totalTasks;
        this.completionPercent = completionPercent;
        this.thresholdMet = thresholdMet;
    }

    public String getUsername() { return username; }
    public Integer getCompletedTasks() { return completedTasks; }
    public Integer getTotalTasks() { return totalTasks; }
    public Integer getCompletionPercent() { return completionPercent; }
    public Boolean getThresholdMet() { return thresholdMet; }
}
package com.companion.backend.task;

import java.util.List;

public class MemberTaskSummary {
    private String username;
    private Integer completedTasks;
    private Integer totalTasks;
    private Integer completionPercent;
    private Boolean thresholdMet;

    // Rally state (Phase 2)
    private Boolean atRisk;          // hasn't reported in and the day is running out
    private Boolean rallied;         // someone has their back today
    private List<String> backedBy;   // who rallied them today

    public MemberTaskSummary(String username, Integer completedTasks,
                             Integer totalTasks, Integer completionPercent,
                             Boolean thresholdMet, Boolean atRisk,
                             Boolean rallied, List<String> backedBy) {
        this.username = username;
        this.completedTasks = completedTasks;
        this.totalTasks = totalTasks;
        this.completionPercent = completionPercent;
        this.thresholdMet = thresholdMet;
        this.atRisk = atRisk;
        this.rallied = rallied;
        this.backedBy = backedBy;
    }

    public String getUsername() { return username; }
    public Integer getCompletedTasks() { return completedTasks; }
    public Integer getTotalTasks() { return totalTasks; }
    public Integer getCompletionPercent() { return completionPercent; }
    public Boolean getThresholdMet() { return thresholdMet; }
    public Boolean getAtRisk() { return atRisk; }
    public Boolean getRallied() { return rallied; }
    public List<String> getBackedBy() { return backedBy; }
}

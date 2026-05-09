package com.companion.backend.task;

public class TaskCheckinResponse {
    private Long taskId;
    private Boolean completed;
    private Integer completionPercent;
    private Integer completedCount;
    private Integer totalCount;

    public TaskCheckinResponse(Long taskId, Boolean completed,
                               Integer completionPercent,
                               Integer completedCount, Integer totalCount) {
        this.taskId = taskId;
        this.completed = completed;
        this.completionPercent = completionPercent;
        this.completedCount = completedCount;
        this.totalCount = totalCount;
    }

    public Long getTaskId() { return taskId; }
    public Boolean getCompleted() { return completed; }
    public Integer getCompletionPercent() { return completionPercent; }
    public Integer getCompletedCount() { return completedCount; }
    public Integer getTotalCount() { return totalCount; }
}
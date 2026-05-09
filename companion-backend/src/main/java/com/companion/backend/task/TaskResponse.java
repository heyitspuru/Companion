package com.companion.backend.task;

public class TaskResponse {
    private Long id;
    private String title;
    private Integer displayOrder;
    private Boolean completedToday;

    public TaskResponse(Long id, String title, Integer displayOrder, Boolean completedToday) {
        this.id = id;
        this.title = title;
        this.displayOrder = displayOrder;
        this.completedToday = completedToday;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public Integer getDisplayOrder() { return displayOrder; }
    public Boolean getCompletedToday() { return completedToday; }
}
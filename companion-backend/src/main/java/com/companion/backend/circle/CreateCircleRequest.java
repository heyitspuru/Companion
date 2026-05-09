package com.companion.backend.circle;

import com.companion.backend.goal.GoalCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateCircleRequest {

    @NotBlank(message = "Circle name is required")
    private String name;

    @NotBlank(message = "Goal title is required")
    private String goalTitle;

    private String goalDescription;

    @NotNull(message = "Goal category is required")
    private GoalCategory goalCategory;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Completion threshold is required")
    private CompletionThreshold completionThreshold;

    private Integer customThresholdPercent;

    // Getters
    public String getName() { return name; }
    public String getGoalTitle() { return goalTitle; }
    public String getGoalDescription() { return goalDescription; }
    public GoalCategory getGoalCategory() { return goalCategory; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public CompletionThreshold getCompletionThreshold() { return completionThreshold; }
    public Integer getCustomThresholdPercent() { return customThresholdPercent; }

    // Setters
    public void setName(String name) { this.name = name; }
    public void setGoalTitle(String goalTitle) { this.goalTitle = goalTitle; }
    public void setGoalDescription(String goalDescription) { this.goalDescription = goalDescription; }
    public void setGoalCategory(GoalCategory goalCategory) { this.goalCategory = goalCategory; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public void setCompletionThreshold(CompletionThreshold completionThreshold) { this.completionThreshold = completionThreshold; }
    public void setCustomThresholdPercent(Integer customThresholdPercent) { this.customThresholdPercent = customThresholdPercent; }
}
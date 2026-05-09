package com.companion.backend.task;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:3000")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // Add a task to a circle
    @PostMapping("/circle/{circleId}")
    public ResponseEntity<TaskResponse> addTask(
            @PathVariable Long circleId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(taskService.addTask(circleId, body.get("title")));
    }

    // Delete a task
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.ok().build();
    }

    // Get my tasks for a circle
    @GetMapping("/circle/{circleId}/my")
    public ResponseEntity<List<TaskResponse>> getMyTasks(@PathVariable Long circleId) {
        return ResponseEntity.ok(taskService.getMyTasks(circleId));
    }
    // Update my tasks for the circle
    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(taskService.updateTask(taskId, body.get("title")));
    }

    // Toggle task completion for today
    @PostMapping("/{taskId}/toggle")
    public ResponseEntity<TaskCheckinResponse> toggleTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(taskService.toggleTask(taskId));
    }

    // Get all members' task summary for today
    @GetMapping("/circle/{circleId}/summary")
    public ResponseEntity<List<MemberTaskSummary>> getCircleSummary(
            @PathVariable Long circleId) {
        return ResponseEntity.ok(taskService.getCircleTaskSummary(circleId));
    }
}
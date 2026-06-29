package com.companion.backend.circle;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/circles")
public class CircleController {

    private final CircleService circleService;

    public CircleController(CircleService circleService) {
        this.circleService = circleService;
    }

    @PostMapping("/create")
    public ResponseEntity<CircleResponse> createCircle(
            @Valid @RequestBody CreateCircleRequest request) {
        return ResponseEntity.ok(circleService.createCircle(request));
    }

    @PostMapping("/join/{inviteCode}")
    public ResponseEntity<CircleResponse> joinCircle(
            @PathVariable String inviteCode) {
        return ResponseEntity.ok(circleService.joinCircle(inviteCode));
    }

    @GetMapping("/my")
    public ResponseEntity<List<CircleResponse>> getMyCircles() {
        return ResponseEntity.ok(circleService.getMyCircles());
    }

    @GetMapping("/archived/my")
    public ResponseEntity<List<CircleResponse>> getArchivedCircles() {
        return ResponseEntity.ok(circleService.getArchivedCircles());
    }

    @GetMapping("/{circleId}")
    public ResponseEntity<CircleResponse> getCircleById(
            @PathVariable Long circleId) {
        return ResponseEntity.ok(circleService.getCircleById(circleId));
    }

    @DeleteMapping("/{circleId}")
    public ResponseEntity<Void> deleteCircle(@PathVariable Long circleId) {
        circleService.deleteCircle(circleId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{circleId}/leave")
    public ResponseEntity<Void> leaveCircle(@PathVariable Long circleId) {
        circleService.leaveCircle(circleId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{circleId}/conclude")
    public ResponseEntity<CircleResponse> concludeCircle(
            @PathVariable Long circleId,
            @RequestBody Map<String, String> body) {
        String action = body.get("action");
        String newEndDateStr = body.get("newEndDate");
        LocalDate newEndDate = newEndDateStr != null ? LocalDate.parse(newEndDateStr) : null;
        return ResponseEntity.ok(circleService.concludeCircle(circleId, action, newEndDate));
    }

    @GetMapping("/{circleId}/stats")
    public ResponseEntity<Map<String, Object>> getCircleStats(
            @PathVariable Long circleId) {
        return ResponseEntity.ok(circleService.getCircleStats(circleId));
    }
}
package com.companion.backend.checkin;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkins")
@CrossOrigin(origins = "http://localhost:3000")
public class CheckInController {

    private final CheckInService checkInService;

    public CheckInController(CheckInService checkInService) {
        this.checkInService = checkInService;
    }

    // One tap check-in for today
    @PostMapping("/circle/{circleId}")
    public ResponseEntity<CheckInResponse> doCheckIn(
            @PathVariable Long circleId) {
        return ResponseEntity.ok(checkInService.doCheckIn(circleId));
    }

    // Get today's check-ins for a circle (all members)
    @GetMapping("/circle/{circleId}/today")
    public ResponseEntity<List<CheckInResponse>> getCircleCheckIns(
            @PathVariable Long circleId) {
        return ResponseEntity.ok(checkInService.getCircleCheckIns(circleId));
    }

    // Get my full check-in history for a circle
    @GetMapping("/circle/{circleId}/my")
    public ResponseEntity<List<CheckInResponse>> getMyCheckIns(
            @PathVariable Long circleId) {
        return ResponseEntity.ok(checkInService.getMyCheckIns(circleId));
    }
}
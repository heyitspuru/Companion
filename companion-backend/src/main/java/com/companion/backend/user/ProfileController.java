package com.companion.backend.user;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {
        return ResponseEntity.ok(profileService.getProfile());
    }

    @PutMapping("/username")
    public ResponseEntity<ProfileResponse> updateUsername(
            @Valid @RequestBody UpdateUsernameRequest request) {
        return ResponseEntity.ok(profileService.updateUsername(request.getUsername()));
    }
}
package com.companion.backend.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateUsernameRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 2, max = 30, message = "Username must be 2–30 characters")
    private String username;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}

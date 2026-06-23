package com.companion.backend.common;

import org.springframework.http.HttpStatus;

/** Maps to HTTP 404. */
public class NotFoundException extends ApiException {
    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}

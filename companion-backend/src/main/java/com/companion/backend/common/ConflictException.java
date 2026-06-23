package com.companion.backend.common;

import org.springframework.http.HttpStatus;

/** Maps to HTTP 409. */
public class ConflictException extends ApiException {
    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}

package com.companion.backend.common;

import org.springframework.http.HttpStatus;

/** Maps to HTTP 403. */
public class ForbiddenException extends ApiException {
    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}

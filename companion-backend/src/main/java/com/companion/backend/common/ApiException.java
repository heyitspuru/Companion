package com.companion.backend.common;

import org.springframework.http.HttpStatus;

/**
 * Base type for expected, client-facing errors. Each subclass carries the HTTP
 * status it should map to, so {@link GlobalExceptionHandler} can translate it
 * without every service needing to know about the web layer.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;

    protected ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}

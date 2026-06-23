package com.companion.backend.common;

import org.springframework.http.HttpStatus;

/** Maps to HTTP 400. */
public class BadRequestException extends ApiException {
    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}

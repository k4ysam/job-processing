"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = exports.TimeoutError = exports.ValidationError = exports.RetryableError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'AppError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
class RetryableError extends AppError {
    constructor(message) {
        super(message, 'RETRYABLE_ERROR', 503);
        this.name = 'RetryableError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.RetryableError = RetryableError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ValidationError = ValidationError;
class TimeoutError extends AppError {
    constructor(message) {
        super(message, 'TIMEOUT', 504);
        this.name = 'TimeoutError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.TimeoutError = TimeoutError;
class NotFoundError extends AppError {
    constructor(id) {
        super(`Resource not found: ${id}`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=types.js.map
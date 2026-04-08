package com.lms.backend.exception;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(BookingConflictException.class)
    public ResponseEntity<BookingConflictErrorResponse> handleBookingConflictException(BookingConflictException ex) {
        BookingConflictErrorResponse error = new BookingConflictErrorResponse(
                HttpStatus.CONFLICT.value(),
                ex.getMessage(),
                LocalDateTime.now(),
                ex.getConflictingBookingId(),
                ex.getConflictingStartTime(),
                ex.getConflictingEndTime()
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLockingFailure(OptimisticLockingFailureException ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "The booking was modified by another user. Please refresh and try again.",
                LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ValidationErrorResponse response = new ValidationErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed",
                errors,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ex.getMessage(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    public static class ErrorResponse {
        private int status;
        private String message;
        private LocalDateTime timestamp;
        
        public ErrorResponse(int status, String message, LocalDateTime timestamp) {
            this.status = status;
            this.message = message;
            this.timestamp = timestamp;
        }
        
        public int getStatus() { return status; }
        public void setStatus(int status) { this.status = status; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }
    
    public static class ValidationErrorResponse {
        private int status;
        private String message;
        private Map<String, String> errors;
        private LocalDateTime timestamp;
        
        public ValidationErrorResponse(int status, String message, Map<String, String> errors, LocalDateTime timestamp) {
            this.status = status;
            this.message = message;
            this.errors = errors;
            this.timestamp = timestamp;
        }
        
        public int getStatus() { return status; }
        public void setStatus(int status) { this.status = status; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public Map<String, String> getErrors() { return errors; }
        public void setErrors(Map<String, String> errors) { this.errors = errors; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }
    
    public static class BookingConflictErrorResponse {
        private int status;
        private String message;
        private LocalDateTime timestamp;
        private String conflictingBookingId;
        private String conflictingStartTime;
        private String conflictingEndTime;
        
        public BookingConflictErrorResponse(int status, String message, LocalDateTime timestamp,
                                           String conflictingBookingId, String conflictingStartTime, String conflictingEndTime) {
            this.status = status;
            this.message = message;
            this.timestamp = timestamp;
            this.conflictingBookingId = conflictingBookingId;
            this.conflictingStartTime = conflictingStartTime;
            this.conflictingEndTime = conflictingEndTime;
        }
        
        public int getStatus() { return status; }
        public void setStatus(int status) { this.status = status; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        public String getConflictingBookingId() { return conflictingBookingId; }
        public void setConflictingBookingId(String conflictingBookingId) { this.conflictingBookingId = conflictingBookingId; }
        public String getConflictingStartTime() { return conflictingStartTime; }
        public void setConflictingStartTime(String conflictingStartTime) { this.conflictingStartTime = conflictingStartTime; }
        public String getConflictingEndTime() { return conflictingEndTime; }
        public void setConflictingEndTime(String conflictingEndTime) { this.conflictingEndTime = conflictingEndTime; }
    }
}

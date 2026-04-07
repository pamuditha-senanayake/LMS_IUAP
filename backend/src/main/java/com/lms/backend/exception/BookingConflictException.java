package com.lms.backend.exception;

public class BookingConflictException extends RuntimeException {
    
    private final String conflictingBookingId;
    private final String conflictingStartTime;
    private final String conflictingEndTime;
    
    public BookingConflictException(String message) {
        super(message);
        this.conflictingBookingId = null;
        this.conflictingStartTime = null;
        this.conflictingEndTime = null;
    }
    
    public BookingConflictException(String message, Throwable cause) {
        super(message, cause);
        this.conflictingBookingId = null;
        this.conflictingStartTime = null;
        this.conflictingEndTime = null;
    }
    
    public BookingConflictException(String message, String conflictingBookingId, String conflictingStartTime, String conflictingEndTime) {
        super(message);
        this.conflictingBookingId = conflictingBookingId;
        this.conflictingStartTime = conflictingStartTime;
        this.conflictingEndTime = conflictingEndTime;
    }
    
    public String getConflictingBookingId() {
        return conflictingBookingId;
    }
    
    public String getConflictingStartTime() {
        return conflictingStartTime;
    }
    
    public String getConflictingEndTime() {
        return conflictingEndTime;
    }
}

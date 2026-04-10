package com.lms.backend.controller;

import com.lms.backend.dto.LoginRequest;
import com.lms.backend.dto.RegisterRequest;
import com.lms.backend.model.AuditLog;
import com.lms.backend.service.AuditLogService;
import com.lms.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuditLogService auditLogService;

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private ResponseEntity<?> createCookieResponse(com.lms.backend.dto.AuthResponse res) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("token", res.getToken())
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(86400)
                .sameSite("None")
                .build();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body(res);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        try {
            var res = authService.register(request);
            auditLogService.logAction(AuditLog.builder()
                    .actionType("REGISTER")
                    .entityType("USER")
                    .entityId(request.getEmail())
                    .actorId(request.getEmail())
                    .ipAddress(getClientIp(httpRequest))
                    .afterData("Role: ROLE_STUDENT")
                    .createdAt(LocalDateTime.now())
                    .build());
            return createCookieResponse(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register/admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        try {
            var res = authService.registerWithRole(request, "ROLE_ADMIN");
            auditLogService.logAction(AuditLog.builder()
                    .actionType("REGISTER")
                    .entityType("USER")
                    .entityId(request.getEmail())
                    .actorId(request.getEmail())
                    .ipAddress(getClientIp(httpRequest))
                    .afterData("Role: ROLE_ADMIN")
                    .createdAt(LocalDateTime.now())
                    .build());
            return createCookieResponse(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register/lecturer")
    public ResponseEntity<?> registerLecturer(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        try {
            var res = authService.registerWithRole(request, "ROLE_LECTURER");
            auditLogService.logAction(AuditLog.builder()
                    .actionType("REGISTER")
                    .entityType("USER")
                    .entityId(request.getEmail())
                    .actorId(request.getEmail())
                    .ipAddress(getClientIp(httpRequest))
                    .afterData("Role: ROLE_LECTURER")
                    .createdAt(LocalDateTime.now())
                    .build());
            return createCookieResponse(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            var res = authService.login(request);
            auditLogService.logAction(AuditLog.builder()
                    .actionType("LOGIN")
                    .entityType("SESSION")
                    .entityId(request.getEmail())
                    .actorId(request.getEmail())
                    .ipAddress(getClientIp(httpRequest))
                    .afterData("Authenticated: true")
                    .createdAt(LocalDateTime.now())
                    .build());
            return createCookieResponse(res);
        } catch (Exception e) {
            auditLogService.logAction(AuditLog.builder()
                    .actionType("LOGIN_FAILED")
                    .entityType("SESSION")
                    .entityId(request.getEmail())
                    .actorId(request.getEmail())
                    .ipAddress(getClientIp(httpRequest))
                    .afterData("Reason: Invalid credentials")
                    .createdAt(LocalDateTime.now())
                    .build());
            return ResponseEntity.badRequest().body("Invalid email or password");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest httpRequest) {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String actorId = "anonymous";
            if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
                com.lms.backend.model.User user = (com.lms.backend.model.User) auth.getPrincipal();
                actorId = user.getEmail();
            }
            auditLogService.logAction(AuditLog.builder()
                    .actionType("LOGOUT")
                    .entityType("SESSION")
                    .entityId(actorId)
                    .actorId(actorId)
                    .ipAddress(getClientIp(httpRequest))
                    .afterData("Session terminated")
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (Exception ignored) {}

        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body("Logged out successfully");
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody com.lms.backend.dto.GoogleAuthRequest request, HttpServletRequest httpRequest) {
        try {
            var res = authService.loginWithGoogle(request.getCredential());
            auditLogService.logAction(AuditLog.builder()
                    .actionType("LOGIN")
                    .entityType("SESSION")
                    .entityId(res.getEmail())
                    .actorId(res.getEmail())
                    .ipAddress(getClientIp(httpRequest))
                    .afterData("Provider: Google OAuth")
                    .createdAt(LocalDateTime.now())
                    .build());
            return createCookieResponse(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Google authentication failed: " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.status(401).body("Not authenticated");
            }
            com.lms.backend.model.User user = (com.lms.backend.model.User) auth.getPrincipal();
            return ResponseEntity.ok(java.util.Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "roles", user.getRoles() != null ? user.getRoles() : java.util.List.of("ROLE_STUDENT")
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}


package com.lms.backend.service;

import com.lms.backend.dto.AuthResponse;
import com.lms.backend.dto.LoginRequest;
import com.lms.backend.dto.RegisterRequest;
import com.lms.backend.model.User;
import com.lms.backend.repository.UserRepository;
import com.lms.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        userRepository.save(user);

        var jwtToken = jwtUtils.generateToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .message("User registered successfully")
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        var jwtToken = jwtUtils.generateToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .message("Login successful")
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}

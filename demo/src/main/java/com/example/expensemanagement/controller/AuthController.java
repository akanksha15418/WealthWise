package com.example.expensemanagement.controller;

import com.example.expensemanagement.config.JwtService;
import com.example.expensemanagement.dto.AuthRequest;
import com.example.expensemanagement.dto.AuthResponse;
import com.example.expensemanagement.entity.User;
import com.example.expensemanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthController(UserService userService, JwtService jwtService,
                          AuthenticationManager authenticationManager, UserDetailsService userDetailsService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            return ResponseEntity.ok(registeredUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
            final User user = userService.findByEmail(request.getEmail());
            final String jwt = jwtService.generateToken(userDetails);
            
            return ResponseEntity.ok(new AuthResponse(jwt, user.getName(), user.getEmail()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }
}

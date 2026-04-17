package com.nexus.app.controller;

import com.nexus.app.entity.User;
import com.nexus.app.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;

    public AuthController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String username = body.get("username");
        String password = body.get("password");
        String fullName = body.get("fullName");
        String bio      = body.getOrDefault("bio", "");
        String location = body.getOrDefault("location", "");
        String website  = body.getOrDefault("website", "");
        String phone    = body.getOrDefault("phone", "");

        if (userRepo.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        if (userRepo.existsByUsername(username))
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));

        User user = User.builder()
                .email(email).username(username)
                .password(password)
                .fullName(fullName)
                .role(User.Role.USER)
                .bio(bio).location(location)
                .website(website).phone(phone)
                .build();

        userRepo.save(user);
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email=body.get("email");
        String password=body.get("password");

        Optional<User> opt = userRepo.findByEmail(email);
        if (opt.isEmpty() || !opt.get().getPassword().equals(password))
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));

        User user = opt.get();
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}
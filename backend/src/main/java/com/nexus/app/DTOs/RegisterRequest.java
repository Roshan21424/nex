package com.nexus.app.DTOs;

import com.nexus.app.entity.User;
import lombok.Data;

@Data
public class RegisterRequest {
    public String username, email, password, fullName;
    public String bio, location, website, phone;
    public User.Role role;
}
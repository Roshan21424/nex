package com.nexus.app.DTOs;

import lombok.Data;

@Data
public class LoginRequest {
    public String email;
    public String password;
}
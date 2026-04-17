package com.nexus.app.DTOs;

import com.nexus.app.entity.User;
import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDTO {
    public Long id;
    public String username, email, fullName, bio;
    public String location, website, phone;
    public String profileImageUrl;
    public User.Role role;
    public LocalDateTime createdAt;
    public long followersCount;
    public long followingCount;
    public boolean isFollowing;

    public static UserDTO from(User u) {
        return UserDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .bio(u.getBio())
                .location(u.getLocation())
                .website(u.getWebsite())
                .phone(u.getPhone())
                .profileImageUrl(u.getProfileImageUrl())
                .role(u.getRole())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
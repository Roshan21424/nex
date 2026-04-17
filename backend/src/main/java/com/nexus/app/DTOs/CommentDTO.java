package com.nexus.app.DTOs;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentDTO {
    public Long id;
    public String content;
    public UserDTO user;
    public LocalDateTime createdAt;
}
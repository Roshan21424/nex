package com.nexus.app.DTOs;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PostDTO {
    public Long id;
    public String content, imageUrl;
    public UserDTO user;
    public int likesCount, commentsCount;
    public boolean likedByMe;
    public LocalDateTime createdAt;
    public List<CommentDTO> comments;
}
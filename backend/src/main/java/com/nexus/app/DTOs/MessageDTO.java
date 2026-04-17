package com.nexus.app.DTOs;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageDTO {
    public Long id;
    public String content;
    public Long senderId, receiverId;
    public String senderUsername, senderProfileImage;
    public boolean read;
    public LocalDateTime createdAt;
}
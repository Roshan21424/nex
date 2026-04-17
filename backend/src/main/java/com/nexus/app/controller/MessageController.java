package com.nexus.app.controller;

import com.nexus.app.entity.Message;
import com.nexus.app.entity.User;
import com.nexus.app.repository.MessageRepository;
import com.nexus.app.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository msgRepo;
    private final UserRepository    userRepo;

    public MessageController(MessageRepository msgRepo, UserRepository userRepo) {
        this.msgRepo  = msgRepo;
        this.userRepo = userRepo;
    }

    // Send a message
    @PostMapping
    public ResponseEntity<?> send(@RequestBody Map<String, Object> body,
                                  HttpServletRequest request) {
        Long   senderId   = Long.valueOf(body.get("senderId").toString());
        Long   receiverId = Long.valueOf(body.get("receiverId").toString());
        String content    = body.get("content").toString();

        User sender   = userRepo.findById(senderId).orElseThrow();
        User receiver = userRepo.findById(receiverId).orElseThrow();

        Message msg = Message.builder()
                .sender(sender).receiver(receiver).content(content)
                .build();
        msgRepo.save(msg);
        return ResponseEntity.ok(toMap(msg, request));
    }

    // Get conversation between two users
    @GetMapping("/conversation")
    public ResponseEntity<?> conversation(@RequestParam Long userA,
                                          @RequestParam Long userB,
                                          HttpServletRequest request) {
        List<Map<String, Object>> list = msgRepo.findConversation(userA, userB)
                .stream().map(m -> toMap(m, request))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // Get all chat partners for inbox list
    @GetMapping("/inbox")
    public ResponseEntity<?> inbox(@RequestParam Long userId,
                                   HttpServletRequest request) {
        List<Long> partnerIds = msgRepo.findChatPartnerIds(userId);
        List<Map<String, Object>> partners = partnerIds.stream()
                .map(pid -> userRepo.findById(pid).map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",              u.getId());
                    m.put("username",        u.getUsername());
                    m.put("fullName",        u.getFullName());
                    m.put("role",            u.getRole());
                    // Inject avatar so inbox sidebar shows profile pictures
                    m.put("profileImageUrl", buildAvatarUrl(request, u));
                    return m;
                }).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return ResponseEntity.ok(partners);
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private Map<String, Object> toMap(Message m, HttpServletRequest request) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",                  m.getId());
        map.put("content",             m.getContent());
        map.put("senderId",            m.getSender().getId());
        map.put("receiverId",          m.getReceiver().getId());
        map.put("senderName",          m.getSender().getFullName());
        // Include sender avatar URL so chat bubbles can show tiny profile pics
        map.put("senderProfileImage",  buildAvatarUrl(request, m.getSender()));
        map.put("createdAt",           m.getCreatedAt());
        map.put("read",                m.isRead());
        return map;
    }

    private String buildAvatarUrl(HttpServletRequest request, User u) {
        if (u.getProfileImage() == null) return null;
        return request.getScheme() + "://" + request.getServerName()
                + ":" + request.getServerPort()
                + "/api/users/" + u.getId() + "/avatar";
    }
}
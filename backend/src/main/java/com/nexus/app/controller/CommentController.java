package com.nexus.app.controller;

import com.nexus.app.entity.Comment;
import com.nexus.app.entity.Post;
import com.nexus.app.entity.User;
import com.nexus.app.repository.CommentRepository;
import com.nexus.app.repository.PostRepository;
import com.nexus.app.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
public class CommentController {

    private final CommentRepository commentRepo;
    private final PostRepository    postRepo;
    private final UserRepository    userRepo;

    public CommentController(CommentRepository commentRepo, PostRepository postRepo,
                             UserRepository userRepo) {
        this.commentRepo = commentRepo;
        this.postRepo    = postRepo;
        this.userRepo    = userRepo;
    }

    @GetMapping
    public ResponseEntity<?> getComments(@PathVariable Long postId,
                                         HttpServletRequest request) {
        List<Map<String, Object>> list = commentRepo
                .findByPostIdOrderByCreatedAtAsc(postId)
                .stream().map(c -> toMap(c, request))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<?> addComment(@PathVariable Long postId,
                                        @RequestParam Long userId,
                                        @RequestBody Map<String, String> body,
                                        HttpServletRequest request) {
        Post post = postRepo.findById(postId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();
        Comment c = Comment.builder()
                .post(post).user(user).content(body.get("content"))
                .build();
        commentRepo.save(c);
        return ResponseEntity.ok(toMap(c, request));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long postId,
                                           @PathVariable Long commentId,
                                           @RequestParam Long userId) {
        Comment c = commentRepo.findById(commentId).orElseThrow();
        if (!c.getUser().getId().equals(userId))
            return ResponseEntity.status(403).body(Map.of("error", "Not your comment"));
        commentRepo.delete(c);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private Map<String, Object> toMap(Comment c, HttpServletRequest request) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",        c.getId());
        map.put("content",   c.getContent());
        map.put("createdAt", c.getCreatedAt());

        User u = c.getUser();
        Map<String, Object> uMap = new LinkedHashMap<>();
        uMap.put("id",              u.getId());
        uMap.put("username",        u.getUsername());
        uMap.put("fullName",        u.getFullName());
        uMap.put("role",            u.getRole());
        // Inject avatar URL so comment avatars show profile pictures
        uMap.put("profileImageUrl", buildAvatarUrl(request, u));
        map.put("user", uMap);
        return map;
    }

    private String buildAvatarUrl(HttpServletRequest request, User u) {
        if (u.getProfileImage() == null) return null;
        return request.getScheme() + "://" + request.getServerName()
                + ":" + request.getServerPort()
                + "/api/users/" + u.getId() + "/avatar";
    }
}
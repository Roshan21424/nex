package com.nexus.app.controller;

import com.nexus.app.entity.Like;
import com.nexus.app.entity.Post;
import com.nexus.app.entity.User;
import com.nexus.app.repository.*;
import com.nexus.app.service.S3Service;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostRepository    postRepo;
    private final UserRepository    userRepo;
    private final LikeRepository    likeRepo;
    private final FollowRepository  followRepo;
    private final CommentRepository commentRepo;
    private final S3Service         s3;

    public PostController(PostRepository postRepo, UserRepository userRepo,
                          LikeRepository likeRepo, FollowRepository followRepo,
                          CommentRepository commentRepo, S3Service s3) {
        this.postRepo    = postRepo;
        this.userRepo    = userRepo;
        this.likeRepo    = likeRepo;
        this.followRepo  = followRepo;
        this.commentRepo = commentRepo;
        this.s3          = s3;
    }

    // ── Create post ───────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createPost(@RequestParam Long userId,
                                        @RequestParam(required = false) String content,
                                        @RequestParam(required = false) MultipartFile file,
                                        HttpServletRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String fileUrl  = null;
        String fileType = null;
        if (file != null && !file.isEmpty()) {
            fileUrl  = s3.uploadFile(file);
            fileType = resolveFileType(file.getContentType());
        }

        Post post = Post.builder()
                .user(user).content(content)
                .fileUrl(fileUrl).fileType(fileType)
                .build();
        postRepo.save(post);
        return ResponseEntity.ok(toMap(post, userId, request));
    }

    // ── Global feed ───────────────────────────────────────────────────────────
    @GetMapping("/feed")
    public ResponseEntity<?> feed(@RequestParam(required = false) Long userId,
                                  HttpServletRequest request) {
        List<Map<String, Object>> posts = postRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(p -> toMap(p, userId, request))
                .collect(Collectors.toList());
        return ResponseEntity.ok(posts);
    }

    // ── Feed of followed users ────────────────────────────────────────────────
    @GetMapping("/feed/following")
    public ResponseEntity<?> followingFeed(@RequestParam Long userId,
                                           HttpServletRequest request) {
        List<Long> ids = followRepo.findByFollowerId(userId)
                .stream().map(f -> f.getFollowing().getId())
                .collect(Collectors.toList());
        ids.add(userId);
        List<Map<String, Object>> posts = postRepo.findByUserIdInOrderByCreatedAtDesc(ids)
                .stream().map(p -> toMap(p, userId, request))
                .collect(Collectors.toList());
        return ResponseEntity.ok(posts);
    }

    // ── Posts by user ─────────────────────────────────────────────────────────
    @GetMapping("/user/{targetId}")
    public ResponseEntity<?> userPosts(@PathVariable Long targetId,
                                       @RequestParam(required = false) Long userId,
                                       HttpServletRequest request) {
        List<Map<String, Object>> posts = postRepo.findByUserIdOrderByCreatedAtDesc(targetId)
                .stream().map(p -> toMap(p, userId, request))
                .collect(Collectors.toList());
        return ResponseEntity.ok(posts);
    }

    // ── Like / Unlike ─────────────────────────────────────────────────────────
    @PostMapping("/{postId}/like")
    public ResponseEntity<?> like(@PathVariable Long postId, @RequestParam Long userId) {
        Post post = postRepo.findById(postId).orElseThrow();
        User user = userRepo.findById(userId).orElseThrow();

        Optional<Like> existing = likeRepo.findByPostIdAndUserId(postId, userId);
        boolean liked;
        if (existing.isPresent()) {
            likeRepo.delete(existing.get());
            liked = false;
        } else {
            likeRepo.save(Like.builder().post(post).user(user).build());
            liked = true;
        }
        return ResponseEntity.ok(Map.of("liked", liked, "likeCount", likeRepo.countByPostId(postId)));
    }

    // ── Delete post ───────────────────────────────────────────────────────────
    @DeleteMapping("/{postId}")
    public ResponseEntity<?> delete(@PathVariable Long postId, @RequestParam Long userId) {
        Post post = postRepo.findById(postId).orElseThrow();
        if (!post.getUser().getId().equals(userId))
            return ResponseEntity.status(403).body(Map.of("error", "Not your post"));
        postRepo.delete(post);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Single post ───────────────────────────────────────────────────────────
    @GetMapping("/{postId}")
    public ResponseEntity<?> getPost(@PathVariable Long postId,
                                     @RequestParam(required = false) Long userId,
                                     HttpServletRequest request) {
        return postRepo.findById(postId)
                .map(p -> ResponseEntity.ok(toMap(p, userId, request)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Map<String, Object> toMap(Post p, Long viewerId, HttpServletRequest request) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",           p.getId());
        map.put("content",      p.getContent());
        map.put("fileUrl",      p.getFileUrl());
        map.put("fileType",     p.getFileType());
        map.put("createdAt",    p.getCreatedAt());
        map.put("likeCount",    likeRepo.countByPostId(p.getId()));
        map.put("commentCount", commentRepo.countByPostId(p.getId()));
        map.put("likedByMe",    viewerId != null
                && likeRepo.existsByPostIdAndUserId(p.getId(), viewerId));

        User u = p.getUser();
        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("id",          u.getId());
        userMap.put("username",    u.getUsername());
        userMap.put("fullName",    u.getFullName());
        userMap.put("role",        u.getRole());

        // Inject the avatar URL so post cards show the author's profile picture
        userMap.put("profileImageUrl", buildAvatarUrl(request, u));
        map.put("user", userMap);
        return map;
    }

    /** Returns the avatar URL only when the user actually has an image stored. */
    private String buildAvatarUrl(HttpServletRequest request, User u) {
        if (u.getProfileImage() == null) return null;
        return request.getScheme() + "://" + request.getServerName()
                + ":" + request.getServerPort()
                + "/api/users/" + u.getId() + "/avatar";
    }

    private String resolveFileType(String contentType) {
        if (contentType == null)                      return "other";
        if (contentType.startsWith("image/"))         return "image";
        if (contentType.startsWith("video/"))         return "video";
        if (contentType.equals("application/pdf"))    return "pdf";
        return "other";
    }
}
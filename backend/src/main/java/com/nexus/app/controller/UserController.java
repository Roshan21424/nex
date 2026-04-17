package com.nexus.app.controller;

import com.nexus.app.entity.Follow;
import com.nexus.app.entity.User;
import com.nexus.app.repository.FollowRepository;
import com.nexus.app.repository.UserRepository;
import com.nexus.app.service.S3Service;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepo;
    private final FollowRepository followRepo;
    private final S3Service s3;

    public UserController(UserRepository userRepo, FollowRepository followRepo, S3Service s3) {
        this.userRepo   = userRepo;
        this.followRepo = followRepo;
        this.s3         = s3;
    }

    @GetMapping("/{id}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Long id) {

        // find user
        Optional<User> opt = userRepo.findById(id);

        // if user is empty return NOT_FOUND
        if (opt.isEmpty()){
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        if (opt.get().getProfileImage() == null){
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
        User u = opt.get();
        String ct = u.getProfileImageContentType() != null ? u.getProfileImageContentType() : "image/jpeg";
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(ct)).body(u.getProfileImage());
    }

    @PostMapping("/{id}/profile-pic")
    public ResponseEntity<?> uploadProfilePic(@PathVariable Long id,
                                              @RequestParam("file") MultipartFile file,
                                              HttpServletRequest request) {
        return userRepo.findById(id).map(user -> {
            try {
                user.setProfileImage(file.getBytes());
                user.setProfileImageContentType(file.getContentType());
                userRepo.save(user);
                return ResponseEntity.ok(Map.of("profileImageUrl", buildAvatarUrl(request, id)));
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to store image: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id,
                                     @RequestParam(required = false) Long viewerId,
                                     HttpServletRequest request) {
        return userRepo.findById(id)
                .map(u -> ResponseEntity.ok(buildUserMap(u, viewerId, request)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id,
                                           @RequestBody Map<String, String> body,
                                           HttpServletRequest request) {
        return userRepo.findById(id).map(user -> {
            if (body.containsKey("bio"))      user.setBio(body.get("bio"));
            if (body.containsKey("phone"))    user.setPhone(body.get("phone"));
            if (body.containsKey("fullName")) user.setFullName(body.get("fullName"));
            if (body.containsKey("location")) user.setLocation(body.get("location"));
            if (body.containsKey("website"))  user.setWebsite(body.get("website"));
            userRepo.save(user);
            user.setPassword(null);
            user.setProfileImageUrl(buildAvatarUrl(request, user.getId()));
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{targetId}/follow")
    public ResponseEntity<?> followToggle(@PathVariable Long targetId,
                                          @RequestParam Long userId) {
        User follower  = userRepo.findById(userId).orElseThrow();
        User following = userRepo.findById(targetId).orElseThrow();
        Optional<Follow> existing = followRepo.findByFollowerIdAndFollowingId(userId, targetId);
        if (existing.isPresent()) {
            followRepo.delete(existing.get());
            return ResponseEntity.ok(Map.of("following", false));
        } else {
            followRepo.save(Follow.builder().follower(follower).following(following).build());
            return ResponseEntity.ok(Map.of("following", true));
        }
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<?> getFollowers(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(
                followRepo.findByFollowingId(id).stream()
                        .map(f -> buildUserMap(f.getFollower(), null, request))
                        .collect(Collectors.toList()));
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<?> getFollowing(@PathVariable Long id, HttpServletRequest request) {
        return ResponseEntity.ok(
                followRepo.findByFollowerId(id).stream()
                        .map(f -> buildUserMap(f.getFollowing(), null, request))
                        .collect(Collectors.toList()));
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String q,
                                    @RequestParam(required = false) Long viewerId,
                                    HttpServletRequest request) {
        return ResponseEntity.ok(
                userRepo.findByFullNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(q, q)
                        .stream().map(u -> buildUserMap(u, viewerId, request))
                        .collect(Collectors.toList()));
    }

    @GetMapping
    public ResponseEntity<?> allUsers(@RequestParam(required = false) Long viewerId,
                                      HttpServletRequest request) {
        return ResponseEntity.ok(
                userRepo.findAll().stream()
                        .map(u -> buildUserMap(u, viewerId, request))
                        .collect(Collectors.toList()));
    }

    private String buildAvatarUrl(HttpServletRequest request, Long userId) {
        return userRepo.findById(userId)
                .filter(u -> u.getProfileImage() != null)
                .map(u -> request.getScheme() + "://" + request.getServerName()
                        + ":" + request.getServerPort()
                        + "/api/users/" + userId + "/avatar")
                .orElse(null);
    }

    private Map<String, Object> buildUserMap(User u, Long viewerId, HttpServletRequest request) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id",             u.getId());
        map.put("username",       u.getUsername());
        map.put("fullName",       u.getFullName());
        map.put("email",          u.getEmail());
        map.put("role",           u.getRole());
        map.put("bio",            u.getBio());
        map.put("location",       u.getLocation());
        map.put("website",        u.getWebsite());
        map.put("phone",          u.getPhone());
        map.put("createdAt",      u.getCreatedAt());
        map.put("followersCount", followRepo.countByFollowingId(u.getId()));
        map.put("followingCount", followRepo.countByFollowerId(u.getId()));
        String avatarUrl = (u.getProfileImage() != null)
                ? request.getScheme() + "://" + request.getServerName()
                + ":" + request.getServerPort() + "/api/users/" + u.getId() + "/avatar"
                : null;
        map.put("profileImageUrl", avatarUrl);
        map.put("isFollowing", viewerId != null
                && followRepo.existsByFollowerIdAndFollowingId(viewerId, u.getId()));
        return map;
    }
}

package com.nexus.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

    @Entity
    @Table(name = "users")
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public class User {

        @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(unique = true, nullable = false)
        private String username;

        @Column(unique = true, nullable = false)
        private String email;

        @Column(nullable = false)
        private String password;

        @Enumerated(EnumType.STRING)
        private Role role;

        private String fullName;
        private String bio;
        private String location;
        private String website;
        private String phone;

        // profile image stored as blob
        @Lob
        @Column(name = "profile_image", columnDefinition = "LONGBLOB")
        private byte[] profileImage;

        @Column(name = "profile_image_content_type")
        private String profileImageContentType;

        @Transient
        private String profileImageUrl;

        @Column(updatable = false)
        private LocalDateTime createdAt;

        @PrePersist
        protected void onCreate() { createdAt = LocalDateTime.now(); }

        public enum Role { USER, ADMIN }
    }
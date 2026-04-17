package com.nexus.app.config;

import com.nexus.app.entity.User;
import com.nexus.app.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepo;

    public DataInitializer(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    public void run(String... args) {
        if (userRepo.count() > 0) return;

        seedUsers();
        seedAdmins();
        attachProfilePictures();

        System.out.println("✅ DataInitializer: seeded all accounts.");
    }

    // ── Profile picture loader ─────────────────────────────────────────────
    private void attachProfilePictures() {
        String[] extensions = {"jpg", "jpeg", "png", "webp"};
        userRepo.findAll().forEach(user -> {
            for (String ext : extensions) {
                String path = "seed-images/" + user.getUsername() + "." + ext;
                ClassPathResource resource = new ClassPathResource(path);
                if (resource.exists()) {
                    try (InputStream is = resource.getInputStream()) {
                        user.setProfileImage(is.readAllBytes());
                        user.setProfileImageContentType(mimeType(ext));
                        userRepo.save(user);
                        System.out.println("  📸 Profile pic loaded for: " + user.getUsername());
                        return;
                    } catch (IOException e) {
                        System.err.println("  ⚠️  Failed to load image for " + user.getUsername() + ": " + e.getMessage());
                    }
                    break;
                }
            }
        });
    }

    private String mimeType(String ext) {
        return switch (ext.toLowerCase()) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png"         -> "image/png";
            case "webp"        -> "image/webp";
            default            -> "image/jpeg";
        };
    }

    // ── Seed normal users ─────────────────────────────────────────────────
    private void seedUsers() {
        List<Object[]> users = List.of(
                new Object[]{"alex.morgan",   "alex@example.com",    "Pass@123", "Alex Morgan",   "Photographer & traveler 📸", "New York, USA",    "https://alexmorgan.com"},
                new Object[]{"priya.sharma",  "priya@example.com",   "Pass@123", "Priya Sharma",  "Designer | Coffee lover ☕",  "Mumbai, India",    ""},
                new Object[]{"jake.wu",       "jake@example.com",    "Pass@123", "Jake Wu",       "Software engineer 👨‍💻",       "San Francisco, CA","https://jakewu.dev"},
                new Object[]{"sofia.reyes",   "sofia@example.com",   "Pass@123", "Sofia Reyes",   "Artist & illustrator 🎨",     "Barcelona, Spain", "https://sofiart.io"},
                new Object[]{"liam.okafor",   "liam@example.com",    "Pass@123", "Liam Okafor",   "Writer & storyteller ✍️",     "Lagos, Nigeria",   ""},
                new Object[]{"emma.chen",     "emma@example.com",    "Pass@123", "Emma Chen",     "Fitness & wellness 🏃",       "Toronto, Canada",  ""},
                new Object[]{"noah.patel",    "noah@example.com",    "Pass@123", "Noah Patel",    "Music producer 🎵",           "London, UK",       "https://noahbeats.com"},
                new Object[]{"mia.kowalski",  "mia@example.com",     "Pass@123", "Mia Kowalski",  "Foodie & recipe creator 🍜",  "Warsaw, Poland",   ""},
                new Object[]{"ethan.kim",     "ethan@example.com",   "Pass@123", "Ethan Kim",     "Gamer & streamer 🎮",         "Seoul, South Korea","https://ethanstreams.tv"},
                new Object[]{"aisha.hassan",  "aisha@example.com",   "Pass@123", "Aisha Hassan",  "Entrepreneur & startup ⚡",   "Dubai, UAE",       ""}
        );

        for (Object[] u : users) {
            userRepo.save(User.builder()
                    .username((String) u[0])
                    .email((String) u[1])
                    .password((String) u[2])
                    .fullName((String) u[3])
                    .bio((String) u[4])
                    .location((String) u[5])
                    .website((String) u[6])
                    .role(User.Role.USER)
                    .build());
        }
    }

    // ── Seed admins ──────────────────────────────────────────────────────
    private void seedAdmins() {
        userRepo.save(User.builder()
                .username("admin")
                .email("admin@nexus.com")
                .password("Admin@123")
                .fullName("Nexus Admin")
                .bio("Platform administrator")
                .role(User.Role.ADMIN)
                .build());
    }
}
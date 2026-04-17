package com.nexus.app.repository;

import com.nexus.app.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    // FIX: added a count query so PostController can get the comment count
    // without loading every Comment object into memory just to call .size().
    // Previously: commentRepo.findByPostIdOrderByCreatedAtAsc(postId).size()
    // Now:        commentRepo.countByPostId(postId)
    long countByPostId(Long postId);
}
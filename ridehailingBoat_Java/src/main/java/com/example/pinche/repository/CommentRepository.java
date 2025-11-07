package com.example.pinche.repository;

import com.example.pinche.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Map;

public interface CommentRepository extends JpaRepository<Comment, Integer> {
    @Query(value = "SELECT c.*, u.avatarUrl, u.nickName FROM xcx_comment c LEFT JOIN xcx_user u ON c.uid = u.id WHERE c.iid = :iid AND c.type = :type ORDER BY c.time DESC", nativeQuery = true)
    Page<Map<String, Object>> findComments(@Param("iid") String iid, @Param("type") String type, Pageable pageable);

    long countByIidAndType(String iid, String type);

    @Query(value = "SELECT c.id, c.iid, c.reply, c.content, u.nickName FROM xcx_comment c LEFT JOIN xcx_user u ON c.uid = u.id WHERE c.iid IN :iids AND c.type = :type ORDER BY c.time DESC", nativeQuery = true)
    List<Map<String, Object>> findCommentsByIids(@Param("iids") List<String> iids, @Param("type") String type);
}
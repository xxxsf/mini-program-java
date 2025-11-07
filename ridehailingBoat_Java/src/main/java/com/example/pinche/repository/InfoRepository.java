package com.example.pinche.repository;

import com.example.pinche.entity.Info;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Map;

public interface InfoRepository extends JpaRepository<Info, Integer> {

    @Query(value = "SELECT i.*, u.avatarUrl, u.nickName FROM xcx_info i LEFT JOIN xcx_user u ON i.uid = u.id WHERE i.type = ?1 AND i.status = 0 ORDER BY i.addtime DESC", nativeQuery = true)
    Page<Map<String, Object>> findInfo(Integer type, Pageable pageable);

    long countByUid(Integer uid);

    Page<Info> findByUid(Integer uid, Pageable pageable);
}
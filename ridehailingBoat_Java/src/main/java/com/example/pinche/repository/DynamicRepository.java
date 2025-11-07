package com.example.pinche.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.example.pinche.entity.Dynamic;

import java.util.Map;

public interface DynamicRepository extends JpaRepository<Dynamic, Integer> {
    @Query(value = "SELECT d.*, u.avatarUrl, u.nickName FROM xcx_dynamic d LEFT JOIN xcx_user u ON d.uid = u.id ORDER BY d.time DESC",
            countQuery = "SELECT count(*) FROM xcx_dynamic",
            nativeQuery = true)
    Page<Map<String, Object>> findDynamics(Pageable pageable);
}
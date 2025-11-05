package com.example.pinche.repository;

import com.example.pinche.entity.Msg;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

public interface MsgRepository extends JpaRepository<Msg, Integer> {

    @Query(value = "SELECT m.*, u.avatarUrl, u.nickName FROM xcx_msg m LEFT JOIN xcx_user u ON m.fid = u.id WHERE m.uid = ?1 AND m.type = ?2 ORDER BY m.time DESC", nativeQuery = true)
    Page<Map<String, Object>> findMsgs(Integer uid, Integer type, Pageable pageable);

    @Transactional
    @Modifying
    @Query("UPDATE Msg m SET m.see = 1 WHERE m.id IN ?1")
    void updateSee(List<Integer> ids);

    @Query(value = "SELECT type, COUNT(*) as count FROM xcx_msg WHERE uid = ?1 AND see = 0 GROUP BY type", nativeQuery = true)
    List<Map<String, Object>> countUnread(Integer uid);
}
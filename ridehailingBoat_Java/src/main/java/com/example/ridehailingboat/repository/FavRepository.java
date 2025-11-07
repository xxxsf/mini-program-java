package com.example.ridehailingboat.repository;

import com.example.ridehailingboat.entity.Fav;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Map;

public interface FavRepository extends JpaRepository<Fav, Integer> {
    Fav findByUidAndIid(Integer uid, Integer iid);

    void deleteByUidAndIid(Integer uid, Integer iid);

    @Query(value = "SELECT i.*, f.id as fad FROM xcx_fav f LEFT JOIN xcx_info i ON i.id = f.iid WHERE f.uid = :uid ORDER BY f.time ASC",
            countQuery = "SELECT count(*) FROM xcx_fav WHERE uid = :uid",
            nativeQuery = true)
    Page<Map<String, Object>> findMyFav(@Param("uid") Integer uid, Pageable pageable);
}
package com.example.ridehailingboat.repository;

import com.example.ridehailingboat.entity.Zan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZanRepository extends JpaRepository<Zan, Integer> {
    Zan findByUidAndCid(Integer uid, Integer cid);
}
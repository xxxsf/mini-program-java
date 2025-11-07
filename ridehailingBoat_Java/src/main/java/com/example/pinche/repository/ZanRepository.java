package com.example.pinche.repository;

import com.example.pinche.entity.Zan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZanRepository extends JpaRepository<Zan, Integer> {
    Zan findByUidAndCid(Integer uid, Integer cid);
}
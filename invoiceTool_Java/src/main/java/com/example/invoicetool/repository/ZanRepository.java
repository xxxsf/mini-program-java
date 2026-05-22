package com.example.invoicetool.repository;

import com.example.invoicetool.entity.Zan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZanRepository extends JpaRepository<Zan, Integer> {
    Zan findByUidAndCid(Integer uid, Integer cid);
}
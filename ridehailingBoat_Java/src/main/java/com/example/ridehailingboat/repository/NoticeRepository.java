package com.example.ridehailingboat.repository;

import com.example.ridehailingboat.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Integer> {
}
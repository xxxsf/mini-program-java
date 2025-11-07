package com.example.ridehailingboat.repository;

import com.example.ridehailingboat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
    User findByOpenId(String openId);
}
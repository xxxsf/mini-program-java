package com.example.pinche.repository;

import com.example.pinche.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
    User findByOpenId(String openId);
}
package com.example.invoicetool.repository;

import com.example.invoicetool.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
    User findByOpenId(String openId);
}
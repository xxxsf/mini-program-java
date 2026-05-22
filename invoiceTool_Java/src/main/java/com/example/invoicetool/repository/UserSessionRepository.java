package com.example.invoicetool.repository;

import com.example.invoicetool.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionRepository extends JpaRepository<UserSession, Integer> {
    UserSession findBySk(String sk);
}

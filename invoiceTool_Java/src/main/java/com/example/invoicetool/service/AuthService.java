package com.example.invoicetool.service;

import com.example.invoicetool.entity.User;
import com.example.invoicetool.entity.UserSession;
import com.example.invoicetool.repository.UserRepository;
import com.example.invoicetool.repository.UserSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;

@Service
public class AuthService {
    @Autowired
    private UserSessionRepository userSessionRepository;
    @Autowired
    private UserRepository userRepository;

    public String createSession(User user, String sessionKey) {
        long now = System.currentTimeMillis();
        UserSession userSession = new UserSession();
        userSession.setSk(randomToken());
        userSession.setUserId(user.getId());
        userSession.setOpenId(user.getOpenId());
        userSession.setSessionKey(sessionKey);
        userSession.setCreateTime(now);
        userSession.setExpireTime(now + 30L * 24L * 60L * 60L * 1000L);
        userSessionRepository.save(userSession);
        return userSession.getSk();
    }

    public User requireUser(String sk) {
        if (sk == null || sk.trim().isEmpty()) {
            return null;
        }
        UserSession session = userSessionRepository.findBySk(sk);
        if (session == null || session.getExpireTime() == null || session.getExpireTime() < System.currentTimeMillis()) {
            return null;
        }
        return userRepository.findById(session.getUserId()).orElse(null);
    }

    public boolean isValid(String sk) {
        return requireUser(sk) != null;
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

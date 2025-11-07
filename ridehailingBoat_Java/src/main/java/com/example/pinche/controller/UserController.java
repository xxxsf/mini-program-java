package com.example.pinche.controller;

import com.example.pinche.entity.User;
import com.example.pinche.repository.UserRepository;
import com.example.pinche.service.WeChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private WeChatService weChatService;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestParam String code,
                                     @RequestParam String appid,
                                     @RequestParam String appsecret,
                                     @RequestParam String encryptedData,
                                     @RequestParam String iv) {
        Map<String, Object> result = new HashMap<>();

        // 1) code2session 获取 openid & session_key
        Map<String, String> session = weChatService.code2Session(appid, appsecret, code);
        String openId = session.get("openid");
        String sessionKey = session.get("session_key");
        if (openId == null || sessionKey == null) {
            result.put("status", 0);
            result.put("msg", "微信登录失败: " + session.getOrDefault("raw", "code2session 无返回"));
            return result;
        }

        // 2) 解密用户信息
        Map<String, Object> userInfo = weChatService.decryptUserInfo(encryptedData, sessionKey, iv);
        if (userInfo.containsKey("error")) {
            result.put("status", 0);
            result.put("msg", "用户信息解密失败: " + userInfo.get("error"));
            return result;
        }

        // 3) 落库到 xcx_user（按 openId upsert）
        User user = userRepository.findByOpenId(openId);
        if (user == null) {
            user = new User();
            user.setOpenId(openId);
        }
        user.setNickName((String) userInfo.get("nickName"));
        user.setAvatarUrl((String) userInfo.get("avatarUrl"));
        user.setGender(String.valueOf(userInfo.get("gender"))); // gender 可能是数字，统一为字符串
        user.setCity((String) userInfo.get("city"));
        user.setProvince((String) userInfo.get("province"));
        user.setCountry((String) userInfo.get("country"));
        user.setLanguage((String) userInfo.get("language"));

        userRepository.save(user);

        // 4) 维持兼容的 sk 返回（前端依赖该格式）
        String sk = "mock_sk_" + openId;

        result.put("status", 1);
        result.put("msg", "登录成功");
        result.put("user", user);
        result.put("sk", sk);
        return result;
    }

    @PostMapping("/editUser")
    public Map<String, Object> editUser(@RequestBody User user, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        String openId = "mock_openid_12345"; // Placeholder for openId from sk
        User existingUser = userRepository.findByOpenId(openId);
        if (existingUser != null) {
            existingUser.setNickName(user.getNickName());
            existingUser.setAvatarUrl(user.getAvatarUrl());
            existingUser.setGender(user.getGender());
            existingUser.setCity(user.getCity());
            existingUser.setProvince(user.getProvince());
            existingUser.setCountry(user.getCountry());
            existingUser.setLanguage(user.getLanguage());
            userRepository.save(existingUser);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "修改成功");
        result.put("user", existingUser);
        return result;
    }

    @PostMapping("/vaild_sk")
    public Map<String, Object> vaildSk(@RequestParam String sk) {
        // TODO: Implement actual sk validation
        boolean isValid = sk != null && sk.startsWith("mock_sk_");

        Map<String, Object> result = new HashMap<>();
        result.put("status", isValid ? 1 : 0);
        return result;
    }
}
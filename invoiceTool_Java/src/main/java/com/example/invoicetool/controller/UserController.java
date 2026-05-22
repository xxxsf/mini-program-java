package com.example.invoicetool.controller;

import com.example.invoicetool.entity.User;
import com.example.invoicetool.repository.UserRepository;
import com.example.invoicetool.service.AuthService;
import com.example.invoicetool.service.WeChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
    @Autowired
    private AuthService authService;
    @Value("${wechat.appid}")
    private String appid;
    @Value("${wechat.appsecret}")
    private String appsecret;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestParam String code,
                                     @RequestParam(required = false) String encryptedData,
                                     @RequestParam(required = false) String iv) {
        Map<String, Object> result = new HashMap<>();

        // 1) code2session 获取 openid & session_key
        if (appsecret == null || appsecret.trim().isEmpty()) {
            result.put("status", 0);
            result.put("msg", "后端未配置微信 appsecret");
            return result;
        }
        Map<String, String> session = weChatService.code2Session(appid, appsecret, code);
        String openId = session.get("openid");
        String sessionKey = session.get("session_key");
        if (openId == null || sessionKey == null) {
            result.put("status", 0);
            result.put("msg", "微信登录失败: " + session.getOrDefault("raw", "code2session 无返回"));
            return result;
        }

        // 2) 解密用户信息（如果提供了 encryptedData 和 iv）
        Map<String, Object> userInfo = null;
        if (encryptedData != null && !encryptedData.isEmpty()
                && iv != null && !iv.isEmpty()) {
            userInfo = weChatService.decryptUserInfo(encryptedData, sessionKey, iv);
            if (userInfo.containsKey("error")) {
                userInfo = null;
            }
        }

        // 3) 落库到 xcx_user（按 openId upsert）
        User user = userRepository.findByOpenId(openId);
        if (user == null) {
            user = new User();
            user.setOpenId(openId);
        }
        if (userInfo != null) {
            user.setNickName((String) userInfo.get("nickName"));
            user.setAvatarUrl((String) userInfo.get("avatarUrl"));
            user.setGender(String.valueOf(userInfo.get("gender")));
            user.setCity((String) userInfo.get("city"));
            user.setProvince((String) userInfo.get("province"));
            user.setCountry((String) userInfo.get("country"));
            user.setLanguage((String) userInfo.get("language"));
        } else if (user.getNickName() == null) {
            user.setNickName("微信用户");
        }

        userRepository.save(user);

        String sk = authService.createSession(user, sessionKey);

        result.put("status", 1);
        result.put("msg", "登录成功");
        result.put("user", user);
        result.put("sk", sk);
        return result;
    }

    @PostMapping("/editUser")
    public Map<String, Object> editUser(@RequestBody User user, @RequestParam String sk) {
        User existingUser = authService.requireUser(sk);
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
        boolean isValid = authService.isValid(sk);

        Map<String, Object> result = new HashMap<>();
        result.put("status", isValid ? 1 : 0);
        return result;
    }
}

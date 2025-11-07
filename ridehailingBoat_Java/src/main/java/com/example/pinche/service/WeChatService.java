package com.example.pinche.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class WeChatService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, String> code2Session(String appid, String appsecret, String code) {
        String url = String.format(
                "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                appid, appsecret, code);
        String resp = restTemplate.getForObject(url, String.class);
        Map<String, String> result = new HashMap<>();
        try {
            JsonNode node = objectMapper.readTree(resp);
            String openid = node.path("openid").asText(null);
            String sessionKey = node.path("session_key").asText(null);
            result.put("openid", openid);
            result.put("session_key", sessionKey);
            result.put("raw", resp);
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }

    public Map<String, Object> decryptUserInfo(String encryptedData, String sessionKey, String iv) {
        Map<String, Object> map = new HashMap<>();
        try {
            String json = com.example.pinche.util.WxDecryptUtil.decrypt(encryptedData, sessionKey, iv);
            JsonNode node = objectMapper.readTree(json);
            map.put("avatarUrl", node.path("avatarUrl").asText(null));
            map.put("city", node.path("city").asText(null));
            map.put("country", node.path("country").asText(null));
            map.put("gender", node.path("gender").asText(null));
            map.put("language", node.path("language").asText(null));
            map.put("nickName", node.path("nickName").asText(null));
            map.put("province", node.path("province").asText(null));
        } catch (Exception e) {
            map.put("error", e.getMessage());
        }
        return map;
    }
}
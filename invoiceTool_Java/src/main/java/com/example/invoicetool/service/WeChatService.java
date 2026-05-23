package com.example.invoicetool.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import javax.net.ssl.*;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.security.cert.X509Certificate;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class WeChatService {

    private final RestTemplate restTemplate = createSSLTrustingRestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private RestTemplate createSSLTrustingRestTemplate() {
        try {
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public java.security.cert.X509Certificate[] getAcceptedIssuers() { return null; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }
            };

            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

            // Create an all-trusting host name verifier
            HostnameVerifier allHostsValid = new HostnameVerifier() {
                public boolean verify(String hostname, SSLSession session) { return true; }
            };
            HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);

            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory() {
                @Override
                protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
                    if (connection instanceof HttpsURLConnection) {
                        ((HttpsURLConnection) connection).setSSLSocketFactory(sc.getSocketFactory());
                        ((HttpsURLConnection) connection).setHostnameVerifier(allHostsValid);
                    }
                    super.prepareConnection(connection, httpMethod);
                }
            };

            return new RestTemplate(requestFactory);
        } catch (Exception e) {
            System.err.println("[WeChatService] Failed to create SSL-trusting RestTemplate: " + e.getMessage());
            return new RestTemplate();
        }
    }

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
    String json = com.example.invoicetool.util.WxDecryptUtil.decrypt(encryptedData, sessionKey, iv);
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
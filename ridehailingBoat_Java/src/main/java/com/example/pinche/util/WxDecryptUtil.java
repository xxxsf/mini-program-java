package com.example.pinche.util;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class WxDecryptUtil {
    public static String decrypt(String encryptedData, String sessionKey, String iv) throws Exception {
        byte[] dataBytes = Base64.getDecoder().decode(encryptedData);
        byte[] keyBytes = Base64.getDecoder().decode(sessionKey);
        byte[] ivBytes = Base64.getDecoder().decode(iv);

        // PKCS7 等同于 PKCS5Padding 在 JCE 中
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(ivBytes);
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
        byte[] resultBytes = cipher.doFinal(dataBytes);
        return new String(resultBytes, StandardCharsets.UTF_8);
    }
}
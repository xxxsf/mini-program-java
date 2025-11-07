package com.example.ridehailingboat.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @PostMapping
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        if (file.isEmpty()) {
            result.put("status", 0);
            result.put("msg", "上传失败，请选择文件");
            return result;
        }

        String fileName = file.getOriginalFilename();
        String suffixName = fileName.substring(fileName.lastIndexOf("."));
        String filePath = "/tmp/uploads/";
        fileName = UUID.randomUUID() + suffixName;
        File dest = new File(filePath + fileName);
        if (!dest.getParentFile().exists()) {
            dest.getParentFile().mkdirs();
        }
        try {
            file.transferTo(dest);
            result.put("status", 1);
            result.put("msg", "上传成功");
            result.put("data", "/uploads/" + fileName);
        } catch (IOException e) {
            e.printStackTrace();
            result.put("status", 0);
            result.put("msg", "上传失败");
        }
        return result;
    }
}
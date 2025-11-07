package com.example.pinche.controller;

import com.example.pinche.entity.Notice;
import com.example.pinche.repository.NoticeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notice")
public class NoticeController {

    @Autowired
    private NoticeRepository noticeRepository;

    @GetMapping("/index")
    public Map<String, Object> index(@RequestParam Integer id) {
        Notice notice = noticeRepository.findById(id).orElse(null);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("data", notice);
        return result;
    }
}
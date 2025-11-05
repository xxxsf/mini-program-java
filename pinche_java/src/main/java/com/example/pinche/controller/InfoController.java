package com.example.pinche.controller;

import com.example.pinche.entity.Info;
import com.example.pinche.repository.InfoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/info")
public class InfoController {

    @Autowired
    private InfoRepository infoRepository;

    @PostMapping("/add")
    public Map<String, Object> add(@RequestBody Info info, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID
        info.setUid(userId);
        info.setAddtime((int) (System.currentTimeMillis() / 1000));

        Info savedInfo = infoRepository.save(info);

        // TODO: Implement update user info logic

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "发布成功");
        result.put("info", savedInfo.getId());
        return result;
    }

    @GetMapping("/index")
    public Map<String, Object> index(@RequestParam Integer id) {
        Info info = infoRepository.findById(id).orElse(null);

        // TODO: Implement see count logic

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("info", info);
        return result;
    }

    @GetMapping("/lists")
    public Map<String, Object> lists(@RequestParam Integer type, @RequestParam(defaultValue = "1") Integer page) {
        Pageable pageable = PageRequest.of(page - 1, 10);
        Page<Map<String, Object>> infoPage = infoRepository.findInfo(type, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("data", infoPage.getContent());
        return result;
    }

    @PostMapping("/del")
    public Map<String, Object> del(@RequestParam Integer id, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID
        infoRepository.deleteById(id);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "删除成功");
        return result;
    }

    @GetMapping("/mycount")
    public Map<String, Object> mycount(@RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID
        long count = infoRepository.countByUid(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("count", count);
        return result;
    }

    @GetMapping("/mylist")
    public Map<String, Object> mylist(@RequestParam String sk, @RequestParam(defaultValue = "1") Integer page) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID
        Pageable pageable = PageRequest.of(page - 1, 10);
        Page<Info> infoPage = infoRepository.findByUid(userId, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("data", infoPage.getContent());
        return result;
    }
}
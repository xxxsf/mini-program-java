package com.example.pinche.controller;

import com.example.pinche.entity.Dynamic;
import com.example.pinche.repository.CommentRepository;
import com.example.pinche.repository.DynamicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dynamic")
public class DynamicController {

    @Autowired
    private DynamicRepository dynamicRepository;

    @Autowired
    private CommentRepository commentRepository;

    @PostMapping("/add")
    public Map<String, Object> add(@RequestBody Dynamic dynamic, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID
        dynamic.setUid(userId);
        dynamic.setTime((int) (System.currentTimeMillis() / 1000));

        dynamicRepository.save(dynamic);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "发表成功");
        return result;
    }

    @PostMapping("/del")
    public Map<String, Object> del(@RequestParam Integer id, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        dynamicRepository.deleteById(id);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "删除成功");
        return result;
    }

    @GetMapping("/getList")
    public Map<String, Object> getList(@RequestParam(defaultValue = "1") int page, @RequestParam(required = false) String sk) {
        Pageable pageable = PageRequest.of(page - 1, 20);
        Page<Map<String, Object>> dynamicsPage = dynamicRepository.findDynamics(pageable);
        List<Map<String, Object>> dynamics = dynamicsPage.getContent();

        List<String> iids = dynamics.stream().map(d -> d.get("id").toString()).collect(Collectors.toList());
        if (!iids.isEmpty()) {
            List<Map<String, Object>> comments = commentRepository.findCommentsByIids(iids, "dynamic");
            Map<String, List<Map<String, Object>>> commentsMap = comments.stream().collect(Collectors.groupingBy(c -> c.get("iid").toString()));
            dynamics.forEach(d -> d.put("comment", commentsMap.get(d.get("id").toString())));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("list", dynamics);
        return result;
    }
}
package com.example.ridehailingboat.controller;

import com.example.ridehailingboat.repository.MsgRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/msg")
public class MsgController {

    @Autowired
    private MsgRepository msgRepository;

    @GetMapping("/get")
    public Map<String, Object> get(@RequestParam String sk, @RequestParam Integer type, @RequestParam(defaultValue = "1") Integer page) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        Pageable pageable = PageRequest.of(page - 1, 20);
        Page<Map<String, Object>> msgPage = msgRepository.findMsgs(userId, type, pageable);

        List<Integer> ids = msgPage.getContent().stream().map(m -> (Integer) m.get("id")).collect(Collectors.toList());
        if (!ids.isEmpty()) {
            msgRepository.updateSee(ids);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "消息加载成功");
        result.put("data", msgPage.getContent());
        return result;
    }

    @GetMapping("/getAll")
    public Map<String, Object> getAll(@RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        List<Map<String, Object>> counts = msgRepository.countUnread(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "消息加载成功");
        result.put("data", counts);
        return result;
    }
}
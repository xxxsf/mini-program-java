package com.example.ridehailingboat.controller;

import com.example.ridehailingboat.entity.Comment;
import com.example.ridehailingboat.entity.Zan;
import com.example.ridehailingboat.repository.CommentRepository;
import com.example.ridehailingboat.repository.ZanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/comment")
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ZanRepository zanRepository;

    @GetMapping("/get")
    public Map<String, Object> get(@RequestParam String id, @RequestParam String type, @RequestParam(defaultValue = "1") int page) {
        Pageable pageable = PageRequest.of(page - 1, 20);
        Page<Map<String, Object>> comments = commentRepository.findComments(id, type, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "评论加载成功");
        result.put("data", comments.getContent());
        return result;
    }

    @GetMapping("/get_count")
    public Map<String, Object> getCount(@RequestParam String id, @RequestParam String type) {
        long count = commentRepository.countByIidAndType(id, type);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "评论总数加载成功");
        result.put("data", count);
        return result;
    }

    @PostMapping("/add")
    public Map<String, Object> add(@RequestBody Comment comment, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID
        comment.setUid(userId);
        comment.setTime((int) (System.currentTimeMillis() / 1000));

        Comment savedComment = commentRepository.save(comment);

        // TODO: Implement msg logic

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "评论成功");
        result.put("id", savedComment.getId());
        return result;
    }

    @PostMapping("/zan")
    public Map<String, Object> zan(@RequestParam Integer cid, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        Zan existingZan = zanRepository.findByUidAndCid(userId, cid);
        if (existingZan != null) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", 0);
            result.put("msg", "你已经赞过了");
            return result;
        }

        Zan zan = new Zan();
        zan.setUid(userId);
        zan.setCid(cid);
        zan.setTime((int) (System.currentTimeMillis() / 1000));
        zanRepository.save(zan);

        Comment comment = commentRepository.findById(cid).orElse(null);
        if (comment != null) {
            comment.setZan(comment.getZan() + 1);
            commentRepository.save(comment);
            // TODO: Implement msg logic
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "点赞成功");
        result.put("zan", comment != null ? comment.getZan() : 0);
        return result;
    }
}
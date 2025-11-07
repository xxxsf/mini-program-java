package com.example.ridehailingboat.controller;

import com.example.ridehailingboat.entity.Fav;
import com.example.ridehailingboat.repository.FavRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/fav")
public class FavController {

    @Autowired
    private FavRepository favRepository;

    @PostMapping("/addFav")
    public Map<String, Object> addFav(@RequestBody Fav fav, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID
        fav.setUid(userId);
        fav.setTime((int) (System.currentTimeMillis() / 1000));

        favRepository.save(fav);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "收藏成功");
        return result;
    }

    @PostMapping("/delFav")
    public Map<String, Object> delFav(@RequestParam Integer iid, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        favRepository.deleteByUidAndIid(userId, iid);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "取消收藏成功");
        return result;
    }

    @GetMapping("/isFav")
    public Map<String, Object> isFav(@RequestParam Integer iid, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        Fav fav = favRepository.findByUidAndIid(userId, iid);

        Map<String, Object> result = new HashMap<>();
        if (fav != null) {
            result.put("status", 1);
            result.put("msg", "已收藏");
        } else {
            result.put("status", 0);
            result.put("msg", "未收藏");
        }
        return result;
    }

    @GetMapping("/myFav")
    public Map<String, Object> myFav(@RequestParam String sk, @RequestParam(defaultValue = "1") int page) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        Pageable pageable = PageRequest.of(page - 1, 20);
        Page<Map<String, Object>> favs = favRepository.findMyFav(userId, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("data", favs.getContent());
        return result;
    }
}
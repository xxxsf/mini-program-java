package com.example.invoicetool.controller;

import com.example.invoicetool.entity.InvoiceHeader;
import com.example.invoicetool.entity.User;
import com.example.invoicetool.repository.InvoiceHeaderRepository;
import com.example.invoicetool.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoiceHeader")
public class InvoiceHeaderController {
    @Autowired
    private InvoiceHeaderRepository invoiceHeaderRepository;
    @Autowired
    private AuthService authService;

    @PostMapping("/list")
    public Map<String, Object> list(@RequestParam String sk) {
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        if (user == null) {
            result.put("status", 0);
            result.put("msg", "登录已失效");
            return result;
        }
        List<InvoiceHeader> headers = invoiceHeaderRepository.findByUserIdOrderByCreateTimeDesc(user.getId());
        result.put("status", 1);
        result.put("data", headers);
        return result;
    }

    @PostMapping("/save")
    public Map<String, Object> save(@RequestParam String sk, @RequestBody InvoiceHeader header) {
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        if (user == null) {
            result.put("status", 0);
            result.put("msg", "登录已失效");
            return result;
        }
        long now = System.currentTimeMillis();
        InvoiceHeader target = header.getId() == null ? new InvoiceHeader() : invoiceHeaderRepository.findById(header.getId()).orElse(new InvoiceHeader());
        if (target.getId() != null && !user.getId().equals(target.getUserId())) {
            result.put("status", 0);
            result.put("msg", "无权操作");
            return result;
        }
        target.setUserId(user.getId());
        target.setName(header.getName());
        target.setTaxNo(header.getTaxNo());
        target.setAddress(header.getAddress());
        target.setPhone(header.getPhone());
        target.setBank(header.getBank());
        target.setBankAccount(header.getBankAccount());
        if (target.getCreateTime() == null) {
            target.setCreateTime(now);
        }
        target.setUpdateTime(now);
        invoiceHeaderRepository.save(target);
        result.put("status", 1);
        result.put("msg", "保存成功");
        result.put("data", target);
        return result;
    }

    @PostMapping("/delete")
    public Map<String, Object> delete(@RequestParam String sk, @RequestParam Integer id) {
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        InvoiceHeader header = id == null ? null : invoiceHeaderRepository.findById(id).orElse(null);
        if (user == null || header == null || !user.getId().equals(header.getUserId())) {
            result.put("status", 0);
            result.put("msg", "删除失败");
            return result;
        }
        invoiceHeaderRepository.delete(header);
        result.put("status", 1);
        result.put("msg", "删除成功");
        return result;
    }
}

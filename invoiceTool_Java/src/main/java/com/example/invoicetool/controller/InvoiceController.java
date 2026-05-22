package com.example.invoicetool.controller;

import com.example.invoicetool.entity.Invoice;
import com.example.invoicetool.entity.User;
import com.example.invoicetool.repository.InvoiceRepository;
import com.example.invoicetool.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoice")
public class InvoiceController {
    @Autowired
    private InvoiceRepository invoiceRepository;
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
        List<Invoice> invoices = invoiceRepository.findByUserIdOrderByCreateTimeDesc(user.getId());
        result.put("status", 1);
        result.put("data", invoices);
        return result;
    }

    @PostMapping("/save")
    public Map<String, Object> save(@RequestParam String sk, @RequestBody Invoice invoice) {
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        if (user == null) {
            result.put("status", 0);
            result.put("msg", "登录已失效");
            return result;
        }
        long now = System.currentTimeMillis();
        Invoice target = invoice.getId() == null ? new Invoice() : invoiceRepository.findById(invoice.getId()).orElse(new Invoice());
        if (target.getId() != null && !user.getId().equals(target.getUserId())) {
            result.put("status", 0);
            result.put("msg", "无权操作");
            return result;
        }
        target.setUserId(user.getId());
        target.setSellerName(value(invoice.getSellerName(), "待识别"));
        target.setBuyerName(value(invoice.getBuyerName(), "个人"));
        target.setAmount(invoice.getAmount() == null ? BigDecimal.ZERO : invoice.getAmount());
        target.setDate(invoice.getDate() == null ? now : invoice.getDate());
        target.setCategory(value(invoice.getCategory(), "其他"));
        target.setStatus(value(invoice.getStatus(), "normal"));
        target.setInvoiceNo(value(invoice.getInvoiceNo(), "FP" + now));
        target.setFileName(invoice.getFileName());
        target.setFileSize(invoice.getFileSize());
        target.setFilePath(invoice.getFilePath());
        if (target.getCreateTime() == null) {
            target.setCreateTime(now);
        }
        target.setUpdateTime(now);
        invoiceRepository.save(target);
        result.put("status", 1);
        result.put("msg", "保存成功");
        result.put("data", target);
        return result;
    }

    @PostMapping("/delete")
    public Map<String, Object> delete(@RequestParam String sk, @RequestParam Integer id) {
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        Invoice invoice = id == null ? null : invoiceRepository.findById(id).orElse(null);
        if (user == null || invoice == null || !user.getId().equals(invoice.getUserId())) {
            result.put("status", 0);
            result.put("msg", "删除失败");
            return result;
        }
        invoiceRepository.delete(invoice);
        result.put("status", 1);
        result.put("msg", "删除成功");
        return result;
    }

    private String value(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }
}

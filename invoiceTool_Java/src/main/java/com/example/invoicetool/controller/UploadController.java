package com.example.invoicetool.controller;

import com.example.invoicetool.entity.Invoice;
import com.example.invoicetool.entity.User;
import com.example.invoicetool.repository.InvoiceRepository;
import com.example.invoicetool.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {
    @Autowired
    private AuthService authService;
    @Autowired
    private InvoiceRepository invoiceRepository;

    @PostMapping
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file, @RequestParam String sk) {
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        if (user == null) {
            result.put("status", 0);
            result.put("msg", "登录已失效");
            return result;
        }
        if (file.isEmpty()) {
            result.put("status", 0);
            result.put("msg", "上传失败，请选择文件");
            return result;
        }

        String originalFileName = file.getOriginalFilename();
        String suffixName = originalFileName != null && originalFileName.lastIndexOf(".") >= 0 ? originalFileName.substring(originalFileName.lastIndexOf(".")) : ".pdf";
        String filePath = "/tmp/uploads/";
        String fileName = UUID.randomUUID() + suffixName;
        File dest = new File(filePath + fileName);
        if (!dest.getParentFile().exists()) {
            dest.getParentFile().mkdirs();
        }
        try {
            file.transferTo(dest);
            long now = System.currentTimeMillis();
            String displayName = originalFileName == null ? "待识别" : originalFileName.replaceAll("(?i)\\.pdf$", "");
            Invoice invoice = new Invoice();
            invoice.setUserId(user.getId());
            invoice.setSellerName(displayName);
            invoice.setBuyerName("个人");
            invoice.setAmount(BigDecimal.ZERO);
            invoice.setDate(now);
            invoice.setCategory("其他");
            invoice.setStatus("normal");
            invoice.setInvoiceNo("FP" + now);
            invoice.setFileName(originalFileName);
            invoice.setFileSize(file.getSize());
            invoice.setFilePath("/uploads/" + fileName);
            invoice.setCreateTime(now);
            invoice.setUpdateTime(now);
            invoiceRepository.save(invoice);
            result.put("status", 1);
            result.put("msg", "上传成功");
            result.put("data", invoice);
        } catch (IOException e) {
            e.printStackTrace();
            result.put("status", 0);
            result.put("msg", "上传失败");
        }
        return result;
    }
}
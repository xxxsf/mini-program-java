package com.example.invoicetool.controller;

import com.example.invoicetool.entity.Invoice;
import com.example.invoicetool.entity.User;
import com.example.invoicetool.repository.InvoiceRepository;
import com.example.invoicetool.service.AuthService;
import com.example.invoicetool.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
    @Autowired
    private OcrService ocrService;

    @PostMapping
    public Map<String, Object> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam String sk,
            @RequestParam(required = false) String sellerName,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal amount) {
        System.out.println("[Upload] 收到文件上传请求. 文件名: " + (file != null ? file.getOriginalFilename() : "null") + ", 大小: " + (file != null ? file.getSize() : 0) + ", sk: " + sk);
        System.out.println("[Upload] 前端传入的解析字段 - 商家: " + sellerName + ", 分类: " + category + ", 金额: " + amount);
        
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        if (user == null) {
            System.out.println("[Upload] 登录失效或未找到用户. sk: " + sk);
            result.put("status", 0);
            result.put("msg", "登录已失效");
            return result;
        }
        if (file == null || file.isEmpty()) {
            System.out.println("[Upload] 上传文件为空.");
            result.put("status", 0);
            result.put("msg", "上传失败，请选择文件");
            return result;
        }

        String originalFileName = file.getOriginalFilename();
        String suffixName = originalFileName != null && originalFileName.lastIndexOf(".") >= 0 ? originalFileName.substring(originalFileName.lastIndexOf(".")) : ".pdf";
        String fileName = UUID.randomUUID() + suffixName;
        try {
            // 直接读取上传字节存入 DB（LONGBLOB），不再依赖容器本地 /tmp，
            // 彻底规避云托管多实例 /tmp 不共享导致原件丢失问题。
            byte[] fileBytes = file.getBytes();
            System.out.println("[Upload] 读取到文件字节数: " + fileBytes.length + ", 将存入 DB");
            long now = System.currentTimeMillis();
            
            // ========== OCR 自动识别发票内容 ==========
            Map<String, Object> ocrResult = new HashMap<>();
            boolean isPdf = originalFileName != null && originalFileName.toLowerCase().endsWith(".pdf");
            
            // DEBUG: 检查OCR服务状态
            System.out.println("[Upload] 文件类型: " + (isPdf ? "PDF" : "非PDF") + 
                              ", OCR可用: " + ocrService.isAvailable());
            
            if (isPdf && ocrService.isAvailable()) {
                System.out.println("[Upload] 开始OCR识别PDF发票...");
                ocrResult = ocrService.recognizeInvoice(fileBytes);
                System.out.println("[Upload] OCR识别结果: " + ocrResult);
            } else {
                System.out.println("[Upload] 跳过OCR: isPdf=" + isPdf + ", ocrAvailable=" + ocrService.isAvailable());
            }
            
            // 优先使用OCR识别结果，其次使用前端传入参数，最后使用默认值
            String finalSeller = sellerName != null && !sellerName.trim().isEmpty() 
                ? sellerName 
                : (ocrResult.containsKey("sellerName") ? (String) ocrResult.get("sellerName") : null);
            
            if (finalSeller == null || finalSeller.isEmpty()) {
                finalSeller = originalFileName == null ? "待识别" : originalFileName.replaceAll("(?i)\\.pdf$", "");
            }
            
            String finalBuyerName = ocrResult.containsKey("buyerName") 
                ? (String) ocrResult.get("buyerName") 
                : "个人";
            
            BigDecimal finalAmount = amount != null 
                ? amount 
                : (ocrResult.containsKey("amount") ? (BigDecimal) ocrResult.get("amount") : BigDecimal.ZERO);
            
            Long finalDate = ocrResult.containsKey("invoiceDate") 
                ? (Long) ocrResult.get("invoiceDate") 
                : now;
            
            String finalInvoiceNo = ocrResult.containsKey("invoiceNo") 
                ? (String) ocrResult.get("invoiceNo") 
                : "FP" + now;
            
            String finalCategory = category != null && !category.trim().isEmpty() 
                ? category 
                : "其他";

            Invoice invoice = new Invoice();
            invoice.setUserId(user.getId());
            invoice.setSellerName(finalSeller);
            invoice.setBuyerName(finalBuyerName);
            invoice.setAmount(finalAmount);
            invoice.setDate(finalDate);
            invoice.setCategory(finalCategory);
            invoice.setStatus("normal");
            invoice.setInvoiceNo(finalInvoiceNo);
            invoice.setFileName(originalFileName);
            invoice.setFileSize(file.getSize());
            invoice.setFilePath("/uploads/" + fileName);
            invoice.setFileData(fileBytes);
            invoice.setCreateTime(now);
            invoice.setUpdateTime(now);
            
            System.out.println("[Upload] 开始保存发票到数据库...");
            invoiceRepository.save(invoice);
            System.out.println("[Upload] 数据库保存成功. Invoice ID: " + invoice.getId());
            
            result.put("status", 1);
            result.put("msg", "上传成功");
            result.put("data", invoice);
        } catch (Exception e) {
            System.out.println("[Upload] 发生异常: " + e.getMessage());
            e.printStackTrace();
            result.put("status", 0);
            result.put("msg", "上传失败: " + e.getMessage());
        }
        return result;
    }
}
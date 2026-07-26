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
            
            // ========== 优先使用OCR识别结果，其次使用前端传入参数，最后使用默认值 ==========
            
            // 销售方名称：优先 OCR，其次前端参数，最后文件名
            String finalSeller = ocrResult.containsKey("sellerName") && ocrResult.get("sellerName") != null
                ? (String) ocrResult.get("sellerName")
                : (sellerName != null && !sellerName.trim().isEmpty() ? sellerName : null);
            if (finalSeller == null || finalSeller.isEmpty()) {
                finalSeller = originalFileName == null ? "待识别" : originalFileName.replaceAll("(?i)\\.pdf$", "");
            }
            // 兜底：临时文件名不作为销售方展示
            if (finalSeller.startsWith("tmp_") || finalSeller.startsWith("wx_")) {
                finalSeller = "待识别";
            }
            
            // 购买方名称：优先 OCR
            String finalBuyerName = ocrResult.containsKey("buyerName") && ocrResult.get("buyerName") != null
                ? (String) ocrResult.get("buyerName")
                : "个人";
            if (finalBuyerName == null || finalBuyerName.trim().isEmpty()) {
                finalBuyerName = "个人";
            }
            
            // 金额：优先 OCR，其次前端参数，最后 0
            BigDecimal finalAmount = ocrResult.containsKey("amount") && ocrResult.get("amount") != null
                ? (BigDecimal) ocrResult.get("amount")
                : (amount != null ? amount : BigDecimal.ZERO);
            
            // 开票日期：优先 OCR
            Long finalDate = ocrResult.containsKey("invoiceDate") && ocrResult.get("invoiceDate") != null
                ? (Long) ocrResult.get("invoiceDate")
                : now;
            
            // 发票号码：优先 OCR
            String finalInvoiceNo = ocrResult.containsKey("invoiceNo") && ocrResult.get("invoiceNo") != null
                ? (String) ocrResult.get("invoiceNo")
                : "FP" + now;
            
            // 分类：优先前端有效参数，否则根据文件名前缀 / 销售方名称智能推断
            String finalCategory = (category != null && !category.trim().isEmpty() && !"其他".equals(category.trim()))
                ? category.trim()
                : inferCategory(originalFileName, finalSeller);

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

    /**
     * 智能推断发票消费类型：优先取文件名下划线/连字符前缀（如"交通_1596.00元_..."），
     * 其次根据文件名与销售方名称中的关键词匹配，最后归为"其他"。
     */
    private String inferCategory(String fileName, String sellerName) {
        // 已知类型及其关键词
        String[][] rules = {
            {"餐饮", "餐饮", "餐厅", "饭店", "酒楼", "美食", "食品", "咖啡", "火锅", "烧烤", "小吃", "食堂", "茶"},
            {"交通", "交通", "航空", "机票", "高铁", "铁路", "火车", "出租", "打车", "滴滴", "网约车", "加油", "石油", "石化", "停车", "客运", "地铁", "公交", "车票", "过路", "高速"},
            {"住宿", "住宿", "酒店", "宾馆", "旅馆", "民宿", "客栈", "度假"},
            {"办公", "办公", "文具", "耗材", "打印", "复印", "纸品"},
            {"通讯", "通讯", "电信", "移动", "联通", "话费", "宽带", "网络"},
            {"购物", "商场", "超市", "百货", "商贸", "购物"},
            {"医疗", "医院", "药房", "药店", "医疗", "诊所", "卫生"}
        };

        // 1. 文件名前缀直接命中类型名（去掉扩展名后取第一个分隔段）
        if (fileName != null && !fileName.trim().isEmpty()) {
            String base = fileName.trim().replaceAll("(?i)\\.(pdf|png|jpe?g)$", "");
            String[] segs = base.split("[_\\-\\s]");
            if (segs.length > 0) {
                String prefix = segs[0].trim();
                for (String[] rule : rules) {
                    if (rule[0].equals(prefix)) {
                        return rule[0];
                    }
                }
            }
        }

        // 2. 文件名 + 销售方名称关键词匹配
        String haystack = ((fileName == null ? "" : fileName) + " " + (sellerName == null ? "" : sellerName));
        for (String[] rule : rules) {
            for (int i = 1; i < rule.length; i++) {
                if (haystack.contains(rule[i])) {
                    return rule[0];
                }
            }
        }

        return "其他";
    }
}
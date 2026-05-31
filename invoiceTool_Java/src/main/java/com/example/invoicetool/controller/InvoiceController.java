package com.example.invoicetool.controller;

import com.example.invoicetool.entity.Invoice;
import com.example.invoicetool.entity.User;
import com.example.invoicetool.repository.InvoiceRepository;
import com.example.invoicetool.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import javax.mail.internet.MimeMessage;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import java.math.BigDecimal;
import java.util.ArrayList;
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
    @Autowired(required = false)
    private JavaMailSender mailSender;
    @Value("${spring.mail.username:}")
    private String mailFrom;

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
        
        // 手动构造返回数据，确保字段名与前端一致
        List<Map<String, Object>> data = new ArrayList<>();
        for (Invoice inv : invoices) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", inv.getId());
            item.put("sellerName", inv.getSellerName());
            item.put("buyerName", inv.getBuyerName() != null && !inv.getBuyerName().trim().isEmpty() ? inv.getBuyerName() : "个人");
            item.put("amount", inv.getAmount() != null ? inv.getAmount().toString() : null);
            item.put("invoiceDate", inv.getDate()); // Long 类型的时间戳
            item.put("category", inv.getCategory());
            item.put("status", inv.getStatus());
            item.put("invoiceNo", inv.getInvoiceNo());
            item.put("fileName", inv.getFileName());
            item.put("filePath", inv.getFilePath());
            item.put("fileSize", inv.getFileSize());
            item.put("createTime", inv.getCreateTime());
            data.add(item);
        }
        
        result.put("status", 1);
        result.put("data", data);
        return result;
    }

    @PostMapping("/detail")
    public Map<String, Object> detail(@RequestParam String sk, @RequestParam Integer id) {
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        Invoice inv = id == null ? null : invoiceRepository.findById(id).orElse(null);
        if (user == null) {
            result.put("status", 0);
            result.put("msg", "登录已失效");
            return result;
        }
        if (inv == null || !user.getId().equals(inv.getUserId())) {
            result.put("status", 0);
            result.put("msg", "发票不存在");
            return result;
        }
        Map<String, Object> item = new HashMap<>();
        item.put("id", inv.getId());
        item.put("sellerName", inv.getSellerName());
        item.put("buyerName", inv.getBuyerName() != null && !inv.getBuyerName().trim().isEmpty() ? inv.getBuyerName() : "个人");
        item.put("amount", inv.getAmount() != null ? inv.getAmount().toString() : null);
        item.put("invoiceDate", inv.getDate());
        item.put("category", inv.getCategory());
        item.put("status", inv.getStatus());
        item.put("invoiceNo", inv.getInvoiceNo());
        item.put("fileName", inv.getFileName());
        item.put("filePath", inv.getFilePath());
        item.put("fileSize", inv.getFileSize());
        item.put("createTime", inv.getCreateTime());
        result.put("status", 1);
        result.put("data", item);
        return result;
    }

    @GetMapping("/downloadOriginal")
    public void downloadOriginal(@RequestParam String sk, @RequestParam Integer id, HttpServletResponse response) {
        User user = authService.requireUser(sk);
        Invoice inv = id == null ? null : invoiceRepository.findById(id).orElse(null);
        if (user == null || inv == null || !user.getId().equals(inv.getUserId())) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        try {
            byte[] bytes = inv.getFileData();
            if (bytes == null || bytes.length == 0) {
                String fileSrc = inv.getFilePath();
                if (fileSrc != null) {
                    java.io.File localFile = new java.io.File("/tmp" + fileSrc);
                    if (localFile.exists()) {
                        bytes = java.nio.file.Files.readAllBytes(localFile.toPath());
                    }
                }
            }
            if (bytes == null || bytes.length == 0) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }
            String fileName = inv.getFileName() != null ? inv.getFileName() : ("invoice_" + id + ".pdf");
            String lowerName = fileName.toLowerCase();
            String contentType = "application/octet-stream";
            if (lowerName.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (lowerName.endsWith(".png")) {
                contentType = "image/png";
            } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            }
            response.setContentType(contentType);
            response.setHeader("Content-Disposition", "attachment; filename=\"" + java.net.URLEncoder.encode(fileName, "UTF-8") + "\"");
            response.setContentLength(bytes.length);
            response.getOutputStream().write(bytes);
            response.getOutputStream().flush();
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
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

    @PostMapping("/export")
    public Map<String, Object> export(@RequestParam String sk, @RequestParam String ids) {
        // 仅做预检：校验登录、统计本次将打包的发票数。
        // 真正打包/下载交给 /exportZip 流式接口，避免云托管多实例不共享 /tmp 导致下载失败。
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        if (user == null) {
            result.put("status", 0);
            result.put("msg", "登录已失效");
            return result;
        }

        int count = 0;
        for (String idStr : ids.split(",")) {
            if (idStr.trim().isEmpty()) continue;
            try {
                Integer id = Integer.parseInt(idStr.trim());
                java.util.Optional<Invoice> opt = invoiceRepository.findById(id);
                if (opt.isPresent() && opt.get().getUserId().equals(user.getId())) {
                    count++;
                }
            } catch (NumberFormatException ignored) {}
        }

        if (count == 0) {
            result.put("status", 0);
            result.put("msg", "没有可导出的发票");
            return result;
        }

        result.put("status", 1);
        result.put("msg", "预检通过");
        result.put("count", count);
        // 兼容字段：前端只用来标记"已准备好可分享"，真正下载走 /exportZip
        result.put("url", "ready");
        return result;
    }

    /**
     * 流式导出 ZIP：把打包好的二进制直接写入响应体，避免容器多实例 /tmp 不共享。
     * 前端通过 wx.cloud.callContainer / wx.request (responseType:'arraybuffer') 一次性拿到二进制再写入本地临时文件。
     */
    @PostMapping("/exportZip")
    public void exportZip(@RequestParam String sk, @RequestParam String ids, HttpServletResponse response) {
        User user = authService.requireUser(sk);
        if (user == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String[] idArray = ids.split(",");
        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=\"invoices.zip\"");

        try (java.io.OutputStream out = response.getOutputStream();
             java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(out)) {

            int packed = 0;
            java.util.List<Integer> missing = new java.util.ArrayList<>();
            // 防止同名文件覆盖：同名时自动加 (id) 后缀
            java.util.Set<String> usedNames = new java.util.HashSet<>();

            for (String idStr : idArray) {
                if (idStr.trim().isEmpty()) continue;
                Integer id;
                try {
                    id = Integer.parseInt(idStr.trim());
                } catch (NumberFormatException e) { continue; }
                java.util.Optional<Invoice> opt = invoiceRepository.findById(id);
                if (!opt.isPresent() || !opt.get().getUserId().equals(user.getId())) continue;

                Invoice inv = opt.get();
                byte[] bytes = inv.getFileData();
                if (bytes == null || bytes.length == 0) {
                    // 旧数据兜底：尝试同实例 /tmp 本地文件
                    String fileSrc = inv.getFilePath();
                    if (fileSrc != null) {
                        java.io.File localFile = new java.io.File("/tmp" + fileSrc);
                        if (localFile.exists()) {
                            bytes = java.nio.file.Files.readAllBytes(localFile.toPath());
                        }
                    }
                }
                if (bytes == null || bytes.length == 0) {
                    // 没有可用原件，跳过此发票，避免在 zip 里塞入误导性的空白 PDF
                    missing.add(id);
                    continue;
                }

                String entryName = inv.getFileName() != null ? inv.getFileName() : ("发票_" + id + ".pdf");
                if (usedNames.contains(entryName)) {
                    int dot = entryName.lastIndexOf('.');
                    if (dot > 0) {
                        entryName = entryName.substring(0, dot) + "_" + id + entryName.substring(dot);
                    } else {
                        entryName = entryName + "_" + id;
                    }
                }
                usedNames.add(entryName);
                zos.putNextEntry(new java.util.zip.ZipEntry(entryName));
                zos.write(bytes);
                zos.closeEntry();
                packed++;
            }

            // 仅当存在丢失的旧数据时，附一个简短的说明 txt 提醒用户重传
            if (!missing.isEmpty()) {
                zos.putNextEntry(new java.util.zip.ZipEntry("README.txt"));
                StringBuilder note = new StringBuilder();
                note.append("以下发票原件缺失（旧数据，已跳过），请在小程序中重新上传后再导出：\n");
                for (Integer mid : missing) {
                    note.append("  - 发票 ID ").append(mid).append("\n");
                }
                note.append("\n本次成功打包 ").append(packed).append(" 张发票。\n");
                zos.write(note.toString().getBytes("UTF-8"));
                zos.closeEntry();
            }

            zos.finish();
        } catch (Exception e) {
            e.printStackTrace();
            try { response.sendError(500, "打包失败: " + e.getMessage()); } catch (Exception ignored) {}
        }
    }

    @PostMapping("/sendEmail")
    public Map<String, Object> sendEmail(@RequestParam String sk, @RequestParam String ids, @RequestParam String email) {
        Map<String, Object> result = new HashMap<>();
        User user = authService.requireUser(sk);
        if (user == null) {
            result.put("status", 0);
            result.put("msg", "登录已失效");
            return result;
        }
        
        // 1. 验证邮件发送器配置状态
        if (mailSender == null || mailFrom == null || mailFrom.trim().isEmpty()) {
            System.out.println("[Email Warning] SMTP 发件账户未配置。");
            result.put("status", 0);
            result.put("msg", "邮件推送未启用：后端未配置发件人账户 (MAIL_USERNAME) 和授权码 (MAIL_PASSWORD)。若想发送真实邮件，请在微信云托管部署设置中，新增这两个环境变量，重新部署即可激活！");
            return result;
        }

        try {
            // 2. 准备发票和 ZIP 附件
            String[] idArray = ids.split(",");
            long now = System.currentTimeMillis();
            String zipName = "export_" + now + ".zip";
            String zipPath = "/tmp/uploads/" + zipName;
            
            java.io.File zipFile = new java.io.File(zipPath);
            if (!zipFile.getParentFile().exists()) {
                zipFile.getParentFile().mkdirs();
            }
            
            java.io.FileOutputStream fos = new java.io.FileOutputStream(zipFile);
            java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(fos);
            
            StringBuilder tableRows = new StringBuilder();
            java.math.BigDecimal totalAmount = java.math.BigDecimal.ZERO;
            int count = 0;
            int packed = 0;
            java.util.List<Integer> missing = new java.util.ArrayList<>();
            java.util.Set<String> usedNames = new java.util.HashSet<>();

            for (String idStr : idArray) {
                if (idStr.trim().isEmpty()) continue;
                Integer id;
                try { id = Integer.parseInt(idStr.trim()); } catch (NumberFormatException e) { continue; }
                java.util.Optional<Invoice> opt = invoiceRepository.findById(id);
                if (!opt.isPresent() || !opt.get().getUserId().equals(user.getId())) continue;

                Invoice inv = opt.get();
                String sellerName = displaySellerName(inv);
                java.math.BigDecimal amount = displayAmount(inv.getAmount());
                count++;
                totalAmount = totalAmount.add(amount);

                // 打包发票文件：优先 DB 二进制，兜底同实例 /tmp
                byte[] bytes = inv.getFileData();
                if (bytes == null || bytes.length == 0) {
                    String fileSrc = inv.getFilePath();
                    if (fileSrc != null) {
                        java.io.File localFile = new java.io.File("/tmp" + fileSrc);
                        if (localFile.exists()) {
                            bytes = java.nio.file.Files.readAllBytes(localFile.toPath());
                        }
                    }
                }
                if (bytes != null && bytes.length > 0) {
                    String entryName = inv.getFileName() != null ? inv.getFileName() : ("发票_" + id + ".pdf");
                    if (usedNames.contains(entryName)) {
                        int dot = entryName.lastIndexOf('.');
                        if (dot > 0) {
                            entryName = entryName.substring(0, dot) + "_" + id + entryName.substring(dot);
                        } else {
                            entryName = entryName + "_" + id;
                        }
                    }
                    usedNames.add(entryName);
                    zos.putNextEntry(new java.util.zip.ZipEntry(entryName));
                    zos.write(bytes);
                    zos.closeEntry();
                    packed++;
                } else {
                    // 没有可用原件，跳过此发票，避免在 zip 里塞入误导性的空白 PDF
                    missing.add(id);
                }

                // 构建 HTML 报销报表表格行
                tableRows.append("<tr>")
                         .append("<td style='border:1px solid #dee2e6;padding:10px;'>").append(inv.getCategory() != null ? inv.getCategory() : "其他").append("</td>")
                         .append("<td style='border:1px solid #dee2e6;padding:10px;'>").append(sellerName).append("</td>")
                         .append("<td style='border:1px solid #dee2e6;padding:10px;'>").append(inv.getBuyerName() != null ? inv.getBuyerName() : "个人").append("</td>")
                         .append("<td style='border:1px solid #dee2e6;padding:10px;color:#3b5bdb;font-weight:bold;'>¥").append(amount).append("</td>")
                         .append("<td style='border:1px solid #dee2e6;padding:10px;'>").append(new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date(inv.getCreateTime()))).append("</td>")
                         .append("</tr>");
            }

            // 仅当存在丢失的旧数据时，附一个简短的说明 txt 提醒用户重传
            if (!missing.isEmpty()) {
                zos.putNextEntry(new java.util.zip.ZipEntry("README.txt"));
                StringBuilder note = new StringBuilder();
                note.append("以下发票原件缺失（旧数据，已跳过），请在小程序中重新上传后再导出：\n");
                for (Integer mid : missing) {
                    note.append("  - 发票 ID ").append(mid).append("\n");
                }
                note.append("\n本次成功打包 ").append(packed).append(" 张发票。\n");
                zos.write(note.toString().getBytes("UTF-8"));
                zos.closeEntry();
            }

            zos.close();
            fos.close();
            
            // 3. 使用 Spring Mail MimeMessage 发送富文本 HTML 和 ZIP 附件
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(mailFrom);
            helper.setTo(email);
            helper.setSubject("您导出的发票电子报销单及原件压缩包");
            
            String htmlContent = "<html><body style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>"
                + "<h2 style='color:#3b5bdb; border-bottom: 2px solid #3b5bdb; padding-bottom: 10px;'>📬 发票电子报销投递报告</h2>"
                + "<p>您好，" + (user.getNickName() != null ? user.getNickName() : "微信用户") + "！</p>"
                + "<p>您从「好票管家-发票助手」小程序批量导出了 <b>" + count + "</b> 张发票，合并核算账单总金额共计：<b style='color:#3b5bdb; font-size: 18px;'>¥" + totalAmount + "</b> 元。</p>"
                + "<p><b>📎 邮件附件</b> 包含了您刚才勾选的发票原件 PDF/图片压缩包，可解压后直接用于报销。</p>"
                + "<h3 style='margin-top: 30px; color:#495057;'>📊 报销发票汇总明细：</h3>"
                + "<table style='border-collapse:collapse; width:100%; font-size:14px; text-align:left; border:1px solid #dee2e6;'>"
                + "<thead><tr style='background:#f8f9fa; border-bottom: 2px solid #dee2e6;'>"
                + "<th style='border:1px solid #dee2e6; padding:10px;'>发票分类</th>"
                + "<th style='border:1px solid #dee2e6; padding:10px;'>销售方 (商家)</th>"
                + "<th style='border:1px solid #dee2e6; padding:10px;'>付款方 (抬头)</th>"
                + "<th style='border:1px solid #dee2e6; padding:10px;'>金额</th>"
                + "<th style='border:1px solid #dee2e6; padding:10px;'>导入/开票时间</th>"
                + "</tr></thead>"
                + "<tbody>" + tableRows.toString() + "</tbody>"
                + "</table>"
                + "<br/><p style='color:#868e96; font-size:12px; margin-top: 40px; border-top: 1rpx solid #dee2e6; padding-top: 15px;'>此邮件由极简发票助手云端服务自动发送，请勿直接回复。</p>"
                + "</body></html>";
                
            helper.setText(htmlContent, true);
            
            // 添加 ZIP 附件
            helper.addAttachment("发票及电子报销单_" + count + "张.zip", zipFile);
            
            mailSender.send(mimeMessage);
            
            result.put("status", 1);
            result.put("msg", "发票及报销单已成功发送至您的邮箱 " + email);
        } catch (Exception e) {
            e.printStackTrace();
            result.put("status", 0);
            result.put("msg", "邮件发送异常: " + e.getMessage());
        }
        return result;
    }

    private String value(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private String displaySellerName(Invoice invoice) {
        String sellerName = invoice.getSellerName();
        if (sellerName != null && !sellerName.trim().isEmpty() && !"待识别".equals(sellerName.trim()) && !sellerName.trim().matches("^\\d+\\.?\\d*$")) {
            return sellerName.trim();
        }
        String fileName = invoice.getFileName();
        if (fileName != null && !fileName.trim().isEmpty()) {
            return fileName.trim().replaceAll("(?i)\\.pdf$", "");
        }
        String invoiceNo = invoice.getInvoiceNo();
        if (invoiceNo != null && !invoiceNo.trim().isEmpty() && !invoiceNo.startsWith("FP")) {
            return invoiceNo.trim();
        }
        return "待识别";
    }

    private java.math.BigDecimal displayAmount(java.math.BigDecimal amount) {
        if (amount == null) {
            return java.math.BigDecimal.ZERO;
        }
        String amountText = amount.stripTrailingZeros().toPlainString();
        if (amountText.matches("^202[0-9]$") || amount.compareTo(java.math.BigDecimal.ZERO) <= 0 || amount.compareTo(new java.math.BigDecimal("1000000")) >= 0) {
            return java.math.BigDecimal.ZERO;
        }
        return amount;
    }
}

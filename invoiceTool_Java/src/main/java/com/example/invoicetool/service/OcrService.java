package com.example.invoicetool.service;

import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.ocr.v20181119.OcrClient;
import com.tencentcloudapi.ocr.v20181119.models.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class OcrService {
    private static final Logger logger = Logger.getLogger(OcrService.class.getName());

    @Value("${tencent.cloud.secretId:}")
    private String secretId;

    @Value("${tencent.cloud.secretKey:}")
    private String secretKey;

    @Value("${tencent.cloud.region:ap-guangzhou}")
    private String region;

    private OcrClient ocrClient;

    @PostConstruct
    public void init() {
        if (secretId != null && !secretId.isEmpty() && secretKey != null && !secretKey.isEmpty()) {
            try {
                Credential cred = new Credential(secretId, secretKey);
                HttpProfile httpProfile = new HttpProfile();
                httpProfile.setEndpoint("ocr.tencentcloudapi.com");
                ClientProfile clientProfile = new ClientProfile();
                clientProfile.setHttpProfile(httpProfile);
                ocrClient = new OcrClient(cred, region, clientProfile);
                logger.info("[OCR] 腾讯云OCR客户端初始化成功");
            } catch (Exception e) {
                logger.warning("[OCR] 初始化失败: " + e.getMessage());
            }
        } else {
            logger.warning("[OCR] 未配置腾讯云密钥，OCR功能不可用");
        }
    }

    /**
     * 识别PDF发票
     * @param pdfBytes PDF文件字节数组
     * @return 识别结果Map，包含金额、抬头、日期等信息
     */
    public Map<String, Object> recognizeInvoice(byte[] pdfBytes) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);

        if (ocrClient == null) {
            logger.warning("[OCR] OCR客户端未初始化");
            return result;
        }

        try {
            // 将PDF第一页转换为图片
            byte[] imageBytes = pdfFirstPageToImage(pdfBytes);
            if (imageBytes == null) {
                logger.warning("[OCR] PDF转图片失败");
                return result;
            }

            // Base64编码
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            // 调用腾讯云增值税发票识别API
            VatInvoiceOCRRequest req = new VatInvoiceOCRRequest();
            req.setImageBase64(base64Image);

            VatInvoiceOCRResponse resp = ocrClient.VatInvoiceOCR(req);

            // 解析识别结果
            if (resp.getVatInvoiceInfos() != null && resp.getVatInvoiceInfos().length > 0) {
                TextVatInvoice[] infos = resp.getVatInvoiceInfos();
                
                // DEBUG: 打印所有识别到的字段
                System.out.println("[OCR] ========== 识别到 " + infos.length + " 个字段 ==========");
                for (TextVatInvoice info : infos) {
                    System.out.println("[OCR] 字段: '" + info.getName() + "' = '" + info.getValue() + "'");
                }

                for (TextVatInvoice info : infos) {
                    String name = info.getName();
                    String value = info.getValue();

                    if (name != null && value != null) {
                        switch (name) {
                            case "合计金额":
                            case "小写金额":
                            case "金额":
                                try {
                                    // 去除货币符号和逗号
                                    String amountStr = value.replaceAll("[¥,￥,元]", "").trim();
                                    result.put("amount", new BigDecimal(amountStr));
                                } catch (Exception e) {
                                    logger.warning("[OCR] 金额解析失败: " + value);
                                }
                                break;
                            case "销售方名称":
                            case "卖方名称":
                            case "销售方":
                                result.put("sellerName", value);
                                break;
                            case "购买方名称":
                            case "买方名称":
                            case "购买方":
                                result.put("buyerName", value);
                                break;
                            case "开票日期":
                            case "日期":
                                result.put("invoiceDate", parseDate(value));
                                break;
                            case "发票号码":
                                result.put("invoiceNo", value);
                                break;
                            case "发票代码":
                                result.put("invoiceCode", value);
                                break;
                            case "税率":
                                result.put("taxRate", value);
                                break;
                            case "税额":
                                result.put("taxAmount", value);
                                break;
                            case "价税合计(大写)":
                                result.put("totalAmountInWords", value);
                                break;
                            case "价税合计(小写)":
                                result.put("totalAmount", value);
                                break;
                            case "发票类型":
                                result.put("invoiceType", value);
                                break;
                        }
                    }
                }

                // 如果没有单独的小写金额，尝试使用价税合计
                if (!result.containsKey("amount") && result.containsKey("totalAmount")) {
                    try {
                        String totalAmt = (String) result.get("totalAmount");
                        String amountStr = totalAmt.replaceAll("[¥,￥,元]", "").trim();
                        result.put("amount", new BigDecimal(amountStr));
                    } catch (Exception e) {
                        logger.warning("[OCR] 价税合计解析失败");
                    }
                }

                result.put("success", true);
                logger.info("[OCR] 发票识别成功，金额: " + result.get("amount") + 
                           ", 销售方: " + result.get("sellerName"));
            } else {
                logger.warning("[OCR] 未识别到发票信息");
            }

        } catch (TencentCloudSDKException e) {
            logger.warning("[OCR] 腾讯云API调用失败: " + e.getMessage());
        } catch (Exception e) {
            logger.warning("[OCR] 识别异常: " + e.getMessage());
            e.printStackTrace();
        }

        return result;
    }

    /**
     * 将PDF第一页转换为PNG图片
     */
    private byte[] pdfFirstPageToImage(byte[] pdfBytes) {
        try (PDDocument document = PDDocument.load(pdfBytes)) {
            PDFRenderer renderer = new PDFRenderer(document);
            // 渲染第一页，150 DPI
            BufferedImage image = renderer.renderImageWithDPI(0, 150);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            logger.warning("[OCR] PDF转图片失败: " + e.getMessage());
            return null;
        }
    }

    /**
     * 解析日期字符串
     */
    private Long parseDate(String dateStr) {
        // 尝试多种日期格式
        String[] patterns = {
            "yyyy年MM月dd日",
            "yyyy-MM-dd",
            "yyyy/MM/dd",
            "yyyyMMdd"
        };

        for (String pattern : patterns) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat(pattern);
                Date date = sdf.parse(dateStr);
                return date.getTime();
            } catch (ParseException e) {
                // 继续尝试下一个格式
            }
        }

        return null;
    }

    /**
     * 检查OCR服务是否可用
     */
    public boolean isAvailable() {
        return ocrClient != null;
    }
}

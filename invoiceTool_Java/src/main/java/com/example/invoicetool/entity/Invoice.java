package com.example.invoicetool.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "invoice")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "user_id")
    private Integer userId;
    @Column(name = "seller_name")
    private String sellerName;
    @Column(name = "buyer_name")
    private String buyerName;
    @Column(name = "amount", precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "invoice_date")
    private Long date;
    @Column(name = "category")
    private String category;
    @Column(name = "status")
    private String status;
    @Column(name = "invoice_no")
    private String invoiceNo;
    @Column(name = "file_name")
    private String fileName;
    @Column(name = "file_size")
    private Long fileSize;
    @Column(name = "file_path")
    private String filePath;
    // 发票原件二进制内容：直接存数据库，规避云托管多实例 /tmp 不共享问题
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @JsonIgnore
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    private byte[] fileData;
    @Column(name = "create_time")
    private Long createTime;
    @Column(name = "update_time")
    private Long updateTime;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Long getDate() { return date; }
    public void setDate(Long date) { this.date = date; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getInvoiceNo() { return invoiceNo; }
    public void setInvoiceNo(String invoiceNo) { this.invoiceNo = invoiceNo; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }
    public Long getCreateTime() { return createTime; }
    public void setCreateTime(Long createTime) { this.createTime = createTime; }
    public Long getUpdateTime() { return updateTime; }
    public void setUpdateTime(Long updateTime) { this.updateTime = updateTime; }
}

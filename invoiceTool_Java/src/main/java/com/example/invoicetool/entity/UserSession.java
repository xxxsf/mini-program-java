package com.example.invoicetool.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "user_session")
public class UserSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "sk", unique = true, length = 64)
    private String sk;
    @Column(name = "user_id")
    private Integer userId;
    @Column(name = "open_id")
    private String openId;
    @Column(name = "session_key")
    private String sessionKey;
    @Column(name = "expire_time")
    private Long expireTime;
    @Column(name = "create_time")
    private Long createTime;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getOpenId() { return openId; }
    public void setOpenId(String openId) { this.openId = openId; }
    public String getSessionKey() { return sessionKey; }
    public void setSessionKey(String sessionKey) { this.sessionKey = sessionKey; }
    public Long getExpireTime() { return expireTime; }
    public void setExpireTime(Long expireTime) { this.expireTime = expireTime; }
    public Long getCreateTime() { return createTime; }
    public void setCreateTime(Long createTime) { this.createTime = createTime; }
}

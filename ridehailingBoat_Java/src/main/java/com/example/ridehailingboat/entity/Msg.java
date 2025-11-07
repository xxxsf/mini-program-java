package com.example.ridehailingboat.entity;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class Msg {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Integer uid;
    private String content;
    private Integer time;
    private Integer see;
    private String type;
    private String url;
    private Integer fid;

    // Getters and Setters
}
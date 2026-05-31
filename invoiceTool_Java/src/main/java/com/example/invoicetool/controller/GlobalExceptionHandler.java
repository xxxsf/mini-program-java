package com.example.invoicetool.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleMaxUploadSize(MaxUploadSizeExceededException e) {
        Map<String, Object> result = new HashMap<>();
        result.put("status", 0);
        result.put("msg", "上传失败：文件过大，请选择小于20MB的发票文件");
        return result;
    }

    @ExceptionHandler(MultipartException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleMultipart(MultipartException e) {
        Map<String, Object> result = new HashMap<>();
        result.put("status", 0);
        result.put("msg", "上传失败：文件上传解析失败，请重新选择文件后重试");
        return result;
    }
}

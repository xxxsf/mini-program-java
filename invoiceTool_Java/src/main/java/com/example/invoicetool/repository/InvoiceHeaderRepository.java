package com.example.invoicetool.repository;

import com.example.invoicetool.entity.InvoiceHeader;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceHeaderRepository extends JpaRepository<InvoiceHeader, Integer> {
    List<InvoiceHeader> findByUserIdOrderByCreateTimeDesc(Integer userId);
}

package com.example.invoicetool.repository;

import com.example.invoicetool.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    List<Invoice> findByUserIdOrderByCreateTimeDesc(Integer userId);
}

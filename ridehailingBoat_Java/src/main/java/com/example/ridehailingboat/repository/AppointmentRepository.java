package com.example.ridehailingboat.repository;

import com.example.ridehailingboat.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    @Query(value = "SELECT a.* FROM xcx_appointment a RIGHT JOIN xcx_info i ON a.iid = i.id WHERE (i.uid = :userId AND i.type = 1) OR (a.uid = :userId AND i.type = 2) ORDER BY a.time DESC", nativeQuery = true)
    List<Appointment> findMyAppointment(@Param("userId") Integer userId);

    @Query(value = "SELECT COUNT(*) FROM xcx_appointment a RIGHT JOIN xcx_info i ON a.iid = i.id WHERE i.uid = :userId AND a.status = 0", nativeQuery = true)
    Integer getMyAppointmentCount(@Param("userId") Integer userId);

    @Query(value = "SELECT i.id, i.phone, i.departure, i.destination, i.time, a.status FROM xcx_info i RIGHT JOIN xcx_appointment a ON i.id = a.iid WHERE (i.uid = :userId AND i.type = 2) OR (a.uid = :userId AND i.type = 1) ORDER BY a.time DESC", nativeQuery = true)
    List<Map<String, Object>> findPassengers(@Param("userId") Integer userId);

    @Query(value = "SELECT i.id, i.departure, i.destination, i.time, a.* FROM xcx_info i RIGHT JOIN xcx_appointment a ON i.id = a.iid WHERE a.id = :id AND i.uid = :userId", nativeQuery = true)
    Map<String, Object> findAppointmentDetail(@Param("id") Integer id, @Param("userId") Integer userId);
}
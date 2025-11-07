package com.example.ridehailingboat.controller;

import com.example.ridehailingboat.entity.Appointment;
import com.example.ridehailingboat.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@RestController
@RequestMapping("/api/appointment")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @PostMapping("/add")
    public Map<String, Object> add(@RequestBody Appointment appointment) {
        // TODO: Implement user validation (vaild_sk)
        appointment.setTime((int) (System.currentTimeMillis() / 1000));

        // TODO: Implement validation rules

        // TODO: Check for duplicate appointments

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // TODO: Implement sendMessage and msg logic

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "预约成功");
        result.put("data", savedAppointment);
        return result;
    }

    @GetMapping("/my")
    public Map<String, Object> my(@RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        List<Appointment> appointments = appointmentRepository.findMyAppointment(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("data", appointments);
        return result;
    }

    @GetMapping("/mycount")
    public Map<String, Object> mycount(@RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        Integer count = appointmentRepository.getMyAppointmentCount(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("data", count);
        return result;
    }

    @GetMapping("/getPassenger")
    public Map<String, Object> getPassenger(@RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        List<Map<String, Object>> passengers = appointmentRepository.findPassengers(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("data", passengers);
        return result;
    }

    @GetMapping("/detail")
    public Map<String, Object> detail(@RequestParam Integer id, @RequestParam String sk) {
        // TODO: Implement user validation (vaild_sk)
        Integer userId = 10001; // Placeholder for user ID

        Map<String, Object> appointment = appointmentRepository.findAppointmentDetail(id, userId);

        Map<String, Object> result = new HashMap<>();
        result.put("status", 1);
        result.put("msg", "获取成功");
        result.put("data", appointment);
        return result;
    }
}
package com.example.expensemanagement.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ExpenseController {

    @GetMapping("/summary")
    public Map<String, Integer> getSummary() {

        Map<String, Integer> summary = new HashMap<>();
        summary.put("income", 5000);
        summary.put("expense", 2300);
        summary.put("savings", 2700);

        return summary;
    }
}

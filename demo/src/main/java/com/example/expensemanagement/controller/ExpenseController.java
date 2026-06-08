package com.example.expensemanagement.controller;

import com.example.expensemanagement.entity.Expense;
import com.example.expensemanagement.entity.User;
import com.example.expensemanagement.repository.ExpenseRepository;
import com.example.expensemanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final UserService userService;

    public ExpenseController(ExpenseRepository expenseRepository, UserService userService) {
        this.expenseRepository = expenseRepository;
        this.userService = userService;
    }

    private User getLoggedInUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByEmail(email);
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getExpenses() {
        User user = getLoggedInUser();
        List<Expense> expenses = expenseRepository.findByUserOrderByDateDesc(user);
        return ResponseEntity.ok(expenses);
    }

    @PostMapping
    public ResponseEntity<?> addExpense(@Valid @RequestBody Expense expense) {
        User user = getLoggedInUser();
        expense.setUser(user);
        Expense savedExpense = expenseRepository.save(expense);
        return ResponseEntity.ok(savedExpense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        User user = getLoggedInUser();
        Optional<Expense> expenseOpt = expenseRepository.findById(id);
        if (expenseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Expense expense = expenseOpt.get();
        if (!expense.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body("You can only delete your own transactions");
        }
        expenseRepository.delete(expense);
        return ResponseEntity.ok("Transaction deleted successfully");
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Double>> getSummary() {
        User user = getLoggedInUser();
        List<Expense> transactions = expenseRepository.findByUser(user);

        double totalIncome = 0;
        double totalExpense = 0;

        for (Expense t : transactions) {
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                totalIncome += t.getAmount();
            } else if ("EXPENSE".equalsIgnoreCase(t.getType())) {
                totalExpense += t.getAmount();
            }
        }

        double savings = totalIncome - totalExpense;

        Map<String, Double> summary = new HashMap<>();
        summary.put("income", totalIncome);
        summary.put("expense", totalExpense);
        summary.put("savings", savings);

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/weekly")
    public ResponseEntity<Map<String, Double>> getWeeklyBreakdown() {
        User user = getLoggedInUser();
        List<Expense> transactions = expenseRepository.findByUser(user);

        // Filter only EXPENSE type for this week
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        Map<String, Double> weeklyMap = new LinkedHashMap<>();
        weeklyMap.put("Mon", 0.0);
        weeklyMap.put("Tue", 0.0);
        weeklyMap.put("Wed", 0.0);
        weeklyMap.put("Thu", 0.0);
        weeklyMap.put("Fri", 0.0);
        weeklyMap.put("Sat", 0.0);
        weeklyMap.put("Sun", 0.0);

        for (Expense t : transactions) {
            if ("EXPENSE".equalsIgnoreCase(t.getType()) && !t.getDate().isBefore(startOfWeek) && !t.getDate().isAfter(endOfWeek)) {
                String dayName = t.getDate().getDayOfWeek().name().substring(0, 3); // MON, TUE etc.
                String capitalizedDay = dayName.charAt(0) + dayName.substring(1).toLowerCase(); // Mon, Tue etc.
                weeklyMap.put(capitalizedDay, weeklyMap.getOrDefault(capitalizedDay, 0.0) + t.getAmount());
            }
        }

        return ResponseEntity.ok(weeklyMap);
    }

    @GetMapping("/category")
    public ResponseEntity<Map<String, Double>> getCategoryBreakdown() {
        User user = getLoggedInUser();
        List<Expense> transactions = expenseRepository.findByUser(user);

        Map<String, Double> categoryMap = transactions.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getType()))
                .collect(Collectors.groupingBy(
                        Expense::getCategory,
                        Collectors.summingDouble(Expense::getAmount)
                ));

        return ResponseEntity.ok(categoryMap);
    }
}

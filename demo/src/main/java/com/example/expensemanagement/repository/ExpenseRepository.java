package com.example.expensemanagement.repository;

import com.example.expensemanagement.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
}

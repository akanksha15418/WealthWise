package com.example.expensemanagement.repository;

import com.example.expensemanagement.entity.Expense;
import com.example.expensemanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserOrderByDateDesc(User user);
    List<Expense> findByUser(User user);
}

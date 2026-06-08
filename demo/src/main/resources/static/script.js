// Global variables
let barChartInstance = null;
let pieChartInstance = null;

// DOM loaded handler
document.addEventListener("DOMContentLoaded", () => {
    // Determine which page we are on
    const isDashboard = document.getElementById("greeting") !== null;
    const isAuthPage = document.querySelector(".auth-page") !== null;

    if (isDashboard) {
        checkAuthAndInitDashboard();
    }
    
    if (isAuthPage) {
        // Clear any previous invalid tokens on auth page
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
    }
});

/* =========================================================================
   AUTHENTICATION & AUTHORIZATION HANDLERS
   ========================================================================= */

// Switch auth tabs
function switchTab(type) {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const msg = document.getElementById("auth-message");

    msg.innerText = "";
    msg.className = "auth-message";

    if (type === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
    } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        tabLogin.classList.remove("active");
        tabRegister.classList.add("active");
    }
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const msg = document.getElementById("auth-message");

    msg.innerText = "Signing in...";
    msg.className = "auth-message";

    fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (!res.ok) throw new Error("Invalid email or password");
        return res.json();
    })
    .then(data => {
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userEmail", data.email);
        msg.className = "auth-message success";
        msg.innerText = "Login successful! Redirecting...";
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    })
    .catch(err => {
        msg.className = "auth-message error";
        msg.innerText = err.message;
    });
}

// Handle register
function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const msg = document.getElementById("auth-message");

    msg.innerText = "Creating account...";
    msg.className = "auth-message";

    fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(text => { throw new Error(text || "Registration failed") });
        }
        return res.json();
    })
    .then(() => {
        msg.className = "auth-message success";
        msg.innerText = "Account created! Please sign in.";
        setTimeout(() => {
            switchTab("login");
            document.getElementById("login-email").value = email;
        }, 1500);
    })
    .catch(err => {
        msg.className = "auth-message error";
        msg.innerText = err.message;
    });
}

// Check auth & initialize
function checkAuthAndInitDashboard() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Populate user profile info
    const name = localStorage.getItem("userName") || "User";
    const email = localStorage.getItem("userEmail") || "user@example.com";
    
    document.getElementById("userName").innerText = name;
    document.getElementById("userEmail").innerText = email;
    document.getElementById("avatarName").innerText = name.charAt(0).toUpperCase();
    document.getElementById("greeting").innerText = `Welcome back, ${name.split(" ")[0]}!`;

    // Set today's date as default in add modal
    document.getElementById("tx-date").valueAsDate = new Date();

    // Fetch Dashboard data
    refreshDashboard();
}

// Handle logout
function handleLogout() {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
}

/* =========================================================================
   DASHBOARD DATA FETCHING & RENDERING
   ========================================================================= */

function getAuthHeaders() {
    return {
        "Authorization": "Bearer " + localStorage.getItem("jwtToken"),
        "Content-Type": "application/json"
    };
}

function refreshDashboard() {
    fetchSummary();
    fetchTransactions();
    fetchWeeklyTrend();
    fetchCategoryBreakdown();
}

// Fetch summary metrics
function fetchSummary() {
    fetch("/api/expenses/summary", { headers: getAuthHeaders() })
    .then(res => {
        if (res.status === 401) handleLogout();
        return res.json();
    })
    .then(data => {
        document.getElementById("incomeAmount").innerText = "₹" + data.income.toFixed(2);
        document.getElementById("expenseAmount").innerText = "₹" + data.expense.toFixed(2);
        
        const savings = data.savings;
        const savingEl = document.getElementById("savingAmount");
        savingEl.innerText = (savings < 0 ? "-₹" : "₹") + Math.abs(savings).toFixed(2);
        
        if (savings < 0) {
            savingEl.style.color = "var(--color-expense)";
        } else {
            savingEl.style.color = "var(--color-income)";
        }
    })
    .catch(err => console.error("Error fetching summary:", err));
}

// Fetch transaction list
function fetchTransactions() {
    fetch("/api/expenses", { headers: getAuthHeaders() })
    .then(res => res.json())
    .then(data => {
        const listBody = document.getElementById("transactionList");
        listBody.innerHTML = "";

        if (data.length === 0) {
            listBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No transactions found. Click "+ Add Transaction" to add one!</td></tr>`;
            return;
        }

        data.forEach(tx => {
            const isIncome = tx.type === "INCOME";
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${tx.date}</td>
                <td>${escapeHtml(tx.category)}</td>
                <td>
                    <span class="tx-type-tag ${isIncome ? 'tag-income' : 'tag-expense'}">
                        ${tx.type}
                    </span>
                </td>
                <td style="font-weight: 600; color: ${isIncome ? 'var(--color-income)' : 'var(--text-primary)'}">
                    ${isIncome ? '+' : '-'}₹${tx.amount.toFixed(2)}
                </td>
                <td>
                    <button class="btn-delete" onclick="handleDeleteTransaction(${tx.id})">Delete</button>
                </td>
            `;
            listBody.appendChild(row);
        });
    })
    .catch(err => console.error("Error fetching transactions:", err));
}

// Fetch weekly trend and render bar chart
function fetchWeeklyTrend() {
    fetch("/api/expenses/weekly", { headers: getAuthHeaders() })
    .then(res => res.json())
    .then(data => {
        const labels = Object.keys(data);
        const values = Object.values(data);

        const barCtx = document.getElementById("barChart").getContext("2d");

        if (barChartInstance) {
            barChartInstance.destroy();
        }

        barChartInstance = new Chart(barCtx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Expenses",
                    data: values,
                    backgroundColor: "#6366F1",
                    borderRadius: 6,
                    borderWidth: 0,
                    barThickness: 22
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: "#9CA3AF" }
                    },
                    y: {
                        grid: { color: "rgba(255,255,255,0.05)" },
                        ticks: { color: "#9CA3AF" },
                        beginAtZero: true
                    }
                }
            }
        });
    })
    .catch(err => console.error("Error fetching weekly trends:", err));
}

// Fetch category spending and render pie chart
function fetchCategoryBreakdown() {
    fetch("/api/expenses/category", { headers: getAuthHeaders() })
    .then(res => res.json())
    .then(data => {
        const labels = Object.keys(data);
        const values = Object.values(data);

        const pieCtx = document.getElementById("pieChart").getContext("2d");

        if (pieChartInstance) {
            pieChartInstance.destroy();
        }

        if (labels.length === 0) {
            // Draw empty state
            pieChartInstance = new Chart(pieCtx, {
                type: "doughnut",
                data: {
                    labels: ["No Expenses"],
                    datasets: [{
                        data: [1],
                        backgroundColor: ["rgba(255,255,255,0.05)"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom", labels: { color: "#9CA3AF" } } }
                }
            });
            return;
        }

        pieChartInstance = new Chart(pieCtx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        "#EC4899", // Pink
                        "#8B5CF6", // Purple
                        "#3B82F6", // Blue
                        "#10B981", // Green
                        "#F59E0B", // Orange
                        "#EF4444"  // Red
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#9CA3AF",
                            boxWidth: 12,
                            padding: 15
                        }
                    }
                }
            }
        });
    })
    .catch(err => console.error("Error fetching category breakdown:", err));
}

// Handle save transaction
function handleSaveTransaction(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById("tx-amount").value);
    const type = document.getElementById("tx-type").value;
    const category = document.getElementById("tx-category").value;
    const date = document.getElementById("tx-date").value;

    fetch("/api/expenses", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, type, category, date })
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to save transaction");
        return res.json();
    })
    .then(() => {
        closeModal();
        document.getElementById("transaction-form").reset();
        refreshDashboard();
    })
    .catch(err => {
        alert(err.message);
    });
}

// Handle delete transaction
function handleDeleteTransaction(id) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to delete transaction");
        refreshDashboard();
    })
    .catch(err => {
        alert(err.message);
    });
}

/* =========================================================================
   MODAL CONTROLLER
   ========================================================================= */

function openModal() {
    document.getElementById("transactionModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("transactionModal").style.display = "none";
}

// Utility to escape HTML strings
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

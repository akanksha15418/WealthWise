document.addEventListener("DOMContentLoaded", () => {

    fetch("/api/summary")
        .then(res => res.json())
        .then(data => {

            document.getElementById("incomeAmount").innerText = "₹" + data.income;
            document.getElementById("expenseAmount").innerText = "₹" + data.expense;
            document.getElementById("savingAmount").innerText = "₹" + data.savings;

            if (window.barChartInstance) window.barChartInstance.destroy();
            if (window.pieChartInstance) window.pieChartInstance.destroy();

            // BAR CHART
            const barCtx = document.getElementById("barChart");

            window.barChartInstance = new Chart(barCtx, {
                type: "bar",
                data: {
                    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    datasets: [{
                        data: [300, 400, 250, 500, 200, 450, 200],
                        backgroundColor: "#ff8a65",
                        borderRadius: 8,
                        barThickness: 28
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true }
                    }
                }
            });

            // PIE CHART
            const pieCtx = document.getElementById("pieChart");

            window.pieChartInstance = new Chart(pieCtx, {
                type: "pie",
                data: {
                    labels: ["Food", "Travel", "Shopping", "Bills"],
                    datasets: [{
                        data: [800, 600, 500, 400],
                        backgroundColor: [
                            "#4db6ac",
                            "#64b5f6",
                            "#ffd54f",
                            "#ba68c8"
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "right",
                            labels: { boxWidth: 14 }
                        }
                    }
                }
            });

        })
        .catch(err => console.error(err));
});

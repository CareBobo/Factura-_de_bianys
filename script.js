// Hardcoded data provided by user for cross-device sync
const initialData = [
    { "date": "2025-11-19 22:18:43", "value": 38000 },
    { "date": "2025-11-20 22:18:43", "value": 38000 },
    { "date": "2025-11-22 22:18:43", "value": 38000 },
    { "date": "2025-11-24 22:18:43", "value": 38000 },
    { "date": "2025-11-25 22:18:43", "value": 12000 },
    { "date": "2025-11-26 22:18:43", "value": 38000 },
    { "date": "2025-11-27 22:18:43", "value": 26000 },
    { "date": "2025-11-29 22:18:43", "value": 0 },
    { "date": "2025-12-01 22:18:43", "value": 38000 },
    { "date": "2025-12-02 22:18:43", "value": 37000 },
    { "date": "2025-12-03 22:18:43", "value": 0 },
    { "date": "2025-12-04 22:18:43", "value": 0 },
    { "date": "2025-12-06 22:18:43", "value": 0 },
    { "date": "2025-12-08 22:18:43", "value": 0 },
    { "date": "2025-12-09 22:18:43", "value": 0 },
    { "date": "2025-12-10 22:18:43", "value": 0 },
    { "date": "2025-12-11 22:18:43", "value": 0 },
    { "date": "2025-12-13 22:18:43", "value": 0 },
    { "date": "2025-12-15 22:18:43", "value": 0 },
    { "date": "2025-12-16 22:18:43", "value": 0 },
    { "date": "2025-12-17 22:18:43", "value": 0 },
    { "date": "2025-12-18 22:18:43", "value": 0 },
    { "date": "2025-12-20 22:18:43", "value": 0 }
];

const STORAGE_KEY = 'financeTrackerData_2025_v2'; // Changed key to force fresh load on PC too
let financeData = [];
let chartInstance = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderSheet();
    initChart();

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
});

function exportData() {
    const dataToExport = financeData.map(row => ({
        date: row.date,
        value: row.value
    }));

    const jsonString = JSON.stringify(dataToExport, null, 2);

    // Show Modal
    const modal = document.getElementById('export-modal');
    const area = document.getElementById('export-area');

    if (modal && area) {
        area.value = jsonString;
        modal.style.display = 'flex';
        area.select();
    }

    navigator.clipboard.writeText(jsonString).catch(err => console.log('Auto-copy failed'));
}

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
        try {
            const storedData = JSON.parse(stored);
            // Merge stored data with initialData structure
            financeData = initialData.map((item, index) => {
                const found = storedData.find(d => d.date === item.date);
                return {
                    id: index,
                    date: item.date,
                    // Prefer stored value if it exists, otherwise use initial hardcoded value
                    value: found ? found.value : item.value,
                    cumulative: 0
                };
            });
        } catch (e) {
            console.error("Error parsing stored data", e);
            resetData();
        }
    } else {
        // If no data in local storage (like on mobile), use the hardcoded initialData
        resetData();
    }

    calculateCumulative();
}

function resetData() {
    financeData = initialData.map((item, index) => ({
        id: index,
        date: item.date,
        value: item.value,
        cumulative: 0
    }));
}

function calculateCumulative() {
    let runningTotal = 0;
    financeData.forEach(row => {
        row.value = parseFloat(row.value) || 0;
        runningTotal += row.value;
        row.cumulative = runningTotal;
    });
    saveData();
    updateUI();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(financeData));
}

function renderSheet() {
    const tbody = document.getElementById('sheet-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    financeData.forEach((row, index) => {
        const tr = document.createElement('tr');
        if (row.value > 0) {
            tr.classList.add('row-completed');
        }

        // Row Header (Number)
        const tdRowHeader = document.createElement('td');
        tdRowHeader.textContent = index + 1;
        tr.appendChild(tdRowHeader);

        // Col A: Date
        const tdDate = document.createElement('td');
        tdDate.setAttribute('data-col', 'A');
        tdDate.textContent = row.date;
        tr.appendChild(tdDate);

        // Col B: Value Input
        const tdValue = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = '0.00';
        input.value = row.value === 0 ? '' : row.value;
        input.addEventListener('input', (e) => handleInput(e, index));
        input.addEventListener('focus', () => {
            const fx = document.getElementById('formula-input');
            if (fx) fx.value = `VALOR DE FECHA: ${row.date}`;
        });
        tdValue.appendChild(input);
        tr.appendChild(tdValue);

        // Col C: Cumulative
        const tdTotal = document.createElement('td');
        tdTotal.setAttribute('data-col', 'C');
        // Format as currency
        tdTotal.textContent = formatCurrency(row.cumulative);
        tr.appendChild(tdTotal);

        tbody.appendChild(tr);
    });
}

function handleInput(e, index) {
    const val = parseFloat(e.target.value);
    financeData[index].value = isNaN(val) ? 0 : val;

    // Update Logic
    calculateCumulative();

    const rows = document.getElementById('sheet-body').rows;
    // Toggle green class
    if (financeData[index].value > 0) {
        rows[index].classList.add('row-completed');
    } else {
        rows[index].classList.remove('row-completed');
    }

    updateSheetValues();
}

function updateSheetValues() {
    const rows = document.getElementById('sheet-body').rows;
    financeData.forEach((row, index) => {
        const cellC = rows[index].querySelector('td[data-col="C"]');
        if (cellC) cellC.textContent = formatCurrency(row.cumulative);
    });
    updateChart();
    updateGrandTotal();
}

function updateUI() {
    updateGrandTotal();
}

function updateGrandTotal() {
    const total = financeData.length > 0 ? financeData[financeData.length - 1].cumulative : 0;
    const el = document.getElementById('grand-total');
    if (el) el.textContent = formatCurrency(total);
}

function formatCurrency(num) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(num);
}

// Chart.js
function initChart() {
    const cvs = document.getElementById('financeChart');
    if (!cvs) return;

    const ctx = cvs.getContext('2d');

    // Create gradients
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradientFill.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: financeData.map(d => d.date.split(' ')[0]),
            datasets: [{
                label: 'Acumulado',
                data: financeData.map(d => d.cumulative),
                borderColor: '#ffffff',
                backgroundColor: gradientFill,
                borderWidth: 2,
                pointBackgroundColor: '#107C41',
                pointBorderColor: '#fff',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function updateChart() {
    if (chartInstance) {
        chartInstance.data.datasets[0].data = financeData.map(d => d.cumulative);
        chartInstance.update();
    }
}
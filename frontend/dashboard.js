import { API_URL } from './config.js';

const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const alertBox = document.getElementById('alert');
const logoutBtn = document.getElementById('logoutBtn');
const transactionForm = document.getElementById('transactionForm');
const transactionsTable = document.getElementById('transactionsTable');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const balanceEl = document.getElementById('balance');
const categoryChartCtx = document.getElementById('categoryChart').getContext('2d');
const summaryChartCtx = document.getElementById('summaryChart').getContext('2d');
const incomeCategoryChartCtx = document.getElementById('incomeCategoryChart').getContext('2d');
const expenseCategoryChartCtx = document.getElementById('expenseCategoryChart').getContext('2d');

// Modal elements
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editTypeInput = document.getElementById('editType');
const editAmountInput = document.getElementById('editAmount');
const editCategoryInput = document.getElementById('editCategory');
const editDateInput = document.getElementById('editDate');
const cancelEditBtn = document.querySelector('.btn-cancel');

let categoryChart, summaryChart, incomeCategoryChart, expenseCategoryChart;
let currentEditId = null;

// --- Helpers ---
function showAlert(msg, type='error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => alertBox.innerHTML = '', 3000);
}

// --- Logout ---
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

// --- Fetch Summary ---
async function fetchSummary() {
  try {
    const res = await fetch(`${API_URL}/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch summary');

    totalIncomeEl.textContent = data.totalIncome.toFixed(2);
    totalExpensesEl.textContent = data.totalExpenses.toFixed(2);
    balanceEl.textContent = data.balance.toFixed(2);
  } catch (err) {
    console.error('Summary error:', err);
    showAlert('Error fetching summary');
  }
}

// --- Fetch Transactions ---
async function fetchTransactions() {
  try {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch transactions');

    // Sort transactions by date descending
    data.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

    transactionsTable.innerHTML = '';
    data.forEach(tx => {
      const row = document.createElement('tr');
      const txDate = tx.date || tx.created_at || '';
      row.innerHTML = `
        <td>${tx.type}</td>
        <td>${Number(tx.amount).toFixed(2)}</td>
        <td>${tx.category}</td>
        <td>${txDate ? new Date(txDate).toLocaleDateString() : ''}</td>
        <td>
          <button class="editBtn" data-id="${tx.id}">Edit</button>
          <button class="deleteBtn" data-id="${tx.id}">Delete</button>
        </td>
      `;
      transactionsTable.appendChild(row);
    });
  } catch (err) {
    console.error('Transactions error:', err);
    showAlert(err.message || 'Error fetching transactions');
  }
}

// --- Fetch Category Summary ---
async function fetchCategorySummary() {
  try {
    const res = await fetch(`${API_URL}/category-summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch category summary');

    const categories = Object.keys(data);
    const incomeData = categories.map(cat => data[cat].income || 0);
    const expenseData = categories.map(cat => data[cat].expense || 0);

    const incomeCategories = categories.filter(cat => data[cat].income > 0);
    const expenseCategories = categories.filter(cat => data[cat].expense > 0);
    
    const incomeCategoryData = incomeCategories.map(cat => data[cat].income);
    const expenseCategoryData = expenseCategories.map(cat => data[cat].expense);

    // Destroy existing charts to prevent stacking
    if (categoryChart) categoryChart.destroy();
    if (summaryChart) summaryChart.destroy();
    if (incomeCategoryChart) incomeCategoryChart.destroy();
    if (expenseCategoryChart) expenseCategoryChart.destroy();

    // Bar chart for category summary - fixed colors as requested
    categoryChart = new Chart(categoryChartCtx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          { label: 'Income', data: incomeData, backgroundColor: 'green' },
          { label: 'Expense', data: expenseData, backgroundColor: 'red' }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } }
    });

    // Pie chart for Income vs Expenses
    summaryChart = new Chart(summaryChartCtx, {
      type: 'pie',
      data: {
        labels: ['Income','Expense'],
        datasets: [{
          data: [incomeData.reduce((a,b)=>a+b,0), expenseData.reduce((a,b)=>a+b,0)],
          backgroundColor: ['#28a745','#dc3545']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    // Pie chart for Category Incomes
    incomeCategoryChart = new Chart(incomeCategoryChartCtx, {
      type: 'pie',
      data: {
        labels: incomeCategories,
        datasets: [{ data: incomeCategoryData, backgroundColor: generateIncomeColors(incomeCategories.length) }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    // Pie chart for Category Expenses
    expenseCategoryChart = new Chart(expenseCategoryChartCtx, {
      type: 'pie',
      data: {
        labels: expenseCategories,
        datasets: [{ data: expenseCategoryData, backgroundColor: generateExpenseColors(expenseCategories.length) }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

  } catch (err) {
    console.error('Category summary error:', err);
    showAlert(`Error fetching category summary: ${err.message}`);
  }
}

// Helper function to generate dynamic colors for income chart
function generateIncomeColors(num) {
  const colors = [];
  const hueStep = 360 / num;
  for (let i = 0; i < num; i++) {
    const hue = Math.floor(i * hueStep);
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
}

// Helper function to generate dynamic colors for expense chart
function generateExpenseColors(num) {
  const colors = [];
  const hueStep = 360 / num;
  for (let i = 0; i < num; i++) {
    const hue = Math.floor(180 + i * hueStep);
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
}

// --- Add Transaction ---
transactionForm.addEventListener('submit', async e => {
  e.preventDefault();
  const type = document.getElementById('type').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ type, amount, category, date })
    });
    const data = await res.json();
    if(res.ok) {
      showAlert('Transaction added', 'success');
      transactionForm.reset();
      loadDashboard();
    } else showAlert(data.error || 'Failed to add transaction');
  } catch (err) {
      console.error('Add transaction error:', err);
      showAlert('Server error');
  }
});

// --- Edit/Delete Transaction ---
transactionsTable.addEventListener('click', async e => {
  const id = e.target.dataset.id;
  if (!id) return;

  // Delete
  if(e.target.classList.contains('deleteBtn')) {
    if(!confirm('Delete this transaction?')) return;
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if(res.ok) { showAlert('Transaction deleted', 'success'); loadDashboard(); }
      else showAlert(data.error || 'Failed to delete');
    } catch (err) {
        console.error('Delete error:', err);
        showAlert('Server error');
    }
  }

  // Edit - show modal
  if(e.target.classList.contains('editBtn')) {
    const row = e.target.closest('tr');
    const type = row.children[0].textContent;
    const amount = row.children[1].textContent;
    const category = row.children[2].textContent;
    const date = row.children[3].textContent;

    currentEditId = id;
    editTypeInput.value = type;
    editAmountInput.value = parseFloat(amount);
    editCategoryInput.value = category;
    editDateInput.value = new Date(date).toISOString().split('T')[0];

    editModal.classList.remove('hidden');
  }
});

// Handle edit form submission
editForm.addEventListener('submit', async e => {
  e.preventDefault();

  const type = editTypeInput.value;
  const amount = parseFloat(editAmountInput.value);
  const category = editCategoryInput.value;
  const date = editDateInput.value;

  try {
    const res = await fetch(`${API_URL}/transactions/${currentEditId}`, {
      method: 'PUT',
      headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        type,
        amount,
        category,
        date
      })
    });
    const data = await res.json();
    if(res.ok) {
      showAlert('Transaction updated', 'success');
      editModal.classList.add('hidden');
      loadDashboard();
    } else {
      showAlert(data.error || 'Failed to update transaction');
    }
  } catch (err) {
    console.error('Edit error:', err);
    showAlert('Server error');
  }
});

// Handle cancel button
cancelEditBtn.addEventListener('click', () => {
  editModal.classList.add('hidden');
});

// --- Load Dashboard ---
async function loadDashboard() {
  await fetchSummary();
  await fetchTransactions();
  await fetchCategorySummary();
}

// Initial Load
loadDashboard();
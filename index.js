const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

let transactions = [];
let idCounter = 1;

app.get('/', (req, res) => {
  res.send('Expense Tracker API is running');
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.get('/transactions', (req, res) => {
  const { type, start, end } = req.query;
  let filtered = [...transactions];

  if (type) {
    filtered = filtered.filter(txn => txn.type === type);
  }

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    filtered = filtered.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate >= startDate && txnDate <= endDate;
    });
  }

  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(filtered);
});

app.post('/transactions', (req, res) => {
  const { type, amount, category, date } = req.body;

  if (!type || amount === undefined || !category || !date) {
    return res.status(400).json({ error: 'All fields (type, amount, category, date) are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  if (typeof category !== 'string' || category.trim() === '') {
    return res.status(400).json({ error: 'Category must be a non-empty string' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: 'Date must be a valid date (YYYY-MM-DD)' });
  }

  const newTransaction = {
    id: idCounter++,
    type,
    amount,
    category,
    date
  };

  transactions.push(newTransaction);
  res.status(201).json({ message: 'Transaction added successfully', transaction: newTransaction });
});

app.get('/summary', (req, res) => {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(txn => {
    if (txn.type === 'income') {
      totalIncome += txn.amount;
    } else if (txn.type === 'expense') {
      totalExpenses += txn.amount;
    }
  });

  const balance = totalIncome - totalExpenses;

  res.json({
    totalIncome,
    totalExpenses,
    balance
  });
});

app.delete('/transactions/:id', (req, res) => {
  const transactionId = parseInt(req.params.id);
  const index = transactions.findIndex(txn => txn.id === transactionId);

  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const deleted = transactions.splice(index, 1);
  res.json({ message: 'Transaction deleted successfully', transaction: deleted[0] });
});

app.put('/transactions/:id', (req, res) => {
  const transactionId = parseInt(req.params.id);
  const { type, amount, category, date } = req.body;

  const transaction = transactions.find(txn => txn.id === transactionId);

  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (type && !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
  }

  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  if (type) transaction.type = type;
  if (amount !== undefined) transaction.amount = amount;
  if (category) transaction.category = category;
  if (date) transaction.date = date;

  res.json({ message: 'Transaction updated successfully', transaction });
});

app.get('/category-summary', (req, res) => {
  const summary = {};

  transactions.forEach(txn => {
    const { category, type, amount } = txn;

    if (!summary[category]) {
      summary[category] = {
        income: 0,
        expense: 0
      };
    }

    if (type === 'income') {
      summary[category].income += amount;
    } else if (type === 'expense') {
      summary[category].expense += amount;
    }
  });

  res.json(summary);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

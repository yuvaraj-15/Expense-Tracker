const express = require('express');
const app = express();
const PORT = 5000;

const pool = require('./db');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Expense Tracker API is running');
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.get('/transactions', async (req, res) => {
  const { type, start, end } = req.query;
  let query = 'SELECT * FROM transactions';
  const values = [];

  const filters = [];
  if (type) {
    filters.push(`type = $${values.length + 1}`);
    values.push(type);
  }

  if (start && end) {
    filters.push(`date BETWEEN $${values.length + 1} AND $${values.length + 2}`);
    values.push(start, end);
  }

  if (filters.length > 0) {
    query += ' WHERE ' + filters.join(' AND ');
  }

  query += ' ORDER BY date ASC';

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/transactions', async (req, res) => {
  const { type, amount, category, date } = req.body;

  if (!type || amount === undefined || !category || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }

  if (typeof category !== 'string' || category.trim() === '') {
    return res.status(400).json({ error: 'Category must be a non-empty string' });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: 'Date must be a valid date (YYYY-MM-DD)' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO transactions(type, amount, category, date) VALUES($1, $2, $3, $4) RETURNING *',
      [type, amount, category, date]
    );
    res.status(201).json({ message: 'Transaction added', transaction: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/summary', async (req, res) => {
  try {
    const incomeRes = await pool.query('SELECT SUM(amount) AS total FROM transactions WHERE type=$1', ['income']);
    const expenseRes = await pool.query('SELECT SUM(amount) AS total FROM transactions WHERE type=$1', ['expense']);

    const totalIncome = incomeRes.rows[0].total || 0;
    const totalExpenses = expenseRes.rows[0].total || 0;
    const balance = totalIncome - totalExpenses;

    res.json({ totalIncome, totalExpenses, balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/transactions/:id', async (req, res) => {
  const transactionId = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM transactions WHERE id=$1 RETURNING *', [transactionId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted', transaction: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/transactions/:id', async (req, res) => {
  const transactionId = parseInt(req.params.id);
  const { type, amount, category, date } = req.body;

  try {
    const current = await pool.query('SELECT * FROM transactions WHERE id=$1', [transactionId]);
    if (current.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });

    const updated = {
      type: type || current.rows[0].type,
      amount: amount !== undefined ? amount : current.rows[0].amount,
      category: category || current.rows[0].category,
      date: date || current.rows[0].date
    };

    const result = await pool.query(
      'UPDATE transactions SET type=$1, amount=$2, category=$3, date=$4 WHERE id=$5 RETURNING *',
      [updated.type, updated.amount, updated.category, updated.date, transactionId]
    );

    res.json({ message: 'Transaction updated', transaction: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/category-summary', async (req, res) => {
  try {
    const result = await pool.query('SELECT category, type, SUM(amount) AS total FROM transactions GROUP BY category, type');
    const summary = {};

    result.rows.forEach(row => {
      if (!summary[row.category]) summary[row.category] = { income: 0, expense: 0 };
      summary[row.category][row.type] = parseFloat(row.total);
    });

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

import express from 'express';
import {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpensesByDay,
  getExpensesByCategory
} from '../controllers/expense.controller.js';

const router = express.Router({ mergeParams: true });

// IMPORTANT: Specific routes MUST come before parameterized routes
// Summary routes (must be before /:expenseId)
router.get('/by-day', getExpensesByDay);          // GET /api/itineraries/:itineraryId/expenses/by-day
router.get('/by-category', getExpensesByCategory);// GET /api/itineraries/:itineraryId/expenses/by-category

// CRUD routes
router.post('/', addExpense);              // POST /api/itineraries/:itineraryId/expenses
router.get('/', getExpenses);              // GET all expenses
router.get('/:expenseId', getExpenseById); // GET single expense
router.put('/:expenseId', updateExpense);  // UPDATE expense
router.delete('/:expenseId', deleteExpense); // DELETE expense

export default router;
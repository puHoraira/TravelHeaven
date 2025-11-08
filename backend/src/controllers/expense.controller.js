import { Itinerary } from '../models/Itinerary.js';

// Add expense
export const addExpense = async (req, res, next) => {
  try {
    const { itineraryId } = req.params;
    const { name, amount, category, paidBy, splitAmong, dayNumber, date, notes } = req.body;

    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    const expense = {
      name,
      amount,
      category,
      paidBy,
      splitAmong: splitAmong || [],
      dayNumber: dayNumber || null,
      date: date || new Date(),
      notes: notes || '',
    };

    if (!itinerary.budget) itinerary.budget = { total: 0, currency: 'USD', expenses: [] };
    itinerary.budget.expenses.push(expense);

    await itinerary.save();

    res.status(201).json({ success: true, data: itinerary });
  } catch (error) {
    next(error);
  }
};

// Get all expenses
export const getExpenses = async (req, res, next) => {
  try {
    const { itineraryId } = req.params;
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    res.status(200).json({ success: true, data: itinerary.budget?.expenses || [] });
  } catch (error) {
    next(error);
  }
};

// Get specific expense by ID
export const getExpenseById = async (req, res, next) => {
  try {
    const { itineraryId, expenseId } = req.params;
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    const expense = itinerary.budget?.expenses.id(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// Update expense
export const updateExpense = async (req, res, next) => {
  try {
    const { itineraryId, expenseId } = req.params;
    const updateData = req.body;

    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    const expense = itinerary.budget?.expenses.id(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    Object.assign(expense, updateData);

    await itinerary.save();

    res.status(200).json({ success: true, data: itinerary });
  } catch (error) {
    next(error);
  }
};

// Delete expense
export const deleteExpense = async (req, res, next) => {
  try {
    const { itineraryId, expenseId } = req.params;

    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    const expense = itinerary.budget?.expenses.id(expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    expense.remove();
    await itinerary.save();

    res.status(200).json({ success: true, message: 'Expense deleted successfully', data: itinerary });
  } catch (error) {
    next(error);
  }
};

// Get expenses grouped by day
export const getExpensesByDay = async (req, res, next) => {
  try {
    const { itineraryId } = req.params;
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    const expensesByDay = itinerary.days.map(day => ({
      dayNumber: day.dayNumber,
      date: day.date,
      expenses: (itinerary.budget?.expenses || []).filter(exp => exp.dayNumber === day.dayNumber),
      total: (itinerary.budget?.expenses || [])
        .filter(exp => exp.dayNumber === day.dayNumber)
        .reduce((sum, exp) => sum + exp.amount, 0)
    }));

    res.status(200).json({ success: true, data: expensesByDay });
  } catch (error) {
    next(error);
  }
};

// Get expenses grouped by category
export const getExpensesByCategory = async (req, res, next) => {
  try {
    const { itineraryId } = req.params;
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });

    const categories = ['accommodation', 'transport', 'food', 'activities', 'shopping', 'other'];
    const expensesByCategory = categories.map(cat => ({
      category: cat,
      expenses: (itinerary.budget?.expenses || []).filter(exp => exp.category === cat),
      total: (itinerary.budget?.expenses || [])
        .filter(exp => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0)
    })).filter(cat => cat.total > 0);

    res.status(200).json({ success: true, data: expensesByCategory });
  } catch (error) {
    next(error);
  }
};

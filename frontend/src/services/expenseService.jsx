const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const expenseService = {
  // Get all expenses for an itinerary
  getExpenses: async (itineraryId) => {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/expenses`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return response.json();
  },

  // Add a new expense
  addExpense: async (itineraryId, expenseData) => {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    if (!response.ok) throw new Error('Failed to add expense');
    return response.json();
  },

  // Update an expense
  updateExpense: async (itineraryId, expenseId, expenseData) => {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    if (!response.ok) throw new Error('Failed to update expense');
    return response.json();
  },

  // Delete an expense
  deleteExpense: async (itineraryId, expenseId) => {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete expense');
    return response.json();
  },

  // Get expenses by day
  getExpensesByDay: async (itineraryId) => {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/expenses/by-day`);
    if (!response.ok) throw new Error('Failed to fetch expenses by day');
    return response.json();
  },

  // Get expenses by category
  getExpensesByCategory: async (itineraryId) => {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/expenses/by-category`);
    if (!response.ok) throw new Error('Failed to fetch expenses by category');
    return response.json();
  },
};
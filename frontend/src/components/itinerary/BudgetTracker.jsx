import { useState, useEffect } from 'react';
import { DollarSign, Plus, X, TrendingUp, TrendingDown, PieChart, Calendar } from 'lucide-react';

/**
 * BudgetTracker Component - Enhanced with Per-Day Tracking
 * Comprehensive expense tracking with visualization and category breakdown
 * 
 * Props:
 * - budgetTotal: number - Total budget amount
 * - currency: string - Currency code (USD, EUR, GBP, BDT)
 * - expenses: array - Array of expense objects
 * - onExpensesChange: function - Callback when expenses are updated
 * - days: array - Array of day objects with stops
 */
export default function BudgetTracker({ 
  budgetTotal = 0, 
  currency = 'USD', 
  expenses = [], 
  onExpensesChange,
  days = []
}) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedDayForExpense, setSelectedDayForExpense] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'by-day'
  const [newExpense, setNewExpense] = useState({
    category: 'accommodation',
    amount: '',
    description: '',
    dayNumber: 1,
    date: ''
  });

  // Currency symbols
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    BDT: '৳'
  };

  const symbol = currencySymbols[currency] || currency;

  // Expense categories with icons and colors
  const categories = {
    accommodation: { label: 'Accommodation', icon: '🏨', color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-500' },
    transport: { label: 'Transport', icon: '🚗', color: 'bg-purple-100 text-purple-800', bgColor: 'bg-purple-500' },
    food: { label: 'Food & Dining', icon: '🍽️', color: 'bg-orange-100 text-orange-800', bgColor: 'bg-orange-500' },
    activities: { label: 'Activities', icon: '🎭', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-500' },
    shopping: { label: 'Shopping', icon: '🛍️', color: 'bg-pink-100 text-pink-800', bgColor: 'bg-pink-500' },
    other: { label: 'Other', icon: '📌', color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-500' }
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const remainingBudget = budgetTotal - totalExpenses;
  const percentageUsed = budgetTotal > 0 ? (totalExpenses / budgetTotal) * 100 : 0;

  // Calculate expenses by category
  const expensesByCategory = Object.keys(categories).map(cat => ({
    category: cat,
    ...categories[cat],
    total: expenses
      .filter(exp => exp.category === cat)
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  })).filter(cat => cat.total > 0);

  // Calculate expenses by day
  const expensesByDay = days.map((day, index) => {
    const dayExpenses = expenses.filter(exp => exp.dayNumber === (index + 1));
    const dayTotal = dayExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    return {
      dayNumber: index + 1,
      date: day.date,
      expenses: dayExpenses,
      total: dayTotal
    };
  });

  // Handle adding expense
 const handleAddExpense = () => {
  if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  const expense = {
    id: Date.now().toString(), // Temporary ID for frontend
    category: newExpense.category,
    amount: parseFloat(newExpense.amount),
    description: newExpense.description || categories[newExpense.category].label,
    dayNumber: parseInt(newExpense.dayNumber) || 1,
    date: newExpense.date || new Date().toISOString(),
  };

  onExpensesChange([...expenses, expense]);

  // Reset form
  setNewExpense({
    category: 'accommodation',
    amount: '',
    description: '',
    dayNumber: selectedDayForExpense || 1,
    date: ''
  });
  setShowAddExpense(false);
  setSelectedDayForExpense(null);
};
   

  // Handle removing expense
  const handleRemoveExpense = (expenseId) => {
    onExpensesChange(expenses.filter(exp => exp.id !== expenseId));
  };

  // Get budget status color
  const getBudgetStatusColor = () => {
    if (percentageUsed > 100) return 'text-red-600';
    if (percentageUsed > 80) return 'text-orange-600';
    return 'text-green-600';
  };

  // Get progress bar color
  const getProgressBarColor = () => {
    if (percentageUsed > 100) return 'bg-red-500';
    if (percentageUsed > 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  // Open add expense form for specific day
  const addExpenseForDay = (dayNumber) => {
    setSelectedDayForExpense(dayNumber);
    setNewExpense({
      ...newExpense,
      dayNumber: dayNumber
    });
    setShowAddExpense(true);
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="text-blue-600" size={24} />
            Budget Overview
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'overview' ? 'by-day' : 'overview')}
              className="btn-secondary btn-sm flex items-center gap-2"
            >
              <Calendar size={16} />
              {viewMode === 'overview' ? 'View by Day' : 'View Overview'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDayForExpense(null);
                setShowAddExpense(!showAddExpense);
              }}
              className="btn-primary btn-sm flex items-center gap-2"
            >
              <Plus size={16} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Budget Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-gray-900">
              {symbol}{budgetTotal.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-blue-600">
              {symbol}{totalExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${getBudgetStatusColor()}`}>
              {remainingBudget >= 0 ? (
                <span className="flex items-center gap-1">
                  <TrendingUp size={20} />
                  {symbol}{remainingBudget.toFixed(2)}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <TrendingDown size={20} />
                  {symbol}{Math.abs(remainingBudget).toFixed(2)} over
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Budget Usage</span>
            <span className={`text-sm font-bold ${getBudgetStatusColor()}`}>
              {percentageUsed.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
          {percentageUsed > 100 && (
            <p className="text-xs text-red-600 mt-2 font-medium">
              ⚠️ Over budget by {symbol}{Math.abs(remainingBudget).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddExpense && (
        <div className="card bg-blue-50 border-2 border-blue-300">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="text-blue-600" size={20} />
            Add New Expense {selectedDayForExpense && `(Day ${selectedDayForExpense})`}
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="input"
              >
                {Object.entries(categories).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount ({symbol}) *
              </label>
              <input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="input"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day Number *
              </label>
              <select
                value={newExpense.dayNumber}
                onChange={(e) => setNewExpense({ ...newExpense, dayNumber: e.target.value })}
                className="input"
              >
                {days.length > 0 ? (
                  days.map((day, index) => (
                    <option key={index} value={index + 1}>
                      Day {index + 1} - {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </option>
                  ))
                ) : (
                  <option value="1">Day 1</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="input"
                placeholder="e.g., Hotel Paris Downtown"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleAddExpense}
              className="btn-primary btn-sm"
            >
              Add Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddExpense(false);
                setSelectedDayForExpense(null);
              }}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View Mode: Overview */}
      {viewMode === 'overview' && (
        <>
          {/* Category Breakdown */}
          {expensesByCategory.length > 0 && (
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="text-purple-600" size={20} />
                Expenses by Category
              </h4>
              
              <div className="space-y-3">
                {expensesByCategory.map(cat => {
                  const percentage = budgetTotal > 0 ? (cat.total / budgetTotal) * 100 : 0;
                  const expenseCount = expenses.filter(exp => exp.category === cat.category).length;
                  return (
                    <div key={cat.category} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${cat.color}`}>
                            {cat.icon} {cat.label}
                          </span>
                          <span className="text-xs text-gray-500">({expenseCount} item{expenseCount !== 1 ? 's' : ''})</span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {symbol}{cat.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-full rounded-full ${cat.bgColor}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {percentage.toFixed(1)}% of total budget
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Expenses List */}
          {expenses.length > 0 && (
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-4">
                All Expenses ({expenses.length})
              </h4>
              
              <div className="space-y-2">
                {expenses.map((expense) => {
                  const cat = categories[expense.category];
                  return (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${cat.color}`}>
                          {cat.icon}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-xs text-gray-500">Day {expense.dayNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">
                          {symbol}{parseFloat(expense.amount).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExpense(expense.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* View Mode: By Day */}
      {viewMode === 'by-day' && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            Expenses by Day
          </h4>

          {days.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Please set your trip dates first</p>
          ) : (
            <div className="space-y-4">
              {expensesByDay.map((day) => (
                <div key={day.dayNumber} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900">
                        Day {day.dayNumber} - {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {day.expenses.length} expense{day.expenses.length !== 1 ? 's' : ''} • Total: <span className="font-bold">{symbol}{day.total.toFixed(2)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addExpenseForDay(day.dayNumber)}
                      className="btn-primary btn-sm flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </div>

                  {day.expenses.length > 0 ? (
                    <div className="space-y-2">
                      {day.expenses.map((expense) => {
                        const cat = categories[expense.category];
                        return (
                          <div key={expense.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                            <div className="flex items-center gap-3 flex-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${cat.color}`}>
                                {cat.icon}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{expense.description}</p>
                                <p className="text-xs text-gray-500">{cat.label}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900">
                                {symbol}{parseFloat(expense.amount).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveExpense(expense.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500">No expenses recorded for this day</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {expenses.length === 0 && !showAddExpense && (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            <DollarSign size={48} className="mx-auto" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Expenses Yet</h4>
          <p className="text-gray-600 mb-4">
            Start tracking your trip expenses to stay within budget
          </p>
          <button
            type="button"
            onClick={() => setShowAddExpense(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Add First Expense
          </button>
        </div>
      )}
    </div>
  );
}
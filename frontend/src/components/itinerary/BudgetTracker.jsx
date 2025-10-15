import { DollarSign, TrendingUp, User, Users as UsersIcon } from 'lucide-react';

/**
 * BudgetTracker Component - Displays budget and expenses
 * Design Pattern: Strategy Pattern - Different expense splitting strategies
 * 
 * @param {Object} budget - Budget object with total and expenses
 * @param {Array} collaborators - List of collaborators for expense splitting
 */
export default function BudgetTracker({ budget, collaborators = [] }) {
  if (!budget) {
    return null;
  }

  const totalExpenses = budget.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const remaining = budget.total - totalExpenses;
  const percentageUsed = budget.total > 0 ? (totalExpenses / budget.total) * 100 : 0;

  const getProgressBarColor = () => {
    if (percentageUsed < 50) return 'bg-green-500';
    if (percentageUsed < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: budget.currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="text-green-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">Budget Overview</h3>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Budget</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(budget.total)}</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Spent</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className={`text-center p-3 rounded-lg ${remaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-sm text-gray-600 mb-1">Remaining</p>
          <p className={`text-xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Budget Used</span>
          <span className="font-semibold">{percentageUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Recent Expenses */}
      {budget.expenses && budget.expenses.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <TrendingUp size={16} />
            Recent Expenses
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {budget.expenses.slice(-5).reverse().map((expense, index) => (
              <div
                key={expense._id || index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{expense.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    {expense.category && (
                      <span className="px-2 py-0.5 bg-gray-200 rounded-full">
                        {expense.category}
                      </span>
                    )}
                    {expense.paidBy && (
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {expense.paidBy.name || 'Someone'}
                      </span>
                    )}
                    {expense.splitAmong && expense.splitAmong.length > 1 && (
                      <span className="flex items-center gap-1">
                        <UsersIcon size={12} />
                        Split {expense.splitAmong.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                  {expense.date && (
                    <p className="text-xs text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {budget.expenses && budget.expenses.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <DollarSign size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No expenses recorded yet</p>
        </div>
      )}
    </div>
  );
}

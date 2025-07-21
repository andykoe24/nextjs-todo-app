import { useMemo } from 'react';
import moment from 'moment';

// Filtering
export function filterTodos(todos, searchTerm, statusFilter) {
  let filtered = [...todos];
  if (searchTerm) {
    filtered = filtered.filter(todo =>
      todo.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter(todo => {
      if (statusFilter === 'completed') return todo.completed;
      if (statusFilter === 'incomplete') return !todo.completed;
      return true;
    });
  }
  return filtered;
}

// Sorting
export function sortTodos(todos, sortBy, sortOrder = 'asc') {
  return [...todos].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'priority-high': // desc
        return (
          (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : b.priority === 'low' ? 1 : 0) -
          (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : a.priority === 'low' ? 1 : 0)
        );
      case 'priority-low': // asc
        return (
          (a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : a.priority === 'low' ? 1 : 0) -
          (b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : b.priority === 'low' ? 1 : 0)
        );
      case 'dueDate-newest': // desc (dueDate)
        return new Date(b.dueDate || '9999-12-31') - new Date(a.dueDate || '9999-12-31');
      case 'dueDate-oldest': // asc (dueDate)
        return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
      case 'text':
        aValue = a.text.toLowerCase();
        bValue = b.text.toLowerCase();
        break;
      case 'order':
      default:
        aValue = a.order;
        bValue = b.order;
        break;
    }
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
}

// Pagination
export function paginateTodos(todos, currentPage, itemsPerPage) {
  const totalItems = todos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return {
    currentTasks: todos.slice(startIndex, endIndex),
    totalItems,
    totalPages,
    startIndex,
    endIndex
  };
}

// Date formatting (from TodoItem)
export function formatDueDate(dateString, timeString) {
  if (!dateString) return null;
  const dueDate = moment(dateString);
  const today = moment();
  const diffDays = dueDate.diff(today, 'days');
  let timeDisplay = '';
  if (timeString) {
    timeDisplay = ` at ${timeString}`;
  }
  if (diffDays >= -7 && diffDays <= 7) {
    if (diffDays < 0) {
      return { text: dueDate.fromNow() + timeDisplay, color: 'text-red-500' };
    } else if (diffDays === 0) {
      return { text: 'Today' + timeDisplay, color: 'text-red-500' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow' + timeDisplay, color: 'text-orange-500' };
    } else if (diffDays <= 7) {
      return { text: dueDate.format('dddd') + timeDisplay, color: 'text-blue-500' };
    }
  }
  if (diffDays < 0) {
    return { text: dueDate.format('MMM D') + timeDisplay, color: 'text-red-500' };
  } else {
    return { text: dueDate.format('MMM D') + timeDisplay, color: 'text-gray-500' };
  }
}

// Main hook for memoized derived todos
export function useTodos({ todos, searchTerm, statusFilter, sortBy, sortOrder, currentPage, itemsPerPage }) {
  return useMemo(() => {
    const filtered = filterTodos(todos, searchTerm, statusFilter);
    const sorted = sortTodos(filtered, sortBy, sortOrder);
    const paginated = paginateTodos(sorted, currentPage, itemsPerPage);
    return paginated;
  }, [todos, searchTerm, statusFilter, sortBy, sortOrder, currentPage, itemsPerPage]);
} 
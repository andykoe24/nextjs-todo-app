'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

const TodoContext = createContext();

const initialState = {
  todos: [],
  filteredTodos: [],
  searchTerm: '',
  statusFilter: 'all',
  sortBy: 'order',
  sortOrder: 'asc',
  editingId: null,
  editingTaskId: null,
  isAdding: false,
  dragIndex: null,
  dropIndex: null,
  currentView: 'list'
};

// Category definitions with colors
export const categories = {
  'Work': { color: 'bg-blue-500', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  'Personal': { color: 'bg-green-500', textColor: 'text-green-700', borderColor: 'border-green-200' },
  'Shopping': { color: 'bg-purple-500', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
  'Health': { color: 'bg-pink-500', textColor: 'text-pink-700', borderColor: 'border-pink-200' },
  'Finance': { color: 'bg-yellow-500', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  'Travel': { color: 'bg-indigo-500', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
  'Home': { color: 'bg-orange-500', textColor: 'text-orange-700', borderColor: 'border-orange-200' }
};

const todoReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      const newTodo = {
        id: Date.now().toString(),
        text: action.payload.text,
        completed: false,
        dueDate: action.payload.dueDate,
        dueTime: action.payload.dueTime,
        category: action.payload.category,
        priority: action.payload.priority,
        order: state.todos.length,
        createdAt: new Date().toISOString()
      };
      const updatedTodos = [...state.todos, newTodo];
      return {
        ...state,
        todos: updatedTodos,
        filteredTodos: updatedTodos
      };
    
    case 'DELETE_TODO':
      const todosAfterDelete = state.todos.filter(todo => todo.id !== action.payload);
      return {
        ...state,
        todos: todosAfterDelete,
        filteredTodos: todosAfterDelete
      };
    
    case 'TOGGLE_TODO':
      const todosAfterToggle = state.todos.map(todo =>
        todo.id === action.payload ? { ...todo, completed: !todo.completed } : todo
      );
      return {
        ...state,
        todos: todosAfterToggle,
        filteredTodos: todosAfterToggle
      };
    
    case 'UPDATE_TODO':
      const todosAfterUpdate = state.todos.map(todo =>
        todo.id === action.payload.id ? { ...todo, ...action.payload.updates } : todo
      );
      return {
        ...state,
        todos: todosAfterUpdate,
        filteredTodos: todosAfterUpdate,
        editingId: null,
        editingTaskId: null
      };
    
    case 'SET_EDITING_ID':
      return {
        ...state,
        editingId: action.payload
      };

    case 'SET_EDITING_TASK':
      return {
        ...state,
        editingTaskId: action.payload,
        isAdding: false
      };

    case 'CANCEL_EDITING':
      return {
        ...state,
        editingTaskId: null
      };

    case 'SET_ADDING':
      return {
        ...state,
        isAdding: action.payload,
        editingTaskId: null
      };

    case 'DUPLICATE_TODO':
      const taskToDuplicate = state.todos.find(todo => todo.id === action.payload);
      if (taskToDuplicate) {
        const duplicatedTask = {
          ...taskToDuplicate,
          id: Date.now().toString(),
          text: `${taskToDuplicate.text} (copy)`,
          completed: false,
          order: state.todos.length,
          createdAt: new Date().toISOString()
        };
        const todosWithDuplicate = [...state.todos, duplicatedTask];
        return {
          ...state,
          todos: todosWithDuplicate,
          filteredTodos: todosWithDuplicate
        };
      }
      return state;
    
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload,
      };
    
    case 'SET_STATUS_FILTER':
      return {
        ...state,
        statusFilter: action.payload,
      };
    
    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder
      };
    
    case 'SET_DRAG_INDEX':
      return {
        ...state,
        dragIndex: action.payload
      };
    
    case 'SET_DROP_INDEX':
      return {
        ...state,
        dropIndex: action.payload
      };
    
    case 'REORDER_TODOS':
      let reorderedTodos;
      
      if (action.payload.useFiltered) {
        // Reorder based on filtered todos (what user sees)
        const reorderedFiltered = [...state.filteredTodos];
        const [draggedItem] = reorderedFiltered.splice(action.payload.fromIndex, 1);
        reorderedFiltered.splice(action.payload.toIndex, 0, draggedItem);
        
        // Update order values based on the new filtered order
        const todosWithUpdatedOrder = reorderedFiltered.map((todo, index) => ({
          ...todo,
          order: index
        }));
        
        // Update the main todos array to match the new order
        reorderedTodos = state.todos.map(todo => {
          const updatedTodo = todosWithUpdatedOrder.find(t => t.id === todo.id);
          return updatedTodo || todo;
        });
      } else {
        // Original logic for direct todos reordering
        reorderedTodos = [...state.todos];
        const [draggedItem] = reorderedTodos.splice(action.payload.fromIndex, 1);
        reorderedTodos.splice(action.payload.toIndex, 0, draggedItem);
        
        // Update order values for all todos based on their new positions
        reorderedTodos = reorderedTodos.map((todo, index) => ({
          ...todo,
          order: index
        }));
      }
      
      // Apply the same filtering and sorting to the reordered todos
      let filtered = [...reorderedTodos];

      // Apply search filter
      if (state.searchTerm) {
        filtered = filtered.filter(todo =>
          todo.text.toLowerCase().includes(state.searchTerm.toLowerCase())
        );
      }

      // Apply status filter
      if (state.statusFilter !== 'all') {
        filtered = filtered.filter(todo => {
          if (state.statusFilter === 'completed') return todo.completed;
          if (state.statusFilter === 'incomplete') return !todo.completed;
          return true;
        });
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (state.sortBy) {
          case 'dueDate':
            aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
            bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
            break;
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

        if (state.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      return {
        ...state,
        todos: reorderedTodos,
        filteredTodos: filtered,
        dragIndex: null,
        dropIndex: null
      };
    
    case 'IMPORT_TODOS':
      return {
        ...state,
        todos: action.payload,
        filteredTodos: action.payload
      };
    
    case 'SET_FILTERED_TODOS':
      return {
        ...state,
        filteredTodos: action.payload
      };
    
    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload
      };
    
    default:
      return state;
  }
};

export const TodoProvider = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  // Filter and sort todos
  useEffect(() => {
    let filtered = [...state.todos];

    // Apply search filter
    if (state.searchTerm) {
      filtered = filtered.filter(todo =>
        todo.text.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (state.statusFilter !== 'all') {
      filtered = filtered.filter(todo => {
        if (state.statusFilter === 'completed') return todo.completed;
        if (state.statusFilter === 'incomplete') return !todo.completed;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (state.sortBy) {
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
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

      if (state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    dispatch({ type: 'SET_FILTERED_TODOS', payload: filtered });
  }, [state.todos, state.searchTerm, state.statusFilter, state.sortBy, state.sortOrder]);

  // Action creators
  const addTodo = (todo) => {
    dispatch({ type: 'ADD_TODO', payload: todo });
  };

  const updateTodo = (id, updates) => {
    dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
  };

  const deleteTodo = (id) => {
    dispatch({ type: 'DELETE_TODO', payload: id });
  };

  const toggleTodo = (id) => {
    dispatch({ type: 'TOGGLE_TODO', payload: id });
  };

  const duplicateTodo = (id) => {
    dispatch({ type: 'DUPLICATE_TODO', payload: id });
  };

  const setEditingTask = (taskId) => {
    dispatch({ type: 'SET_EDITING_TASK', payload: taskId });
  };

  const cancelEditing = () => {
    dispatch({ type: 'CANCEL_EDITING' });
  };

  const setAdding = (isAdding) => {
    dispatch({ type: 'SET_ADDING', payload: isAdding });
  };

  const setView = (view) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const value = {
    ...state,
    dispatch,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    duplicateTodo,
    setEditingTask,
    cancelEditing,
    setAdding,
    setView
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
}; 
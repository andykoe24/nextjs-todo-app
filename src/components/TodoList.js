'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TodoItem from './TodoItem';
import ListTodoItem from './ListTodoItem';
import TodoForm from './TodoForm';
import { useTodo } from '../context/TodoContext';
import { categories } from '../context/TodoContext';
import { Plus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useTodos, formatDueDate } from '../hooks/useTodos';

// Sortable Task Item wrapper
const SortableTodoItem = ({ task, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ListTodoItem 
        task={task} 
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  );
};

const TodoList = () => {
  const { 
    todos,
    filteredTodos, 
    dragIndex, 
    dropIndex,
    editingTaskId,
    isAdding,
    dispatch,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    duplicateTodo,
    setEditingTask,
    cancelEditing,
    setAdding
  } = useTodo();

  const [activeId, setActiveId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [appliedCategories, setAppliedCategories] = useState([]);
  const [appliedPriorities, setAppliedPriorities] = useState([]);
  const applyClickedRef = useRef(false);

  // Reset filter selections when dropdown closes (only if not applied)
  useEffect(() => {
    if (!filterDropdownOpen && !applyClickedRef.current) {
      setSelectedCategories(appliedCategories);
      setSelectedPriorities(appliedPriorities);
    }
    if (!filterDropdownOpen) {
      applyClickedRef.current = false;
    }
  }, [filterDropdownOpen]);

  // Use the new hook for derived todos
  const { currentTasks, totalItems, totalPages, startIndex, endIndex } = useTodos({
    todos: filteredTodos,
    searchTerm: debouncedSearch,
    statusFilter: 'all', // Already filtered in context
    sortBy,
    sortOrder: 'asc',
    currentPage,
    itemsPerPage
  });

  // Filter tasks by category/priority after search and before sort
  const filteredByQuickFilter = currentTasks.filter(task => {
    const catOk = appliedCategories.length === 0 || appliedCategories.includes(task.category);
    const priOk = appliedPriorities.length === 0 || appliedPriorities.includes(task.priority);
    return catOk && priOk;
  });

  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTodos.length, sortBy]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortDropdown && !event.target.closest('.sort-dropdown')) {
        setShowSortDropdown(false);
      }
      if (showPerPageDropdown && !event.target.closest('.per-page-dropdown')) {
        setShowPerPageDropdown(false);
      }
      if (filterDropdownOpen && !event.target.closest('.quick-filter-dropdown')) {
        setFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortDropdown, showPerPageDropdown, filterDropdownOpen]);

  // Per page options
  const perPageOptions = [10, 25, 50, 100];

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = filteredTodos.findIndex((item) => item.id === active.id);
      const newIndex = filteredTodos.findIndex((item) => item.id === over.id);

      dispatch({
        type: 'REORDER_TODOS',
        payload: { fromIndex: oldIndex, toIndex: newIndex, useFiltered: true }
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleToggleTask = (taskId) => {
    toggleTodo(taskId);
  };

  const handleStartEdit = (task) => {
    setEditingTask(task.id);
  };

  const handleSaveEdit = (taskId, updates) => {
    updateTodo(taskId, updates);
    cancelEditing();
  };

  const handleCancelEdit = () => {
    cancelEditing();
  };

  const handleAddTask = (newTask) => {
    addTodo(newTask);
    setAdding(false);
  };

  const handleCancelAdd = () => {
    setAdding(false);
  };

  const handleStartAdd = () => {
    setAdding(true);
  };

  const handleDeleteTask = (taskId) => {
    deleteTodo(taskId);
  };

  const handleDuplicateTask = (taskId) => {
    duplicateTodo(taskId);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setShowSortDropdown(false);
  };

  const handlePerPageChange = (newPerPage) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setShowPerPageDropdown(false);
  };

  const activeTask = activeId ? todos.find(task => task.id === activeId) : null;
  const editingTask = editingTaskId ? todos.find(task => task.id === editingTaskId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="h-full w-full flex flex-col">
      {/* Fixed Pagination Header */}
      <div className="flex items-center justify-between p-4 pt-16 pb-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        {/* Left side - Page info */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {totalItems > 0 ? `${startIndex + 1} - ${Math.min(endIndex, totalItems)} of ${totalItems}` : '0 of 0'}
          </span>
          
          {/* Per page dropdown */}
          <div className="relative per-page-dropdown">
            <button
              onClick={() => setShowPerPageDropdown(!showPerPageDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span>{itemsPerPage}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Per page dropdown */}
            {showPerPageDropdown && (
              <div className="absolute left-0 top-full mt-1 w-16 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {perPageOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handlePerPageChange(option)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${itemsPerPage === option ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right side - Filter and Sort dropdowns */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Filter Button */}
          <div className="relative quick-filter-dropdown">
            <button
              onClick={() => setFilterDropdownOpen(v => !v)}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-2-1A1 1 0 019 18v-4.586a1 1 0 00-.293-.707L2.293 6.707A1 1 0 012 6V4z" /></svg>
              Filter
            </button>
            {filterDropdownOpen && (
              <div className="absolute left-0 mt-2 w-46 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4">
                <div className="mb-3">
                  <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">Category</div>
                  {Object.keys(categories).map(cat => (
                    <label key={cat} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={e => setSelectedCategories(
                          e.target.checked
                            ? [...selectedCategories, cat]
                            : selectedCategories.filter(c => c !== cat)
                        )}
                        className="accent-blue-500"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
                <div className="mb-3">
                  <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-1">Priority</div>
                  {['high', 'medium', 'low'].map(pri => (
                    <label key={pri} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPriorities.includes(pri)}
                        onChange={e => setSelectedPriorities(
                          e.target.checked
                            ? [...selectedPriorities, pri]
                            : selectedPriorities.filter(p => p !== pri)
                        )}
                        className="accent-blue-500"
                      />
                      <span className={
                        pri === 'high' ? 'text-red-500' : pri === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                      }>{pri.charAt(0).toUpperCase() + pri.slice(1)}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => {
                      applyClickedRef.current = true;
                      setAppliedCategories(selectedCategories);
                      setAppliedPriorities(selectedPriorities);
                      setFilterDropdownOpen(false);
                    }}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setFilterDropdownOpen(false)}
                    className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Sort dropdown */}
          <div className="relative sort-dropdown">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span>Sort by: {sortBy === 'default' ? 'Default' : 
                sortBy === 'priority-high' ? 'Priority (desc)' :
                sortBy === 'priority-low' ? 'Priority (asc)' :
                sortBy === 'dueDate-newest' ? 'Date (desc)' :
                sortBy === 'dueDate-oldest' ? 'Date (asc)' : 'Default'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Sort dropdown */}
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleSortChange('default')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${sortBy === 'default' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => handleSortChange('priority-high')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${sortBy === 'priority-high' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    Priority (desc)
                  </button>
                  <button
                    onClick={() => handleSortChange('priority-low')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${sortBy === 'priority-low' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    Priority (asc)
                  </button>
                  <button
                    onClick={() => handleSortChange('dueDate-newest')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${sortBy === 'dueDate-newest' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    Date (desc)
                  </button>
                  <button
                    onClick={() => handleSortChange('dueDate-oldest')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${sortBy === 'dueDate-oldest' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    Date (asc)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Search Bar */}
      <div className="p-4 pb-0 relative">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search tasks..."
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-blue-500 text-xs">
            <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Searching...
          </div>
        )}
      </div>

      {/* Scrollable Task List Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="space-y-3">
              {filteredByQuickFilter.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by adding your first task</p>
                    {isAdding ? (
                      <TodoForm 
                        mode="add"
                        onSave={handleAddTask} 
                        onCancel={handleCancelAdd} 
                      />
                    ) : (
                      <button
                        onClick={handleStartAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add your first task
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <SortableContext items={filteredByQuickFilter.map(task => task.id)} strategy={verticalListSortingStrategy}>
                  {filteredByQuickFilter.map((task) => (
                    <div key={task.id}>
                      <SortableTodoItem
                        task={task}
                        onToggle={handleToggleTask}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteTask}
                        onDuplicate={handleDuplicateTask}
                      />
                      
                      {/* Show EditTodo inline below the task being edited */}
                      {editingTaskId === task.id && editingTask && (
                        <div className="mt-3">
                          <TodoForm 
                            mode="edit"
                            task={editingTask}
                            onSave={handleSaveEdit}
                            onCancel={handleCancelEdit}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </SortableContext>
              )}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="opacity-80">
                  <ListTodoItem
                    task={activeTask}
                    onToggle={handleToggleTask}
                    onEdit={handleStartEdit}
                    onDelete={handleDeleteTask}
                    onDuplicate={handleDuplicateTask}
                    isDragging={true}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Global Add Task Form - for sidebar "Add New Task" button */}
      {isAdding && (
        <TodoForm 
          mode="add"
          onSave={handleAddTask} 
          onCancel={handleCancelAdd} 
        />
      )}
    </div>
  );
};

export default TodoList; 
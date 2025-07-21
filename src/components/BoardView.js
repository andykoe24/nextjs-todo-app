'use client';

import { useState, useRef, useEffect } from 'react';
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
import BoardTodoItem from './BoardTodoItem';
import TodoForm from './TodoForm';
import { useTodo } from '../context/TodoContext';
import { Plus } from 'lucide-react';
import { categories } from '../context/TodoContext';

// Sortable Task Item wrapper for board
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
      <BoardTodoItem 
        task={task} 
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  );
};

const BoardView = () => {
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

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const allCategories = Object.keys(categories);
  const allPriorities = ['high', 'medium', 'low'];
  const [selectedCategories, setSelectedCategories] = useState(allCategories);
  const [selectedPriorities, setSelectedPriorities] = useState(allPriorities);
  const [appliedCategories, setAppliedCategories] = useState(allCategories);
  const [appliedPriorities, setAppliedPriorities] = useState(allPriorities);
  const applyClickedRef = useRef(false);
  const categoryDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const allStatuses = ['complete', 'incomplete'];
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(allStatuses);
  const [appliedStatuses, setAppliedStatuses] = useState(allStatuses);
  const statusDropdownRef = useRef(null);

  // Debounce search
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset filter selections when dropdown closes (only if not applied)
  useEffect(() => {
    if (!categoryDropdownOpen) {
      setSelectedCategories(appliedCategories);
    }
    if (!priorityDropdownOpen) {
      setSelectedPriorities(appliedPriorities);
    }
    if (!statusDropdownOpen) {
      setSelectedStatuses(appliedStatuses);
    }
  }, [categoryDropdownOpen, priorityDropdownOpen, statusDropdownOpen, appliedCategories, appliedPriorities, appliedStatuses]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setPriorityDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tasks by search, category, and priority
  const filteredBoardTodos = filteredTodos.filter(task => {
    const matchesSearch = !debouncedSearch || task.text.toLowerCase().includes(debouncedSearch.toLowerCase());
    const catOk = appliedCategories.length === 0 || appliedCategories.includes(task.category);
    const priOk = appliedPriorities.length === 0 || appliedPriorities.includes(task.priority);
    const statusOk = appliedStatuses.length === 0 ||
      (appliedStatuses.includes('complete') && task.completed) ||
      (appliedStatuses.includes('incomplete') && !task.completed);
    return matchesSearch && catOk && priOk && statusOk;
  });

  // Group tasks by category (filtered)
  const groupedTasks = {};
  Object.keys(categories).forEach(category => {
    groupedTasks[category] = filteredBoardTodos.filter(task => task.category === category);
  });
  groupedTasks['Uncategorized'] = filteredBoardTodos.filter(task => !task.category);

  const [activeId, setActiveId] = useState(null);
  const [addingToCategory, setAddingToCategory] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

    setActiveId(null);
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
    setAddingToCategory(null);
  };

  const handleCancelAdd = () => {
    setAdding(false);
    setAddingToCategory(null);
  };

  const handleStartAdd = (category = null) => {
    setAdding(true);
    setAddingToCategory(category);
  };

  const handleDeleteTask = (taskId) => {
    deleteTodo(taskId);
  };

  const handleDuplicateTask = (taskId) => {
    duplicateTodo(taskId);
  };

  const activeTask = activeId ? todos.find(task => task.id === activeId) : null;
  const editingTask = editingTaskId ? todos.find(task => task.id === editingTaskId) : null;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Search & Filter Bar */}
      <div className="shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-16">
        <div className="flex flex-col md:flex-row gap-2 items-center">
          {/* Search */}
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
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
          {/* Category Dropdown */}
          <div className="relative w-56" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(v => !v)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">Category</span>
                {appliedCategories.length > 0 && (
                  <span className="ml-2 text-xs text-blue-500">({appliedCategories.length})</span>
                )}
              </div>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {categoryDropdownOpen && (
              <div className="absolute left-0 mt-2 w-42 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4">
                <div className="mb-3">
                  {Object.keys(categories).map(cat => (
                    <label key={cat} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={e => {
                          let newSelected;
                          if (e.target.checked) {
                            newSelected = [...selectedCategories, cat];
                          } else {
                            newSelected = selectedCategories.filter(c => c !== cat);
                          }
                          setSelectedCategories(newSelected);
                          setAppliedCategories(newSelected);
                        }}
                        className="accent-blue-500"
                      />
                      <div className={`w-3 h-3 rounded-full ${categories[cat].color}`}></div>
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Priority Dropdown */}
          <div className="relative w-48" ref={priorityDropdownRef}>
            <button
              type="button"
              onClick={() => setPriorityDropdownOpen(v => !v)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">Priority</span>
                {appliedPriorities.length > 0 && (
                  <span className="ml-2 text-xs text-blue-500">({appliedPriorities.length})</span>
                )}
              </div>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {priorityDropdownOpen && (
              <div className="absolute left-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4">
                <div className="mb-3">
                  {['high', 'medium', 'low'].map(pri => (
                    <label key={pri} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPriorities.includes(pri)}
                        onChange={e => {
                          let newSelected;
                          if (e.target.checked) {
                            newSelected = [...selectedPriorities, pri];
                          } else {
                            newSelected = selectedPriorities.filter(p => p !== pri);
                          }
                          setSelectedPriorities(newSelected);
                          setAppliedPriorities(newSelected);
                        }}
                        className="accent-blue-500"
                      />
                      <div className={`w-3 h-3 rounded-full ${
                        pri === 'high' ? 'bg-red-500' : pri === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className={
                        pri === 'high' ? 'text-red-500' : pri === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                      }>{pri.charAt(0).toUpperCase() + pri.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Status Dropdown */}
          <div className="relative w-36" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setStatusDropdownOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full justify-between"
            >
              <span>Status</span>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {statusDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4">
                {allStatuses.map(status => (
                  <label key={status} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={e => {
                        let newSelected;
                        if (e.target.checked) {
                          newSelected = [...selectedStatuses, status];
                        } else {
                          newSelected = selectedStatuses.filter(s => s !== status);
                        }
                        setSelectedStatuses(newSelected);
                        setAppliedStatuses(newSelected);
                      }}
                      className="accent-blue-500"
                    />
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Board View - Full height with horizontal scroll */}
      <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 h-full p-4" style={{ minWidth: 'max-content' }}>
            {[...Object.keys(categories), 'Uncategorized'].filter(cat => appliedCategories.includes(cat)).map((category) => {
              const categoryTasks = filteredBoardTodos.filter(task => 
                category === 'Uncategorized' 
                  ? (!task.category || task.category === '') 
                  : task.category === category
              );
              return (
                <div key={category} className="w-96 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                  {/* Kanban Column Header with Accent Bar */}
                  <div className="flex items-center justify-between mb-2 flex-shrink-0 px-4 pt-4 relative">
                    <div className={`absolute left-0 top-0 h-2 w-full rounded-t-xl ${categories[category]?.color || 'bg-gray-400'}`}></div>
                    <div className="flex items-center gap-2 z-10">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{category}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">({categoryTasks.length})</span>
                    </div>
                    {/* Add Task Button for this category */}
                    <button
                      onClick={() => handleStartAdd(category === 'Uncategorized' ? '' : category)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors z-10"
                      title={`Add task to ${category}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Task Cards */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-3 p-3">
                      {categoryTasks.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <div className="text-gray-300 dark:text-gray-600 mb-2">
                            <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No tasks</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add a task to get started</p>
                        </div>
                      ) : (
                        <SortableContext items={categoryTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                          {categoryTasks.map((task) => (
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
                  </div>

                  {/* Add Task Form for this category */}
                  {isAdding && addingToCategory === (category === 'Uncategorized' ? '' : category) && (
                    <div className="mt-4 flex-shrink-0">
                      <TodoForm 
                        mode="add"
                        onSave={handleAddTask} 
                        onCancel={handleCancelAdd}
                        defaultCategory={category === 'Uncategorized' ? '' : category}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-80">
                <BoardTodoItem
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

      {/* Global Add Task Form - for sidebar "Add New Task" button */}
      {isAdding && !addingToCategory && (
        <TodoForm 
          mode="add"
          onSave={handleAddTask} 
          onCancel={handleCancelAdd} 
        />
      )}
    </div>
  );
};

export default BoardView; 
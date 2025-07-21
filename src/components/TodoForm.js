'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, Tag, Flag, X } from 'lucide-react';
import { categories } from '../context/TodoContext';

const TodoForm = ({ 
  task = null, 
  onSave, 
  onCancel, 
  defaultCategory = '',
  mode = 'add' // 'add' or 'edit'
}) => {
  const [title, setTitle] = useState(task?.text || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [dueTime, setDueTime] = useState(task?.dueTime || '');
  const [category, setCategory] = useState(task?.category || defaultCategory);
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const inputRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const modalRef = useRef(null);

  const priorityOptions = [
    { value: 'high', color: 'bg-red-500', label: 'High Priority' },
    { value: 'medium', color: 'bg-orange-500', label: 'Medium Priority' },
    { value: 'low', color: 'bg-yellow-500', label: 'Low Priority' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      const taskData = {
        text: title.trim(),
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        category: category || null,
        priority: priority || null
      };

      if (mode === 'edit' && task) {
        onSave(task.id, taskData);
      } else {
        onSave(taskData);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleDateChange = (e) => {
    setDueDate(e.target.value);
  };

  const handleTimeChange = (e) => {
    setDueTime(e.target.value);
  };

  const handleCategoryRemove = (e) => {
    e.stopPropagation();
    setCategory('');
  };

  const handlePriorityRemove = (e) => {
    e.stopPropagation();
    setPriority('');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setShowPriorityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (mode === 'edit') {
        inputRef.current.select();
      }
    }
  }, [mode]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title Input */}
          <div>
            <label htmlFor="task-title" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title
            </label>
            <input
              ref={inputRef}
              type="text"
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter task title..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="due-date" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              id="due-date"
              value={dueDate || ''}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Due Time */}
          <div>
            <label htmlFor="due-time" className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Time (Optional)
            </label>
            <input
              type="time"
              id="due-time"
              value={dueTime || ''}
              onChange={handleTimeChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  {category ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${categories[category]?.color || 'bg-gray-400'}`}></div>
                      <span>{category}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Select category</span>
                  )}
                </div>
                {category && (
                  <X 
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" 
                    onClick={handleCategoryRemove} 
                  />
                )}
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-1 z-10">
                  {Object.keys(categories).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <div className={`w-3 h-3 rounded-full ${categories[cat].color}`}></div>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <div className="relative" ref={priorityDropdownRef}>
              <button
                type="button"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-gray-400" />
                  {priority ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${priorityOptions.find(p => p.value === priority)?.color || 'bg-gray-400'}`}></div>
                      <span>{priorityOptions.find(p => p.value === priority)?.label || priority}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Select priority</span>
                  )}
                </div>
                {priority && (
                  <X 
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" 
                    onClick={handlePriorityRemove} 
                  />
                )}
              </button>
              
              {showPriorityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-1 z-10">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setPriority(option.value);
                        setShowPriorityDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {mode === 'edit' ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoForm; 
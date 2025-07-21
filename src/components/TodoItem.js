'use client';

import { useState, useRef, useEffect } from 'react';
import { GripVertical, Edit, Trash2, Check } from 'lucide-react';
import { categories } from '../context/TodoContext';
import { formatDueDate } from '../hooks/useTodos';

const TodoItem = ({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete, 
  onDuplicate,
  isDragging = false,
  dragHandleProps = {}
}) => {
  const [isDragReady, setIsDragReady] = useState(false);
  const dragTimeoutRef = useRef(null);

  const priorityDots = {
    p1: 'bg-red-500',
    p2: 'bg-orange-500',
    p3: 'bg-yellow-500', 
    p4: 'bg-gray-400'
  };

  const priorityLabels = {
    p1: 'Priority 1',
    p2: 'Priority 2', 
    p3: 'Priority 3',
    p4: 'Priority 4'
  };

  // Remove the local formatDueDate function and use the imported one.

  const dueDateInfo = formatDueDate(task.dueDate, task.dueTime);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  // Handle drag start with delay
  const handleMouseDown = (e) => {
    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }

    // Set timeout for 1 second
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragReady(true);
    }, 1000);
  };

  const handleMouseUp = () => {
    // Clear timeout and reset drag ready state
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
    setIsDragReady(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`
      relative group p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200
      ${isDragging ? 'opacity-50 scale-95' : ''}
      ${task.completed ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
    `}>
      {/* Checkbox - Outside Draggable Area */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`
          absolute left-3 top-1/2 transform -translate-y-1/2 rounded-full border-2 w-5 h-5 flex items-center justify-center
          transition-all duration-200 hover:scale-110 z-20
          ${task.completed 
            ? 'bg-blue-500 border-blue-500' 
            : 'border-gray-400 hover:border-blue-400'
          }
        `}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && (
          <Check className="h-3 w-3 text-white" />
        )}
      </button>

      {/* Draggable Area */}
      <div 
        {...dragHandleProps}
        className={`flex items-start gap-2 cursor-grab active:cursor-grabbing transition-all duration-200 ${isDragReady ? 'cursor-grabbing' : ''} pl-8`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          <button
            onClick={() => onEdit(task)}
            className={`
              w-full text-left text-sm font-medium transition-colors duration-200
              hover:text-blue-600 dark:hover:text-blue-400
              line-clamp-2 overflow-hidden
              ${task.completed 
                ? 'line-through text-gray-500 dark:text-gray-400' 
                : 'text-gray-900 dark:text-white'
              }
            `}
          >
            {task.text}
          </button>

          {/* Metadata Row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {dueDateInfo && (
              <span className={`text-xs font-medium ${dueDateInfo.color}`}>
                {dueDateInfo.text}
              </span>
            )}
            
            {task.category && (
              <span className={`
                inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full
                ${categories[task.category]?.textColor || 'text-gray-700'} 
                ${categories[task.category]?.borderColor || 'border-gray-300'} 
                border bg-white dark:bg-gray-700
              `}>
                <div className={`w-2 h-2 rounded-full ${categories[task.category]?.color || 'bg-gray-400'}`}></div>
                {task.category}
              </span>
            )}

            {/* Priority Display */}
            {task.priority && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                <div className={`w-2 h-2 rounded-full ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-orange-500' :
                  task.priority === 'low' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
                {task.priority}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons - Floating Overlay */}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <div className="bg-gradient-to-b from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-sm rounded-lg p-1 shadow-lg">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Edit task"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoItem; 
'use client';
// CalendarView.js
// Additional recommended plugins for future features: @fullcalendar/timegrid, @fullcalendar/list

import React, { useMemo, useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useTodo } from '../context/TodoContext';
import { categories } from '../context/TodoContext';
import TodoForm from './TodoForm';

const CalendarView = () => {
  const {
    todos,
    filteredTodos,
    dispatch,
    isAdding,
    setAdding,
    addTodo,
    updateTodo
  } = useTodo();

  // --- Filter Bar State (copied from BoardView) ---
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

  // --- Filtering Logic ---
  const visibleTodos = useMemo(() => {
    return filteredTodos.filter(task => {
      const matchesSearch = !debouncedSearch || task.text.toLowerCase().includes(debouncedSearch.toLowerCase());
      const catOk = appliedCategories.length === 0 || appliedCategories.includes(task.category);
      const priOk = appliedPriorities.length === 0 || appliedPriorities.includes(task.priority);
      const statusOk = appliedStatuses.length === 0 ||
        (appliedStatuses.includes('complete') && task.completed) ||
        (appliedStatuses.includes('incomplete') && !task.completed);
      return matchesSearch && catOk && priOk && statusOk;
    });
  }, [filteredTodos, debouncedSearch, appliedCategories, appliedPriorities, appliedStatuses]);

  // Map todos to FullCalendar events
  const events = useMemo(() => {
    return visibleTodos.map(task => {
      let start = task.dueDate;
      let allDay = true;
      let isoDueDateTime = task.dueDate || '';
      if (task.dueDate && task.dueTime) {
        start = `${task.dueDate}T${task.dueTime}`;
        allDay = false;
        isoDueDateTime = start;
      }
      const catColor = categories[task.category]?.hex || '#3b82f6';
      return {
        id: task.id,
        title: task.text,
        start: start || task.createdAt,
        end: start || task.createdAt,
        allDay,
        isoDueDateTime,
        backgroundColor: catColor,
        borderColor: catColor,
        textColor: '#fff',
        extendedProps: {
          completed: task.completed,
          category: task.category,
          priority: task.priority,
        },
      };
    });
  }, [visibleTodos]);

  // Calendar container ref for scroll control
  const calendarContainerRef = useRef(null);

  // Optional: Focus calendar on mount
  useEffect(() => {
    if (calendarContainerRef.current) {
      calendarContainerRef.current.focus();
    }
  }, []);

  // Add Task handlers for modal
  const handleAddTask = (newTask) => {
    addTodo(newTask);
    setAdding(false);
  };
  const handleCancelAdd = () => {
    setAdding(false);
  };

  // Handler for drag & drop and resize
  const handleEventChange = (changeInfo) => {
    const { event } = changeInfo;
    const todoId = event.id;
    const start = event.start;
    let dueDate = null;
    let dueTime = null;
    if (start) {
      const yyyy = start.getFullYear();
      const mm = String(start.getMonth() + 1).padStart(2, '0');
      const dd = String(start.getDate()).padStart(2, '0');
      dueDate = `${yyyy}-${mm}-${dd}`;
    }
    if (event.allDay) {
      dueTime = null;
    } else {
      dueTime = start ? start.toTimeString().slice(0, 5) : null;
    }
    updateTodo(todoId, { dueDate, dueTime });
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Filter Bar (copied from BoardView) */}
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
      {/* Add Task Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-auto">
            <TodoForm
              mode="add"
              onSave={handleAddTask}
              onCancel={handleCancelAdd}
            />
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <div
          ref={calendarContainerRef}
          className="h-full w-full overflow-y-auto bg-white dark:bg-gray-900 p-4"
          tabIndex={-1}
        >
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            views={{
              dayGridMonth: { buttonText: 'Month' },
              timeGridWeek: { buttonText: 'Week' }
            }}
            height="auto"
            events={events}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            eventDisplay="block"
            eventContent={renderEventContent}
            dayMaxEventRows={3}
            fixedWeekCount={false}
            aspectRatio={1.5}
            editable={true}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
            // Add more FullCalendar props as needed
          />
        </div>
      </div>
    </div>
  );
};

// Custom event rendering for a clean look
function renderEventContent(eventInfo) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium"
      style={{ backgroundColor: eventInfo.event.backgroundColor || '#3b82f6', color: '#fff' }}
    >
      <span>{eventInfo.event.title}</span>
      {eventInfo.event.extendedProps.completed && (
        <span className="ml-1 text-green-200">✓</span>
      )}
    </div>
  );
}

export default CalendarView; 
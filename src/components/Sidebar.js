'use client';

import { useState, useRef } from 'react';
import { List, Grid3X3, X, Upload, Download, FileText, PlusCircle } from 'lucide-react';
import { useTodo } from '../context/TodoContext';

const Sidebar = ({ onClose }) => {
  const { todos, currentView, setView, dispatch, addTodo, setAdding } = useTodo();
  const fileInputRef = useRef(null);

  const menuItems = [
    {
      id: 'list',
      label: 'List',
      icon: List,
      description: 'View all tasks in a list'
    },
    {
      id: 'board',
      label: 'Board',
      icon: Grid3X3,
      description: 'View tasks by category'
    }
  ];

  const exportToCSV = () => {
    if (todos.length === 0) {
      alert('No tasks to export!');
      return;
    }

    const headers = ['Task', 'Status', 'Category', 'Priority', 'Due Date', 'Due Time', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...todos.map(todo => [
        `"${todo.text.replace(/"/g, '""')}"`,
        todo.completed ? 'Completed' : 'Incomplete',
        todo.category || 'Uncategorized',
        todo.priority || 'Medium',
        todo.dueDate || 'No due date',
        todo.dueTime || 'No due time',
        new Date(todo.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Task', 'Status', 'Category', 'Priority', 'Due Date', 'Due Time', 'Created At'],
      ['Complete project documentation', 'Incomplete', 'Work', 'High', '2024-01-15', '14:30', '2024-01-01'],
      ['Buy groceries', 'Completed', 'Shopping', 'Medium', '2024-01-10', '', '2024-01-01'],
      ['Exercise', 'Incomplete', 'Health', 'Low', '2024-01-12', '18:00', '2024-01-01'],
      ['Review quarterly reports', 'Incomplete', 'Work', 'High', '2024-01-20', '09:00', '2024-01-01'],
      ['Call dentist', 'Incomplete', 'Health', 'Medium', '2024-01-25', '', '2024-01-01']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-tasks.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionItems = [
    {
      id: 'import',
      label: 'Import',
      icon: Upload,
      description: 'Import tasks from CSV file',
      action: () => fileInputRef.current?.click()
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      description: `Export ${todos.length} tasks to CSV`,
      action: exportToCSV,
      disabled: todos.length === 0
    },
    {
      id: 'sample',
      label: 'Download Sample',
      icon: FileText,
      description: 'Get sample CSV template',
      action: downloadSampleCSV
    }
  ];

  const handleViewChange = (viewId) => {
    setView(viewId);
    // Close sidebar on mobile after view change
    if (onClose) {
      onClose();
    }
  };

  const importFromCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        
        const importedTodos = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const todo = {
              id: Date.now().toString() + i,
              text: values[0] || 'Imported task',
              completed: values[1]?.toLowerCase() === 'completed',
              category: values[2] && values[2] !== 'Uncategorized' ? values[2] : null,
              priority: values[3] && values[3] !== 'Medium' ? values[3].toLowerCase() : 'medium',
              dueDate: values[4] && values[4] !== 'No due date' ? values[4] : null,
              dueTime: values[5] && values[5] !== 'No due time' ? values[5] : null,
              createdAt: new Date().toISOString(),
              order: todos.length + i
            };
            importedTodos.push(todo);
          }
        }

        if (importedTodos.length > 0) {
          const confirmImport = confirm(
            `Import ${importedTodos.length} tasks? This will add them to your existing tasks.`
          );
          
          if (confirmImport) {
            dispatch({
              type: 'IMPORT_TODOS',
              payload: [...todos, ...importedTodos]
            });
            alert(`Successfully imported ${importedTodos.length} tasks!`);
          }
        } else {
          alert('No valid tasks found in the file.');
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing the CSV file. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tasks</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Organize your work</p>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          {/* Add New Task Button - Primary Style */}
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            <PlusCircle className="h-5 w-5" />
            <div className="flex-1">
              <div className="font-medium">Add New</div>
              <div className="text-xs text-blue-500 dark:text-blue-400">Create a new task</div>
            </div>
          </button>

          {/* Other Quick Actions */}
          {actionItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={item.action}
                disabled={item.disabled}
                className={`
                  group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200
                  ${item.disabled 
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300'
                  }
                `}
              >
                <Icon className={`h-5 w-5 transition-colors duration-200 ${item.disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Todo App v1.0
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={importFromCSV}
        className="hidden"
      />
    </div>
  );
};

export default Sidebar;
'use client';

import { useState } from 'react';
import TodoList from '../components/TodoList';
import BoardView from '../components/BoardView';
import CalendarView from '../components/CalendarView';
import Sidebar from '../components/Sidebar';
import { TodoProvider, useTodo } from '../context/TodoContext';
import { Menu, X } from 'lucide-react';

const MainContent = () => {
  const { currentView } = useTodo();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar - Never moves */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area - Offset by sidebar width */}
      <div className="lg:ml-64 flex flex-col h-screen">
        {/* Fixed Header - Never moves */}
        <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-3 flex-shrink-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentView === 'list' ? 'Task List' : currentView === 'board' ? 'Task Board' : currentView === 'calendar' ? 'Calendar' : ''}
            </h1>
            <div className="w-10 lg:hidden" /> {/* Spacer for centering on mobile */}
          </div>
        </header>

        {/* Main Content Area - Takes remaining space */}
        <main className="flex-1 overflow-hidden mt-2">
          {currentView === 'list' ? <TodoList /> : currentView === 'board' ? <BoardView /> : currentView === 'calendar' ? <CalendarView /> : null}
        </main>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <TodoProvider>
      <MainContent />
    </TodoProvider>
  );
}

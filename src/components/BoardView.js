'use client';

import { useState } from 'react';
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

  const [activeId, setActiveId] = useState(null);
  const [addingToCategory, setAddingToCategory] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by category
  const groupedTasks = {};
  Object.keys(categories).forEach(category => {
    groupedTasks[category] = filteredTodos.filter(task => task.category === category);
  });
  
  // Add uncategorized tasks
  groupedTasks['Uncategorized'] = filteredTodos.filter(task => !task.category);

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
        <input type="text" placeholder="Search tasks..." className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        {/* Add filter controls here if needed */}
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
            {Object.keys(categories).map((category) => {
              const categoryTasks = filteredTodos.filter(task => 
                category === 'Uncategorized' 
                  ? (!task.category || task.category === '') 
                  : task.category === category
              );
              
              return (
                <div key={category} className="w-96 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                  {/* Kanban Column Header with Accent Bar */}
                  <div className="flex items-center justify-between mb-2 flex-shrink-0 px-4 pt-4 relative">
                    <div className={`absolute left-0 top-0 h-2 w-full rounded-t-xl ${categories[category].color}`}></div>
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
'use client';

import TodoItem from './TodoItem';

const ListTodoItem = ({ task, ...props }) => {
  return (
    <div className="w-full">
      <TodoItem task={task} {...props} />
    </div>
  );
};

export default ListTodoItem; 
'use client';

import TodoItem from './TodoItem';

const BoardTodoItem = ({ task, ...props }) => {
  return (
    <div className="w-full">
      <TodoItem task={task} {...props} />
    </div>
  );
};

export default BoardTodoItem; 
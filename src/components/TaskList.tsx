"use client";

import { TaskCard } from "@/components/TaskCard";
import type { TaskModel as Task } from "@/generated/prisma/models";

export function TaskList({
  tasks,
  loading,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando tareas...</p>;
  }

  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay tareas por aquí. Crea una nueva para empezar.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task)}
          onToggleDone={() => onToggleDone(task)}
        />
      ))}
    </div>
  );
}

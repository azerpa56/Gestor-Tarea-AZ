"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { TaskList } from "@/components/TaskList";
import { TaskForm } from "@/components/TaskForm";
import type { TaskModel as Task } from "@/generated/prisma/models";

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error("No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    fetchTasks();
  }, [fetchTasks]);

  const datesWithTasks = useMemo(() => {
    const set = new Set<string>();
    for (const task of tasks) {
      if (task.dueDate) set.add(dateKey(new Date(task.dueDate)));
    }
    return set;
  }, [tasks]);

  const tasksForSelectedDate = useMemo(() => {
    const key = dateKey(selectedDate);
    return tasks.filter((task) => task.dueDate && dateKey(new Date(task.dueDate)) === key);
  }, [tasks, selectedDate]);

  function openNewTaskForSelectedDate() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  async function toggleDone(task: Task) {
    const status = task.status === "DONE" ? "PENDING" : "DONE";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      toast.error("No se pudo actualizar la tarea");
      fetchTasks();
    }
  }

  async function deleteTask(task: Task) {
    if (!confirm(`¿Eliminar "${task.title}"?`)) return;
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Tarea eliminada");
    } catch {
      toast.error("No se pudo eliminar la tarea");
    }
  }

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
        locale={es}
        modifiers={{ hasTask: (date) => datesWithTasks.has(dateKey(date)) }}
        modifiersClassNames={{
          hasTask:
            "relative after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary",
        }}
        className="mx-auto w-fit rounded-lg border"
      />

      <div className="flex items-center justify-between">
        <h2 className="font-medium">{format(selectedDate, "PPPP", { locale: es })}</h2>
        <Button onClick={openNewTaskForSelectedDate} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      <TaskList
        tasks={tasksForSelectedDate}
        loading={loading}
        onEdit={openEditTask}
        onDelete={deleteTask}
        onToggleDone={toggleDone}
      />

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        defaultDueDate={selectedDate}
        onSaved={fetchTasks}
      />
    </div>
  );
}

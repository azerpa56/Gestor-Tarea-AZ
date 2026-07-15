"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TaskList } from "@/components/TaskList";
import { TaskForm } from "@/components/TaskForm";
import type { Category } from "@/generated/prisma/enums";
import type { TaskModel as Task } from "@/generated/prisma/models";

const CATEGORY_TABS: { value: Category | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "UNIVERSIDAD", label: "Universidad" },
  { value: "TRABAJO", label: "Trabajo" },
  { value: "OTROS", label: "Otros" },
];

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "ALL") params.set("category", category);
      if (urgentOnly) params.set("urgent", "true");

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error("No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, [category, urgentOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial + refetch on filter change
    fetchTasks();
  }, [fetchTasks]);

  function openNewTask() {
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
      <div className="flex items-center justify-between gap-2">
        <Tabs value={category} onValueChange={(v) => setCategory(v as Category | "ALL")}>
          <TabsList>
            {CATEGORY_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={openNewTask} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="urgent-only" checked={urgentOnly} onCheckedChange={setUrgentOnly} />
        <Label htmlFor="urgent-only" className="cursor-pointer text-sm">
          Solo urgentes
        </Label>
      </div>

      <TaskList
        tasks={tasks}
        loading={loading}
        onEdit={openEditTask}
        onDelete={deleteTask}
        onToggleDone={toggleDone}
      />

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        onSaved={fetchTasks}
      />
    </div>
  );
}

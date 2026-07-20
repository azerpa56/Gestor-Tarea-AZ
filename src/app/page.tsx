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
import type { TaskWithArea as Task } from "@/lib/types";
import type { AreaModel as Area } from "@/generated/prisma/models";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaId, setAreaId] = useState<string>("ALL");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetch("/api/areas")
      .then((res) => res.json())
      .then(setAreas)
      .catch(() => toast.error("No se pudieron cargar las áreas"));
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (areaId !== "ALL") params.set("areaId", areaId);
      if (urgentOnly) params.set("urgent", "true");

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error("No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, [areaId, urgentOnly]);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={areaId} onValueChange={(v) => v && setAreaId(v)} className="min-w-0">
          <TabsList className="max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="ALL">Todas</TabsTrigger>
            {areas.map((area) => (
              <TabsTrigger key={area.id} value={area.id} className="gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                {area.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={openNewTask} size="sm" className="gap-1.5 self-start sm:self-auto">
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

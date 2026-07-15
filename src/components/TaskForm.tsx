"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Mic, Sparkles, Square, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/lib/useVoiceInput";
import type { Category, Status } from "@/generated/prisma/enums";
import type { TaskModel as Task } from "@/generated/prisma/models";

const CATEGORY_LABELS: Record<Category, string> = {
  UNIVERSIDAD: "Universidad",
  TRABAJO: "Trabajo",
  OTROS: "Otros",
};

const STATUS_LABELS: Record<Status, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  DONE: "Hecha",
};

type TaskFormValues = {
  title: string;
  description: string;
  category: Category;
  urgent: boolean;
  dueDate: Date | undefined;
  tools: string[];
  status: Status;
};

const EMPTY_VALUES: TaskFormValues = {
  title: "",
  description: "",
  category: "OTROS",
  urgent: false,
  dueDate: undefined,
  tools: [],
  status: "PENDING",
};

function taskToValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    category: task.category,
    urgent: task.urgent,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    tools: task.tools,
    status: task.status,
  };
}

export function TaskForm({
  open,
  onOpenChange,
  task,
  defaultDueDate,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultDueDate?: Date;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<TaskFormValues>(EMPTY_VALUES);
  const [toolInput, setToolInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form state whenever the dialog opens for a task
      setValues(taskToValues(task));
    } else {
      setValues({ ...EMPTY_VALUES, dueDate: defaultDueDate });
    }
    setToolInput("");
  }, [open, task, defaultDueDate]);

  const { start, stop, listening, supported } = useVoiceInput((transcript) => {
    setValues((v) => ({
      ...v,
      description: v.description ? `${v.description} ${transcript}` : transcript,
    }));
  });

  async function runAiAutocomplete() {
    if (!values.description.trim()) {
      toast.error("Escribe o dicta una descripción primero");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: values.description }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const suggestion = await res.json();
      setValues((v) => ({
        ...v,
        title: v.title || suggestion.title || v.title,
        category: suggestion.category ?? v.category,
        urgent: suggestion.urgent ?? v.urgent,
        tools: suggestion.tools?.length ? suggestion.tools : v.tools,
        dueDate: suggestion.dueDate ? new Date(`${suggestion.dueDate}T00:00:00`) : v.dueDate,
      }));
      toast.success("Sugerencia de IA aplicada, revisa y ajusta si hace falta");
    } catch {
      toast.error("No se pudo obtener la sugerencia de IA");
    } finally {
      setAiLoading(false);
    }
  }

  function addTool() {
    const value = toolInput.trim();
    if (!value) return;
    setValues((v) => ({ ...v, tools: [...v.tools, value] }));
    setToolInput("");
  }

  function removeTool(index: number) {
    setValues((v) => ({ ...v, tools: v.tools.filter((_, i) => i !== index) }));
  }

  async function handleSubmit() {
    if (!values.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || null,
        category: values.category,
        urgent: values.urgent,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        tools: values.tools,
        status: values.status,
      };

      const res = await fetch(task ? `/api/tasks/${task.id}` : "/api/tasks", {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success(task ? "Tarea actualizada" : "Tarea creada");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("No se pudo guardar la tarea");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <div className="relative">
              <Textarea
                id="description"
                placeholder="Ej: Entregar informe de ventas para el jueves, es urgente, necesito el excel de gastos"
                value={values.description}
                onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
                rows={4}
              />
              {supported && (
                <Button
                  type="button"
                  size="icon"
                  variant={listening ? "destructive" : "secondary"}
                  className="absolute right-2 bottom-2"
                  onClick={() => (listening ? stop() : start())}
                  title={listening ? "Detener dictado" : "Dictar por voz"}
                >
                  {listening ? <Square className="size-4" /> : <Mic className="size-4" />}
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={runAiAutocomplete}
              disabled={aiLoading}
              className="gap-2"
            >
              {aiLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Autocompletar con IA
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              placeholder="Título corto de la tarea"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={values.category}
                onValueChange={(value: Category | null) =>
                  value && setValues((v) => ({ ...v, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={values.status}
                onValueChange={(value: Status | null) =>
                  value && setValues((v) => ({ ...v, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="urgent" className="cursor-pointer">
              Urgente
            </Label>
            <Switch
              id="urgent"
              checked={values.urgent}
              onCheckedChange={(checked) => setValues((v) => ({ ...v, urgent: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha límite</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !values.dueDate && "text-muted-foreground",
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 size-4" />
                {values.dueDate
                  ? format(values.dueDate, "PPP", { locale: es })
                  : "Sin fecha"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={values.dueDate}
                  onSelect={(date) => setValues((v) => ({ ...v, dueDate: date }))}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tools">Herramientas necesarias</Label>
            <div className="flex gap-2">
              <Input
                id="tools"
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTool();
                  }
                }}
                placeholder="Ej: laptop, calculadora"
              />
              <Button type="button" variant="secondary" onClick={addTool}>
                Añadir
              </Button>
            </div>
            {values.tools.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {values.tools.map((tool, i) => (
                  <Badge key={`${tool}-${i}`} variant="outline" className="gap-1">
                    {tool}
                    <button type="button" onClick={() => removeTool(i)} className="ml-1">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

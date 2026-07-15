"use client";

import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Pencil, Trash2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { cn } from "@/lib/utils";
import type { TaskModel as Task } from "@/generated/prisma/models";

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
}) {
  const done = task.status === "DONE";
  const overdue = task.dueDate && !done && isPast(new Date(task.dueDate));

  return (
    <Card className={cn(done && "opacity-60")}>
      <CardContent className="flex items-start justify-between gap-3 py-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-medium", done && "line-through")}>{task.title}</h3>
            {task.urgent && !done && <Badge variant="destructive">Urgente</Badge>}
            <CategoryBadge category={task.category} />
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {task.dueDate && (
              <span className={cn(overdue && "font-medium text-destructive")}>
                {format(new Date(task.dueDate), "PPP", { locale: es })}
              </span>
            )}
            {task.tools.length > 0 && <span>· Herramientas: {task.tools.join(", ")}</span>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            title={done ? "Marcar como pendiente" : "Marcar como hecha"}
            onClick={onToggleDone}
          >
            {done ? <Undo2 className="size-4" /> : <Check className="size-4" />}
          </Button>
          <Button size="icon" variant="ghost" title="Editar" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" title="Eliminar" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

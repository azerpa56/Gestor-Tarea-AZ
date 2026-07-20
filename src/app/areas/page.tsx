"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AreaModel } from "@/generated/prisma/models";

type AreaWithCount = AreaModel & { _count: { tasks: number } };

const DEFAULT_NEW_AREA_COLOR = "#6d5ef5";

export default function AreasPage() {
  const [areas, setAreas] = useState<AreaWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(DEFAULT_NEW_AREA_COLOR);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_NEW_AREA_COLOR);
  const [creating, setCreating] = useState(false);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/areas");
      const data = await res.json();
      setAreas(data);
    } catch {
      toast.error("No se pudieron cargar las áreas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    fetchAreas();
  }, [fetchAreas]);

  async function createArea() {
    if (!newName.trim()) {
      toast.error("Ponle un nombre al área");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (!res.ok) throw new Error("failed");
      setNewName("");
      setNewColor(DEFAULT_NEW_AREA_COLOR);
      toast.success("Área creada");
      fetchAreas();
    } catch {
      toast.error("No se pudo crear el área");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(area: AreaWithCount) {
    setEditingId(area.id);
    setEditName(area.name);
    setEditColor(area.color);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    try {
      const res = await fetch(`/api/areas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });
      if (!res.ok) throw new Error("failed");
      setEditingId(null);
      toast.success("Área actualizada");
      fetchAreas();
    } catch {
      toast.error("No se pudo actualizar el área");
    }
  }

  async function deleteArea(area: AreaWithCount) {
    if (!confirm(`¿Eliminar el área "${area.name}"?`)) return;
    try {
      const res = await fetch(`/api/areas/${area.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "No se pudo eliminar el área");
        return;
      }
      toast.success("Área eliminada");
      fetchAreas();
    } catch {
      toast.error("No se pudo eliminar el área");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Áreas</h1>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Cargando áreas...</p>
      ) : (
        <div className="space-y-2">
          {areas.map((area) => (
            <Card key={area.id}>
              <CardContent className="flex items-center gap-3 py-3">
                {editingId === area.id ? (
                  <>
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
                    />
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={() => saveEdit(area.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span
                      className="size-4 shrink-0 rounded-full"
                      style={{ backgroundColor: area.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{area.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {area._count.tasks} tarea{area._count.tasks === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" title="Editar" onClick={() => startEdit(area)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Eliminar"
                      onClick={() => deleteArea(area)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="space-y-2 py-4">
          <Label htmlFor="new-area-name">Nueva área</Label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
            />
            <Input
              id="new-area-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Gimnasio"
              className="min-w-40 flex-1"
            />
            <Button onClick={createArea} disabled={creating} className="gap-1.5">
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Crear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

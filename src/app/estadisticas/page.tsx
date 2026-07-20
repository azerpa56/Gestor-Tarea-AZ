"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { hexToRgba } from "@/lib/utils";

type AreaStat = {
  id: string;
  name: string;
  color: string;
  total: number;
  done: number;
  pending: number;
  percentDone: number;
};

type Stats = {
  areas: AreaStat[];
  overall: { total: number; done: number; percentDone: number };
};

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => toast.error("No se pudieron cargar las estadísticas"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando estadísticas...</p>;
  }

  if (!stats || stats.overall.total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aún no hay tareas para mostrar estadísticas.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Estadísticas</h1>

      <Card>
        <CardContent className="space-y-2 py-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Cumplimiento general</span>
            <span className="text-2xl font-semibold">{stats.overall.percentDone}%</span>
          </div>
          <ProgressBar percent={stats.overall.percentDone} color="var(--color-primary)" />
          <p className="text-xs text-muted-foreground">
            {stats.overall.done} de {stats.overall.total} tareas completadas
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {stats.areas
          .filter((area) => area.total > 0)
          .map((area) => (
            <Card key={area.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: area.color }}
                    />
                    <span className="truncate font-medium">{area.name}</span>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {area.done}/{area.total} · {area.percentDone}%
                  </span>
                </div>
                <ProgressBar percent={area.percentDone} color={area.color} />
                <p className="text-xs text-muted-foreground">
                  {area.pending} pendiente{area.pending === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {stats.areas.some((a) => a.total === 0) && (
        <p
          className="rounded-lg px-3 py-2 text-xs text-muted-foreground"
          style={{ backgroundColor: hexToRgba("#64748b", 0.1) }}
        >
          Hay áreas sin tareas todavía, no se muestran aquí.
        </p>
      )}
    </div>
  );
}

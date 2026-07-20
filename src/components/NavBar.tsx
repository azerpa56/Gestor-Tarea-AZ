"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, ListTodo, Shapes } from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Tareas", icon: ListTodo },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/areas", label: "Áreas", icon: Shapes },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <span className="shrink-0 text-lg font-semibold">Mis Tareas</span>
        <nav className="flex min-w-0 gap-1 overflow-x-auto">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

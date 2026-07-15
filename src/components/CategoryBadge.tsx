import { Badge } from "@/components/ui/badge";
import type { Category } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const LABELS: Record<Category, string> = {
  UNIVERSIDAD: "Universidad",
  TRABAJO: "Trabajo",
  OTROS: "Otros",
};

const STYLES: Record<Category, string> = {
  UNIVERSIDAD: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  TRABAJO: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  OTROS: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", STYLES[category])}>
      {LABELS[category]}
    </Badge>
  );
}

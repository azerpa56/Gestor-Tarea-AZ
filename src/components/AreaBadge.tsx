import { Badge } from "@/components/ui/badge";
import { hexToRgba } from "@/lib/utils";

export function AreaBadge({ name, color }: { name: string; color: string }) {
  return (
    <Badge
      variant="secondary"
      className="border-transparent"
      style={{ backgroundColor: hexToRgba(color, 0.16), color }}
    >
      {name}
    </Badge>
  );
}

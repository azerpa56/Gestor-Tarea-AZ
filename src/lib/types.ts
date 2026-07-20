import type { TaskModel, AreaModel } from "@/generated/prisma/models";

export type TaskWithArea = TaskModel & { area: AreaModel };

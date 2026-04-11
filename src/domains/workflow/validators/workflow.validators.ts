import { z } from "zod";

// ── Pending Changes / Workflow ──
export const createPendingChangeSchema = z.object({
  page: z.string().min(1, "Page is required"),
  changeType: z.string().min(1, "Change type is required"),
  itemName: z.string().min(1, "Item name is required"),
  snapshot: z.unknown().optional().nullable(),
  entityRef: z.string().optional().nullable(),
});

export const reviewPendingChangeSchema = z.object({
  id: z.string().min(1, "Change id required"),
  status: z.enum(["approved", "declined"]),
});

export type CreatePendingChangeDto = z.infer<typeof createPendingChangeSchema>;
export type ReviewPendingChangeDto = z.infer<typeof reviewPendingChangeSchema>;

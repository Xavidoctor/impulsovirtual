import { z } from "zod";
import {
  COMMON_NEEDS,
  PROJECT_TYPE_VALUES,
  QUALIFICATION_VALUES,
  TARGET_PLATFORM_VALUES,
  URGENCY_VALUES,
} from "@/src/lib/project-assistant/types";

const chatMessageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().trim().min(1).max(2000),
});

export const projectAssistantRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(24),
});

export const projectAssistantOutputSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  project_type: z.enum(PROJECT_TYPE_VALUES),
  detected_needs: z.array(z.string().trim().min(1).max(120)).max(12),
  goal: z.string().trim().min(1).max(300),
  urgency: z.enum(URGENCY_VALUES),
  target_platform: z.enum(TARGET_PLATFORM_VALUES),
  needs_backend: z.boolean(),
  qualification_level: z.enum(QUALIFICATION_VALUES),
  interest_in_ai: z.boolean(),
  interest_in_automation: z.boolean(),
  ready_for_cta: z.boolean(),
  lead_summary: z.string().trim().min(1).max(700),
});

export const projectAssistantApiResponseSchema = z.object({
  data: projectAssistantOutputSchema,
  warning: z.string().optional(),
  meta: z
    .object({
      source: z.enum(["openai", "fallback"]).optional(),
    })
    .optional(),
});

export const knownNeedsSet = new Set<string>(COMMON_NEEDS);

export type ProjectAssistantRequestInput = z.infer<typeof projectAssistantRequestSchema>;
export type ProjectAssistantOutputInput = z.infer<typeof projectAssistantOutputSchema>;

import { z } from "zod";
import {
  COMMON_NEEDS,
  CONVERSATION_PHASE_VALUES,
  CURRENT_SITUATION_VALUES,
  PROJECT_TYPE_VALUES,
  QUESTION_KEY_VALUES,
  QUALIFICATION_VALUES,
  SLOT_STATUS_VALUES,
  TARGET_PLATFORM_VALUES,
  URGENCY_VALUES,
} from "@/src/lib/project-assistant/types";

const chatMessageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().trim().min(1).max(2000),
});

const nullableBoolean = z.boolean().nullable();
const nullableText = z.string().trim().min(1).max(700).nullable();

const collectedDataSchema = z.object({
  projectType: z.enum(PROJECT_TYPE_VALUES).nullable(),
  mainGoal: z.string().trim().min(1).max(300).nullable(),
  featuresNeeded: z.array(z.string().trim().min(1).max(120)).max(12),
  currentSituation: z.enum(CURRENT_SITUATION_VALUES).nullable(),
  targetPlatform: z.enum(TARGET_PLATFORM_VALUES).nullable(),
  urgency: z.enum(URGENCY_VALUES).nullable(),
  needsBackend: nullableBoolean,
  needsAdminPanel: nullableBoolean,
  integrations: z.array(z.string().trim().min(1).max(120)).max(12),
  aiInterest: nullableBoolean,
  automationInterest: nullableBoolean,
});

const slotStatusSchema = z.object({
  projectType: z.enum(SLOT_STATUS_VALUES),
  mainGoal: z.enum(SLOT_STATUS_VALUES),
  featuresNeeded: z.enum(SLOT_STATUS_VALUES),
  currentSituation: z.enum(SLOT_STATUS_VALUES),
  targetPlatform: z.enum(SLOT_STATUS_VALUES),
  urgency: z.enum(SLOT_STATUS_VALUES),
  needsBackend: z.enum(SLOT_STATUS_VALUES),
  needsAdminPanel: z.enum(SLOT_STATUS_VALUES),
  integrations: z.enum(SLOT_STATUS_VALUES),
  aiInterest: z.enum(SLOT_STATUS_VALUES),
  automationInterest: z.enum(SLOT_STATUS_VALUES),
});

const conversationStateSchema = z.object({
  project_type: z.enum(PROJECT_TYPE_VALUES).nullable().optional(),
  detected_needs: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  goal: z.string().trim().min(1).max(300).nullable().optional(),
  current_situation: z.enum(CURRENT_SITUATION_VALUES).nullable().optional(),
  urgency: z.enum(URGENCY_VALUES).nullable().optional(),
  target_platform: z.enum(TARGET_PLATFORM_VALUES).nullable().optional(),
  needs_backend: nullableBoolean.optional(),
  needs_admin_panel: nullableBoolean.optional(),
  integrations: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  interest_in_ai: nullableBoolean.optional(),
  interest_in_automation: nullableBoolean.optional(),
  answered_steps: z.array(z.enum(QUESTION_KEY_VALUES)).max(24).optional(),
  last_question_key: z.enum(QUESTION_KEY_VALUES).nullable().optional(),
});

export const projectAssistantRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(24),
  conversation_state: conversationStateSchema.optional(),
});

export const projectAssistantOutputSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  project_type: z.enum(PROJECT_TYPE_VALUES).nullable(),
  detected_needs: z.array(z.string().trim().min(1).max(120)).max(12),
  goal: z.string().trim().min(1).max(300).nullable(),
  current_situation: z.enum(CURRENT_SITUATION_VALUES).nullable(),
  urgency: z.enum(URGENCY_VALUES).nullable(),
  target_platform: z.enum(TARGET_PLATFORM_VALUES).nullable(),
  needs_backend: nullableBoolean,
  needs_admin_panel: nullableBoolean,
  integrations: z.array(z.string().trim().min(1).max(120)).max(12),
  qualification_level: z.enum(QUALIFICATION_VALUES).nullable(),
  interest_in_ai: nullableBoolean,
  interest_in_automation: nullableBoolean,
  ready_for_cta: z.boolean(),
  lead_summary: nullableText,
  conversation_phase: z.enum(CONVERSATION_PHASE_VALUES),
  collected_data: collectedDataSchema,
  slot_status: slotStatusSchema,
  missing_critical_fields: z.array(z.string().trim().min(1).max(160)).max(16),
  should_ask_follow_up: z.boolean(),
  follow_up_questions: z.array(z.string().trim().min(1).max(220)).max(4),
  cta_label: z.string().trim().min(1).max(80).nullable(),
  answered_steps: z.array(z.enum(QUESTION_KEY_VALUES)).max(24),
  last_question_key: z.enum(QUESTION_KEY_VALUES).nullable(),
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

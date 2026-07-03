import { z } from 'zod'

// Draft refinement lenses surfaced as buttons next to a generated draft.
// Lives here (not in draftAsk.ts) so the client form can import the type
// without crossing the `'server-only'` boundary.
export const draftVariantSchema = z.enum(['shorter', 'more-direct', 'warmer'])
export type DraftVariant = z.infer<typeof draftVariantSchema>

// One ask type (ADR 0011 Phase 2). The asks.ask_type column and its enum
// still exist until the Phase 6 contract migration; createAsk writes a
// constant. Commitment tiers and screening left the contract with the
// type split — the columns sit idle until Phase 6 drops them.
export const askSchema = z.object({
  helperId: z.uuid(),
  // The drafter may propose a "why you specifically" line; it's optional
  // and the asks.reason column is nullable.
  reason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  // 800 matches the draft API's ceiling so a generated note can never be
  // rejected at send for being a few sentences too warm.
  helpNeeded: z.string().trim().min(10, 'Be specific (10+ chars).').max(800),
  background: z.string().trim().max(1000).optional().nullable(),
})

export type AskInput = z.infer<typeof askSchema>

export function parseAskForm(formData: FormData) {
  return askSchema.safeParse({
    helperId: formData.get('helperId'),
    reason: formData.get('reason'),
    helpNeeded: formData.get('helpNeeded'),
    background: formData.get('background'),
  })
}

export const messageSchema = z.object({
  threadId: z.uuid(),
  body: z.string().trim().min(1).max(4000),
})

export type MessageInput = z.infer<typeof messageSchema>

export function parseMessageForm(formData: FormData) {
  return messageSchema.safeParse({
    threadId: formData.get('threadId'),
    body: formData.get('body'),
  })
}

const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean())

// One availability state (ADR 0011 Phase 2): open to helping, or not.
// The caps and screening prompt left the UI; max_pending_requests stays
// enforced in createAsk as an invisible abuse valve (decided 2026-07-02),
// and existing column values are left untouched by saves.
export const helperPreferenceSchema = z.object({
  openToHelp: checkbox,
  topics: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    ),
})

export type HelperPreferenceInput = z.infer<typeof helperPreferenceSchema>

export function parseHelperPreferenceForm(formData: FormData) {
  return helperPreferenceSchema.safeParse({
    openToHelp: formData.get('openToHelp'),
    topics: formData.get('topics'),
  })
}

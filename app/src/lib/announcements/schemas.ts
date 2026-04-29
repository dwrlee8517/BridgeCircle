import { z } from 'zod'

export const announcementCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  body: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  /** When true, fan out an email to every active org member. */
  sendEmail: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
})

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>

export function parseAnnouncementCreateForm(formData: FormData) {
  return announcementCreateSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    sendEmail: formData.get('sendEmail'),
  })
}

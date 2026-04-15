import { z } from 'zod'

export const loginSchema = z.object({
  accessKey: z.string().min(10).max(255),
})

export type LoginInput = z.infer<typeof loginSchema>

import { z } from 'zod'

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return undefined
    return value
  })

export const adminLoginSchema = z.object({
  accessKey: z.string().trim().min(8).max(255),
})

export const createAdminUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, numbers, dots, underscores, and hyphens are allowed'),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  avatar: optionalTrimmedString,
})

export const updateServerSchema = z.object({
  name: z.string().trim().min(2).max(64),
  description: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens'),
  description: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  type: z.enum(['TEXT', 'VOICE']).default('TEXT'),
})

export const updateChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens'),
  description: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  type: z.enum(['TEXT', 'VOICE']),
  position: z.number().int().min(0).optional(),
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>
export type UpdateServerInput = z.infer<typeof updateServerSchema>
export type CreateChannelInput = z.infer<typeof createChannelSchema>
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>

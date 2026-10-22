import { z } from 'zod'
import {
  type ChangePasswordRequest,
  profileSchema,
  type UpdateProfileRequest,
} from '@/shared/contracts/account'
import { request } from '@/shared/infrastructure/http'

export function fetchProfile(signal?: AbortSignal) {
  return request(profileSchema, { url: '/profile', signal })
}

export function updateProfile(body: UpdateProfileRequest) {
  return request(profileSchema, { url: '/profile', method: 'PATCH', data: body })
}

export function updateAvatar(dataUrl: string | null) {
  return request(profileSchema, { url: '/profile/avatar', method: 'PUT', data: { dataUrl } })
}

export async function changePassword(body: ChangePasswordRequest): Promise<void> {
  await request(z.unknown(), { url: '/profile/password', method: 'POST', data: body })
}

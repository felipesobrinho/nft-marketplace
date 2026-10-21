import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authKeys, useCurrentUserId } from '@/modules/auth'
import type { ChangePasswordRequest, Profile, UpdateProfileRequest } from '@/shared/contracts/account'
import { ApiError } from '@/shared/domain/apiError'
import { avatarProblem } from '../domain/avatar'
import { changePassword, fetchProfile, updateAvatar, updateProfile } from '../infrastructure/profileApi'
import { readFileAsDataUrl } from '../infrastructure/readFile'

export const profileKeys = {
  detail: (userId: string) => ['user', userId, 'profile'] as const,
}

export function profileQuery(userId: string) {
  return queryOptions({
    queryKey: profileKeys.detail(userId),
    queryFn: ({ signal }) => fetchProfile(signal),
  })
}

export function useProfile() {
  const userId = useCurrentUserId()
  return useQuery({ ...profileQuery(userId ?? 'anonimo'), enabled: userId !== null })
}

function useProfileSaved() {
  const userId = useCurrentUserId()
  const queryClient = useQueryClient()
  return (profile: Profile) => {
    if (!userId) return
    queryClient.setQueryData(profileKeys.detail(userId), profile)
    void queryClient.invalidateQueries({ queryKey: authKeys.session(userId) })
  }
}

export function useUpdateProfile() {
  const saved = useProfileSaved()
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => updateProfile(body),
    onSuccess: saved,
  })
}

export function useUpdateAvatar() {
  const saved = useProfileSaved()
  return useMutation({
    mutationFn: async (file: File | null) => {
      if (!file) return updateAvatar(null)
      const problem = avatarProblem(file)
      if (problem) {
        throw new ApiError({
          kind: 'http',
          status: 422,
          code: 'validation_error',
          message: problem,
          fields: { dataUrl: problem },
        })
      }
      return updateAvatar(await readFileAsDataUrl(file))
    },
    onSuccess: saved,
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => changePassword(body),
  })
}

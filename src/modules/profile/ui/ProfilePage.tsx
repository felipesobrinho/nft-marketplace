import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImageIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  avatarMimeTypes,
  changePasswordRequestSchema,
  ensNameSchema,
  updateProfileRequestSchema,
  type Profile,
} from '@/shared/contracts/account'
import { isApiError } from '@/shared/domain/apiError'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/components/ui/avatar'
import { Button } from '@/shared/ui/components/ui/button'
import { Input } from '@/shared/ui/components/ui/input'
import { Skeleton } from '@/shared/ui/components/ui/skeleton'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { FormField } from '@/shared/ui/form/FormField'
import { PasswordInput } from '@/shared/ui/form/PasswordInput'
import { applyApiErrors } from '@/shared/ui/form/applyApiErrors'
import { initialsOf } from '../domain/avatar'
import { useChangePassword, useProfile, useUpdateAvatar, useUpdateProfile } from '../application/profile'

const profileFormSchema = updateProfileRequestSchema.extend({
  ensName: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .pipe(ensNameSchema.nullable()),
})

type ProfileFormInput = z.input<typeof profileFormSchema>
type ProfileFormOutput = z.output<typeof profileFormSchema>

const passwordFormSchema = changePasswordRequestSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme a nova senha') })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })

type PasswordFormValues = z.infer<typeof passwordFormSchema>

const avatarAccept = avatarMimeTypes.join(',')

function profileDefaults(profile: Profile): ProfileFormInput {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName ?? '',
  }
}

function FormAlert({ message }: { message: string | null }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (message) ref.current?.focus()
  }, [message])
  if (!message) return null
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="border-l-4 border-destructive bg-surface-raised p-3 text-small text-foreground outline-none"
    >
      {message}
    </div>
  )
}

function AvatarEditor({ profile }: { profile: Profile }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const avatar = useUpdateAvatar()
  const [problem, setProblem] = useState<string | null>(null)
  const busy = avatar.isPending

  const fail = (error: unknown) => {
    if (isApiError(error)) {
      setProblem(error.fields.dataUrl ?? error.message)
      return
    }
    setProblem('Não foi possível atualizar o avatar agora. Tente de novo em instantes.')
  }

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setProblem(null)
    avatar.mutate(file, {
      onSuccess: () => toast.success('Avatar atualizado.'),
      onError: fail,
    })
  }

  const onRemove = () => {
    setProblem(null)
    avatar.mutate(null, {
      onSuccess: () => toast.success('Avatar removido.'),
      onError: fail,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <span id="avatar-label" className="text-small font-medium text-foreground">
        Avatar
      </span>
      <div className="flex flex-wrap items-center gap-3" role="group" aria-labelledby="avatar-label">
        <Avatar className="size-14">
          {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
          <AvatarFallback>
            {profile.displayName ? (
              initialsOf(profile.displayName)
            ) : (
              <ImageIcon aria-hidden="true" className="size-6" />
            )}
          </AvatarFallback>
        </Avatar>
        <input
          ref={inputRef}
          type="file"
          accept={avatarAccept}
          aria-label="Escolher imagem do avatar"
          className="sr-only"
          tabIndex={-1}
          onChange={onPick}
        />
        <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? 'Enviando…' : 'Alterar'}
        </Button>
        <Button type="button" variant="ghost" disabled={busy || !profile.avatarUrl} onClick={onRemove}>
          Remover
        </Button>
      </div>
      <p className="text-caption text-muted-foreground">PNG, JPEG ou WebP de até 1 MB.</p>
      {problem ? (
        <p role="alert" className="text-caption text-destructive">
          {problem}
        </p>
      ) : null}
    </div>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProfileFormInput, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: profileDefaults(profile),
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const saved = await update.mutateAsync(values)
      reset(profileDefaults(saved))
      toast.success('Perfil salvo.')
    } catch (error) {
      if (applyApiErrors(error, setError, ['displayName', 'username', 'email', 'ensName'])) return
      setFormError(
        isApiError(error)
          ? error.message
          : 'Não foi possível salvar o perfil agora. Tente de novo em instantes.',
      )
    }
  })

  return (
    <form
      noValidate
      aria-labelledby="profile-heading"
      aria-busy={update.isPending}
      onSubmit={(event) => void onSubmit(event)}
      className="grid gap-6 md:grid-cols-2 md:gap-x-12"
    >
      <FormField
        id="profile-display-name"
        label="Nome de exibição"
        required
        {...(errors.displayName?.message ? { error: errors.displayName.message } : {})}
      >
        {(control) => <Input {...control} autoComplete="name" {...register('displayName')} />}
      </FormField>
      <FormField
        id="profile-username"
        label="Nome de usuário"
        required
        {...(errors.username?.message ? { error: errors.username.message } : {})}
      >
        {(control) => (
          <Input
            {...control}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            {...register('username')}
          />
        )}
      </FormField>
      <FormField
        id="profile-email"
        label="E-mail"
        required
        {...(errors.email?.message ? { error: errors.email.message } : {})}
      >
        {(control) => <Input {...control} type="email" autoComplete="email" {...register('email')} />}
      </FormField>
      <FormField
        id="profile-ens"
        label="Nome ENS"
        {...(errors.ensName?.message ? { error: errors.ensName.message } : {})}
      >
        {(control) => (
          <div className="flex items-center gap-2">
            <Input
              {...control}
              autoCapitalize="none"
              spellCheck={false}
              placeholder="seunome"
              {...register('ensName')}
            />
            <span aria-hidden="true" className="text-body text-muted-foreground">
              .eth
            </span>
          </div>
        )}
      </FormField>
      <div className="md:col-start-2">
        <AvatarEditor profile={profile} />
      </div>
      <div className="flex flex-col items-start gap-4 md:col-span-2">
        <FormAlert message={formError} />
        <Button type="submit" disabled={update.isPending} className="w-full md:w-auto">
          {update.isPending ? 'Salvando…' : 'Salvar perfil'}
        </Button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const change = useChangePassword()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      reset()
      toast.success('Senha alterada.')
    } catch (error) {
      if (applyApiErrors(error, setError, ['currentPassword', 'newPassword'])) return
      setFormError(
        isApiError(error)
          ? error.message
          : 'Não foi possível alterar a senha agora. Tente de novo em instantes.',
      )
    }
  })

  return (
    <section aria-labelledby="password-heading" className="mt-12 grid md:grid-cols-2 md:gap-x-12">
      <form
        noValidate
        aria-busy={change.isPending}
        onSubmit={(event) => void onSubmit(event)}
        className="flex flex-col gap-6"
      >
        <h2 id="password-heading" className="text-title font-bold text-foreground">
          Alterar senha
        </h2>
        <FormField
          id="password-current"
          label="Senha atual"
          {...(errors.currentPassword?.message ? { error: errors.currentPassword.message } : {})}
        >
          {(control) => (
            <PasswordInput {...control} autoComplete="current-password" {...register('currentPassword')} />
          )}
        </FormField>
        <FormField
          id="password-new"
          label="Nova senha"
          hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número"
          {...(errors.newPassword?.message ? { error: errors.newPassword.message } : {})}
        >
          {(control) => (
            <PasswordInput {...control} autoComplete="new-password" {...register('newPassword')} />
          )}
        </FormField>
        <FormField
          id="password-confirm"
          label="Confirmar nova senha"
          {...(errors.confirmPassword?.message ? { error: errors.confirmPassword.message } : {})}
        >
          {(control) => (
            <PasswordInput {...control} autoComplete="new-password" {...register('confirmPassword')} />
          )}
        </FormField>
        <FormAlert message={formError} />
        <Button type="submit" disabled={change.isPending} className="w-full md:w-auto md:self-start">
          {change.isPending ? 'Alterando…' : 'Alterar senha'}
        </Button>
      </form>
    </section>
  )
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando perfil" className="grid gap-6 md:grid-cols-2 md:gap-x-12">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </div>
  )
}

export function ProfilePage() {
  const profile = useProfile()

  let content
  if (profile.isPending) {
    content = <ProfileSkeleton />
  } else if (profile.isError) {
    const forbidden = isApiError(profile.error) && profile.error.status === 403
    content = (
      <ErrorState
        title={forbidden ? 'Acesso negado' : 'Não foi possível carregar o perfil'}
        message={
          forbidden
            ? 'Você não tem permissão para ver este perfil.'
            : 'Algo deu errado ao buscar seus dados. Tente de novo.'
        }
        onRetry={() => void profile.refetch()}
        isRetrying={profile.isFetching}
      />
    )
  } else {
    content = (
      <>
        <ProfileForm profile={profile.data} />
        <PasswordForm />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 id="profile-heading" className="text-title font-bold text-foreground">
        Perfil do colecionador
      </h1>
      {content}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { isApiError } from '@/shared/domain/apiError'
import { loginRequestSchema, type LoginRequest } from '@/shared/contracts/auth'
import { Button } from '@/shared/ui/components/ui/button'
import { Input } from '@/shared/ui/components/ui/input'
import { UnavailableButton } from '@/shared/ui/feedback/UnavailableNotice'
import { FormField } from '@/shared/ui/form/FormField'
import { PasswordInput } from '@/shared/ui/form/PasswordInput'
import { useLogin } from '../application/account'
import { safeRedirect } from '../domain/redirect'
import { applyApiErrors } from './applyApiErrors'

interface LoginFormProps {
  redirect?: string | undefined
}

export function LoginForm({ redirect }: LoginFormProps) {
  const router = useRouter()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (formError) alertRef.current?.focus()
  }, [formError])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login.mutateAsync(values)
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        setFormError('E-mail ou senha incorretos.')
        return
      }
      if (applyApiErrors(error, setError, ['email', 'password'])) return
      setFormError(
        isApiError(error) ? error.message : 'Não foi possível entrar agora. Tente de novo em instantes.',
      )
      return
    }
    router.history.push(safeRedirect(redirect))
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      aria-busy={login.isPending}
      className="flex flex-col gap-4"
    >
      <FormField
        id="login-email"
        label="E-mail"
        required
        {...(errors.email?.message ? { error: errors.email.message } : {})}
      >
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            placeholder="contato@email.com"
            {...register('email')}
          />
        )}
      </FormField>
      <div className="flex flex-col gap-1">
        <FormField
          id="login-password"
          label="Senha"
          required
          {...(errors.password?.message ? { error: errors.password.message } : {})}
        >
          {(control) => (
            <PasswordInput {...control} autoComplete="current-password" {...register('password')} />
          )}
        </FormField>
        <div className="flex justify-end">
          <UnavailableButton
            feature="A recuperação de senha"
            variant="link"
            className="h-11 px-0 text-small font-normal"
          >
            Esqueceu a senha?
          </UnavailableButton>
        </div>
      </div>
      {formError ? (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="border-l-4 border-destructive bg-surface-raised p-3 text-small text-foreground outline-none"
        >
          {formError}
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

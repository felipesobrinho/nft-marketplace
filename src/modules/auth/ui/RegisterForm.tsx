import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isApiError } from '@/shared/domain/apiError'
import { registerRequestSchema } from '@/shared/contracts/auth'
import { Button } from '@/shared/ui/components/ui/button'
import { Input } from '@/shared/ui/components/ui/input'
import { FormField } from '@/shared/ui/form/FormField'
import { PasswordInput } from '@/shared/ui/form/PasswordInput'
import { useRegister } from '../application/account'
import { safeRedirect } from '../domain/redirect'
import { applyApiErrors } from './applyApiErrors'

const registerFormSchema = registerRequestSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme a senha') })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })

type RegisterFormValues = z.infer<typeof registerFormSchema>

interface RegisterFormProps {
  redirect?: string | undefined
}

export function RegisterForm({ redirect }: RegisterFormProps) {
  const router = useRouter()
  const registration = useRegister()
  const [formError, setFormError] = useState<string | null>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (formError) alertRef.current?.focus()
  }, [formError])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registration.mutateAsync({
        username: values.username,
        email: values.email,
        password: values.password,
      })
    } catch (error) {
      if (applyApiErrors(error, setError, ['username', 'email', 'password'])) return
      setFormError(
        isApiError(error)
          ? error.message
          : 'Não foi possível criar a conta agora. Tente de novo em instantes.',
      )
      return
    }
    router.history.push(safeRedirect(redirect))
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      aria-busy={registration.isPending}
      className="flex flex-col gap-4"
    >
      <FormField
        id="register-username"
        label="Nome de usuário"
        required
        hint="3 a 20 caracteres: letras minúsculas, números, ponto e sublinhado"
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
        id="register-email"
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
      <FormField
        id="register-password"
        label="Senha"
        required
        hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número"
        {...(errors.password?.message ? { error: errors.password.message } : {})}
      >
        {(control) => <PasswordInput {...control} autoComplete="new-password" {...register('password')} />}
      </FormField>
      <FormField
        id="register-confirm"
        label="Confirmar senha"
        required
        {...(errors.confirmPassword?.message ? { error: errors.confirmPassword.message } : {})}
      >
        {(control) => (
          <PasswordInput {...control} autoComplete="new-password" {...register('confirmPassword')} />
        )}
      </FormField>
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
      <Button type="submit" className="w-full" disabled={registration.isPending}>
        {registration.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}

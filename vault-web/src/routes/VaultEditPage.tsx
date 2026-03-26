import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type FieldValues, type Path, type UseFormRegister, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { TotpCodeCard } from '@/components/TotpCodeCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVaultSession } from '@/providers/VaultSessionProvider'
import { loginCredentialsSchema, totpSchema } from '@shared/loginCredentialsSchema'

const loginFormSchema = loginCredentialsSchema
const totpFormSchema = totpSchema

type SecretKind = 'LOGIN_CREDENTIALS' | 'TOTP'

export function VaultEditPage() {
  const navigate = useNavigate()
  const { secretId } = useParams()
  const {
    createLoginSecret,
    createTotpSecret,
    deleteSecret,
    decryptedSecrets,
    updateLoginSecret,
    updateTotpSecret
  } = useVaultSession()
  const [kind, setKind] = useState<SecretKind>('LOGIN_CREDENTIALS')

  const currentSecret = secretId
    ? decryptedSecrets.find((secret) => secret.id === secretId)
    : null

  useEffect(() => {
    if (currentSecret) {
      setKind(currentSecret.kind)
    }
  }, [currentSecret])

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: currentSecret?.kind === 'LOGIN_CREDENTIALS'
      ? currentSecret.loginCredentials
      : {
        label: '',
        url: '',
        iconUrl: null,
        username: '',
        password: '',
        androidUri: null,
        iosUri: null
      }
  })

  const totpForm = useForm<z.infer<typeof totpFormSchema>>({
    resolver: zodResolver(totpFormSchema),
    defaultValues: currentSecret?.kind === 'TOTP'
      ? currentSecret.totp
      : {
        label: '',
        url: '',
        iconUrl: null,
        secret: '',
        digits: 6,
        period: 30,
        androidUri: null,
        iosUri: null
      }
  })

  useEffect(() => {
    if (currentSecret?.kind === 'LOGIN_CREDENTIALS') {
      loginForm.reset(currentSecret.loginCredentials)
      return
    }

    loginForm.reset({
      label: '',
      url: '',
      iconUrl: null,
      username: '',
      password: '',
      androidUri: null,
      iosUri: null
    })
  }, [currentSecret, loginForm])

  useEffect(() => {
    if (currentSecret?.kind === 'TOTP') {
      totpForm.reset(currentSecret.totp)
      return
    }

    totpForm.reset({
      label: '',
      url: '',
      iconUrl: null,
      secret: '',
      digits: 6,
      period: 30,
      androidUri: null,
      iosUri: null
    })
  }, [currentSecret, totpForm])

  if (secretId && !currentSecret) {
    return <Navigate replace to="/vault" />
  }

  const isEditing = Boolean(currentSecret)
  const totpLabel = totpForm.watch('label')
  const totpSecret = totpForm.watch('secret')
  const totpDigits = totpForm.watch('digits')
  const totpPeriod = totpForm.watch('period')
  const shouldShowTotpToken = kind === 'TOTP' && (isEditing || totpSecret.trim().length > 0)

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit item' : 'Add item'}</CardTitle>
          <CardDescription>
            Keep the plaintext only in the browser. The API only receives encrypted payloads.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(['LOGIN_CREDENTIALS', 'TOTP'] as const).map((type) => (
            <Button
              key={type}
              disabled={isEditing}
              onClick={() => setKind(type)}
              size="sm"
              type="button"
              variant={kind === type ? 'primary' : 'outline'}
            >
              {type === 'LOGIN_CREDENTIALS' ? (
                <>
                  <KeyRound className="size-4" />
                  Password
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  TOTP
                </>
              )}
            </Button>
          ))}
        </CardContent>
      </Card>

      {shouldShowTotpToken ? (
        <TotpCodeCard
          digits={totpDigits}
          label={totpLabel}
          period={totpPeriod}
          secret={totpSecret}
        />
      ) : null}

      {kind === 'LOGIN_CREDENTIALS' ? (
        <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
          <CardHeader>
            <CardTitle>Password item</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={loginForm.handleSubmit(async (values) => {
                if (currentSecret?.kind === 'LOGIN_CREDENTIALS') {
                  await updateLoginSecret(currentSecret.id, values)
                } else {
                  await createLoginSecret(values)
                }

                navigate('/vault')
              })}
            >
              <VaultField label="Label" name="label" register={loginForm.register} />
              <VaultField label="URL" name="url" register={loginForm.register} />
              <VaultField label="Username" name="username" register={loginForm.register} />
              <VaultField
                label="Password"
                name="password"
                register={loginForm.register}
                showPasswordCopyButton={currentSecret?.kind === 'LOGIN_CREDENTIALS'}
                type="password"
              />
              <VaultField label="Icon URL" name="iconUrl" register={loginForm.register} />
              <VaultField label="Android URI" name="androidUri" register={loginForm.register} />
              <VaultField label="iOS URI" name="iosUri" register={loginForm.register} />
              <div className="col-span-full flex flex-wrap gap-3">
                {currentSecret ? (
                  <Button
                    className="mr-auto"
                    onClick={() => {
                      void deleteSecret(currentSecret.id).then(() => {
                        navigate('/vault')
                      })
                    }}
                    type="button"
                    variant="destructive"
                  >
                    Delete
                  </Button>
                ) : null}
                <Button asChild size="sm" type="button" variant="outline">
                  <Link to="/vault">Cancel</Link>
                </Button>
                <div className="ml-auto flex flex-wrap gap-3">
                  <Button size="sm" type="submit">
                    {isEditing ? 'Save changes' : 'Create password'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
          <CardHeader>
            <CardTitle>TOTP item</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={totpForm.handleSubmit(async (values) => {
                if (currentSecret?.kind === 'TOTP') {
                  await updateTotpSecret(currentSecret.id, values)
                } else {
                  await createTotpSecret(values)
                }

                navigate('/vault')
              })}
            >
              <VaultField label="Label" name="label" register={totpForm.register} />
              <VaultField label="URL" name="url" register={totpForm.register} />
              <VaultField label="Secret" name="secret" register={totpForm.register} />
              <VaultField label="Digits" name="digits" register={totpForm.register} type="number" />
              <VaultField label="Period" name="period" register={totpForm.register} type="number" />
              <VaultField label="Icon URL" name="iconUrl" register={totpForm.register} />
              <VaultField label="Android URI" name="androidUri" register={totpForm.register} />
              <VaultField label="iOS URI" name="iosUri" register={totpForm.register} />
              <div className="col-span-full flex flex-wrap gap-3">
                {currentSecret ? (
                  <Button
                    className="mr-auto"
                    onClick={() => {
                      void deleteSecret(currentSecret.id).then(() => {
                        navigate('/vault')
                      })
                    }}
                    type="button"
                    variant="destructive"
                  >
                    Delete
                  </Button>
                ) : null}
                <div className="ml-auto flex flex-wrap gap-3">
                  <Button size="sm" type="submit">
                    {isEditing ? 'Save changes' : 'Create TOTP'}
                  </Button>
                  <Button asChild size="sm" type="button" variant="outline">
                    <Link to="/vault">Cancel</Link>
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

type VaultFieldProps<FormValues extends FieldValues> = {
  label: string
  name: Path<FormValues>
  register: UseFormRegister<FormValues>
  showPasswordCopyButton?: boolean
  type?: 'text' | 'number' | 'password'
}

function VaultField<FormValues extends FieldValues>(
  {
    label,
    name,
    register,
    showPasswordCopyButton,
    type = 'text'
  }: VaultFieldProps<FormValues>
) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        showPasswordCopyButton={showPasswordCopyButton}
        type={type}
        {...register(name)}
      />
    </div>
  )
}

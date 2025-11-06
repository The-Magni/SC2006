'use client'

import { signup } from "@/lib/controllers/AuthController"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import { WeakPasswordError, weakPwMessage } from "@/error"

export default function LayoutSignup({ ...props }: React.ComponentProps<typeof Card>) {
  const [error, setError] = useState('');
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card {...props}>
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Enter your information below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input name="name" id="name" type="text" placeholder="John Doe" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    name="email"
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                  <FieldDescription>
                    We&apos;ll use this to contact you. We will not share your email
                    with anyone else.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input name="password" id="password" type="password" required />
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                        {
                            error && <FieldDescription className="text-sm text-destructive">
                                {error}
                            </FieldDescription>
                        }

                </Field>
                {/* <Field>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <Input name="confirm_password" id="confirm-password" type="password" required />
                  <FieldDescription>Please confirm your password.</FieldDescription>
                </Field> */}
                <FieldGroup>
                  <Field>
                    <Button type="submit" formAction={async (formData) => {
                        const msg = weakPwMessage(formData.get('password') as string);
                        if (!msg) {
                          try {
                            await signup(formData);
                            setError('');
                          } catch (e) {
                            if (e instanceof WeakPasswordError ||  (e instanceof Error && e.name === 'WeakPasswordError'))
                              setError(e.message);
                          }
                        } else {
                          setError(msg);
                        }
                    }}>Create Account</Button>
                    <FieldDescription className="px-6 text-center">
                      Already have an account? <Link href="/?layout=login">Sign in</Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

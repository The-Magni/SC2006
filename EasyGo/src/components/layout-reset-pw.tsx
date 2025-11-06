"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link";
import { resetPassword } from "@/lib/controllers/AuthController";
import { useState } from "react";
import { InvalidCredentialsError, WeakPasswordError, weakPwMessage } from "@/error";

export default function LayoutResetPw({className, ...props}: React.ComponentProps<"div">) {
  const [error, setError] = useState('');
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle>Reset password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <FieldGroup>
                    <Field>
                        <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        </div>
                        <Input name="password" id="password" type="password" required />
                        {
                            error && <FieldDescription className="text-sm text-destructive">
                                {error}
                            </FieldDescription>
                        }
                  </Field>
                  <Field>
                    <Button type="submit" formAction={async(formData) => {
                        const password = formData.get('password') as string;
												const code = new URL(window.location.href).searchParams.get('code');
                        const msg = weakPwMessage(formData.get('password') as string);
												if (!code) {
													setError('Missing reset token');
													return;
												}
                        if (!msg)
                          try {
                              await resetPassword(password, code);
                              setError('');
                          } catch(e) {
                            if (e instanceof WeakPasswordError || (e instanceof Error && e.name === 'WeakPasswordError'))
                              setError(e.message);
                            if (e instanceof InvalidCredentialsError || (e instanceof Error && e.name === 'InvalidCredentialsError'))
                              setError(e.message);
                            else
                              setError('');
                          }
                        else
                          setError(msg);
                      }}>
                      Save New Password
                    </Button>
                    <FieldDescription className="text-center">
                      Don&apos;t have an account? <Link href="/?layout=signup">Sign up</Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

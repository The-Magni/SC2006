"use client"

import { login } from "@/lib/controllers/AuthController";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link";
import { useState } from "react";
import { InvalidCredentialsError } from "@/error";

export default function LayoutLogin({className, ...props}: React.ComponentProps<"div">) {
  const [error, setError] = useState('');
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      name="email"
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                    />
                  </Field>
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      {/* <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a> */}
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
                        try {
                          await login(formData);
                          setError('');
                        } catch (e) {
                          if (e instanceof InvalidCredentialsError || (e instanceof Error && e.name === 'InvalidCredentialsError'))
                            setError(e.message);
                          else
                            setError('');
                        }
                      }}>
                      Login
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

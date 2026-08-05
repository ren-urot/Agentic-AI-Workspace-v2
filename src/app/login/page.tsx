import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/app/login/actions";
import { PasswordInput } from "@/app/login/password-input";
import { LoginErrorToast } from "@/app/login/login-error-toast";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <LoginErrorToast hasError={Boolean(error)} />
      <Card className="w-full max-w-[420px] px-[29px] py-[40px]">
        <CardHeader className="items-center text-center">
          <Image
            src="/nexxabyte-logo.svg"
            alt="NexxaByte"
            width={194}
            height={48}
            priority
            className="mx-auto"
          />
          <CardTitle className="pt-2">Agentic AI Workspace</CardTitle>
          <CardDescription>Sign in to manage your organization&apos;s AI agents</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="-ml-[9.5px]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                className="h-[42px] w-[calc(100%+19px)] -mx-[9.5px] rounded-[9.6px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="-ml-[9.5px]">
                Password
              </Label>
              <PasswordInput id="password" name="password" />
            </div>
            {error ? <p className="text-sm text-red-600 dark:text-red-400">Enter an email and password.</p> : null}
            <Button type="submit" className="h-[42px] w-[calc(100%+19px)] -mx-[9.5px] rounded-[9.6px]">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

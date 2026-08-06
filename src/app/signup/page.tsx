import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signup } from "@/app/signup/actions";
import { PasswordInput } from "@/app/login/password-input";
import { SignupErrorToast } from "@/app/signup/signup-error-toast";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <SignupErrorToast error={error} />
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
          <CardTitle className="pt-2">Create your admin account</CardTitle>
          <CardDescription>
            You&apos;ll be the first Admin for your organization&apos;s workspace — invite your team once you&apos;re in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="-ml-[9.5px]">
                Full name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Jordan Lee"
                required
                className="h-[42px] w-[calc(100%+19px)] -mx-[9.5px] rounded-[9.6px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="-ml-[9.5px]">
                Work email
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
              <p className="-ml-[9.5px] text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="-ml-[9.5px]">
                Confirm password
              </Label>
              <PasswordInput id="confirmPassword" name="confirmPassword" />
            </div>
            <Button type="submit" className="h-[42px] w-[calc(100%+19px)] -mx-[9.5px] rounded-[9.6px]">
              Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

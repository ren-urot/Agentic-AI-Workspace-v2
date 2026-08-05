import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-6">
      <PageHeader title="Profile" description="Manage your personal account details." />

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-[#231F20] text-white">NB</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">Admin User</p>
              <p className="text-sm text-muted-foreground">admin@nexxabyte.com</p>
            </div>
            <Badge className="ml-auto">Admin</Badge>
          </div>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Password</Label>
          <p className="text-sm text-muted-foreground">
            This workspace uses single sign-on. Password management isn&apos;t available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

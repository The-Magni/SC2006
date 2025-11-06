"use client"

import { useState } from "react";
import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updatePersonal, updatePassword } from "@/lib/controllers/AuthController";
import { useUser } from "@/hooks/useUser";
import { weakPwMessage } from "@/error";

export default function ProfileContent() {
  const [profile, setProfile] = useUser();
  const [open, setOpen] = useState(false);

  // ----- form state (you can hook this up to your backend later) -----
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (newPass === current) {
      setError("New password must be different");
      return;
    }
    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }

    // ----- YOUR API CALL HERE -----
    // await changePassword({ current, new: newPass });
    // ---------------------------------
    const msg = weakPwMessage(newPass);
    if (!msg)
      try {
        await updatePassword(current, newPass);
        setError("");
        setOpen(false);
      } catch (error) {
        if (error instanceof Error)
          setError(error.message);
        else
          setError('Unknown error');
      }
    else
      setError(msg);
  };

  return (
    <Tabs defaultValue="personal" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      {/* Personal Information */}
      <TabsContent value="personal" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details and profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input name="name" id="name" defaultValue={profile ? profile.name: ''} />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john.doe@example.com" />
              </div> */}

              <div className="flex justify-end">
                <Button variant="default" formAction={ async (formData) => {
                  if (profile)
                    setProfile({...profile, name: formData.get('name') as string})
                  
                  await updatePersonal(formData);
                }
                }>Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Settings */}
      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security and authentication.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Password</Label>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current">Current Password</Label>
                        <Input
                          id="current"
                          type="password"
                          value={current}
                          onChange={(e) => setCurrent(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="new">New Password</Label>
                        <Input
                          id="new"
                          type="password"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="confirm">Confirm New Password</Label>
                        <Input
                          id="confirm"
                          type="password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                        />
                      </div>

                      {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>Save Password</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
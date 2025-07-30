"use client"; // Add client directive for hooks
import { useState } from 'react'; // Import useState
import { useRouter } from 'next/navigation'; // Import useRouter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation (can be expanded)
    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Simulate password reset success

    // Redirect to login page with a placeholder email and the new password as query params
    // In a real app, the email would likely come from a token or context
    const placeholderEmail = "user@example.com"; // Placeholder email
    router.push(`/auth/login?email=${encodeURIComponent(placeholderEmail)}&password=${encodeURIComponent(newPassword)}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader className="flex flex-col items-center">
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}> {/* Add onSubmit handler */}
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  placeholder="Enter your new password"
                  type="password"
                  value={newPassword} // Bind value to state
                  onChange={(e) => setNewPassword(e.target.value)} // Add onChange handler
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  placeholder="Confirm your new password"
                  type="password"
                  value={confirmNewPassword} // Bind value to state
                  onChange={(e) => setConfirmNewPassword(e.target.value)} // Add onChange handler
                />
              </div>
            </div>
            <Button className="w-full mt-6" type="submit"> {/* Set type to submit */}
              Reset Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

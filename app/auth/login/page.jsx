"use client"; // Add client directive for hooks
import { useState, useEffect } from 'react'; // Import useState and useEffect
import { useSearchParams, useRouter } from 'next/navigation'; // Import useSearchParams and useRouter
import Link from 'next/link'; // Import Link
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const passwordParam = searchParams.get('password');
    if (emailParam) {
      setEmail(emailParam);
    }
    if (passwordParam) {
      setPassword(passwordParam);
    }
  }, [searchParams]); // Depend on searchParams to re-run if query changes

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate login
    console.log("Logging in with:", email, password);
    // TODO: Implement actual login logic
    // Redirect to onboarding/org-setup after simulated successful login
    router.push('/onboarding/org-setup');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader className="flex items-center flex-col">
          <CardTitle>Login</CardTitle>
          <CardDescription>Login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}> {/* Add onSubmit handler */}
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // Add onChange handler
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // Add onChange handler
                />
              </div>
            </div>
            <Button className="w-full mt-6" type="submit"> {/* Set type to submit */}
              Login
            </Button>
            {/* Add Forgot Password link */}
            <div className="mt-4 text-center text-sm">
              <Link href="/auth/forgot-password" className="underline">
                Forgot your password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

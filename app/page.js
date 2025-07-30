"use client"; // Add client directive for hooks
import { useState, useEffect, Suspense } from 'react'; // Import useState, useEffect, and Suspense
import { useSearchParams, useRouter } from 'next/navigation'; // Import useSearchParams and useRouter
import Link from 'next/link'; // Import Link
import Cookies from 'js-cookie'; // Import Cookies library
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(null); // Add error state
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

  const handleSubmit = async (e) => { // Make handleSubmit async
    e.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true); // Set loading to true

    try {
      const response = await fetch('/api/auth/login', { // Call backend login API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {

        // Store the JWT in the specified cookie
        // The middleware expects the token as the first element of a JSON array string
        Cookies.set('sb-mnvxxmmrlvjgpnhditxc-auth-token', JSON.stringify([data.token, null, null, null, null]), { expires: 7 }); // Store for 7 days

        // Redirect to the select organization page
        router.push('/onboarding/select-organization');
      } else {
        setError(data.message || 'Login failed');
        console.error("Login failed:", data);
      }
    } catch (error) {
      setError('An error occurred during login');
      console.error("Login error:", error);
    } finally {
      setLoading(false); // Set loading to false
    }
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
                  required // Make email required
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
                  required // Make password required
                />
              </div>
            </div>
            {/* Wrap buttons and link in a single div to satisfy potential single-child requirement */}
            <div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>} {/* Display error message */}
              <Button className="w-full mt-6" type="submit" disabled={loading}> {/* Set type to submit and disable when loading */}
                {loading ? 'Logging In...' : 'Login'} {/* Change button text based on loading state */}
              </Button>
              {/* Add Sign Up button */}
              {/* Changed to a regular Button with onClick for navigation */}
              <Button
                className="w-full mt-2"
                variant="outline"
                type="button"
                onClick={() => router.push('/auth/register')}
              >
                Sign Up
              </Button>
              {/* Add Forgot Password link */}
              <div className="mt-4 text-center text-sm">
                <Link href="/auth/forgot-password" className="underline">
                  Forgot your password?
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}

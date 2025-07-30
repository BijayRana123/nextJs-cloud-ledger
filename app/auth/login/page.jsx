"use client"; // Add client directive for hooks
import { useState, useEffect, Suspense } from 'react'; // Import useState, useEffect, and Suspense
import { useSearchParams, useRouter } from 'next/navigation'; // Import useSearchParams and useRouter
import Link from 'next/link'; // Import Link
import Cookies from 'js-cookie'; // Import Cookies library
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}

export function LoginPage() {
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

  const handleSubmit = async (e) => { // Make function async
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        // Login successful

        
        // The cookie is set by the server in the login API response
        // We don't need to set it client-side with js-cookie
        
        // Just verify that we received a token in the response
        if (result.token) {

          
          // For debugging: Check if the token is properly formatted
          try {
            // Split the token to check its structure (header.payload.signature)
            const tokenParts = result.token.split('.');
            if (tokenParts.length !== 3) {
              console.error("LoginPage: Token does not have the expected JWT format (header.payload.signature)");
            } else {

              
              // Decode the payload (middle part) to check its content
              const payload = JSON.parse(atob(tokenParts[1]));

            }
          } catch (e) {
            console.error("LoginPage: Error analyzing token format:", e);
          }
        } else if (result.authToken) {

        } else {
          console.error("LoginPage: No token found in login response:", result);
        }
        
        // Verify that the cookie was set by the server

        
        if (result.organizationId) {
          localStorage.setItem('organizationId', result.organizationId); // Keep organizationId in local storage

        }

        // Check if there's a returnUrl in the query parameters
        const returnUrl = searchParams.get('returnUrl');
        
        if (returnUrl) {

          router.push(returnUrl); // Redirect back to the original page
        } else {

          // Redirect to the appropriate page (e.g., dashboard or organization setup)
          router.push('/onboarding/org-setup');
        }

      } else {
        // Handle login errors
        console.error("Login failed:", result.message);
        // TODO: Display error message to the user (e.g., invalid credentials)
        alert(`Login failed: ${result.message}`); // Basic alert for now
      }
    } catch (error) {
      console.error("Error during login:", error);
      // TODO: Handle network errors
      alert("An unexpected error occurred during login."); // Basic alert for now
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

"use client"; // Add client directive for hooks
import { useState } from 'react'; // Import useState
import { useRouter } from 'next/navigation'; // Import useRouter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(null); // Add error state
  const router = useRouter();

  const handleSubmit = async (e) => { // Make handleSubmit async
    e.preventDefault();
    setError(null); // Clear previous errors

    // Basic validation (can be expanded)
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true); // Set loading to true

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Include organizationName
      });

      const data = await response.json();

      if (response.ok) {

        // Redirect to login page or dashboard upon successful registration
        router.push('/auth/login');
      } else {
        setError(data.message || 'Registration failed');
        console.error("Registration failed:", data);
      }
    } catch (error) {
      setError('An error occurred during registration');
      console.error("Registration error:", error);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader className="flex items-center flex-col">
          <CardTitle>Register</CardTitle>
          <CardDescription>Create a new account</CardDescription>
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
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  placeholder="Confirm your password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} // Add onChange handler
                  required // Make confirm password required
                />
              </div>
               
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>} {/* Display error message */}
            <Button className="w-full mt-6" type="submit" disabled={loading}> {/* Set type to submit and disable when loading */}
              {loading ? 'Registering...' : 'Register'} {/* Change button text based on loading state */}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

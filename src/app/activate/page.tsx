"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Container,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
} from "@/components/ui";
import { Navbar, Footer } from "@/components/layout";

export default function ActivatePage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Activation failed. Please check your activation code.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12">
        <Container size="sm">
          <Card variant="default" className="shadow-md">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Activate One Academy Account</CardTitle>
              <CardDescription>
                Enter the activation code shared by your coach and establish your new password.
              </CardDescription>
            </CardHeader>

            {success ? (
              <CardContent className="space-y-4 text-center py-6">
                <div className="p-4 bg-[var(--color-success-bg)] text-[var(--color-success)] rounded-md border border-[var(--color-success-border)] text-sm font-medium">
                  Your account has been activated successfully! You may now sign in using your email and password.
                </div>
                <div className="pt-2">
                  <Link href="/login">
                    <Button variant="primary" className="w-full">
                      Proceed to Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <div
                      role="alert"
                      className="p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-md border border-[var(--color-error-border)] font-medium"
                    >
                      {error}
                    </div>
                  )}

                  <Input
                    label="Registered Email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Input
                    label="Single-Use Activation Code"
                    required
                    placeholder="e.g. A3F8B29D"
                    helperText="8-character code provided directly by your Coach."
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />

                  <Input
                    label="Create New Password"
                    type="password"
                    required
                    placeholder="At least 8 characters"
                    helperText="Must be at least 8 characters long."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </CardContent>

                <CardFooter className="flex-col gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={loading}
                  >
                    Activate Account
                  </Button>

                  <p className="text-xs text-[var(--color-text-secondary)] text-center">
                    Already activated?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-[var(--color-primary)] hover:underline"
                    >
                      Sign In
                    </Link>
                  </p>
                </CardFooter>
              </form>
            )}
          </Card>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

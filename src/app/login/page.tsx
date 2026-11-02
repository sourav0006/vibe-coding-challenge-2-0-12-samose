"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Select,
  LoadingState,
} from "@/components/ui";
import { Navbar, Footer } from "@/components/layout";
import type { UserRole } from "@/models";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role");
  const errorParam = searchParams.get("error");

  const initialRole: UserRole =
    roleParam === "player" || roleParam === "scout" || roleParam === "coach"
      ? roleParam
      : "coach";

  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "unauthorized_role"
      ? "You do not have permission for that area. Please sign in with an authorized role."
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, requestedRole: role }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Login failed. Please check your credentials.");
        return;
      }

      router.push(`/dashboard/${data.user.role}`);
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="default" className="shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Sign in to One Academy</CardTitle>
        <CardDescription>
          Select your designated role and enter your verified credentials.
        </CardDescription>
      </CardHeader>

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

          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { value: "coach", label: "Coach" },
              { value: "player", label: "Player / Athlete" },
              { value: "scout", label: "Scout" },
            ]}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="name@oneacademy.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
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
            Sign In
          </Button>

          <p className="text-xs text-[var(--color-text-secondary)] text-center">
            Have an activation code?{" "}
            <Link
              href="/activate"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Activate Player or Scout Account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function LoginFormWrapper() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "default";

  return <LoginForm key={roleParam} />;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12">
        <Container size="sm">
          <Suspense fallback={<LoadingState message="Loading login portal..." size="sm" />}>
            <LoginFormWrapper />
          </Suspense>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

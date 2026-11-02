import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xs border-b border-[var(--color-border)]">
      <Container size="xl">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo showTagline />
          </Link>

          <div className="flex items-center gap-3">
            <Badge variant="success" size="sm" dot>
              Phase 4 Active
            </Badge>

            <Link href="/activate">
              <Button variant="ghost" size="sm">
                Activate
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

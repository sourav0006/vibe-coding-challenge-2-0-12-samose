import React from "react";
import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="mt-auto w-full bg-white border-t border-[var(--color-border)] py-6">
      <Container size="xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-secondary)]">
          <p>© 2026 One Academy. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>Sports Academy Management System</span>
            <span aria-hidden="true">•</span>
            <span className="font-medium text-[var(--color-text-primary)]">Architecture Foundation</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}

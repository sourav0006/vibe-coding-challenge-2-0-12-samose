import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="mt-auto w-full bg-white border-t border-slate-200/80 py-6">
      <Container size="xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; 2026 One Academy. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>Sports Academy Management Platform</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}

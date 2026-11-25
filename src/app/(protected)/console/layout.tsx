import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsoleShell } from "./console-shell";

export const metadata: Metadata = {
  title: {
    default: "Tableau de bord",
    template: "%s · YowYob Payment",
  },
};

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ConsoleShell>{children}</ConsoleShell>
    </Suspense>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espaces de travail",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

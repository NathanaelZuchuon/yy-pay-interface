export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="yypay:min-h-screen">{children}</div>;
}

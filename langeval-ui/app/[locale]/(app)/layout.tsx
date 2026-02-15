import { Sidebar } from "@/components/sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="h-full p-4 md:p-8 bg-dot-pattern min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

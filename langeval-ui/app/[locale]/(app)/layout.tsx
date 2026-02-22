import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#0B0F19]">
        <Sidebar />
        <main className="flex-1 min-w-0 pt-16 lg:pt-0">
          <div className="h-full p-4 md:p-8 min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

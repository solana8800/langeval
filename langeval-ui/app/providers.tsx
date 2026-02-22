"use client";

import { SessionProvider } from "next-auth/react";

import { WorkspaceProvider } from "@/components/providers/workspace-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <WorkspaceProvider>
                {children}
            </WorkspaceProvider>
        </SessionProvider>
    );
}

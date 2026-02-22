"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    // useEffect(() => {
    //     if (status === "unauthenticated" && pathname !== "/login") {
    //         router.push("/login");
    //     }
    // }, [status, router, pathname]);

    if (status === "loading") {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }



    // Allow access even if unauthenticated (Demo Mode)
    return <>{children}</>;
}

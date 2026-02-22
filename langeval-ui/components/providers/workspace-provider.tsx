"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

// Type definitions
export interface Workspace {
    id: string;
    name: string;
    is_personal: boolean;
    role: "OWNER" | "EDITOR" | "VIEWER";
}

interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    setCurrentWorkspace: (workspace: Workspace) => void;
    isLoading: boolean;
    refreshWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);

    // Fetch workspaces
    // Use apiClient to ensure Authorization header is attached
    const { data: workspaces, error, isLoading, mutate } = useSWR<Workspace[]>(
        status === "authenticated" ? "/workspaces" : null,
        (url) => apiClient(url)
    );

    // Initialize workspace from LocalStorage or Default
    useEffect(() => {
        if (workspaces && workspaces.length > 0) {
            const storedWorkspaceId = localStorage.getItem("langeval_current_workspace_id");

            let foundWorkspace: Workspace | undefined;
            if (storedWorkspaceId) {
                foundWorkspace = workspaces.find((w) => w.id === storedWorkspaceId);
            }

            if (foundWorkspace) {
                // If stored ID is valid, use it
                if (currentWorkspace?.id !== foundWorkspace.id) {
                    setCurrentWorkspaceState(foundWorkspace);
                }
            } else {
                // Fallback: Default to the first workspace (usually Personal)
                const defaultWorkspace = workspaces[0];
                setCurrentWorkspaceState(defaultWorkspace);
                // CRITICAL: Persist immediately so API client can read it
                localStorage.setItem("langeval_current_workspace_id", defaultWorkspace.id);
            }
        }
    }, [workspaces]);

    const setCurrentWorkspace = (workspace: Workspace) => {
        setCurrentWorkspaceState(workspace);
        localStorage.setItem("langeval_current_workspace_id", workspace.id);
    };

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces: workspaces || [],
                currentWorkspace,
                setCurrentWorkspace,
                isLoading,
                refreshWorkspaces: mutate,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}

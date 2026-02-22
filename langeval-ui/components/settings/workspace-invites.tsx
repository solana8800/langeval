"use client";

import { useWorkspace } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { API_BASE_URL } from "@/lib/api-utils";
import { useSession } from "next-auth/react";
import { Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { cn } from "@/lib/utils";

type Invite = {
    code: string;
    email: string;
    workspace_name: string;
    expires_at: string;
    invite_link: string;
};

const fetcher = (url: string, token: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) =>
        res.json()
    );

export function WorkspaceInvitesList({ className }: { className?: string }) {
    const { currentWorkspace } = useWorkspace();
    const { data: session } = useSession();

    const {
        data: invites,
        error,
        isLoading,
        mutate,
    } = useSWR<Invite[]>(
        currentWorkspace && session?.accessToken
            ? [`${API_BASE_URL}/workspaces/${currentWorkspace.id}/invites`, session.accessToken]
            : null,
        ([url, token]: [string, string]) => fetcher(url, token)
    );

    const handleCancelInvite = async (code: string) => {
        if (!session?.accessToken) return;
        if (!confirm("Are you sure you want to cancel this invite?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/invites/${code}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (res.ok) {
                toast.success("Invite cancelled");
                mutate();
            } else {
                const data = await res.json() as { detail: string };
                toast.error(data.detail || "Failed to cancel invite");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        toast.success("Invite link copied");
    };

    if (!currentWorkspace) return null;

    return (
        <div className={cn("rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm overflow-hidden", className)}>
            <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-bold text-white mb-1">Pending Invites</h3>
                <p className="text-slate-400 text-sm">
                    Pending invitations for <strong>{currentWorkspace.name}</strong>.
                </p>
            </div>
            <div className="p-0">
                <Table>
                    <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-slate-500">Email</TableHead>
                            <TableHead className="text-slate-500">Expires At</TableHead>
                            <TableHead className="text-right text-slate-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow className="border-white/5">
                                <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : !invites || invites.length === 0 ? (
                            <TableRow className="border-white/5">
                                <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                    No pending invites.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invites.map((invite) => (
                                <TableRow key={invite.code} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <TableCell className="text-slate-300 font-medium">{invite.email}</TableCell>
                                    <TableCell className="text-slate-400">{new Date(invite.expires_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => copyLink(invite.invite_link)}
                                            title="Copy Link"
                                            className="text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        {(currentWorkspace.role === "OWNER" || currentWorkspace.role === "EDITOR") && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleCancelInvite(invite.code)}
                                                title="Cancel Invite"
                                                className="text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

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
import { Trash2, User } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Member = {
    user_id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    role: string;
    joined_at: string;
};

const fetcher = (url: string, token: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) =>
        res.json()
    );

export function WorkspaceMembersList({ className }: { className?: string }) {
    const { currentWorkspace } = useWorkspace();
    const { data: session } = useSession();

    const {
        data: members,
        error,
        isLoading,
        mutate,
    } = useSWR<Member[]>(
        currentWorkspace && session?.accessToken
            ? [`${API_BASE_URL}/workspaces/${currentWorkspace.id}/members`, session.accessToken]
            : null,
        ([url, token]: [string, string]) => fetcher(url, token)
    );

    const handleRemoveMember = async (userId: string) => {
        if (!currentWorkspace || !session?.accessToken) return;
        if (!confirm("Are you sure you want to remove this member?")) return;

        try {
            const res = await fetch(
                `${API_BASE_URL}/workspaces/${currentWorkspace.id}/members/${userId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                }
            );

            if (res.ok) {
                toast.success("Member removed successfully");
                mutate();
            } else {
                const data = await res.json() as { detail: string };
                toast.error(data.detail || "Failed to remove member");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    if (!currentWorkspace) return null;

    return (
        <div className={cn("rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm overflow-hidden", className)}>
            <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-bold text-white mb-1">Members</h3>
                <p className="text-slate-400 text-sm">
                    Manage members of <strong>{currentWorkspace.name}</strong>.
                </p>
            </div>
            <div className="p-0">
                <Table>
                    <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-slate-500">User</TableHead>
                            <TableHead className="text-slate-500">Role</TableHead>
                            <TableHead className="text-slate-500">Joined</TableHead>
                            <TableHead className="text-right text-slate-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow className="border-white/5">
                                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : !members || members.length === 0 ? (
                            <TableRow className="border-white/5">
                                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => (
                                <TableRow key={member.user_id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-white/10">
                                            <AvatarImage src={member.avatar_url} />
                                            <AvatarFallback className="bg-indigo-500/10 text-indigo-400 font-bold text-xs">{member.email[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-300">{member.name || "Unknown"}</span>
                                            <span className="text-xs text-slate-500">{member.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-400">
                                        <div className="inline-flex items-center px-2 py-1 rounded bg-white/5 border border-white/5 text-xs">
                                            {member.role}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-400">{new Date(member.joined_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        {/* Only Owner can remove, and cannot remove self (though Backend blocks it too) */}
                                        {member.role !== "OWNER" && currentWorkspace.role === "OWNER" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveMember(member.user_id)}
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

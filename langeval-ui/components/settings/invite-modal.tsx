"use client";

import { API_BASE_URL } from "@/lib/api-client";
import { useState } from "react";
import { Copy, Loader2, Check, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { useSession } from "next-auth/react";

interface InviteMemberModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteMemberModal({
    open,
    onOpenChange,
}: InviteMemberModalProps) {
    const { currentWorkspace } = useWorkspace();
    const { data: session } = useSession();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("VIEWER");
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [isCopied, setIsCopied] = useState(false);

    // Reset state when modal opens/closes
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setEmail("");
            setRole("VIEWER");
            setInviteLink("");
            setIsCopied(false);
        }
        onOpenChange(open);
    };

    const handleGenerateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWorkspace || !session?.user) return;

        setIsLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/workspaces/${currentWorkspace.id}/invites`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                    body: JSON.stringify({ email, role }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to generate invite link");
            }

            const data = await response.json();
            const origin = window.location.origin;
            const link = `${origin}/invite/${data.code}`;

            setInviteLink(link);
            toast.success("Invite link generated!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate invite link. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("Link copied to clipboard!");
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#0B0F19] border-white/10 text-slate-300">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-400" />
                        Invite to {currentWorkspace?.name}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Generate a unique link to invite a new member to this workspace.
                    </DialogDescription>
                </DialogHeader>

                {!inviteLink ? (
                    <form onSubmit={handleGenerateLink}>
                        <div className="grid gap-5 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-slate-400">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="colleague@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role" className="text-slate-400">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="bg-black/20 border-white/10 text-white focus:ring-indigo-500/50">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0B0F19] border-white/10 text-slate-300">
                                        <SelectItem value="VIEWER" className="focus:bg-white/10 focus:text-white">Viewer</SelectItem>
                                        <SelectItem value="EDITOR" className="focus:bg-white/10 focus:text-white">Editor</SelectItem>
                                        <SelectItem value="OWNER" className="focus:bg-white/10 focus:text-white">Owner</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white w-full sm:w-auto">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Link
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="grid gap-5 py-4">
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    defaultValue={inviteLink}
                                    readOnly
                                    className="h-10 bg-black/20 border-white/10 text-slate-300 font-mono text-xs"
                                />
                            </div>
                            <Button type="button" size="sm" className="px-3 bg-white/10 hover:bg-white/20 text-white" onClick={copyToClipboard}>
                                {isCopied ? (
                                    <Check className="h-4 w-4 text-green-400" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                                <span className="sr-only">Copy</span>
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

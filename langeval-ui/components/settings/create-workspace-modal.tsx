"use client";

import { useState } from "react";
import { Loader2, Plus, Building2 } from "lucide-react";
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
import { apiClient } from "@/lib/api-client";
import { useWorkspace } from "@/components/providers/workspace-provider";

interface CreateWorkspaceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceModal({
    open,
    onOpenChange,
}: CreateWorkspaceModalProps) {
    const { refreshWorkspaces, setCurrentWorkspace } = useWorkspace();
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setName("");
        }
        onOpenChange(open);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const data = await apiClient("/workspaces", {
                method: "POST",
                body: JSON.stringify({ name }),
            });

            toast.success("Workspace created successfully!");
            refreshWorkspaces();
            if (data) {
                setCurrentWorkspace(data);
            }
            handleOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create workspace. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#0B0F19] border-white/10 text-slate-300">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-400" />
                        Create Workspace
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Workspaces are where you manage your AI agents and evaluations.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate}>
                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-slate-400">Workspace Name</Label>
                            <Input
                                id="name"
                                placeholder="My Awesome Team"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500/50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleOpenChange(false)}
                            className="text-slate-400 hover:text-white hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Workspace
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

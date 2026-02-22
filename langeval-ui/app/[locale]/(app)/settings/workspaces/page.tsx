"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, ShieldCheck, Check, Search, Building2, User, Sparkles, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { API_BASE_URL } from "@/lib/api-utils";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkspaceMembersList } from "@/components/settings/workspace-members";
import { WorkspaceInvitesList } from "@/components/settings/workspace-invites";
import { InviteMemberModal } from "@/components/settings/invite-modal";
import { CreateWorkspaceModal } from "@/components/settings/create-workspace-modal";
import { useWorkspace, type Workspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const workspaceSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
});

// Custom Card Component to match Landing Page "Glass" style
const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn(
        "rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm relative overflow-hidden",
        className
    )}>
        {children}
    </div>
);

export default function WorkspacesPage() {
    const { currentWorkspace, setCurrentWorkspace, workspaces, isLoading } = useWorkspace();
    const [open, setOpen] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const t = useTranslations("Settings");

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const filteredWorkspaces = workspaces.filter(ws =>
        ws.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-indigo-500/30 lg:-m-8 p-8 overflow-hidden">
            {/* Background Effects - Matching Landing Page */}
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-violet-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-4"
                >
                    <div className="inline-flex items-center w-fit gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        <span>Workspace Management</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Workspace Settings</h2>
                    <p className="text-lg text-slate-400 max-w-2xl">
                        Manage your active workspace, invite team members, and switch between different teams effortlessly.
                    </p>
                </motion.div>

                {/* Current Workspace Highlight - Hero Style */}
                {currentWorkspace && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="relative rounded-3xl p-8 md:p-10 border border-indigo-500/20 overflow-hidden bg-gradient-to-br from-indigo-900/20 to-violet-900/20 backdrop-blur-md">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -z-10" />

                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                                        <Avatar className="h-24 w-24 rounded-2xl border border-white/10 shadow-2xl">
                                            <AvatarFallback className="rounded-2xl bg-[#0B0F19] text-indigo-400 text-3xl font-bold">
                                                {getInitials(currentWorkspace.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-[#0B0F19]">
                                            <ShieldCheck className="w-4 h-4 text-white" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-3xl font-bold text-white">{currentWorkspace.name}</h3>
                                            <Badge className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border-0">
                                                {currentWorkspace.role}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400">
                                            <div className="flex items-center gap-1.5 min-w-max">
                                                <Check className="w-4 h-4 text-green-400" />
                                                <span className="text-green-400/90 whitespace-nowrap">Active Workspace</span>
                                            </div>
                                            <span className="text-white/10 hidden sm:inline">|</span>
                                            <div className="flex items-center gap-1.5 min-w-max">
                                                {currentWorkspace.is_personal ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                                <span className="whitespace-nowrap">{currentWorkspace.is_personal ? "Personal Plan" : "Team Plan"}</span>
                                            </div>
                                            <span className="text-white/10 hidden md:inline">|</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(currentWorkspace.id);
                                                    toast.success("Workspace ID copied");
                                                }}
                                                className="group/id flex items-center gap-1.5 text-xs font-mono bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                                                title="Click to copy ID"
                                            >
                                                <span className="opacity-50">ID:</span>
                                                <span className="opacity-80">{currentWorkspace.id}</span>
                                                <Copy className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setShowInviteModal(true)}
                                    size="lg"
                                    className="h-12 px-8 bg-white text-indigo-950 hover:bg-indigo-50 font-bold rounded-full shadow-lg shadow-indigo-500/10 transition-all hover:scale-105"
                                >
                                    <Users className="mr-2 h-5 w-5" /> Invite Member
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Main Content Tabs */}
                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl w-full max-w-md mb-8">
                        <TabsTrigger
                            value="members"
                            className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-white transition-all"
                        >
                            Members & Invites
                        </TabsTrigger>
                        <TabsTrigger
                            value="all_workspaces"
                            className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-white transition-all"
                        >
                            All Workspaces
                        </TabsTrigger>
                    </TabsList>

                    {/* Members Tab */}
                    <TabsContent value="members" className="space-y-8 mt-0">
                        <div className="grid gap-8 md:grid-cols-1 xl:grid-cols-2">
                            <WorkspaceMembersList className="glass-panel" />
                            <WorkspaceInvitesList className="glass-panel" />
                        </div>
                    </TabsContent>

                    {/* All Workspaces Tab */}
                    <TabsContent value="all_workspaces" className="mt-0">
                        <GlassCard>
                            <div className="p-6 border-b border-white/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-white">Your Workspaces</h3>
                                        <p className="text-slate-400">Switch context or create new teams.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                            <Input
                                                type="search"
                                                placeholder="Search workspaces..."
                                                className="w-full md:w-[260px] pl-10 bg-black/20 border-white/10 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500/50 rounded-lg"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            onClick={() => setOpen(true)}
                                            className="bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30"
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Create Workspace
                                        </Button>
                                        <CreateWorkspaceModal open={open} onOpenChange={setOpen} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Table>
                                    <TableHeader className="bg-white/[0.02]">
                                        <TableRow className="hover:bg-transparent border-white/5">
                                            <TableHead className="text-slate-500">Workspace Name</TableHead>
                                            <TableHead className="text-slate-500">Workspace ID</TableHead>
                                            <TableHead className="text-slate-500">Role</TableHead>
                                            <TableHead className="text-slate-500">Plan Type</TableHead>
                                            <TableHead className="text-right text-slate-500">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow className="border-white/5">
                                                <TableCell colSpan={5} className="text-center py-12 text-slate-500 animate-pulse">Loading workspaces...</TableCell>
                                            </TableRow>
                                        ) : filteredWorkspaces.length === 0 ? (
                                            <TableRow className="border-white/5">
                                                <TableCell colSpan={5} className="text-center py-16 text-slate-500">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Building2 className="h-10 w-10 opacity-20" />
                                                        <p>No workspaces found matching "{searchTerm}".</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredWorkspaces.map((ws) => (
                                                <TableRow
                                                    key={ws.id}
                                                    className={cn(
                                                        "group cursor-pointer transition-colors border-white/5",
                                                        currentWorkspace?.id === ws.id ? "bg-indigo-500/10 hover:bg-indigo-500/15" : "hover:bg-white/[0.02]"
                                                    )}
                                                    onClick={() => {
                                                        if (currentWorkspace?.id !== ws.id) {
                                                            setCurrentWorkspace(ws);
                                                            toast.success(`Switched to ${ws.name}`);
                                                        }
                                                    }}
                                                >
                                                    <TableCell className="font-medium text-slate-300 group-hover:text-white transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9 border border-white/10 group-hover:border-indigo-500/50 transition-colors">
                                                                <AvatarFallback className={cn(
                                                                    "text-xs font-bold",
                                                                    currentWorkspace?.id === ws.id ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400"
                                                                )}>
                                                                    {getInitials(ws.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className={cn(currentWorkspace?.id === ws.id && "text-indigo-400")}>{ws.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div
                                                            className="flex items-center gap-2 group/line-id"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(ws.id);
                                                                toast.success("Workspace ID copied");
                                                            }}
                                                        >
                                                            <code className="text-[10px] font-mono opacity-40 group-hover/line-id:opacity-80 transition-opacity">
                                                                {ws.id.slice(0, 8)}...
                                                            </code>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover/line-id:opacity-100 transition-opacity"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs font-normal bg-white/5 border-white/10 text-slate-400">
                                                            {ws.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500">
                                                        <div className="flex items-center gap-2">
                                                            {ws.is_personal ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                                                            {ws.is_personal ? "Personal" : "Team"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {currentWorkspace?.id === ws.id ? (
                                                            <div className="flex items-center justify-end gap-2 text-indigo-400 font-medium text-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                                                                Active
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-white hover:bg-white/10"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCurrentWorkspace(ws);
                                                                    toast.success(`Switched to ${ws.name}`);
                                                                }}
                                                            >
                                                                Switch
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </GlassCard>
                    </TabsContent>
                </Tabs>

                <InviteMemberModal open={showInviteModal} onOpenChange={setShowInviteModal} />
            </div>
        </div>
    );
}

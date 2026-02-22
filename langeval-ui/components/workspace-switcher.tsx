"use client";

import * as React from "react";
import { ChevronsUpDown, Check, Plus, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteMemberModal } from "@/components/settings/invite-modal";
import { CreateWorkspaceModal } from "@/components/settings/create-workspace-modal";

export function WorkspaceSwitcher({ className, isCollapsed = false }: { className?: string, isCollapsed?: boolean }) {
    const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
    const [open, setOpen] = React.useState(false);
    const [showInviteModal, setShowInviteModal] = React.useState(false);
    const [showCreateModal, setShowCreateModal] = React.useState(false);

    if (!currentWorkspace) {
        return (
            <div className={cn("w-full flex justify-center", className)}>
                <Button
                    variant="ghost"
                    disabled
                    className={cn(
                        "w-full justify-between px-1.5 h-8 opacity-50",
                        isCollapsed ? "justify-center px-0 h-7 w-7 mx-auto" : ""
                    )}
                >
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                        <div className="h-5 w-5 rounded-full bg-slate-200 animate-pulse shrink-0" />
                        {!isCollapsed && (
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-full max-w-[100px]" />
                        )}
                    </div>
                    {!isCollapsed && <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50 shrink-0" />}
                </Button>
            </div>
        );
    }

    const personalWorkspaces = workspaces.filter(w => w.is_personal);
    const teamWorkspaces = workspaces.filter(w => !w.is_personal);

    return (
        <div className={cn("w-full", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between px-1.5 h-8 hover:bg-slate-100 transition-colors",
                            isCollapsed ? "justify-center px-0 h-7 w-7 mx-auto" : ""
                        )}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Avatar className="h-5 w-5 border shrink-0">
                                <AvatarImage
                                    src={`https://avatar.vercel.sh/${currentWorkspace.id}.png`}
                                    alt={currentWorkspace.name}
                                />
                                <AvatarFallback className="text-[10px]">{currentWorkspace.name[0]}</AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <span className="truncate text-xs font-medium text-slate-700">{currentWorkspace.name}</span>
                            )}
                        </div>
                        {!isCollapsed && <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50 shrink-0" />}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start" side={isCollapsed ? "right" : "bottom"}>
                    <Command className="bg-white">
                        <CommandList>
                            <CommandInput placeholder="Search workspace..." className="h-9" />
                            <CommandEmpty>No workspace found.</CommandEmpty>

                            {personalWorkspaces.length > 0 && (
                                <CommandGroup heading="Personal Account" className="text-[10px] text-slate-400">
                                    {personalWorkspaces.map((workspace) => (
                                        <CommandItem
                                            key={workspace.id}
                                            onSelect={() => {
                                                setCurrentWorkspace(workspace);
                                                setOpen(false);
                                            }}
                                            className="text-xs py-2"
                                        >
                                            <Avatar className="mr-2 h-4 w-4 border">
                                                <AvatarImage
                                                    src={`https://avatar.vercel.sh/${workspace.id}.png`}
                                                    alt={workspace.name}
                                                />
                                                <AvatarFallback className="text-[8px]">{workspace.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">{workspace.name}</span>
                                            <Check
                                                className={cn(
                                                    "ml-auto h-3 w-3",
                                                    currentWorkspace.id === workspace.id
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {teamWorkspaces.length > 0 && (
                                <CommandGroup heading="Teams" className="text-[10px] text-slate-400">
                                    {teamWorkspaces.map((workspace) => (
                                        <CommandItem
                                            key={workspace.id}
                                            onSelect={() => {
                                                setCurrentWorkspace(workspace);
                                                setOpen(false);
                                            }}
                                            className="text-xs py-2"
                                        >
                                            <Avatar className="mr-2 h-4 w-4 border">
                                                <AvatarImage
                                                    src={`https://avatar.vercel.sh/${workspace.id}.png`}
                                                    alt={workspace.name}
                                                />
                                                <AvatarFallback className="text-[8px]">{workspace.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">{workspace.name}</span>
                                            <Check
                                                className={cn(
                                                    "ml-auto h-3 w-3",
                                                    currentWorkspace.id === workspace.id
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                        <CommandSeparator />
                        <CommandList>
                            <CommandGroup>
                                <CommandItem
                                    onSelect={() => {
                                        setOpen(false);
                                        setShowInviteModal(true);
                                    }}
                                    className="text-xs cursor-pointer"
                                >
                                    <Users className="mr-2 h-4 w-4 text-slate-500" />
                                    Invite Member
                                </CommandItem>
                                <CommandItem
                                    onSelect={() => {
                                        setOpen(false);
                                        setShowCreateModal(true);
                                    }}
                                    className="text-xs cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4 text-slate-500" />
                                    Create Workspace
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <InviteMemberModal open={showInviteModal} onOpenChange={setShowInviteModal} />
            <CreateWorkspaceModal open={showCreateModal} onOpenChange={setShowCreateModal} />
        </div>
    );
}

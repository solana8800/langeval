"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, Users as UsersIcon, LogOut, LogIn } from "lucide-react";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/providers/workspace-provider";

interface UserProfileProps {
    isCollapsed: boolean;
}

export function UserProfile({ isCollapsed }: UserProfileProps) {
    const { data: session } = useSession();
    const { currentWorkspace } = useWorkspace();
    const t = useTranslations("Sidebar");
    const user = session?.user;

    if (!user) {
        return (
            <I18nLink
                href="/login"
                className={cn(
                    "flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded-md transition-colors w-full p-2 text-slate-600 hover:text-slate-900",
                    isCollapsed ? "justify-center" : ""
                )}
                title={t("login")}
            >
                <LogIn className="h-5 w-5" />
                {!isCollapsed && <span className="text-sm font-medium">{t("login")}</span>}
            </I18nLink>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={cn(
                    "flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 rounded-md transition-colors w-full",
                    isCollapsed ? "justify-center p-1" : "p-1.5"
                )}>
                    <Avatar className="h-7 w-7 border shrink-0">
                        <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                            {user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>

                    {!isCollapsed && (
                        <>
                            <div className="flex flex-col flex-1 min-w-0 animate-in fade-in">
                                <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Settings className="h-4 w-4 text-slate-400 hover:text-slate-900" />
                        </>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount side={isCollapsed ? "right" : "top"}>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <I18nLink href="/profile" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>{t("profile")}</span>
                        </I18nLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <I18nLink href="/settings/workspaces" className="cursor-pointer">
                            <UsersIcon className="mr-2 h-4 w-4" />
                            <span>{t("manageTeam")}</span>
                        </I18nLink>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("logout")}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

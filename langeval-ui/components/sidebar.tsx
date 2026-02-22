"use client";

import { useState, useEffect } from "react";
import { usePathname as useNextPathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link as I18nLink, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-utils";
// import { navGroups } from "@/lib/mock-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserProfile } from "@/components/user-profile";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Menu,
  BookOpen,
  LayoutDashboard,
  BarChart3,
  Terminal,
  Activity,
  GitBranch,
  BrainCircuit,
  Target,
  Users,
  ShieldCheck,
  Webhook,
  FileCode,
  Zap,
  Settings,
  Database,
  LogOut,
  User,
  Users as UsersIcon,
  ChevronLeft,
  Clock,
  Languages
} from "lucide-react";

// Icon mapping
const iconMap: Record<string, any> = {
  BookOpen,
  LayoutDashboard,
  BarChart3,
  Terminal,
  Activity,
  GitBranch,
  BrainCircuit,
  Target,
  Users,
  ShieldCheck,
  Webhook,
  FileCode,
  Zap,
  Settings,
  Database,
  Clock
};

export function Sidebar() {
  const t = useTranslations("Sidebar");
  const navT = useTranslations("Navigation");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [navGroups, setNavGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/navigation')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          // Filter out Documentation/Docs from API response to avoid duplication with Fixed Bottom section
          const filteredData = data.data.map((group: any) => ({
            ...group,
            items: group.items.filter((item: any) => item.href !== '/docs' && item.href !== '/documentation')
          })).filter((group: any) => group.items.length > 0);

          setNavGroups(filteredData);
        }
      })
      .catch(err => console.error("Failed to fetch nav", err))
      .finally(() => setLoading(false));
  }, []);

  // Hydration fix & LocalStorage for collapse state could be added here

  if (loading) {
    return <div className="hidden lg:block w-64 h-screen border-r bg-white p-6 shrink-0"><div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-3/4"></div><div className="h-4 bg-slate-100 rounded w-1/2"></div><div className="space-y-2 pt-4"><div className="h-10 bg-slate-100 rounded"></div><div className="h-10 bg-slate-100 rounded"></div><div className="h-10 bg-slate-100 rounded"></div></div></div></div>;
  }

  const navContent = (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      {/* Header */}
      {/* Header */}
      <div className={cn("flex items-center bg-white shrink-0 transition-all", isCollapsed ? "h-[60px] justify-center px-2" : "h-[60px] px-6 justify-between")}>
        <I18nLink className="flex items-center gap-2 font-bold text-xl text-primary" href="/" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-white text-lg">E</span>
          </div>
          {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{t("brand")}</span>}
        </I18nLink>

        {!isCollapsed && (
          <div className="flex items-center gap-1 bg-slate-50 rounded-full px-1.5 py-0.5 border shadow-sm animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => router.replace(pathname, { locale: 'en' })}
              className={cn("text-[10px] font-bold px-1 rounded transition-colors", locale === 'en' ? "text-indigo-600 bg-white shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >
              EN
            </button>
            <div className="w-px h-2 bg-slate-200" />
            <button
              onClick={() => router.replace(pathname, { locale: 'vi' })}
              className={cn("text-[10px] font-bold px-1 rounded transition-colors", locale === 'vi' ? "text-indigo-600 bg-white shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >
              VI
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Nav */}
      <div className={cn("flex-1 overflow-y-auto py-4 custom-scrollbar flex flex-col", isCollapsed ? "px-2" : "px-3")}>
        <div className="flex flex-col gap-6">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex flex-col gap-2">
              {!isCollapsed && (
                <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 animate-in fade-in duration-200">
                  {(() => {
                    const titleKey = group.title === "Documentation" ? "documentation" :
                      group.title === "Executive View" ? "executiveView" :
                        group.title === "Developer Tools" ? "developerTools" :
                          group.title === "Evaluation" ? "evaluation" :
                            group.title === "Security & Benchmarks" ? "securityBenchmarks" :
                              group.title === "Configuration" ? "configuration" : group.title.toLowerCase().replace(/\s+/g, '');
                    return navT.has(`groups.${titleKey}`) ? navT(`groups.${titleKey}`) : group.title;
                  })()}
                </h4>
              )}
              {isCollapsed && groupIndex > 0 && <div className="h-px bg-slate-100 mx-2 my-1" />}

              <div className="flex flex-col gap-1">
                {group.items.map((item: any, itemIndex: number) => {
                  const Icon = iconMap[item.icon] || Activity;
                  const isActive = pathname === item.href;
                  const itemKey = item.name;
                  const localizedName = navT.has(`items.${itemKey}.name`) ? navT(`items.${itemKey}.name`) : item.name;
                  const localizedDesc = navT.has(`items.${itemKey}.description`) ? navT(`items.${itemKey}.description`) : item.description;

                  return (
                    <I18nLink
                      key={itemIndex}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all relative",
                        isCollapsed ? "justify-center px-2" : "items-start px-3",
                        isActive
                          ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                      title={isCollapsed ? localizedName : localizedDesc}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />

                      {!isCollapsed && (
                        <div className="flex flex-col gap-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                          <span>{localizedName}</span>
                          <span className={cn("text-[10px] leading-tight line-clamp-1 font-normal", isActive ? "text-indigo-600/80" : "text-slate-400")}>
                            {localizedDesc}
                          </span>
                        </div>
                      )}

                      {/* Tooltip for Collapsed State */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                          {localizedName}
                        </div>
                      )}
                    </I18nLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Documentation Section - Moved inside ScrollArea (Bottom) */}
        <div className="mt-auto pt-6">
          {!isCollapsed && (
            <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 animate-in fade-in duration-200 mb-2">
              {t("resources")}
            </h4>
          )}
          <I18nLink
            href="/docs"
            onClick={() => setOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all relative",
              isCollapsed ? "justify-center px-2" : "items-start px-3",
              pathname.startsWith("/docs")
                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
            title={isCollapsed ? t("documentation") : t("docsDesc")}
          >
            <BookOpen className={cn("h-5 w-5 shrink-0 transition-colors", pathname.startsWith("/docs") ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600")} />

            {!isCollapsed && (
              <div className="flex flex-col gap-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                <span>{t("documentation")}</span>
                <span className="text-[10px] leading-tight line-clamp-1 font-normal text-slate-400">
                  {t("docDescription")}
                </span>
              </div>
            )}

            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {t("documentation")}
              </div>
            )}
          </I18nLink>
        </div>
      </div>

      {/* Footer / User Profile & Toggle */}
      <div className={cn("border-t bg-slate-50/50 shrink-0 flex flex-col gap-0.5", isCollapsed ? "p-1 items-center" : "p-1.5")}>


        {/* Workspace Switcher Moved to Bottom */}
        <div className="mb-1">
          <WorkspaceSwitcher isCollapsed={isCollapsed} />
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 absolute -right-3 top-20 border border-white shadow-sm z-50 transition-transform",
            isCollapsed && "rotate-180"
          )}
          title={isCollapsed ? t("expand") : t("collapse")}
        >
          <ChevronLeft className="h-3 w-3" />
        </button>

        <UserProfile isCollapsed={isCollapsed} />
      </div>
    </div >
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:block border-r bg-white dark:bg-slate-900 h-screen sticky top-0 shrink-0 transition-[width] duration-300 ease-in-out z-40 shadow-sm",
          isCollapsed ? "w-[70px]" : "w-64"
        )}
      >
        {navContent}
      </div>

      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 bg-white rounded-md shadow-md border border-slate-200 text-slate-700 hover:bg-slate-50">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-0 gap-0">
            <div className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </div>

            <div className="flex h-full flex-col overflow-hidden bg-white">
              <div className="flex h-[60px] items-center border-b px-6 bg-white shrink-0 justify-between">
                <I18nLink className="flex items-center gap-2 font-bold text-xl text-primary" href="/" onClick={() => setOpen(false)}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="font-bold text-white text-lg">E</span>
                  </div>
                  <span>{t("brand")}</span>
                </I18nLink>

                <div className="flex items-center gap-1 bg-slate-50 rounded-full px-1.5 py-0.5 border shadow-sm">
                  <button
                    onClick={() => router.replace(pathname, { locale: 'en' })}
                    className={cn("text-[10px] font-bold px-1 rounded transition-colors", locale === 'en' ? "text-indigo-600 bg-white shadow-sm" : "text-slate-400 hover:text-slate-600")}
                  >
                    EN
                  </button>
                  <div className="w-px h-2 bg-slate-200" />
                  <button
                    onClick={() => router.replace(pathname, { locale: 'vi' })}
                    className={cn("text-[10px] font-bold px-1 rounded transition-colors", locale === 'vi' ? "text-indigo-600 bg-white shadow-sm" : "text-slate-400 hover:text-slate-600")}
                  >
                    VI
                  </button>
                </div>
              </div>

              {/* Mobile Scrollable Nav */}
              <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col">
                <div className="flex flex-col gap-6">
                  {navGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="flex flex-col gap-2">
                      <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {(() => {
                          const titleKey = group.title === "Documentation" ? "documentation" :
                            group.title === "Executive View" ? "executiveView" :
                              group.title === "Developer Tools" ? "developerTools" :
                                group.title === "Evaluation" ? "evaluation" :
                                  group.title === "Security & Benchmarks" ? "securityBenchmarks" :
                                    group.title === "Configuration" ? "configuration" : group.title.toLowerCase().replace(/\s+/g, '');
                          return navT.has(`groups.${titleKey}`) ? navT(`groups.${titleKey}`) : group.title;
                        })()}
                      </h4>
                      <div className="flex flex-col gap-1">
                        {group.items.map((item: any, i: number) => {
                          const Icon = iconMap[item.icon] || Activity;
                          const isActive = pathname === item.href;
                          const itemKey = item.name;
                          const localizedName = navT.has(`items.${itemKey}.name`) ? navT(`items.${itemKey}.name`) : item.name;
                          const localizedDesc = navT.has(`items.${itemKey}.description`) ? navT(`items.${itemKey}.description`) : item.description;

                          return (
                            <I18nLink key={i} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600")} >
                              <Icon className={cn("h-5 w-5 mt-0.5", isActive ? "text-indigo-600" : "text-slate-400")} />
                              <div className="flex flex-col">
                                <span>{localizedName}</span>
                                <span className="text-[10px] text-slate-400 font-normal">{localizedDesc}</span>
                              </div>
                            </I18nLink>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Documentation - Moved inside ScrollArea (Bottom) */}
                <div className="mt-auto pt-6 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{t("resources")}</h4>
                  </div>
                  <I18nLink
                    href="/docs"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      pathname.startsWith("/docs") ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <BookOpen className={cn("h-5 w-5 mt-0.5", pathname.startsWith("/docs") ? "text-blue-700" : "text-slate-400")} />
                    <div className="flex flex-col">
                      <span>{t("documentation")}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{t("docDescription")}</span>
                    </div>
                  </I18nLink>
                </div>
              </div>

              {/* Mobile Footer / User Profile */}
              <div className="border-t bg-slate-50/50 shrink-0 flex flex-col gap-1 p-3">
                <UserProfile isCollapsed={false} />
              </div>

            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

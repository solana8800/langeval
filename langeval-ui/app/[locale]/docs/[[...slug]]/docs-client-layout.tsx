"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Link as IntlLink } from '@/i18n/routing';
import { MarkdownViewer } from '@/components/markdown-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FileText, BookOpen, Menu, ChevronRight, ChevronLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';

interface DocsClientLayoutProps {
    content: string;
    slug?: string[];
    docGroups: { title: string; items: { title: string; href: string }[] }[];
}

export function DocsClientLayout({ content, slug, docGroups }: DocsClientLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden relative">
            {/* Mobile Docs Nav */}
            <div className="lg:hidden p-4 border-b bg-white flex items-center justify-between shrink-0">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="sm" className="-ml-2 gap-2 text-slate-700 hover:bg-slate-100">
                            <Menu className="h-5 w-5" />
                            <span className="font-semibold text-base">Project Wiki</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[320px] p-0" id="docs-mobile-nav">
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-[#D13138]" />
                                <SheetTitle className="text-base">Mục Lục</SheetTitle>
                            </div>
                            <IntlLink href="/" className="text-sm font-medium text-slate-600 hover:text-[#D13138]">
                                LangEval
                            </IntlLink>
                        </div>
                        <DocsNav groups={docGroups} />
                    </SheetContent>
                </Sheet>
                <div className="text-sm font-medium text-slate-500 truncate max-w-[150px]">
                    {slug?.[0] || 'Introduction'}
                </div>
            </div>

            {/* Desktop Docs Sidebar */}
            <div
                className={cn(
                    "border-r bg-slate-50/50 flex-shrink-0 hidden lg:flex flex-col h-full transition-all duration-300 relative group",
                    isCollapsed ? "w-[60px]" : "w-72"
                )}
            >
                {/* Header */}
                <div className={cn("p-4 border-b font-semibold text-slate-700 flex items-center gap-2 shrink-0 h-[60px]", isCollapsed && "justify-center p-0")}>
                    <IntlLink href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <BookOpen className="h-5 w-5 text-[#D13138] shrink-0" />
                        {!isCollapsed && <span className="truncate">LangEval</span>}
                    </IntlLink>
                </div>

                {/* Nav Items */}
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-3 space-y-6">
                        {docGroups.map((group, i) => (
                            <div key={i} className="space-y-2">
                                {!isCollapsed && (
                                    <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider px-2">{group.title}</h4>
                                )}

                                <div className={cn("flex flex-col gap-0.5", !isCollapsed && "border-l border-slate-200 ml-1 pl-2")}>
                                    {group.items.map((item, j) => {
                                        // Simple active check logic could be improve
                                        const isActive = false;
                                        return (
                                            <Link
                                                key={j}
                                                href={item.href}
                                                className={cn(
                                                    "text-sm hover:text-[#D13138] hover:bg-slate-100/50 transition-all rounded-md flex items-center gap-2 group/item",
                                                    isCollapsed ? "justify-center py-2" : "py-1.5 px-2 text-slate-600"
                                                )}
                                                title={isCollapsed ? item.title : undefined}
                                            >
                                                {isCollapsed && <FileText className="h-4 w-4 text-slate-400 group-hover/item:text-[#D13138]" />}
                                                {!isCollapsed && <span>{item.title}</span>}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "absolute -right-3 top-16 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-[#D13138] shadow-sm transition-opacity opacity-0 group-hover:opacity-100",
                        isCollapsed && "rotate-180 opacity-100"
                    )}
                >
                    <ChevronLeft className="h-3 w-3" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-white p-6 md:p-10 min-w-0">
                <div className="max-w-4xl mx-auto pb-20">
                    <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Link href="/docs" className="hover:underline cursor-pointer flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> Docs
                        </Link>
                        {slug?.map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <ChevronRight className="h-4 w-4" />
                                <span className={cn(i === slug.length - 1 ? "font-medium text-slate-900" : "")}>
                                    {s}
                                </span>
                            </div>
                        ))}
                    </div>

                    <MarkdownViewer content={content} />

                    <div className="mt-12 pt-6 border-t flex justify-between text-sm">
                        <div className="text-muted-foreground">
                            Cập nhật lần cuối: Hôm nay
                        </div>
                        <div className="flex gap-4">
                            <span className="text-blue-600 hover:underline cursor-pointer">Chỉnh sửa trang này</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DocsNav({ groups }: { groups: { title: string; items: { title: string; href: string }[] }[] }) {
    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
                {groups.map((group, i) => (
                    <div key={i} className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-900">{group.title}</h4>
                        <div className="flex flex-col gap-1 border-l border-slate-200 ml-1 pl-3">
                            {group.items.map((item, j) => (
                                <Link
                                    key={j}
                                    href={item.href}
                                    className="text-sm text-slate-500 hover:text-[#D13138] hover:translate-x-1 transition-all py-1 block"
                                >
                                    {item.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}

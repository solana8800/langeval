"use client";

import { API_BASE_URL } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface InviteInfo {
    code: string;
    email: string;
    workspace_name: string;
    expires_at: string;
}

// Glass Card Component
const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
            "w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden",
            className
        )}
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 blur-[50px] -z-10 pointer-events-none" />
        {children}
    </motion.div>
);

export default function AcceptInvitePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [invite, setInvite] = useState<InviteInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewState, setViewState] = useState<"loading" | "details" | "success" | "error">("loading");

    const code = params?.code as string;

    // 1. Fetch Invite Details
    useEffect(() => {
        if (!code) {
            setViewState("error");
            setError("Invalid invite link.");
            return;
        }

        const fetchInvite = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/invites/${code}`);
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || "Invite not found or expired.");
                }
                const data = await res.json();
                setInvite(data);
                setViewState("details");
            } catch (err: any) {
                setError(err.message);
                setViewState("error");
            }
        };

        fetchInvite();
    }, [code]);

    // 2. Handle Accept Invite
    const handleAccept = async () => {
        if (status === "unauthenticated") {
            signIn("google", { callbackUrl: `/invite/${code}` });
            return;
        }

        if (!session?.user) return;

        if (session.user.email !== invite?.email) {
            toast.warning(`This invite is for ${invite?.email}, but you are logged in as ${session.user.email}. You can try to accept it anyway.`);
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/invites/${code}/accept`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.message === "Already a member") {
                    toast.info("You are already a member of this workspace.");
                    router.push("/dashboard");
                    return;
                }
                throw new Error(data.detail || "Failed to accept invite.");
            }

            setViewState("success");
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 2000);

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const BackgroundEffects = () => (
        <>
            <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        </>
    );

    if (viewState === "loading") {
        return (
            <div className="relative flex h-screen items-center justify-center bg-[#0B0F19] overflow-hidden text-slate-300">
                <BackgroundEffects />
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    <p className="text-sm font-medium animate-pulse">Verifying invite...</p>
                </div>
            </div>
        );
    }

    if (viewState === "error") {
        return (
            <div className="relative flex h-screen items-center justify-center bg-[#0B0F19] overflow-hidden p-4">
                <BackgroundEffects />
                <GlassCard className="text-center border-red-500/20 bg-red-500/5">
                    <div className="mx-auto bg-red-500/10 p-4 rounded-full w-fit mb-6 border border-red-500/20">
                        <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Invite Error</h2>
                    <p className="text-slate-400 mb-8">{error}</p>
                    <Button variant="ghost" onClick={() => router.push("/")} className="text-slate-300 hover:text-white hover:bg-white/10 w-full">
                        Go Home
                    </Button>
                </GlassCard>
            </div>
        );
    }

    if (viewState === "success") {
        return (
            <div className="relative flex h-screen items-center justify-center bg-[#0B0F19] overflow-hidden p-4">
                <BackgroundEffects />
                <GlassCard className="text-center border-green-500/20 bg-green-500/5">
                    <div className="mx-auto bg-green-500/10 p-4 rounded-full w-fit mb-6 border border-green-500/20">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h2>
                    <p className="text-slate-400 mb-8">
                        You have successfully joined <span className="text-indigo-400 font-bold">{invite?.workspace_name}</span>.
                    </p>
                    <Button
                        onClick={() => window.location.href = "/dashboard"}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-11"
                    >
                        Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen items-center justify-center bg-[#0B0F19] overflow-hidden p-4 font-sans">
            <BackgroundEffects />
            <GlassCard>
                <div className="text-center mb-8">
                    <div className="mx-auto bg-indigo-500/10 p-4 rounded-full w-fit mb-6 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                        <ShieldCheck className="h-10 w-10 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Join Workspace</h1>
                    <p className="text-slate-400">
                        You have been invited to join <br />
                        <span className="text-white font-bold text-lg">{invite?.workspace_name}</span>
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Account</span>
                            <span className="text-slate-200 truncate font-medium">
                                {session?.user?.email || "Not logged in"}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                            onClick={handleAccept}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Joining...
                                </>
                            ) : status === "unauthenticated" ? (
                                "Login to Accept Invite"
                            ) : (
                                "Accept Invitation"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-slate-400 hover:text-white hover:bg-white/10"
                            onClick={() => router.push("/")}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

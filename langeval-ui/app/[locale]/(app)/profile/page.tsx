"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, RefreshCw, Shield, Key, User, Mail, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Custom components
const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
   <div className={cn(
      "rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm relative overflow-hidden",
      className
   )}>
      {children}
   </div>
);

export default function ProfilePage() {
   const { data: session } = useSession();
   const [apiKey, setApiKey] = useState("");
   const [isCopied, setIsCopied] = useState(false);

   const generateMockKey = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const randomStr = Array.from(crypto.getRandomValues(new Uint8Array(48)))
         .map((b) => chars[b % chars.length])
         .join('');
      return `sk-proj-${randomStr}`;
   };

   useEffect(() => {
      setApiKey(generateMockKey());
   }, []);

   const handleCopy = () => {
      navigator.clipboard.writeText(apiKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
   };

   const handleRegenerate = () => {
      const newKey = generateMockKey();
      setApiKey(newKey);
      toast.success("New API Key generated");
   };

   const getInitials = (name: string) => {
      return name
         ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
         : "??";
   };

   if (!session) {
      return (
         <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-slate-500">Loading profile...</div>
         </div>
      );
   }

   return (
      <div className="relative min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-indigo-500/30 lg:-m-8 p-8 overflow-hidden">
         {/* Background Effects */}
         <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-violet-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

         <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Section */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
               className="flex flex-col gap-4 mb-8"
            >
               <div className="inline-flex items-center w-fit gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-medium">
                  <User className="w-3 h-3" />
                  <span>My Account</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Profile Settings</h1>
               <p className="text-lg text-slate-400 max-w-2xl">
                  Manage your personal information, security settings, and developer API keys.
               </p>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
               {/* Sidebar Profile Card */}
               <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
               >
                  <GlassCard className="sticky top-8">
                     <div className="p-8 flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                           <div className="absolute inset-0 bg-indigo-500 rounded-full blur opacity-20" />
                           <Avatar className="h-32 w-32 border-4 border-[#0B0F19] shadow-2xl">
                              <AvatarImage src={session.user?.image || ""} />
                              <AvatarFallback className="text-3xl bg-indigo-600 text-white font-bold">
                                 {getInitials(session.user?.name || "")}
                              </AvatarFallback>
                           </Avatar>
                        </div>

                        <div className="space-y-1">
                           <h3 className="font-bold text-2xl text-white">{session.user?.name}</h3>
                           <div className="flex items-center justify-center gap-2 text-slate-400">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="text-sm">{session.user?.email}</span>
                           </div>
                        </div>

                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 px-4 py-1.5 flex items-center gap-2">
                           <Sparkles className="h-3.5 w-3.5" />
                           <span>Pro Plan</span>
                        </Badge>
                     </div>

                     <div className="border-t border-white/5 p-6 bg-white/[0.02]">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500">Member since</span>
                           <span className="text-slate-300 font-medium">Jan 2026</span>
                        </div>
                     </div>
                  </GlassCard>
               </motion.div>

               {/* Main Content Tabs */}
               <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-6"
               >
                  <Tabs defaultValue="general" className="w-full">
                     <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl w-full max-w-md mb-8">
                        <TabsTrigger
                           value="general"
                           className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-white transition-all flex-1"
                        >
                           General Info
                        </TabsTrigger>
                        <TabsTrigger
                           value="security"
                           className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-white transition-all flex-1"
                        >
                           Security & API
                        </TabsTrigger>
                     </TabsList>

                     <TabsContent value="general" className="mt-0">
                        <GlassCard>
                           <div className="p-6 border-b border-white/5">
                              <h3 className="text-xl font-bold text-white mb-1">Personal Information</h3>
                              <p className="text-slate-400 text-sm">Update your display name and contact email.</p>
                           </div>
                           <div className="p-6 space-y-6">
                              <div className="grid gap-3">
                                 <Label className="text-slate-300">Full Name</Label>
                                 <Input
                                    defaultValue={session.user?.name || ""}
                                    className="bg-black/20 border-white/10 text-white focus-visible:ring-indigo-500/50 h-11"
                                 />
                              </div>
                              <div className="grid gap-3">
                                 <Label className="text-slate-300">Email Address</Label>
                                 <div className="relative">
                                    <Input
                                       defaultValue={session.user?.email || ""}
                                       disabled
                                       className="bg-white/5 border-white/5 text-slate-400 h-11 pl-10 cursor-not-allowed"
                                    />
                                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-600" />
                                 </div>
                                 <p className="text-xs text-slate-500 ml-1">Email is managed by your organization (SSO).</p>
                              </div>
                              <div className="grid gap-3">
                                 <Label className="text-slate-300">Job Title / Role</Label>
                                 <Input
                                    placeholder="e.g. Senior AI Engineer"
                                    className="bg-black/20 border-white/10 text-white focus-visible:ring-indigo-500/50 h-11"
                                 />
                              </div>
                           </div>
                           <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
                              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6">
                                 Save Changes
                              </Button>
                           </div>
                        </GlassCard>
                     </TabsContent>

                     <TabsContent value="security" className="mt-0">
                        <GlassCard>
                           <div className="p-6 border-b border-white/5">
                              <h3 className="text-xl font-bold text-white mb-1">Developer API Keys</h3>
                              <p className="text-slate-400 text-sm">Use this key to integrate SDKs or call APIs externally.</p>
                           </div>
                           <div className="p-6 space-y-6">
                              <div className="p-5 bg-black/40 rounded-xl border border-white/10 shadow-inner">
                                 <Label className="text-indigo-400 text-xs uppercase tracking-wider font-bold mb-2 block">Secret Key</Label>
                                 <div className="flex items-center gap-3">
                                    <div className="flex-1 font-mono text-emerald-400 text-sm truncate bg-black/20 p-2.5 rounded-lg border border-white/5">
                                       {apiKey}
                                    </div>
                                    <Button
                                       size="icon"
                                       variant="ghost"
                                       onClick={handleCopy}
                                       className="text-slate-400 hover:text-white hover:bg-white/10 shrink-0"
                                    >
                                       {isCopied ? <span className="text-green-400 font-bold text-xs">OK</span> : <Copy className="h-4 w-4" />}
                                    </Button>
                                 </div>
                              </div>

                              <div className="flex items-start gap-3 text-sm text-amber-200/90 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                                 <Key className="h-5 w-5 shrink-0 mt-0.5" />
                                 <span className="leading-relaxed">Do not share this key with anyone. It grants full access to your account and resources. Treat it like a password.</span>
                              </div>
                           </div>
                           <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
                              <Button
                                 variant="outline"
                                 onClick={handleRegenerate}
                                 className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              >
                                 <RefreshCw className="h-4 w-4 mr-2" /> Revoke & Regenerate Key
                              </Button>
                           </div>
                        </GlassCard>
                     </TabsContent>
                  </Tabs>
               </motion.div>
            </div>
         </div>
      </div>
   );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, RefreshCw, Shield, Key } from "lucide-react";

export default function ProfilePage() {
  const [apiKey, setApiKey] = useState("sk-live-8923489238492384923894");
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerate = () => {
    // Mock API call
    setApiKey("sk-live-" + Math.random().toString(36).substring(7));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1 shrink-0 bg-white p-4 rounded-xl border shadow-sm">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Tài Khoản Của Tôi</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Quản lý thông tin cá nhân và cài đặt bảo mật.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
           <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24 border-2 border-slate-100">
                 <AvatarImage src="/avatars/01.png" />
                 <AvatarFallback className="text-2xl bg-[#D13138] text-white">AD</AvatarFallback>
              </Avatar>
              <div>
                 <h3 className="font-bold text-lg">Admin User</h3>
                 <p className="text-sm text-slate-500">admin@company.com</p>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1 flex items-center gap-1">
                 <Shield className="h-3 w-3" /> System Admin
              </Badge>
           </CardContent>
           <CardFooter className="border-t p-4 bg-slate-50">
              <p className="text-xs text-center w-full text-slate-500">
                 Thành viên từ: <strong>01/01/2026</strong>
              </p>
           </CardFooter>
        </Card>

        <div className="space-y-6">
           <Tabs defaultValue="general">
              <TabsList>
                 <TabsTrigger value="general">Thông Tin Chung</TabsTrigger>
                 <TabsTrigger value="security">Bảo Mật & API</TabsTrigger>
                 <TabsTrigger value="notifications">Thông Báo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 mt-4">
                 <Card>
                    <CardHeader>
                       <CardTitle>Thông Tin Cá Nhân</CardTitle>
                       <CardDescription>Cập nhật tên hiển thị và email liên hệ.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="grid gap-2">
                          <Label>Họ và Tên</Label>
                          <Input defaultValue="Admin User" />
                       </div>
                       <div className="grid gap-2">
                          <Label>Email</Label>
                          <Input defaultValue="admin@company.com" disabled className="bg-slate-50" />
                          <p className="text-[10px] text-muted-foreground">Email được quản lý bởi tổ chức (SSO).</p>
                       </div>
                       <div className="grid gap-2">
                          <Label>Chức danh / Role</Label>
                          <Input defaultValue="Senior AI Engineer" />
                       </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t p-4">
                       <Button className="bg-[#D13138] hover:bg-[#b71c1c]">Lưu Thay Đổi</Button>
                    </CardFooter>
                 </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4 mt-4">
                 <Card>
                    <CardHeader>
                       <CardTitle>Developer API Keys</CardTitle>
                       <CardDescription>Dùng key này để tích hợp SDK hoặc gọi API từ bên ngoài.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="p-4 bg-slate-900 rounded-md border border-slate-800">
                          <Label className="text-slate-400 text-xs uppercase tracking-wider">Secret Key</Label>
                          <div className="flex items-center gap-2 mt-2">
                             <code className="flex-1 font-mono text-green-400 text-sm truncate">{apiKey}</code>
                             <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white" onClick={handleCopy}>
                                {isCopied ? <span className="text-green-500 font-bold text-xs">OK</span> : <Copy className="h-4 w-4" />}
                             </Button>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                          <Key className="h-4 w-4" />
                          <span>Không chia sẻ key này cho bất kỳ ai. Key có toàn quyền truy cập vào tài khoản của bạn.</span>
                       </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t p-4">
                       <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleRegenerate}>
                          <RefreshCw className="h-4 w-4 mr-2" /> Tạo Key Mới (Revoke cũ)
                       </Button>
                    </CardFooter>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>
      </div>
    </div>
  );
}

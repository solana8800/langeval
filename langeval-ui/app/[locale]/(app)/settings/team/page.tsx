"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, UserPlus, Shield, Mail, Trash2, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Roles definition with naming and colors
const ROLES = [
   { code: 'ADMIN', name: 'Quản Trị Viên', description: 'Có toàn quyền truy cập và quản lý hệ thống' },
   { code: 'EDITOR', name: 'Biên Tập Viên', description: 'Có thể chỉnh sửa nội dung và cấu hình' },
   { code: 'STAKEHOLDER', name: 'Stakeholder', description: 'Xem báo cáo và nhận xét' },
   { code: 'VIEWER', name: 'Người Xem', description: 'Chỉ có quyền xem nội dung' },
];

// Mock data for users
const MOCK_USERS = [
   { id: 1, name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', role: 'ADMIN', lastActive: 'Vừa xong', avatar: '' },
   { id: 2, name: 'Trần Thị Bình', email: 'binh.tran@example.com', role: 'EDITOR', lastActive: '5 phút trước', avatar: '' },
   { id: 3, name: 'Lê Hoàng Cường', email: 'cuong.le@example.com', role: 'STAKEHOLDER', lastActive: '1 giờ trước', avatar: '' },
   { id: 4, name: 'Phạm Thu Dung', email: 'dung.pham@example.com', role: 'VIEWER', lastActive: '2 ngày trước', avatar: '' },
   { id: 5, name: 'Hoàng Minh Tú', email: 'tu.hoang@example.com', role: 'EDITOR', lastActive: '1 tuần trước', avatar: '' },
];

export default function TeamPage() {
   const [users, setUsers] = useState(MOCK_USERS);
   const [inviteOpen, setInviteOpen] = useState(false);
   const [editingUser, setEditingUser] = useState<any>(null);
   const [editRoleOpen, setEditRoleOpen] = useState(false);
   const [showMatrix, setShowMatrix] = useState(true);

   const getRoleBadge = (roleCode: string) => {
      switch (roleCode) {
         case 'ADMIN':
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Admin</Badge>;
         case 'EDITOR':
            return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Editor</Badge>;
         case 'STAKEHOLDER':
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Stakeholder</Badge>;
         case 'VIEWER':
         default:
            return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">Viewer</Badge>;
      }
   };

   const handleRemoveUser = (id: number) => {
      setUsers(prev => prev.filter(u => u.id !== id));
   };

   const handleUpdateRole = () => {
      // Mock update
      setEditRoleOpen(false);
      setEditingUser(null);
   };

   return (
      <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Thành Viên & Đội Ngũ</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Quản lý các thành viên trong dự án và phân quyền truy cập.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <Button variant="outline" className="flex-1 md:flex-none gap-2 text-xs md:text-sm h-9">
              <Mail className="h-3.5 w-3.5" /> <span className="inline">Gửi Lời Mời</span>
           </Button>
           <Button onClick={() => setInviteOpen(true)} className="flex-1 md:flex-none gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm h-9">
              <UserPlus className="h-3.5 w-3.5" /> <span className="inline">Thêm Thành Viên</span>
           </Button>
        </div>
      </div>

         <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Chỉnh Sửa Quyền Hạn</DialogTitle>
                  <DialogDescription>Thay đổi vai trò của <strong>{editingUser?.name}</strong> trong hệ thống.</DialogDescription>
               </DialogHeader>
               <div className="py-4">
                  <Label>Vai Trò Mới</Label>
                  <Select defaultValue={editingUser?.role || 'STAKEHOLDER'}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        {ROLES.map(role => (
                           <SelectItem key={role.code} value={role.code}>{role.name}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               <DialogFooter>
                  <Button variant="outline" onClick={() => setEditRoleOpen(false)}>Hủy</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateRole}>Lưu Thay Đổi</Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         <Card>
            <CardHeader>
               <CardTitle>Danh Sách Thành Viên</CardTitle>
               <CardDescription>
                  Hiện có {users.length} thành viên đang hoạt động trong hệ thống.
               </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className="w-[300px]">Thành Viên</TableHead>
                        <TableHead>Vai Trò</TableHead>
                        <TableHead>Trạng Thái</TableHead>
                        <TableHead className="text-right">Hành Động</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {users.map((user) => (
                        <TableRow key={user.id}>
                           <TableCell>
                              <div className="flex items-center gap-3">
                                 <Avatar>
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold">{user.name.charAt(0)}</AvatarFallback>
                                 </Avatar>
                                 <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">{user.name}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              {getRoleBadge(user.role)}
                           </TableCell>
                           <TableCell>
                              <div className="flex items-center text-sm text-gray-500">
                                 <div className={`h-2 w-2 rounded-full mr-2 ${user.role === 'ADMIN' || user.role === 'EDITOR' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                 {user.lastActive}
                              </div>
                           </TableCell>
                           <TableCell className="text-right">
                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                       <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => { setEditingUser(user); setEditRoleOpen(true); }}>
                                       <Edit className="h-4 w-4 mr-2" /> Chỉnh sửa quyền
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Gửi lại lời mời</DropdownMenuItem>
                                    <DropdownMenuSeparator />

                                    <AlertDialog>
                                       <AlertDialogTrigger asChild>
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                             <Trash2 className="h-4 w-4 mr-2" /> Xóa thành viên
                                          </DropdownMenuItem>
                                       </AlertDialogTrigger>
                                       <AlertDialogContent>
                                          <AlertDialogHeader>
                                             <AlertDialogTitle>Xóa thành viên này?</AlertDialogTitle>
                                             <AlertDialogDescription>
                                                Người dùng <strong>{user.name}</strong> sẽ mất quyền truy cập vào Workspace này ngay lập tức.
                                             </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                             <AlertDialogCancel>Hủy</AlertDialogCancel>
                                             <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleRemoveUser(user.id)}>
                                                Xóa
                                             </AlertDialogAction>
                                          </AlertDialogFooter>
                                       </AlertDialogContent>
                                    </AlertDialog>

                                 </DropdownMenuContent>
                              </DropdownMenu>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>

         <Card>
            <CardHeader
               className="cursor-pointer hover:bg-slate-50 transition-colors select-none"
               onClick={() => setShowMatrix(!showMatrix)}
            >
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-slate-500" />
                        Ma Trận Phân Quyền (Permission Matrix)
                     </CardTitle>
                     <CardDescription>
                        Chi tiết quyền hạn truy cập theo từng vai trò trong hệ thống.
                     </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                     {showMatrix ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
               </div>
            </CardHeader>
            {showMatrix && (
               <CardContent className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-6">
                     {/* Role Definitions */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ROLES.map((role) => (
                           <div key={role.code} className="border rounded-lg p-3 flex gap-3 items-start bg-slate-50/50">
                              <div className="mt-0.5">{getRoleBadge(role.code)}</div>
                              <div>
                                 <p className="font-semibold text-sm text-slate-900">{role.name}</p>
                                 <p className="text-xs text-slate-500">{role.description}</p>
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* Detailed Matrix */}
                     <div className="border rounded-md overflow-hidden">
                        <Table>
                           <TableHeader className="bg-slate-100">
                              <TableRow>
                                 <TableHead>Tính Năng / Hành Động</TableHead>
                                 <TableHead className="text-center font-bold text-red-700">ADMIN</TableHead>
                                 <TableHead className="text-center font-bold text-blue-700">EDITOR</TableHead>
                                 <TableHead className="text-center font-bold text-amber-700">STAKEHOLDER</TableHead>
                                 <TableHead className="text-center">VIEWER</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {/* Core Modules */}
                              <TableRow className="bg-slate-50/50">
                                 <TableCell colSpan={5} className="font-semibold text-xs uppercase tracking-wider text-slate-500 py-2">Core Modules</TableCell>
                              </TableRow>
                              <TableRow>
                                 <TableCell>Tạo/Kết nối Agent mới</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                              </TableRow>
                              <TableRow>
                                 <TableCell>Cấu hình Test Scenarios</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">👁️</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                              </TableRow>
                              <TableRow>
                                 <TableCell>Chạy Đánh Giá (Run Eval)</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                              </TableRow>

                              {/* Reporting */}
                              <TableRow className="bg-slate-50/50">
                                 <TableCell colSpan={5} className="font-semibold text-xs uppercase tracking-wider text-slate-500 py-2">Reporting & Analytics</TableCell>
                              </TableRow>
                              <TableRow>
                                 <TableCell>Xem Dashboard Tổng Quan</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                              </TableRow>
                              <TableRow>
                                 <TableCell>Xem Logs Chi Tiết (Traces)</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">👁️</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                              </TableRow>

                              {/* Admin */}
                              <TableRow className="bg-slate-50/50">
                                 <TableCell colSpan={5} className="font-semibold text-xs uppercase tracking-wider text-slate-500 py-2">System Admin</TableCell>
                              </TableRow>
                              <TableRow>
                                 <TableCell>Quản lý Thành Viên (Mời/Xóa)</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                              </TableRow>
                              <TableRow>
                                 <TableCell>Cấu hình API Keys & Billing</TableCell>
                                 <TableCell className="text-center">✅</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                                 <TableCell className="text-center">❌</TableCell>
                              </TableRow>
                           </TableBody>
                        </Table>
                     </div>

                     <div className="flex gap-4 text-xs text-slate-500 justify-end">
                        <span className="flex items-center gap-1">✅ : Toàn quyền</span>
                        <span className="flex items-center gap-1">👁️ : Chỉ xem</span>
                        <span className="flex items-center gap-1">❌ : Không truy cập</span>
                     </div>
                  </div>
               </CardContent>
            )}
         </Card>
      </div>
   );
}


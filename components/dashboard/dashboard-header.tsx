
"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FileText, LogOut, User, Calculator } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardHeader() {
  const { data: session, status } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container flex h-20 max-w-7xl items-center justify-between px-6 mx-auto">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gradient">TAXGROK</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="px-4 py-2">
              Dashboard
            </Button>
          </Link>
          <Link href="/file-return">
            <Button className="bg-gradient-to-r from-primary to-green-600 hover:opacity-90 px-4 py-2">
              <Calculator className="mr-2 h-4 w-4" />
              File Return
            </Button>
          </Link>
        </nav>
        
{status === "loading" ? (
          <div className="animate-pulse bg-muted rounded-full h-10 w-24"></div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-3 px-3 py-2 rounded-full hover:bg-gray-100"
                onClick={() => {/* Handle dropdown toggle */}}
              >
                <div className="p-1 bg-primary/10 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">{session?.user?.name?.split(' ')[0] || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuItem disabled className="px-3 py-2">
                <div className="flex flex-col">
                  <span className="font-medium">{session?.user?.name}</span>
                  <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="px-3 py-2 text-red-600 hover:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

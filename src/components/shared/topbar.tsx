"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User } from "lucide-react";

interface TopbarProps {
  userName: string;
  userRole: string;
  onOpenMobile?: () => void;
}

export function Topbar({ userName, userRole, onOpenMobile }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Open navigation"
          className="md:hidden"
          onClick={onOpenMobile}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium leading-none">{userName}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{userRole}</p>
          </div>
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="icon" type="submit" title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}

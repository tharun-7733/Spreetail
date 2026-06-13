"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export function TopHeader({ user }: { user: { name: string; email: string; avatarUrl?: string | null } }) {
  const pathname = usePathname();
  
  let pageTitle = "Dashboard";
  if (pathname.includes("/groups")) pageTitle = "Groups";
  else if (pathname.includes("/expense")) pageTitle = "Expenses";
  else if (pathname.includes("/balances")) pageTitle = "Balances";
  else if (pathname.includes("/settlements")) pageTitle = "Settlements";
  else if (pathname.includes("/import")) pageTitle = "Import CSV";
  else if (pathname.includes("/reports")) pageTitle = "Reports";
  else if (pathname.includes("/settings")) pageTitle = "Settings";

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
        <div className="flex items-center gap-4">
          <button className="text-gray-500 hover:text-gray-900 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-violet-100">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="text-violet-700 font-medium text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

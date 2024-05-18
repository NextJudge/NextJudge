"use client";
import { HoveredLink, Menu, MenuItem } from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Separator } from "../ui/separator";

export default function CompactNavbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div
      className={cn("fixed top-20 inset-x-0 max-w-md mx-auto z-50", className)}
    >
      <Menu setActive={setActive}>
        <MenuItem setActive={setActive} active={active} item="Account">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/platform">Platform Home</HoveredLink>
            <HoveredLink href="/user">Profile</HoveredLink>
            <HoveredLink href="/user/settings">Settings</HoveredLink>
            <Separator />
            <HoveredLink href="/logout">Logout</HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Contests">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/platform/contests">
              Upcoming Contests
            </HoveredLink>
            <HoveredLink href="/platform/contests">Past Contests</HoveredLink>
            <HoveredLink href="/user/contests">My Contests</HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Practice">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/platform/problems">All Problems</HoveredLink>
            <HoveredLink href="/platform/editorials">Editorials</HoveredLink>
            <HoveredLink href="/platform/problems#submissions">
              My Submissions
            </HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Admin">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/platform/admin">Profile</HoveredLink>
            <HoveredLink href="/platform/admin/problems">
              Add New Problem
            </HoveredLink>
            <HoveredLink href="/platform/admin/contests">
              Add New Contest
            </HoveredLink>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}

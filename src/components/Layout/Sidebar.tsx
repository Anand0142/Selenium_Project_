
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  Upload,
  Briefcase,
  Settings,
  MessageCircle,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const NavItem = ({ to, icon, label, badge }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )
    }
  >
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && badge > 0 ? (
        <span className="inline-flex items-center justify-center rounded-full bg-error px-2 py-0.5 text-xs font-medium text-white">
          {badge}
        </span>
      ) : null}
    </div>
  </NavLink>
);

export function Sidebar({ className }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border",
        expanded ? "w-64" : "w-16",
        className
      )}
    >
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {expanded && (
          <span className="text-lg font-semibold text-sidebar-foreground">
            JobFinder
          </span>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg p-1 hover:bg-sidebar-accent"
        >
          <ChevronRight
            className={cn(
              "h-5 w-5 text-sidebar-foreground transition-transform",
              !expanded && "rotate-180"
            )}
          />
        </button>
      </div>

      <div className="flex-1 overflow-auto py-2 px-3">
        <div className={cn("flex flex-col gap-1", !expanded && "items-center")}>
          {expanded ? (
            <>
              <NavItem to="/dashboard" icon={<Home className="h-5 w-5" />} label="Dashboard" />
              <NavItem to="/upload-resume" icon={<Upload className="h-5 w-5" />} label="Upload Resume" />
              <NavItem to="/job-listings" icon={<Briefcase className="h-5 w-5" />} label="Job Listings" />
              <NavItem to="/profile" icon={<Settings className="h-5 w-5" />} label="Settings" />
              <NavItem to="/contact" icon={<MessageCircle className="h-5 w-5" />} label="Contact" />
            </>
          ) : (
            <>
              <NavItem to="/dashboard" icon={<Home className="h-5 w-5" />} label="" />
              <NavItem to="/upload-resume" icon={<Upload className="h-5 w-5" />} label="" />
              <NavItem to="/job-listings" icon={<Briefcase className="h-5 w-5" />} label="" />
              <NavItem to="/profile" icon={<Settings className="h-5 w-5" />} label="" />
              <NavItem to="/contact" icon={<MessageCircle className="h-5 w-5" />} label="" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

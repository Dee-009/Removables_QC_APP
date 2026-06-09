import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Menu, X, Activity, ShieldCheck, RotateCcw, ClipboardPen, FlaskConical, MessageCircleWarning } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard',     description: 'Leadership & Overview',       icon: LayoutDashboard,      path: '/'           },
  { label: 'Remakes',       description: 'External & Internal remakes', icon: RotateCcw,            path: '/remakes'    },
  { label: 'QC Control',   description: 'Supervisor Quality Control',  icon: ShieldCheck,          path: '/qc-control' },
  { label: 'Log QC Reject', description: 'Submit a new QC entry',       icon: ClipboardPen,         path: '/log-reject' },
  { label: 'MRB Board',    description: 'Material Review Board',       icon: FlaskConical,         path: '/mrb'        },
  { label: 'Complaints',   description: 'Customer complaints · REM',   icon: MessageCircleWarning, path: '/complaints' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-300",
        "lg:relative lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-5 py-5 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">QC Dashboard</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Removables · SKDLA</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, description, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive ? "bg-violet-600 text-white shadow-sm" : "hover:bg-muted text-foreground"
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                  <div>
                    <p className="text-sm font-semibold leading-tight">{label}</p>
                    <p className={cn("text-[10px] leading-tight", isActive ? "text-white/70" : "text-muted-foreground")}>{description}</p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-3 border-t">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live data feed
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Auto-syncs in real-time</p>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-card">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg hover:bg-muted">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-semibold text-sm">Removables QC Dashboard</span>
        </div>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}

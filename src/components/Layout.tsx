import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { IconBank, IconBuild, IconDashboard, IconMenu, IconMistakes, IconPerformance, IconPractice, IconX } from "./Icons";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
  { to: "/practice", label: "Practice", icon: IconPractice, end: false },
  { to: "/bank", label: "Question Bank", icon: IconBank, end: false },
  { to: "/build", label: "Build a Test", icon: IconBuild, end: false },
  { to: "/performance", label: "Performance", icon: IconPerformance, end: false },
  { to: "/mistakes", label: "Mistake Review", icon: IconMistakes, end: false },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            }`
          }
        >
          <item.icon className="shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-ink-100 bg-white px-4 py-6">
        <div className="px-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-semibold text-ink-900 tracking-tight">SAT Practice</span>
          </div>
        </div>
        <NavList />
        <div className="mt-auto pt-6 px-2 text-[11px] leading-relaxed text-ink-400">
          Independent SAT practice tool. Not affiliated with or endorsed by College Board.
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between bg-white border-b border-ink-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">S</div>
          <span className="font-semibold text-ink-900 text-sm">SAT Practice</span>
        </div>
        <button className="btn-ghost !px-2 !py-2" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <IconMenu />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white h-full px-4 py-6 shadow-pop animate-in slide-in-from-left">
            <div className="flex items-center justify-between mb-6 px-2">
              <span className="font-semibold text-ink-900">Menu</span>
              <button className="btn-ghost !px-2 !py-2" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <IconX />
              </button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 md:pl-64 pt-14 md:pt-0 flex flex-col min-h-screen">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
        <footer className="md:hidden px-4 py-4 text-center text-[11px] text-ink-400 border-t border-ink-100">
          Independent SAT practice tool. Not affiliated with or endorsed by College Board.
        </footer>
      </div>
    </div>
  );
}

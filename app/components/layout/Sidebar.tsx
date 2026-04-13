'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlaskConical, Settings, BookOpen, ChevronRight, Cpu, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',           label: 'Experiments', icon: FlaskConical },
  { href: '/evaluation', label: 'Evaluation',  icon: BarChart2 },
];

const bottomItems = [
  { href: '#', label: 'Documentation', icon: BookOpen },
  { href: '#', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-40"
      style={{ backgroundColor: '#0f172a' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <Cpu className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <span className="text-white font-semibold text-sm tracking-wide">Model Customization</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest px-2 pb-2">
          Workspace
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group',
                active
                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300')} />
              <span className="font-medium">{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto text-blue-400/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider + bottom nav */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-0.5">
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all duration-150"
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}

        {/* User pill */}
        <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="w-6 h-6 rounded-full bg-blue-500/30 border border-blue-500/40 flex items-center justify-center text-blue-300 text-[10px] font-bold">
            SL
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-300 font-medium truncate">Shreya L.</div>
            <div className="text-[10px] text-slate-600 truncate font-mono">AI Platform Team</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

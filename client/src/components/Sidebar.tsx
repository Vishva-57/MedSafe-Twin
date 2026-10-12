import React from 'react';
import {
  LayoutDashboard,
  Pill,
  Camera,
  ShieldAlert,
  Users,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import { PageId } from '../types/index';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  medicationCount: number;
  pendingConfirmationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  medicationCount,
  pendingConfirmationsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Daily overview & regimen',
    },
    {
      id: 'medications' as PageId,
      label: 'My Medications',
      icon: Pill,
      badge: medicationCount > 0 ? `${medicationCount}` : null,
      description: 'Active prescriptions list',
    },
    {
      id: 'scanner' as PageId,
      label: 'Prescription Scanner',
      icon: Camera,
      badge: 'AI Vision',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      description: 'Multimodal bottle scanner',
    },
    {
      id: 'safety' as PageId,
      label: 'Safety Checker',
      icon: ShieldAlert,
      badge: pendingConfirmationsCount > 0 ? `${pendingConfirmationsCount} alert` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Evidence-based review',
    },
    {
      id: 'caregiver' as PageId,
      label: 'Caregiver View',
      icon: Users,
      badge: 'Elena',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Adherence & doctor visits',
    },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-50px)]">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight flex items-center gap-1.5">
              MedSafe Twin
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            </h1>
            <p className="text-xs font-medium text-slate-500">Polypharmacy Guardian</p>
          </div>
        </div>

        {/* Elder Profile Capsule */}
        <div className="mt-4 p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-200 text-sky-800 font-bold text-xs flex items-center justify-center">
              AM
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Arthur Miller</p>
              <p className="text-xs text-slate-500">Age 78 • Assisted Care</p>
            </div>
          </div>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" title="Twin Active" />
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-3.5 py-3 rounded-xl font-medium transition-all flex items-start gap-3.5 group relative ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 mt-0.5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'
                }`}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-base leading-snug font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 truncate ${isActive ? 'text-sky-100' : 'text-slate-500'}`}>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Responsible AI & Grounding Info Badge */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70">
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Safety Mode</span>
            <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 font-bold">
              Human-in-Loop
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            All AI suggestions require caregiver or clinical validation.
          </p>
        </div>
      </div>
    </aside>
  );
};

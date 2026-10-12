import React, { useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  Pill,
  Camera,
  ShieldAlert,
  Users,
  HeartPulse,
} from 'lucide-react';
import { PageId } from '../types/index';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  medicationCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  medicationCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medications' as PageId, label: 'My Medications', icon: Pill, count: medicationCount },
    { id: 'scanner' as PageId, label: 'Prescription Scanner', icon: Camera },
    { id: 'safety' as PageId, label: 'Safety Checker', icon: ShieldAlert },
    { id: 'caregiver' as PageId, label: 'Caregiver View', icon: Users },
  ];

  const handleNavClick = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand & Elder Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-sm lg:hidden">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight lg:hidden">
                MedSafe Twin
              </span>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Arthur Miller (Age 78)</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 hidden sm:inline">Caregiver: Elena</span>
              </div>
            </div>
          </div>

          {/* Calm, Clean Status & Quick Navigation */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <span className="text-slate-500">Active Regimen:</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white font-bold text-2xs">
                {medicationCount} medicines
              </span>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drop-down */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1.5 shadow-xl animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-sky-600'}`} />
                  <span className="text-base">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

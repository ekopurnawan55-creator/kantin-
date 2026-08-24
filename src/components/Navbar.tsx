import React from 'react';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Store,
  FileSpreadsheet,
  Settings,
  Receipt,
  Coins,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unpaidCountToday: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unpaidCountToday,
}) => {
  const tabs: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string | null;
    badgeColor?: string;
    isActive: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      isActive: activeTab === 'dashboard',
    },
    {
      id: 'input',
      label: 'Penagihan Harian',
      shortLabel: 'Tagihan',
      icon: CheckSquare,
      badge: unpaidCountToday > 0 ? `${unpaidCountToday} Belum` : null,
      badgeColor: 'bg-amber-500 text-white',
      isActive: activeTab === 'input',
    },
    {
      id: 'pemasukan-lain',
      label: 'Dana Masuk Luar',
      shortLabel: 'Dana Masuk',
      icon: Coins,
      badge: null,
      isActive: activeTab === 'pemasukan-lain',
    },
    {
      id: 'pengeluaran',
      label: 'Pengeluaran',
      shortLabel: 'Pengeluaran',
      icon: Receipt,
      badge: null,
      isActive: activeTab === 'pengeluaran',
    },
    {
      id: 'kantin',
      label: 'Master Kantin',
      shortLabel: 'Kantin',
      icon: Store,
      badge: null,
      isActive: activeTab === 'kantin',
    },
    {
      id: 'reports',
      label: 'Laporan & Rekap',
      shortLabel: 'Laporan',
      icon: FileSpreadsheet,
      badge: null,
      isActive: activeTab === 'reports' || activeTab === 'daily' || activeTab === 'monthly',
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      shortLabel: 'Pengaturan',
      icon: Settings,
      badge: null,
      isActive: activeTab === 'settings',
    },
  ];

  return (
    <>
      {/* Desktop Top Navbar (hidden on mobile screens < 640px) */}
      <nav className="hidden sm:block bg-white border-b border-slate-200 shadow-xs sticky top-[57px] z-20">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.isActive;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>

                  {tab.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive ? 'bg-white text-blue-700' : tab.badgeColor || 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on mobile screens < 640px) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-1.5 py-1.5 flex items-center justify-around sm:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isActive;

          return (
            <button
              key={`mobile-bottom-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-bold transition-all relative cursor-pointer ${
                isActive
                  ? 'text-blue-600 font-extrabold bg-blue-50/90'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-600 scale-110' : 'text-slate-500'} transition-transform`} />
                {tab.badge && tab.id === 'input' && unpaidCountToday > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-white text-[9px] font-black px-1 rounded-full min-w-[14px] text-center shadow-xs">
                    {unpaidCountToday}
                  </span>
                )}
              </div>
              <span className="mt-0.5 whitespace-nowrap text-[10px]">
                {tab.shortLabel}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

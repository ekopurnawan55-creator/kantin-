import React from 'react';
import { SchoolSettings, Kantin, UserAccount } from '../types';
import {
  Store,
  QrCode,
  Calendar,
  Smartphone,
  Lock,
  LogOut,
  UserCheck,
  LogIn,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { formatDateIndonesian, getTodayIsoString } from '../utils/formatters';

interface HeaderProps {
  settings: SchoolSettings;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onGoToLogin?: () => void;
  onOpenQris: () => void;
  onOpenInstall: () => void;
  unpaidCountToday: number;
  activePortalKantin?: Kantin | null;
  isDirectLink?: boolean;
  isOnline?: boolean;
  isSyncing?: boolean;
  lastSyncedTime?: Date;
  onManualRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  onLogout,
  onGoToLogin,
  onOpenQris,
  onOpenInstall,
  unpaidCountToday,
  activePortalKantin,
  isDirectLink = false,
  isOnline = true,
  isSyncing = false,
  lastSyncedTime = new Date(),
  onManualRefresh,
}) => {
  const todayIso = getTodayIsoString();
  const formattedSyncTime = lastSyncedTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner flex items-center justify-center text-blue-200">
              <Store className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {activePortalKantin ? activePortalKantin.namaKantin : 'Sistem Iuran Kantin'}
                </h1>
                {activePortalKantin ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Portal Khusus Lapak</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    Bendahara Utama
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-blue-200 font-medium">
                {activePortalKantin
                  ? `Pemilik: ${activePortalKantin.namaPemilik}`
                  : settings.namaKantin}
                {settings.namaSekolah ? (
                  <>
                    {' '}• <span className="text-blue-300">{settings.namaSekolah}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 text-xs">
            
            {/* Logged in User Email & Logout (HANYA DITAMPILKAN DI DASHBOARD BENDAHARA, BUKAN DI PORTAL PEMILIK KANTIN) */}
            {!activePortalKantin && currentUser && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                <div className="flex items-center gap-1.5 text-blue-100">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <div className="text-left leading-tight">
                    <span className="block font-bold text-[11px] text-white truncate max-w-[140px]">
                      {currentUser.email}
                    </span>
                    <span className="block text-[9px] text-blue-200">
                      {currentUser.role === 'bendahara' ? 'Bendahara' : 'Pengelola'}
                    </span>
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="ml-1 px-2 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500 text-rose-100 hover:text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1 border border-rose-400/40"
                    title="Keluar dari akun email ini"
                  >
                    <LogOut className="w-3 h-3" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                )}
              </div>
            )}

            {/* If in portal and not logged in as admin, option to switch to login if desired */}
            {activePortalKantin && !currentUser && onGoToLogin && (
              <button
                onClick={onGoToLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer border border-white/20"
                title="Buka Halaman Login Pengelola"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Login Bendahara</span>
              </button>
            )}

            {/* Auto-Refresh / Sync Status Button */}
            {onManualRefresh && (
              <button
                onClick={onManualRefresh}
                disabled={isSyncing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-medium cursor-pointer ${
                  !isOnline
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                    : isSyncing
                    ? 'bg-blue-600/30 text-blue-100 border-blue-400/30'
                    : 'bg-white/10 hover:bg-white/20 text-emerald-300 border-white/15'
                }`}
                title={`Status: ${isOnline ? 'Online (Sinkron Otomatis)' : 'Offline (Tersimpan Lokal)'} • Terakhir Segar: ${formattedSyncTime}. Klik untuk auto-refresh sekarang.`}
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-300 animate-spin" />
                ) : isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                )}
                <span className="font-bold hidden sm:inline">
                  {isSyncing ? 'Sinkron...' : isOnline ? 'Auto-Refresh' : 'Offline'}
                </span>
                <span className="text-[10px] text-blue-200 opacity-80 hidden lg:inline font-mono">
                  {formattedSyncTime}
                </span>
              </button>
            )}

            {/* Install App Button */}
            <button
              onClick={onOpenInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition shadow-sm cursor-pointer border border-emerald-400/30"
              title="Instal aplikasi ke layar HP atau komputer"
            >
              <Smartphone className="w-3.5 h-3.5 text-white animate-bounce" />
              <span className="hidden sm:inline">Instal App</span>
            </button>

            {/* Today Date Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-700/50 text-blue-200">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium hidden sm:inline">{formatDateIndonesian(todayIso)}</span>
              <span className="font-medium sm:hidden">{todayIso}</span>
            </div>

            {/* QRIS Button */}
            <button
              onClick={onOpenQris}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white transition font-medium cursor-pointer"
              title="Lihat QRIS Pembayaran Bendahara"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>QRIS</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};



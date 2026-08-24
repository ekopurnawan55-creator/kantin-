import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, X } from 'lucide-react';

export interface SyncNotificationData {
  type: 'online' | 'offline' | 'synced';
  message: string;
  timestamp: number;
}

interface SyncNotificationBannerProps {
  notification: SyncNotificationData | null;
  onDismiss: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  onManualRefresh: () => void;
}

export const SyncNotificationBanner: React.FC<SyncNotificationBannerProps> = ({
  notification,
  onDismiss,
  isOnline,
  isSyncing,
  onManualRefresh,
}) => {
  if (!notification && isOnline) {
    return null;
  }

  // If permanently offline and no active popup toast, show subtle top offline warning
  if (!notification && !isOnline) {
    return (
      <div className="bg-amber-500 text-slate-900 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs transition z-20">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-4 h-4 text-slate-900 shrink-0 animate-pulse" />
            <span>Mode Offline Aktif — Anda tetap dapat mencatat iuran. Data akan disinkronkan otomatis saat kembali online.</span>
          </div>
          <button
            onClick={onManualRefresh}
            disabled={isSyncing}
            className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 hover:bg-slate-800 text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1 shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Cek Koneksi</span>
          </button>
        </div>
      </div>
    );
  }

  if (!notification) return null;

  return (
    <div
      className={`fixed top-16 sm:top-20 right-4 left-4 sm:left-auto sm:max-w-md z-50 p-3.5 rounded-2xl shadow-2xl border flex items-start justify-between gap-3 text-xs animate-in slide-in-from-top-4 duration-300 ${
        notification.type === 'online' || notification.type === 'synced'
          ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/40 backdrop-blur-md'
          : 'bg-amber-950/95 text-amber-100 border-amber-500/40 backdrop-blur-md'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`p-2 rounded-xl mt-0.5 shrink-0 ${
            notification.type === 'online' || notification.type === 'synced'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
          }`}
        >
          {notification.type === 'online' ? (
            <Wifi className="w-4 h-4" />
          ) : notification.type === 'synced' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
        </div>
        <div className="leading-snug">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-white text-xs">
              {notification.type === 'online'
                ? '🟢 Terhubung Kembali ke Internet'
                : notification.type === 'synced'
                ? '🔄 Auto-Refresh Berhasil'
                : '🟡 Beralih ke Mode Offline'}
            </h4>
            <span className="text-[10px] opacity-75">
              {new Date(notification.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-200">{notification.message}</p>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
        title="Tutup pemberitahuan"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

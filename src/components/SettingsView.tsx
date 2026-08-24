import React, { useState, useEffect, useRef } from 'react';
import { SchoolSettings, UserAccount } from '../types';
import { INITIAL_SETTINGS, exportAppDataJson, importAppDataJson } from '../utils/storage';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  Building,
  User,
  DollarSign,
  MessageSquare,
  Sparkles,
  Database,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Cloud,
  Check,
  Smartphone,
  Download,
  Upload,
} from 'lucide-react';

interface SettingsViewProps {
  settings: SchoolSettings;
  currentUser?: UserAccount | null;
  kantinCount?: number;
  iuranCount?: number;
  pengeluaranCount?: number;
  pemasukanLainCount?: number;
  isOnline?: boolean;
  isSyncing?: boolean;
  lastSyncedTime?: Date;
  autoRefreshOnReturn?: boolean;
  onToggleAutoRefreshOnReturn?: (val: boolean) => void;
  periodicSyncEnabled?: boolean;
  onTogglePeriodicSync?: (val: boolean) => void;
  onManualRefresh?: () => void;
  onSaveSettings: (newSettings: SchoolSettings) => void;
  onResetToCleanData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  kantinCount = 0,
  iuranCount = 0,
  pengeluaranCount = 0,
  pemasukanLainCount = 0,
  isOnline = true,
  isSyncing = false,
  lastSyncedTime = new Date(),
  autoRefreshOnReturn = true,
  onToggleAutoRefreshOnReturn,
  periodicSyncEnabled = true,
  onTogglePeriodicSync,
  onManualRefresh,
  onSaveSettings,
  onResetToCleanData,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleExportBackup = () => {
    try {
      const jsonStr = exportAppDataJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `cadangan_iuran_kantin_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToastMessage('Cadangan data (.json) berhasil diunduh!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert('Gagal mengunduh cadangan data.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = importAppDataJson(content);
        if (imported && imported.settings) {
          onSaveSettings(imported.settings);
        }
        if (onManualRefresh) {
          onManualRefresh();
        }
        setToastMessage('Data cadangan berhasil dipulihkan!');
        setTimeout(() => setToastMessage(null), 3500);
      } catch (err) {
        alert('Format file cadangan tidak valid atau rusak.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setToastMessage('Pengaturan berhasil disimpan!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan semua pengaturan ke standar awal sistem?')) {
      setFormData({ ...INITIAL_SETTINGS });
      onSaveSettings(INITIAL_SETTINGS);
      setToastMessage('Pengaturan dikembalikan ke default!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSyncFromAccount = () => {
    if (!currentUser) return;
    const updated: SchoolSettings = {
      ...formData,
      namaBendahara: currentUser.nama || formData.namaBendahara,
      namaSekolah: currentUser.namaSekolah !== undefined ? currentUser.namaSekolah : formData.namaSekolah,
      namaKantin: currentUser.namaKantin || formData.namaKantin || 'Pengelola Kantin Terpadu',
      noWaBendahara: currentUser.noWa || formData.noWaBendahara,
      bankAccountInfo: currentUser.bankAccountInfo || formData.bankAccountInfo || (currentUser.nama ? `Bank Transfer a.n ${currentUser.nama}` : formData.bankAccountInfo),
      defaultNominalIuran: currentUser.defaultNominalIuran || formData.defaultNominalIuran,
      anggaranBulanan: currentUser.anggaranBulanan || formData.anggaranBulanan,
    };
    setFormData(updated);
    onSaveSettings(updated);
    setToastMessage('Berhasil menyinkronkan data dari akun pendaftaran aktif!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Pengaturan Sistem & Penagihan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola identitas lembaga/sekolah, profil bendahara, iuran standar, dan format pesan WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser && (
            <button
              onClick={handleSyncFromAccount}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition cursor-pointer"
              title="Terapkan data profil pendaftaran akun login ke pengaturan"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Singkronkan Profil Akun</span>
            </button>
          )}

          <button
            onClick={handleResetDefault}
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Account Info Notice */}
      {currentUser && (
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {currentUser.nama.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-blue-950 block">{currentUser.nama} ({currentUser.email})</span>
              <span className="text-blue-700 text-[11px]">Akun Aktif • Terdaftar sebagai Bendahara / Pengelola Kas</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSyncFromAccount}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Singkronkan Ulang ke Form di Bawah</span>
          </button>
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Identitas Sekolah & Kantin */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Identitas Lembaga / Sekolah & Area Kantin</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lembaga / Sekolah (Opsional)</label>
              <input
                type="text"
                value={formData.namaSekolah || ''}
                onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                placeholder="misal: SMA Harapan Bangsa (boleh dikosongkan)"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Area Kantin</label>
              <input
                type="text"
                required
                value={formData.namaKantin}
                onChange={(e) => setFormData({ ...formData, namaKantin: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                placeholder="misal: Kantin Kejujuran Utama"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bendahara & Pembayaran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" />
            <span>Profil Bendahara & Rekening Pembayaran</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Bendahara Kantin</label>
              <input
                type="text"
                required
                value={formData.namaBendahara}
                onChange={(e) => setFormData({ ...formData, namaBendahara: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp Bendahara</label>
              <input
                type="text"
                value={formData.noWaBendahara || ''}
                onChange={(e) => setFormData({ ...formData, noWaBendahara: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                placeholder="misal: 081234567890"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">NIP / ID Bendahara (Opsional)</label>
              <input
                type="text"
                value={formData.nipBendahara || ''}
                onChange={(e) => setFormData({ ...formData, nipBendahara: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Iuran Harian (Rp)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.defaultNominalIuran}
                onChange={(e) => setFormData({ ...formData, defaultNominalIuran: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Anggaran Bulanan (Rp)</label>
              <input
                type="number"
                min="100000"
                step="50000"
                value={formData.anggaranBulanan ?? 1500000}
                onChange={(e) => setFormData({ ...formData, anggaranBulanan: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                placeholder="1500000"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Info Rekening Transfer Bank</label>
              <input
                type="text"
                value={formData.bankAccountInfo}
                onChange={(e) => setFormData({ ...formData, bankAccountInfo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                placeholder="Bank Mandiri 1234-5678-90 a.n Bendahara Kantin"
              />
            </div>
          </div>
        </div>

        {/* Section: Rotasi & Orientasi Layar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Pengaturan Rotasi & Orientasi Layar
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tentukan mode orientasi layar aplikasi pada perangkat seluler atau tablet Anda.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'auto', label: 'Bebas Rotasi (Auto)', desc: 'Mengikuti sensor rotasi perangkat' },
              { id: 'portrait', label: 'Potret Saja (Portrait)', desc: 'Terkunci tegak vertikal' },
              { id: 'landscape', label: 'Lanskap Saja (Landscape)', desc: 'Terkunci mendatar horizontal' },
            ].map((item) => {
              const currentVal = formData.screenOrientation || 'auto';
              const isSelected = currentVal === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, screenOrientation: item.id as 'auto' | 'portrait' | 'landscape' })}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-50/80 border-purple-300 shadow-xs ring-2 ring-purple-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-extrabold ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                      {item.label}
                    </span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Template WhatsApp */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Template Pesan WhatsApp Penagihan</span>
            </h3>
            <span className="text-[11px] text-blue-600 font-medium">
              Gunakan tanda kurung kurawal &#123;...&#125; untuk data dinamis
            </span>
          </div>

          <div className="text-xs space-y-2">
            <textarea
              rows={9}
              value={formData.waMessageTemplate}
              onChange={(e) => setFormData({ ...formData, waMessageTemplate: e.target.value })}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-700 block mb-1">Variabel Otomatis Tersedia:</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">&#123;pemilik&#125;</code>,{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">&#123;kantin&#125;</code>,{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">&#123;sekolah&#125;</code>,{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">&#123;tanggal&#125;</code>,{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">&#123;nominal&#125;</code>,{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">&#123;status&#125;</code>,{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">&#123;tunggakan_info&#125;</code>,{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">&#123;bank&#125;</code>,{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-blue-700">&#123;bendahara&#125;</code>
              </p>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg transition cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>

      </form>

      {/* Section 4: Auto-Refresh & Sinkronisasi Data Offline */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Sinkronisasi Otomatis & Auto-Refresh Data</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
                  <span>{isOnline ? 'Online (Terhubung)' : 'Mode Offline'}</span>
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mengatur penyegaran otomatis data iuran ketika koneksi pulih kembali atau aplikasi dibuka kembali setelah layar mati/minim.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onManualRefresh && (
              <button
                type="button"
                onClick={onManualRefresh}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition cursor-pointer"
                title="Sinkronkan & segarkan data sekarang"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Segarkan Data Sekarang'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Status Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Terakhir Disinkronkan:</span>
            <span className="font-bold font-mono text-slate-900">
              {lastSyncedTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Status Penyimpanan Lokal:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Aman & Tersimpan</span>
            </span>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 pt-1 text-xs">
          {/* Toggle 1: Auto Refresh on Return / Online */}
          <label className="flex items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200 cursor-pointer transition">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block">
                Auto-Refresh Saat Online & Kembali ke Aplikasi
              </span>
              <p className="text-[11px] text-slate-500 leading-snug">
                Secara otomatis memuat ulang dan merefresh seluruh data iuran seketika setelah perangkat kembali online atau tab dibuka kembali.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoRefreshOnReturn}
              onChange={(e) => onToggleAutoRefreshOnReturn?.(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0 mt-0.5 sm:mt-0"
            />
          </label>

          {/* Toggle 2: Background Periodic Sync */}
          <label className="flex items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200 cursor-pointer transition">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block">
                Auto-Refresh Berkala di Latar Belakang (Setiap 30 Detik)
              </span>
              <p className="text-[11px] text-slate-500 leading-snug">
                Menjaga data tetap up-to-date dan tersinkronisasi dengan perubahan multi-tab tanpa perlu menekan tombol F5 / reload browser.
              </p>
            </div>
            <input
              type="checkbox"
              checked={periodicSyncEnabled}
              onChange={(e) => onTogglePeriodicSync?.(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0 mt-0.5 sm:mt-0"
            />
          </label>
        </div>
      </div>

      {/* Section 5: Database Management & Clean Application */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Manajemen Database
              </h3>
              <p className="text-[11px] text-slate-500">
                Kelola status data aplikasi jika ingin mengosongkan seluruh data untuk memulai pembukuan dari nol.
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600 hidden sm:block">
            <span className="font-bold text-slate-800">{kantinCount}</span> Stan •{' '}
            <span className="font-bold text-slate-800">{iuranCount}</span> Iuran •{' '}
            <span className="font-bold text-slate-800">{pemasukanLainCount}</span> Dana Luar •{' '}
            <span className="font-bold text-slate-800">{pengeluaranCount}</span> Pengeluaran
          </div>
        </div>

        <div className="pt-1 space-y-3">
          {/* Action: Backup & Restore */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Cadangkan & Pulihkan Data (*Backup & Restore*)</span>
              </span>
              <p className="text-[11px] text-blue-700 mt-1 leading-snug">
                Unduh salinan data (format .json) untuk disimpan sebagai arsip aman atau pulihkan data saat pindah ke HP/Laptop lain.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Backup (.json)</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportBackup}
                accept=".json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Pulihkan Data</span>
              </button>
            </div>
          </div>

          {/* Action: Bersihkan Data */}
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Mulai dari Nol (Kosongkan Database)</span>
              </span>
              <p className="text-[11px] text-rose-700 mt-1 leading-snug">
                Kosongkan seluruh stan kantin dan riwayat transaksi iuran/pengeluaran agar pembeli dapat memulai penginputan kantin riil secara mandiri.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin MENGOSONGKAN seluruh stan kantin dan transaksi? Aplikasi akan kembali bersih tanpa data.')) {
                  if (onResetToCleanData) {
                    onResetToCleanData();
                    setToastMessage('Aplikasi berhasil dibersihkan! Mulai input kantin pertama Anda.');
                    setTimeout(() => setToastMessage(null), 3000);
                  }
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Semua Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


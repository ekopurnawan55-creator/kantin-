import React from 'react';
import { Kantin, IuranHarian, ActiveTab, SchoolSettings, Pengeluaran, PemasukanLain, UserAccount } from '../types';
import {
  formatRupiah,
  formatDateIndonesian,
  formatShortDate,
  getTodayIsoString,
  generateWhatsAppLink,
} from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Store,
  PieChart,
  ShieldAlert,
  Sparkles,
  Receipt,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  Target,
  AlertCircle,
  Building,
  UserPlus,
  Info,
} from 'lucide-react';

interface DashboardViewProps {
  kantinList: Kantin[];
  iuranRecords: IuranHarian[];
  pengeluaranList: Pengeluaran[];
  pemasukanLainList: PemasukanLain[];
  settings: SchoolSettings;
  currentUser?: UserAccount | null;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenWaReminder: (kantin: Kantin) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kantinList,
  iuranRecords,
  pengeluaranList,
  pemasukanLainList,
  settings,
  currentUser,
  setActiveTab,
  onOpenWaReminder,
}) => {
  const todayIso = getTodayIsoString();
  const currentMonthIso = todayIso.substring(0, 7);
  const activeKantin = kantinList.filter((k) => k.status === 'Aktif');

  // Compute Today's Fee Stats
  const todayRecords = iuranRecords.filter((r) => r.tanggal === todayIso);
  const totalTargetToday = activeKantin.reduce((sum, k) => sum + k.nominalIuran, 0);
  const totalCollectedToday = todayRecords.reduce((sum, r) => sum + r.nominalDibayar, 0);
  const totalArrearsToday = Math.max(0, totalTargetToday - totalCollectedToday);

  // Compute Today's External Income
  const todayPemasukanLain = pemasukanLainList.filter((item) => item.tanggal === todayIso);
  const totalPemasukanLainToday = todayPemasukanLain.reduce((sum, item) => sum + item.nominal, 0);
  const totalKasMasukHariIni = totalCollectedToday + totalPemasukanLainToday;

  const countLunas = todayRecords.filter((r) => r.statusBayar === 'Lunas').length;
  const countBelum = activeKantin.length - countLunas; // unpaid or not recorded yet
  const percentComplete = totalTargetToday > 0 ? Math.round((totalCollectedToday / totalTargetToday) * 100) : 0;

  // Compute Expense Stats
  const todayExpenses = pengeluaranList.filter((item) => item.tanggal === todayIso);
  const totalExpenseToday = todayExpenses.reduce((sum, item) => sum + item.nominal, 0);

  const currentMonthExpenses = pengeluaranList.filter((item) => item.tanggal.startsWith(currentMonthIso));
  const totalExpenseMonth = currentMonthExpenses.reduce((sum, item) => sum + item.nominal, 0);

  // Monthly Income (Iuran + Pemasukan Luar)
  const currentMonthIuran = iuranRecords
    .filter((r) => r.tanggal.startsWith(currentMonthIso))
    .reduce((sum, r) => sum + r.nominalDibayar, 0);

  const currentMonthPemasukanLain = pemasukanLainList
    .filter((item) => item.tanggal.startsWith(currentMonthIso))
    .reduce((sum, item) => sum + item.nominal, 0);

  const currentMonthTotalIncome = currentMonthIuran + currentMonthPemasukanLain;
  const netCashFlowMonth = currentMonthTotalIncome - totalExpenseMonth;

  // Total All-Time Balance Calculation
  const totalAllTimeIuran = iuranRecords.reduce((sum, r) => sum + r.nominalDibayar, 0);
  const totalAllTimePemasukanLain = pemasukanLainList.reduce((sum, item) => sum + item.nominal, 0);
  const totalAllTimePengeluaran = pengeluaranList.reduce((sum, item) => sum + item.nominal, 0);
  const totalSaldoKasSaatIni = (totalAllTimeIuran + totalAllTimePemasukanLain) - totalAllTimePengeluaran;

  // Monthly Budget Calculations
  const monthlyBudget = settings.anggaranBulanan || 1500000;
  const remainingBudget = monthlyBudget - totalExpenseMonth;
  const budgetUsagePercent = monthlyBudget > 0 ? Math.round((totalExpenseMonth / monthlyBudget) * 100) : 0;
  const clampedBudgetPercent = Math.min(100, Math.max(0, budgetUsagePercent));
  const isOverBudget = totalExpenseMonth > monthlyBudget;
  const isWarningBudget = budgetUsagePercent >= 75 && !isOverBudget;

  // Recent 3 expenses
  const recentExpenses = [...pengeluaranList]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, 3);

  // Recent 3 external incomes
  const recentPemasukanLain = [...pemasukanLainList]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, 3);

  // Unpaid Kantin List Today
  const unpaidKantinToday = activeKantin.filter((k) => {
    const rec = todayRecords.find((r) => r.kantinId === k.id);
    return !rec || rec.statusBayar === 'Belum Bayar';
  });

  // Calculate Arrears over all records per kantin
  const kantinArrearsSummary = activeKantin.map((k) => {
    const records = iuranRecords.filter((r) => r.kantinId === k.id && r.statusBayar === 'Belum Bayar');
    const totalTunggakan = records.reduce((sum, r) => sum + (k.nominalIuran - r.nominalDibayar), 0);
    return {
      kantin: k,
      daysCount: records.length,
      totalTunggakan,
    };
  }).filter((item) => item.totalTunggakan > 0);

  // Method breakdown
  const qrisCount = todayRecords.filter((r) => r.metodePembayaran === 'QRIS').length;
  const transferCount = todayRecords.filter((r) => r.metodePembayaran === 'Transfer').length;
  const tunaiCount = todayRecords.filter((r) => r.metodePembayaran === 'Tunai').length;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Store className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold mb-3 border border-white/20">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span>{formatDateIndonesian(todayIso)}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Selamat Datang, {settings.namaBendahara} 👋
          </h2>
          <p className="text-sm text-blue-100 mt-1">
            {settings.namaSekolah ? `${settings.namaSekolah} • ` : ''}Ringkasan penerimaan iuran harian kantin & saldo kas operasional. Pastikan arus kas tercatat dengan rapi dan transparan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('input')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Input Penagihan Hari Ini</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('pemasukan-lain')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>+ Catat Dana Luar</span>
            </button>
            <button
              onClick={() => setActiveTab('pengeluaran')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Pengeluaran</span>
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs sm:text-sm font-medium border border-white/20 transition cursor-pointer"
            >
              <span>Laporan Rekap Bulanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Assistant when Kantin Master is empty (Clean Application State for New Buyers) */}
      {kantinList.length === 0 && (
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-2xl p-5 border border-emerald-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  ✨ Akun Anda Telah Terhubung & Siap Digunakan!
                </h3>
                <p className="text-xs text-emerald-800">
                  Aplikasi telah disinkronkan dengan data pendaftaran Anda. Database saat ini dalam status bersih (kosong) dan siap diisi.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-200/70 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center">1</span>
              <h4 className="font-bold text-slate-800">Daftarkan Stan Kantin</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tambahkan nama lapak kantin, nama pemilik pedagang, nomor WhatsApp, dan nominal iuran harian.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-200/70 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] flex items-center justify-center">2</span>
              <h4 className="font-bold text-slate-800">Catat Penagihan Harian</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tandai pembayaran 1-klik (Lunas, Belum, Libur) atau kirim nota penagihan WhatsApp langsung.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-200/70 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-black text-[11px] flex items-center justify-center">3</span>
              <h4 className="font-bold text-slate-800">Pantau Saldo & Anggaran</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Catat dana masuk tambahan & kas operasional untuk memantau neraca kas secara real-time.
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-end">
            <button
              onClick={() => setActiveTab('kantin')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Daftarkan Stan Kantin Pertama</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Terbayar Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kas Masuk Hari Ini
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-600">
              {formatRupiah(totalKasMasukHariIni)}
            </div>
            <div className="flex flex-wrap items-center gap-1 mt-1 text-[11px] font-medium text-slate-600">
              <span>Iuran: <strong className="text-emerald-700">{formatRupiah(totalCollectedToday)}</strong></span>
              {totalPemasukanLainToday > 0 && (
                <span>• Luar: <strong className="text-teal-700">+{formatRupiah(totalPemasukanLainToday)}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Pengeluaran Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pengeluaran Hari Ini
            </span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-rose-600">
              {formatRupiah(totalExpenseToday)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {todayExpenses.length} Transaksi pengeluaran
            </p>
          </div>
        </div>

        {/* Card 3: Tunggakan Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tunggakan Iuran Hari Ini
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-extrabold ${totalArrearsToday > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {formatRupiah(totalArrearsToday)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs font-medium text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              <span>{countBelum} Kantin Belum Bayar</span>
            </div>
          </div>
        </div>

        {/* Card 4: Sisa Saldo Kas Bersih Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Surplus Kas Bulan Ini
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-extrabold ${netCashFlowMonth >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              {formatRupiah(netCashFlowMonth)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Masuk: <strong className="text-emerald-600">{formatRupiah(currentMonthTotalIncome)}</strong> | Keluar: <strong className="text-rose-600">{formatRupiah(totalExpenseMonth)}</strong>
            </p>
          </div>
        </div>

      </div>

      {/* Real-time Monthly Budget Progress Bar Card */}
      <div className={`rounded-2xl p-5 border shadow-xs transition ${
        isOverBudget
          ? 'bg-rose-50/80 border-rose-200'
          : isWarningBudget
          ? 'bg-amber-50/80 border-amber-200'
          : 'bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 border-indigo-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isOverBudget
                ? 'bg-rose-100 text-rose-700'
                : isWarningBudget
                ? 'bg-amber-100 text-amber-700'
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Monitoring Anggaran Bulanan (Real-Time)
                </h3>
                {isOverBudget ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Over-Budget ({budgetUsagePercent}%)</span>
                  </span>
                ) : isWarningBudget ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Waspada ({budgetUsagePercent}%)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Anggaran Aman ({budgetUsagePercent}%)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau realisasi pengeluaran operasional & sarpras terhadap pagu anggaran belanja bulan ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pengeluaran')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-200 shadow-2xs cursor-pointer"
            >
              <span>Kelola Anggaran & Pengeluaran</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
          <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pagu Anggaran
            </span>
            <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
              {formatRupiah(monthlyBudget)}
            </div>
            <span className="text-[10px] text-slate-400">Batas belanja bulan ini</span>
          </div>

          <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Realisasi Pengeluaran
            </span>
            <div className="text-base sm:text-lg font-extrabold text-rose-600 mt-0.5">
              {formatRupiah(totalExpenseMonth)}
            </div>
            <span className="text-[10px] text-slate-400">{budgetUsagePercent}% dari kuota pagu</span>
          </div>

          <div className={`p-3 rounded-xl border ${
            isOverBudget ? 'bg-rose-100/80 border-rose-200' : 'bg-white/90 backdrop-blur-xs border-slate-200/70'
          }`}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {isOverBudget ? 'Defisit Melebihi Anggaran' : 'Sisa Kuota Anggaran'}
            </span>
            <div className={`text-base sm:text-lg font-extrabold mt-0.5 ${
              isOverBudget ? 'text-rose-700' : 'text-emerald-600'
            }`}>
              {isOverBudget ? `-${formatRupiah(Math.abs(remainingBudget))}` : formatRupiah(remainingBudget)}
            </div>
            <span className="text-[10px] text-slate-400">
              {isOverBudget ? 'Perlu evaluasi pengeluaran' : 'Sisa kuota siap dialokasikan'}
            </span>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-700 flex items-center gap-1.5">
              <span>Keterpakaian Pagu:</span>
              <span className={isOverBudget ? 'text-rose-600 font-extrabold' : isWarningBudget ? 'text-amber-600' : 'text-emerald-700'}>
                {budgetUsagePercent}% ({formatRupiah(totalExpenseMonth)} / {formatRupiah(monthlyBudget)})
              </span>
            </span>
            <span className={`text-[11px] font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-600'}`}>
              {isOverBudget ? `Over Pagu: ${formatRupiah(Math.abs(remainingBudget))}` : `Tersedia: ${formatRupiah(remainingBudget)}`}
            </span>
          </div>
          <div className="w-full h-3.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget
                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                  : isWarningBudget
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${clampedBudgetPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Cash Flow & Recent Expenses Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Unpaid Canteen List Today */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Daftar Penagihan Hari Ini ({unpaidKantinToday.length} Belum Bayar)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Kantin yang belum melakukan pembayaran iuran untuk tanggal hari ini.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('input')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Kelola Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {unpaidKantinToday.length === 0 ? (
            <div className="text-center py-8 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-emerald-900 text-sm">
                Alhamdulillah! Seluruh kantin sudah lunas hari ini 🎉
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Semua target penerimaan iuran harian telah terkumpul 100%.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {unpaidKantinToday.map((kantin) => (
                <div
                  key={kantin.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {kantin.namaKantin.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {kantin.namaKantin}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Pemilik: <span className="font-semibold text-slate-700">{kantin.namaPemilik}</span> • WA: {kantin.noWa}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Nominal: {formatRupiah(kantin.nominalIuran)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {kantin.jenisDagangan}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onOpenWaReminder(kantin)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Tagihan WA</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Recent Expenses & External Incomes Widgets */}
        <div className="space-y-6">
          
          {/* Recent External Incomes Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-teal-600" />
                <span>Dana Masuk Luar Terbaru</span>
              </h3>
              <button
                onClick={() => setActiveTab('pemasukan-lain')}
                className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentPemasukanLain.length === 0 ? (
              <div className="text-center py-5 bg-slate-50 rounded-xl text-slate-500 text-xs">
                Belum ada catatan dana luar.
                <button
                  onClick={() => setActiveTab('pemasukan-lain')}
                  className="mt-2 block mx-auto text-teal-600 font-bold hover:underline"
                >
                  + Catat Pemasukan Luar
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentPemasukanLain.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500">
                          {formatShortDate(inc.tanggal)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-teal-100 text-teal-800 font-semibold truncate max-w-[120px]">
                          {inc.kategori}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate mt-0.5" title={inc.keterangan}>
                        {inc.keterangan}
                      </p>
                      <span className="text-[10px] text-slate-500 block truncate">
                        Dari: {inc.sumberPemberi}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-teal-700 block">
                        +{formatRupiah(inc.nominal)}
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setActiveTab('pemasukan-lain')}
                  className="w-full mt-2 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl border border-teal-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Catat Pemasukan Luar</span>
                </button>
              </div>
            )}
          </div>

          {/* Recent Expenses Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran Kas Terbaru</span>
              </h3>
              <button
                onClick={() => setActiveTab('pengeluaran')}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl text-slate-500 text-xs">
                Belum ada pengeluaran yang tercatat.
                <button
                  onClick={() => setActiveTab('pengeluaran')}
                  className="mt-2 block mx-auto text-rose-600 font-bold hover:underline"
                >
                  + Catat Pengeluaran
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50/50 border border-slate-100 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500">
                          {formatShortDate(exp.tanggal)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-slate-200 text-slate-700 font-semibold truncate max-w-[110px]">
                          {exp.kategori}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                        {exp.keterangan}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-rose-600 block">
                        -{formatRupiah(exp.nominal)}
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setActiveTab('pengeluaran')}
                  className="w-full mt-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Catat Pengeluaran Baru</span>
                </button>
              </div>
            )}
          </div>

          {/* Arrears Monitor Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>Pantauan Tunggakan Kumulatif</span>
              </h3>
            </div>

            {kantinArrearsSummary.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl">
                Tidak ada tunggakan dari hari-hari sebelumnya. Kepatuhan sangat baik!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {kantinArrearsSummary.map((item) => (
                  <div
                    key={item.kantin.id}
                    className="p-3 bg-red-50/60 rounded-xl border border-red-100 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        {item.kantin.namaKantin}
                      </h5>
                      <p className="text-[10px] text-red-700">
                        {item.daysCount} Hari Tunggakan
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-red-600 text-xs block">
                        {formatRupiah(item.totalTunggakan)}
                      </span>
                      <button
                        onClick={() => onOpenWaReminder(item.kantin)}
                        className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Tagih via WA →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

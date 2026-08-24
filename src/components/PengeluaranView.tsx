import React, { useState, useMemo } from 'react';
import { Pengeluaran, SchoolSettings, KategoriPengeluaran } from '../types';
import {
  formatRupiah,
  formatDateIndonesian,
  formatShortDate,
  formatMonthYearLabel,
  getTodayIsoString,
} from '../utils/formatters';
import { exportPengeluaranPdf } from '../utils/exportPdf';
import { exportPengeluaranExcel } from '../utils/exportExcel';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  FileSpreadsheet,
  Trash2,
  Edit,
  Calendar,
  DollarSign,
  TrendingDown,
  Clock,
  CheckCircle2,
  X,
  AlertTriangle,
  Tag,
  Store,
  CreditCard,
  Banknote,
  RotateCcw,
  Target,
  Sliders,
  AlertCircle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface PengeluaranViewProps {
  pengeluaranList: Pengeluaran[];
  settings: SchoolSettings;
  onAddPengeluaran: (item: Pengeluaran) => void;
  onUpdatePengeluaran: (item: Pengeluaran) => void;
  onDeletePengeluaran: (id: string) => void;
  onUpdateSettings?: (settings: SchoolSettings) => void;
}

const KATEGORI_OPTIONS: KategoriPengeluaran[] = [
  'Kebersihan & Sanitasi',
  'Listrik & Air',
  'Perbaikan Sarpras',
  'Operasional & ATK',
  'Keamanan & Ketertiban',
  'Konsumsi & Rapat',
  'Lain-lain',
];

const KATEGORI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Kebersihan & Sanitasi': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Listrik & Air': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Perbaikan Sarpras': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Operasional & ATK': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Keamanan & Ketertiban': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Konsumsi & Rapat': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Lain-lain': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

export const PengeluaranView: React.FC<PengeluaranViewProps> = ({
  pengeluaranList,
  settings,
  onAddPengeluaran,
  onUpdatePengeluaran,
  onDeletePengeluaran,
  onUpdateSettings,
}) => {
  const todayIso = getTodayIsoString();
  const currentMonthIso = todayIso.substring(0, 7);

  // Filters state
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthIso);
  const [filterAllMonths, setFilterAllMonths] = useState<boolean>(false);
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [budgetInput, setBudgetInput] = useState<number>(settings.anggaranBulanan || 1500000);
  const [budgetSuccessToast, setBudgetSuccessToast] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Pengeluaran | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formTanggal, setFormTanggal] = useState<string>(todayIso);
  const [formKategori, setFormKategori] = useState<string>('Kebersihan & Sanitasi');
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [formNominal, setFormNominal] = useState<number>(50000);
  const [formPenerima, setFormPenerima] = useState<string>('');
  const [formMetode, setFormMetode] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [formNomorBukti, setFormNomorBukti] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Handle Save Budget
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetInput <= 0) return;
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        anggaranBulanan: budgetInput,
      });
    }
    setIsBudgetModalOpen(false);
    setBudgetSuccessToast(`Anggaran bulanan berhasil diperbarui menjadi ${formatRupiah(budgetInput)}`);
    setTimeout(() => setBudgetSuccessToast(null), 3000);
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTanggal(todayIso);
    setFormKategori('Kebersihan & Sanitasi');
    setFormKeterangan('');
    setFormNominal(50000);
    setFormPenerima('');
    setFormMetode('Tunai');
    setFormNomorBukti(`NOTA-${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(10 + Math.random() * 90)}`);
    setFormCatatan('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: Pengeluaran) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormKategori(item.kategori);
    setFormKeterangan(item.keterangan);
    setFormNominal(item.nominal);
    setFormPenerima(item.penerima || '');
    setFormMetode(item.metodePembayaran);
    setFormNomorBukti(item.nomorBukti || '');
    setFormCatatan(item.catatan || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit modal
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKeterangan.trim()) {
      setFormError('Keterangan pengeluaran wajib diisi!');
      return;
    }
    if (formNominal <= 0) {
      setFormError('Nominal pengeluaran harus lebih besar dari Rp 0!');
      return;
    }

    if (editingItem) {
      const updated: Pengeluaran = {
        ...editingItem,
        tanggal: formTanggal,
        kategori: formKategori,
        keterangan: formKeterangan.trim(),
        nominal: formNominal,
        penerima: formPenerima.trim(),
        metodePembayaran: formMetode,
        nomorBukti: formNomorBukti.trim(),
        catatan: formCatatan.trim(),
      };
      onUpdatePengeluaran(updated);
    } else {
      const newPengeluaran: Pengeluaran = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tanggal: formTanggal,
        kategori: formKategori,
        keterangan: formKeterangan.trim(),
        nominal: formNominal,
        penerima: formPenerima.trim(),
        metodePembayaran: formMetode,
        nomorBukti: formNomorBukti.trim(),
        catatan: formCatatan.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddPengeluaran(newPengeluaran);
    }

    setIsModalOpen(false);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return pengeluaranList
      .filter((item) => {
        // Month filter
        if (!filterAllMonths && !item.tanggal.startsWith(selectedMonth)) {
          return false;
        }
        // Category filter
        if (selectedKategori !== 'all' && item.kategori !== selectedKategori) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchKeterangan = item.keterangan.toLowerCase().includes(q);
          const matchPenerima = item.penerima?.toLowerCase().includes(q);
          const matchBukti = item.nomorBukti?.toLowerCase().includes(q);
          const matchCatatan = item.catatan?.toLowerCase().includes(q);
          const matchKategori = item.kategori.toLowerCase().includes(q);
          return matchKeterangan || matchPenerima || matchBukti || matchCatatan || matchKategori;
        }
        return true;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [pengeluaranList, selectedMonth, filterAllMonths, selectedKategori, searchQuery]);

  // Key stats calculation
  const stats = useMemo(() => {
    // Current Month Total
    const currentMonthExpenses = pengeluaranList.filter((item) => item.tanggal.startsWith(selectedMonth));
    const totalMonth = currentMonthExpenses.reduce((sum, item) => sum + item.nominal, 0);

    // Today's Total
    const todayExpenses = pengeluaranList.filter((item) => item.tanggal === todayIso);
    const totalToday = todayExpenses.reduce((sum, item) => sum + item.nominal, 0);

    // Filtered Total & Averages
    const totalFiltered = filteredList.reduce((sum, item) => sum + item.nominal, 0);
    const avgPerTrans = filteredList.length > 0 ? Math.round(totalFiltered / filteredList.length) : 0;

    return {
      totalMonth,
      totalToday,
      totalFiltered,
      countFiltered: filteredList.length,
      avgPerTrans,
    };
  }, [pengeluaranList, filteredList, selectedMonth, todayIso]);

  // Category breakdown for current filter
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredList.forEach((item) => {
      map[item.kategori] = (map[item.kategori] || 0) + item.nominal;
    });

    return Object.entries(map)
      .map(([kategori, total]) => ({
        kategori,
        total,
        percent: stats.totalFiltered > 0 ? Math.round((total / stats.totalFiltered) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredList, stats.totalFiltered]);

  // Export handlers
  const handleExportPdf = () => {
    const period = filterAllMonths ? 'Semua Periode' : formatMonthYearLabel(selectedMonth);
    exportPengeluaranPdf(period, filteredList, settings);
  };

  const handleExportExcel = () => {
    const period = filterAllMonths ? 'Semua Periode' : selectedMonth;
    exportPengeluaranExcel(period, filteredList, settings);
  };

  // Budget Calculations for Active Month
  const currentBudget = settings.anggaranBulanan || 1500000;
  const currentMonthExpensesTotal = stats.totalMonth;
  const remainingBudget = currentBudget - currentMonthExpensesTotal;
  const budgetUsagePercent = currentBudget > 0 ? Math.round((currentMonthExpensesTotal / currentBudget) * 100) : 0;
  const clampedBudgetPercent = Math.min(100, Math.max(0, budgetUsagePercent));
  const isOverBudget = currentMonthExpensesTotal > currentBudget;
  const isWarningBudget = budgetUsagePercent >= 75 && !isOverBudget;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {budgetSuccessToast && (
        <div className="fixed bottom-16 sm:bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{budgetSuccessToast}</span>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-2">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Buku Kas & Pengeluaran Dana</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-rose-600" />
              <span>Pencatatan Pengeluaran Dana Kantin</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Catat dan pantau seluruh pengeluaran operasional kantin seperti kebersihan, perbaikan sarpras, listrik, dan ATK.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setBudgetInput(settings.anggaranBulanan || 1500000);
                setIsBudgetModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs sm:text-sm font-bold border border-indigo-200 transition cursor-pointer"
              title="Atur Target Anggaran Belanja Bulanan"
            >
              <Target className="w-4 h-4 text-indigo-600" />
              <span>Atur Anggaran Bulanan</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Pengeluaran Baru</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
              title="Ekspor Laporan Pengeluaran ke PDF"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition cursor-pointer border border-emerald-200"
              title="Ekspor Laporan Pengeluaran ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Ekspor Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Monthly Budget Progress Card */}
      <div className={`rounded-2xl p-5 border transition shadow-xs ${
        isOverBudget 
          ? 'bg-rose-50/70 border-rose-200' 
          : isWarningBudget 
          ? 'bg-amber-50/70 border-amber-200' 
          : 'bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 border-indigo-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              isOverBudget
                ? 'bg-rose-100 text-rose-700'
                : isWarningBudget
                ? 'bg-amber-100 text-amber-700'
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Monitoring Anggaran Bulanan ({formatMonthYearLabel(selectedMonth)})
                </h3>
                {isOverBudget ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Over-Budget ({budgetUsagePercent}%)</span>
                  </span>
                ) : isWarningBudget ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Waspada ({budgetUsagePercent}%)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Anggaran Aman ({budgetUsagePercent}%)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target batas belanja operasional kantin yang ditetapkan oleh bendahara sekolah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBudgetInput(settings.anggaranBulanan || 1500000);
                setIsBudgetModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ubah Anggaran</span>
            </button>
          </div>
        </div>

        {/* Budget Numbers & Progress Bar */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Target Anggaran */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Target Anggaran
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                {formatRupiah(currentBudget)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Batas belanja bulanan</span>
            </div>

            {/* Realisasi Pengeluaran */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Realisasi Pengeluaran
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-rose-600 mt-1">
                {formatRupiah(currentMonthExpensesTotal)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {budgetUsagePercent}% terpakai dari anggaran
              </span>
            </div>

            {/* Sisa Kuota Anggaran */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isOverBudget ? 'Defisit Anggaran' : 'Sisa Kuota Anggaran'}
              </span>
              <div className={`text-lg sm:text-xl font-extrabold mt-1 ${
                isOverBudget ? 'text-rose-700' : 'text-emerald-600'
              }`}>
                {isOverBudget ? `-${formatRupiah(Math.abs(remainingBudget))}` : formatRupiah(remainingBudget)}
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                {isOverBudget ? 'Melebihi alokasi dana' : 'Tersedia untuk sisa periode'}
              </span>
            </div>

          </div>

          {/* Visual Progress Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span>Keterpakaian Anggaran:</span>
                <span className={isOverBudget ? 'text-rose-600' : isWarningBudget ? 'text-amber-600' : 'text-emerald-700'}>
                  {budgetUsagePercent}% ({formatRupiah(currentMonthExpensesTotal)} / {formatRupiah(currentBudget)})
                </span>
              </span>
              <span className={`text-[11px] font-semibold ${
                isOverBudget ? 'text-rose-600 font-extrabold' : 'text-slate-500'
              }`}>
                {isOverBudget 
                  ? `Over ${formatRupiah(Math.abs(remainingBudget))}` 
                  : `Sisa ${formatRupiah(remainingBudget)}`}
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
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Pengeluaran Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {filterAllMonths ? 'Total Pengeluaran (Semua)' : `Pengeluaran ${formatMonthYearLabel(selectedMonth)}`}
            </span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-rose-600">
              {formatRupiah(filterAllMonths ? stats.totalFiltered : stats.totalMonth)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dari {filterAllMonths ? stats.countFiltered : pengeluaranList.filter((i) => i.tanggal.startsWith(selectedMonth)).length} catatan transaksi
            </p>
          </div>
        </div>

        {/* Total Pengeluaran Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pengeluaran Hari Ini
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatRupiah(stats.totalToday)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {pengeluaranList.filter((i) => i.tanggal === todayIso).length} Transaksi hari ini
            </p>
          </div>
        </div>

        {/* Jumlah Transaksi Terfilter */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Transaksi
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-blue-600">
              {stats.countFiltered} Transaksi
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sesuai filter yang dipilih
            </p>
          </div>
        </div>

        {/* Rata-rata per Transaksi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rata-rata / Pengeluaran
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-indigo-600">
              {formatRupiah(stats.avgPerTrans)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rerata per transaksi pengeluaran
            </p>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left filters: Month & Category */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Month selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="month"
                value={selectedMonth}
                disabled={filterAllMonths}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`text-xs font-bold outline-hidden bg-transparent cursor-pointer ${
                  filterAllMonths ? 'text-slate-400 opacity-50' : 'text-slate-800'
                }`}
              />
            </div>

            {/* Toggle all months */}
            <button
              onClick={() => setFilterAllMonths(!filterAllMonths)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                filterAllMonths
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {filterAllMonths ? '✓ Semua Bulan' : 'Semua Bulan'}
            </button>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
              <Tag className="w-4 h-4 text-slate-500" />
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Right: Search box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari keterangan / penerima..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Category Breakdown Chips */}
        {categoryBreakdown.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Rincian Kategori:</span>
            {categoryBreakdown.map((cat) => {
              const color = KATEGORI_COLORS[cat.kategori] || KATEGORI_COLORS['Lain-lain'];
              return (
                <div
                  key={cat.kategori}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${color.bg} ${color.text} ${color.border}`}
                >
                  <span>{cat.kategori}:</span>
                  <span className="font-extrabold">{formatRupiah(cat.total)}</span>
                  <span className="text-[10px] opacity-75">({cat.percent}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Expense Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Table header bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>Daftar Transaksi Pengeluaran ({filteredList.length} Catatan)</span>
          </h3>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
            Total: {formatRupiah(stats.totalFiltered)}
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Belum Ada Data Pengeluaran
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada catatan pengeluaran pada periode atau filter yang dipilih. Silakan catat pengeluaran baru.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Pengeluaran Sekarang</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile < 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-12">No</th>
                    <th className="py-3.5 px-4">Tanggal & Bukti</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Keterangan & Catatan</th>
                    <th className="py-3.5 px-4">Penerima Dana</th>
                    <th className="py-3.5 px-4 text-center">Metode</th>
                    <th className="py-3.5 px-4 text-right">Nominal</th>
                    <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((item, index) => {
                    const color = KATEGORI_COLORS[item.kategori] || KATEGORI_COLORS['Lain-lain'];
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {formatShortDate(item.tanggal)}
                          </div>
                          {item.nomorBukti && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {item.nomorBukti}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${color.bg} ${color.text} ${color.border}`}
                          >
                            {item.kategori}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {item.keterangan}
                          </div>
                          {item.catatan && (
                            <div className="text-[11px] text-slate-500 mt-0.5 italic">
                              "{item.catatan}"
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {item.penerima || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.metodePembayaran === 'Tunai'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {item.metodePembayaran === 'Tunai' ? (
                              <Banknote className="w-3 h-3" />
                            ) : (
                              <CreditCard className="w-3 h-3" />
                            )}
                            <span>{item.metodePembayaran}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-extrabold text-rose-600 text-sm">
                            {formatRupiah(item.nominal)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Edit Pengeluaran"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Pengeluaran"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50/90 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan={6} className="py-3 px-4 text-right text-slate-700 uppercase tracking-wider text-[11px]">
                      Total Pengeluaran:
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 text-base font-black">
                      {formatRupiah(stats.totalFiltered)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card List View (Visible only on < 768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredList.map((item, index) => {
                const color = KATEGORI_COLORS[item.kategori] || KATEGORI_COLORS['Lain-lain'];
                return (
                  <div key={item.id} className="p-4 space-y-2 hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">
                            {formatDateIndonesian(item.tanggal)}
                          </div>
                          {item.nomorBukti && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              No: {item.nomorBukti}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-rose-600">
                          {formatRupiah(item.nominal)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          via {item.metodePembayaran}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${color.bg} ${color.text} ${color.border}`}
                      >
                        {item.kategori}
                      </span>
                      {item.penerima && (
                        <span className="text-[11px] text-slate-600">
                          Penerima: <strong>{item.penerima}</strong>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-800 font-medium">
                      {item.keterangan}
                    </p>

                    {item.catatan && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{item.catatan}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition cursor-pointer flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 font-bold rounded-lg hover:bg-rose-100 transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* Modal Form: Tambah / Edit Pengeluaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-150 border border-slate-100 my-auto">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100 pr-8">
              <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingItem ? 'Edit Transaksi Pengeluaran' : 'Catat Pengeluaran Baru'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {editingItem ? 'Perbarui rincian data pengeluaran kantin' : 'Isi formulir pengeluaran dana iuran kantin sekolah'}
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="mt-4 space-y-3.5">
              
              {/* Tanggal & Nomor Bukti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Transaksi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Bukti / Nota / Kwitansi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: NOTA-0813-01"
                    value={formNomorBukti}
                    onChange={(e) => setFormNomorBukti(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Kategori Pengeluaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden font-bold text-slate-800 cursor-pointer"
                >
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Keterangan Pengeluaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembelian kantong sampah & sabun cuci tangan"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden font-medium text-slate-800"
                />
              </div>

              {/* Nominal Pengeluaran & Quick Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Pengeluaran (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={formNominal || ''}
                    onChange={(e) => setFormNominal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden font-extrabold text-rose-600"
                  />
                </div>
                {/* Quick nominal buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold">Nominal Cepat:</span>
                  {[20000, 50000, 100000, 200000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormNominal(val)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                        formNominal === val
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Penerima Dana & Metode Pembayaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Penerima Dana / Toko / Pihak
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Toko Bangunan Abadi / Pak Dodi"
                    value={formPenerima}
                    onChange={(e) => setFormPenerima(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormMetode('Tunai')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formMetode === 'Tunai'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Tunai (Cash)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormMetode('Transfer')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formMetode === 'Transfer'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Transfer Bank</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tambahkan keterangan rincian atau peruntukan barang jika ada..."
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden text-slate-800"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Hapus Catatan Pengeluaran?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Catatan pengeluaran yang dihapus tidak dapat dipulihkan kembali. Apakah Anda yakin?
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex-1"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeletePengeluaran(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex-1"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atur Anggaran Bulanan */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Tetapkan Anggaran Bulanan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batas pagu belanja operasional & sarpras kantin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Anggaran Bulanan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="100000"
                    step="50000"
                    required
                    value={budgetInput || ''}
                    onChange={(e) => setBudgetInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-11 pr-4 py-3 text-base bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-hidden font-extrabold text-indigo-700"
                    placeholder="1500000"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Nominal ini menjadi indikator batas belanja real-time di Dashboard dan Modul Pengeluaran.
                </p>
              </div>

              {/* Preset buttons */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Pilihan Cepat Anggaran:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[500000, 1000000, 1500000, 2000000, 3000000, 5000000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBudgetInput(val)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                        budgetInput === val
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                      }`}
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Month Preview */}
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Realisasi bulan ini:</span>
                  <span className="font-bold text-rose-600">{formatRupiah(currentMonthExpensesTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimasi sisa anggaran:</span>
                  <span className={`font-bold ${budgetInput - currentMonthExpensesTotal < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {budgetInput - currentMonthExpensesTotal < 0 
                      ? `Defisit ${formatRupiah(Math.abs(budgetInput - currentMonthExpensesTotal))}`
                      : formatRupiah(budgetInput - currentMonthExpensesTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Anggaran</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

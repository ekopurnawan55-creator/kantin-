import React, { useState, useMemo } from 'react';
import { PemasukanLain, SchoolSettings, KategoriPemasukanLain } from '../types';
import {
  formatRupiah,
  formatDateIndonesian,
  formatShortDate,
  formatMonthYearLabel,
  getTodayIsoString,
} from '../utils/formatters';
import { exportPemasukanLainPdf } from '../utils/exportPdf';
import { exportPemasukanLainExcel } from '../utils/exportExcel';
import {
  TrendingUp,
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
  Clock,
  CheckCircle2,
  X,
  AlertTriangle,
  Tag,
  CreditCard,
  Banknote,
  RotateCcw,
  Sparkles,
  Printer,
  Building,
  User,
  Coins,
  Receipt,
  Wallet,
} from 'lucide-react';

interface PemasukanLainViewProps {
  pemasukanList?: PemasukanLain[];
  pemasukanLainList?: PemasukanLain[];
  settings: SchoolSettings;
  onAddPemasukan?: (item: PemasukanLain) => void;
  onAddPemasukanLain?: (item: PemasukanLain) => void;
  onUpdatePemasukan?: (item: PemasukanLain) => void;
  onUpdatePemasukanLain?: (item: PemasukanLain) => void;
  onDeletePemasukan?: (id: string) => void;
  onDeletePemasukanLain?: (id: string) => void;
}

const KATEGORI_OPTIONS: KategoriPemasukanLain[] = [
  'Subsidi Sekolah / Dana BOS',
  'Modal Awal Kas',
  'Donasi / Hibah',
  'Sponsorship / Kerjasama',
  'Penjualan Barang Bekas / Kardus',
  'Bunga Bank / Jasa Giro',
  'Sewa Lahan / Acara Khusus',
  'Pemasukan Lain-lain',
];

const KATEGORI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Subsidi Sekolah / Dana BOS': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Modal Awal Kas': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Donasi / Hibah': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Sponsorship / Kerjasama': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Penjualan Barang Bekas / Kardus': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Bunga Bank / Jasa Giro': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Sewa Lahan / Acara Khusus': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Pemasukan Lain-lain': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

export const PemasukanLainView: React.FC<PemasukanLainViewProps> = ({
  pemasukanList,
  pemasukanLainList,
  settings,
  onAddPemasukan,
  onAddPemasukanLain,
  onUpdatePemasukan,
  onUpdatePemasukanLain,
  onDeletePemasukan,
  onDeletePemasukanLain,
}) => {
  const effectiveList = pemasukanLainList || pemasukanList || [];
  const handleAdd = onAddPemasukanLain || onAddPemasukan || (() => {});
  const handleUpdate = onUpdatePemasukanLain || onUpdatePemasukan || (() => {});
  const handleDelete = onDeletePemasukanLain || onDeletePemasukan || (() => {});

  const todayIso = getTodayIsoString();
  const currentMonthIso = todayIso.substring(0, 7);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthIso);
  const [filterAllMonths, setFilterAllMonths] = useState<boolean>(false);
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PemasukanLain | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [receiptItem, setReceiptItem] = useState<PemasukanLain | null>(null);

  // Form States
  const [formTanggal, setFormTanggal] = useState<string>(todayIso);
  const [formKategori, setFormKategori] = useState<string>('Subsidi Sekolah / Dana BOS');
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [formNominal, setFormNominal] = useState<number>(100000);
  const [formSumber, setFormSumber] = useState<string>('');
  const [formMetode, setFormMetode] = useState<'Tunai' | 'Transfer'>('Transfer');
  const [formNomorBukti, setFormNomorBukti] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTanggal(todayIso);
    setFormKategori('Subsidi Sekolah / Dana BOS');
    setFormKeterangan('');
    setFormNominal(100000);
    setFormSumber('');
    setFormMetode('Transfer');
    setFormNomorBukti(`KM-${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(10 + Math.random() * 90)}`);
    setFormCatatan('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: PemasukanLain) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormKategori(item.kategori);
    setFormKeterangan(item.keterangan);
    setFormNominal(item.nominal);
    setFormSumber(item.sumberPemberi || '');
    setFormMetode(item.metodePembayaran);
    setFormNomorBukti(item.nomorBukti || '');
    setFormCatatan(item.catatan || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formKeterangan.trim()) {
      setFormError('Uraian / keterangan pemasukan wajib diisi');
      return;
    }

    if (!formSumber.trim()) {
      setFormError('Nama sumber / pemberi dana wajib diisi');
      return;
    }

    if (!formNominal || formNominal <= 0) {
      setFormError('Nominal dana masuk harus lebih besar dari Rp 0');
      return;
    }

    if (editingItem) {
      const updated: PemasukanLain = {
        ...editingItem,
        tanggal: formTanggal,
        kategori: formKategori,
        keterangan: formKeterangan.trim(),
        nominal: formNominal,
        sumberPemberi: formSumber.trim(),
        metodePembayaran: formMetode,
        nomorBukti: formNomorBukti.trim() || undefined,
        catatan: formCatatan.trim() || undefined,
      };
      handleUpdate(updated);
    } else {
      const newItem: PemasukanLain = {
        id: `in-ext-${Date.now()}`,
        tanggal: formTanggal,
        kategori: formKategori,
        keterangan: formKeterangan.trim(),
        nominal: formNominal,
        sumberPemberi: formSumber.trim(),
        metodePembayaran: formMetode,
        nomorBukti: formNomorBukti.trim() || undefined,
        catatan: formCatatan.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      handleAdd(newItem);
    }

    setIsModalOpen(false);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return effectiveList.filter((item) => {
      // Month Filter
      if (!filterAllMonths && !item.tanggal.startsWith(selectedMonth)) {
        return false;
      }

      // Category Filter
      if (selectedKategori !== 'all' && item.kategori !== selectedKategori) {
        return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchKet = item.keterangan.toLowerCase().includes(query);
        const matchSumber = item.sumberPemberi.toLowerCase().includes(query);
        const matchBukti = item.nomorBukti?.toLowerCase().includes(query);
        const matchCatatan = item.catatan?.toLowerCase().includes(query);
        const matchKat = item.kategori.toLowerCase().includes(query);
        return matchKet || matchSumber || matchBukti || matchCatatan || matchKat;
      }

      return true;
    }).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [effectiveList, filterAllMonths, selectedMonth, selectedKategori, searchQuery]);

  // Statistics
  const totalFilteredNominal = useMemo(() => {
    return filteredList.reduce((acc, item) => acc + item.nominal, 0);
  }, [filteredList]);

  const statsMonth = useMemo(() => {
    const listThisMonth = effectiveList.filter((item) => item.tanggal.startsWith(selectedMonth));
    const totalMonth = listThisMonth.reduce((acc, item) => acc + item.nominal, 0);

    const listToday = effectiveList.filter((item) => item.tanggal === todayIso);
    const totalToday = listToday.reduce((acc, item) => acc + item.nominal, 0);

    const totalAllTime = effectiveList.reduce((acc, item) => acc + item.nominal, 0);

    // Group by category
    const catMap: Record<string, number> = {};
    listThisMonth.forEach((i) => {
      catMap[i.kategori] = (catMap[i.kategori] || 0) + i.nominal;
    });

    let topCategory = '-';
    let topCategoryNominal = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topCategoryNominal) {
        topCategoryNominal = val;
        topCategory = cat;
      }
    });

    return {
      totalMonth,
      countMonth: listThisMonth.length,
      totalToday,
      totalAllTime,
      countAllTime: effectiveList.length,
      topCategory,
      topCategoryNominal,
    };
  }, [effectiveList, selectedMonth, todayIso]);

  // Handle Export PDF
  const handleExportPdf = () => {
    const label = filterAllMonths ? 'Semua Periode' : formatMonthYearLabel(selectedMonth);
    exportPemasukanLainPdf(label, filteredList, settings, totalFilteredNominal);
  };

  // Handle Export Excel
  const handleExportExcel = () => {
    const label = filterAllMonths ? 'Semua Periode' : formatMonthYearLabel(selectedMonth);
    exportPemasukanLainExcel(label, filteredList, settings);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Title */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <TrendingUp className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold mb-3 border border-white/20">
            <Coins className="w-3.5 h-3.5 text-emerald-300" />
            <span>Kas Masuk & Dana Eksternal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Pemasukan Kas Dari Luar / Dana Tambahan
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            Catat semua penerimaan dana di luar iuran harian kantin — seperti subsidi sekolah/dana BOS, modal awal kas, donasi, sponsorship, maupun penjualan barang bekas kantin.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm font-black shadow-md transition cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>+ Catat Pemasukan Luar</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-white/20"
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>Cetak PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-white/20"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {filterAllMonths ? 'Total Ditampilkan' : `Bulan Ini (${formatMonthYearLabel(selectedMonth)})`}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatRupiah(filterAllMonths ? totalFilteredNominal : statsMonth.totalMonth)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{filterAllMonths ? filteredList.length : statsMonth.countMonth} transaksi pemasukan luar</span>
            </div>
          </div>
        </div>

        {/* Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Masuk Hari Ini
            </span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              {formatRupiah(statsMonth.totalToday)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {formatDateIndonesian(todayIso)}
            </div>
          </div>
        </div>

        {/* Akumulasi Semua Waktu */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Semua Periode
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatRupiah(statsMonth.totalAllTime)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Akumulasi {statsMonth.countAllTime} transaksi dana masuk
            </div>
          </div>
        </div>

        {/* Kategori Terbesar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kategori Terbesar
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-800 truncate" title={statsMonth.topCategory}>
              {statsMonth.topCategory}
            </div>
            <div className="text-xs text-emerald-600 font-bold mt-1">
              {statsMonth.topCategoryNominal > 0 ? formatRupiah(statsMonth.topCategoryNominal) : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari uraian, sumber pemberi dana, nomor bukti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Month & Period Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-500 font-medium">Bulan:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  disabled={filterAllMonths}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setFilterAllMonths(false);
                  }}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer disabled:opacity-40"
                />
              </div>

              <button
                onClick={() => setFilterAllMonths(!filterAllMonths)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  filterAllMonths
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {filterAllMonths ? '✓ Semua Bulan' : 'Semua Bulan'}
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Baru</span>
              </button>
            </div>

          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-400 font-bold text-[11px] shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Kategori:</span>
            </span>
            <button
              onClick={() => setSelectedKategori('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                selectedKategori === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({effectiveList.length})
            </button>
            {KATEGORI_OPTIONS.map((cat) => {
              const count = effectiveList.filter((p) => p.kategori === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedKategori(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                    selectedKategori === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <Coins className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Belum Ada Catatan Pemasukan Luar
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery || selectedKategori !== 'all'
                ? 'Tidak ada data pemasukan luar yang cocok dengan filter pencarian.'
                : 'Catat dana masuk tambahan seperti subsidi sekolah, modal awal kas, donasi, atau sponsorship.'}
            </p>
            <div className="mt-5">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Pemasukan Luar Sekarang</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-600 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-center w-12">No</th>
                    <th className="py-3 px-4">Tanggal & Bukti</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Uraian / Keterangan</th>
                    <th className="py-3 px-4">Sumber / Pemberi</th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4 text-right">Nominal Masuk</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((item, index) => {
                    const catStyle = KATEGORI_COLORS[item.kategori] || KATEGORI_COLORS['Pemasukan Lain-lain'];
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        {/* No */}
                        <td className="py-3.5 px-4 text-center text-slate-400 font-bold text-xs">
                          {index + 1}
                        </td>

                        {/* Tanggal & Bukti */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-xs">
                            {formatShortDate(item.tanggal)}
                          </div>
                          {item.nomorBukti && (
                            <span className="inline-block mt-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                              {item.nomorBukti}
                            </span>
                          )}
                        </td>

                        {/* Kategori */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.8 rounded-lg text-[11px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                          >
                            {item.kategori}
                          </span>
                        </td>

                        {/* Uraian */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {item.keterangan}
                          </div>
                          {item.catatan && (
                            <div className="text-[11px] text-slate-500 mt-0.5 italic">
                              "{item.catatan}"
                            </div>
                          )}
                        </td>

                        {/* Sumber Pemberi */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.sumberPemberi}</span>
                          </div>
                        </td>

                        {/* Metode */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {item.metodePembayaran === 'Tunai' ? (
                              <Banknote className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <CreditCard className="w-3 h-3 text-blue-600" />
                            )}
                            <span>{item.metodePembayaran}</span>
                          </span>
                        </td>

                        {/* Nominal */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-black text-emerald-600 text-xs sm:text-sm">
                            + {formatRupiah(item.nominal)}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setReceiptItem(item)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              title="Lihat / Cetak Kuitansi Penerimaan"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Edit Data Pemasukan"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Hapus Data Pemasukan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Total */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium">
                Menampilkan <strong>{filteredList.length}</strong> transaksi pemasukan luar
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-bold">Total Dana Masuk:</span>
                <span className="text-sm font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-300">
                  {formatRupiah(totalFilteredNominal)}
                </span>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Modal Add / Edit Pemasukan Luar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-left border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-150">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 pr-8">
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingItem ? 'Edit Pemasukan Kas Luar' : 'Catat Pemasukan Kas Luar / Dana Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {settings.namaSekolah || 'Pengelola Kantin'} • Kas Penerimaan
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-3.5">
              
              {/* Tanggal & No Bukti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Penerimaan *
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Bukti / Kuitansi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: KM-0820-01"
                    value={formNomorBukti}
                    onChange={(e) => setFormNomorBukti(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Kategori Pemasukan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Dana Masuk *
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                >
                  {KATEGORI_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Quick select category chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 no-scrollbar">
                  {['Subsidi Sekolah / Dana BOS', 'Modal Awal Kas', 'Penjualan Barang Bekas / Kardus', 'Donasi / Hibah'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFormKategori(c)}
                      className={`text-[10px] px-2 py-0.8 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                        formKategori === c
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sumber / Pemberi Dana */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sumber / Pemberi Dana *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pihak Sekolah (BOS), Komite Sekolah, PT Sponsor, Donatur"
                  value={formSumber}
                  onChange={(e) => setFormSumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Uraian / Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian / Keterangan Dana Masuk *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Subsidi peremajaan fasilitas sanitasi wastafel kantin"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Nominal & Quick Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Dana Masuk (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={formNominal || ''}
                    onChange={(e) => setFormNominal(Number(e.target.value))}
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-black text-emerald-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* Quick Add Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[50000, 100000, 250000, 500000, 1000000, 2500000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setFormNominal(amt)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold transition cursor-pointer border ${
                        formNominal === amt
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Metode Penerimaan *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormMetode('Transfer')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      formMetode === 'Transfer'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Transfer Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMetode('Tunai')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      formMetode === 'Tunai'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Tunai / Cash</span>
                  </button>
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan peruntukan, nomor rekening transfer, dll."
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Pemasukan'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Hapus Catatan Pemasukan?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Data pemasukan luar ini akan dihapus dari buku kas dan neraca keuangan.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleDelete(deletingId);
                  setDeletingId(null);
                }}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kuitansi / Bukti Tanda Terima Penerimaan */}
      {receiptItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-left border border-slate-100 my-auto animate-in fade-in zoom-in-95">
            
            <button
              onClick={() => setReceiptItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Kuitansi Header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-slate-200">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 mb-2">
                <Receipt className="w-3.5 h-3.5" />
                <span>KUITANSI TANDA TERIMA KAS MASUK</span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                {settings.namaSekolah || settings.namaKantin}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                No. Bukti: {receiptItem.nomorBukti || `KM-${receiptItem.tanggal.replace(/-/g, '')}`}
              </p>
            </div>

            {/* Kuitansi Body */}
            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tanggal Terima:</span>
                <span className="font-bold text-slate-800">{formatDateIndonesian(receiptItem.tanggal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Telah Diterima Dari:</span>
                <span className="font-bold text-slate-900">{receiptItem.sumberPemberi}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-bold text-emerald-700">{receiptItem.kategori}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Untuk Keperluan:</span>
                <span className="font-bold text-slate-800 text-right max-w-[200px]">{receiptItem.keterangan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Metode Pembayaran:</span>
                <span className="font-bold text-slate-800">{receiptItem.metodePembayaran}</span>
              </div>

              {receiptItem.catatan && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Catatan:</span>
                  <span className="font-medium text-slate-600 italic text-right max-w-[200px]">{receiptItem.catatan}</span>
                </div>
              )}

              {/* Total Box */}
              <div className="mt-3 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-900 uppercase">Jumlah Uang:</span>
                <span className="font-black text-base text-emerald-700">
                  {formatRupiah(receiptItem.nominal)}
                </span>
              </div>
            </div>

            {/* Kuitansi Footer Signatures */}
            <div className="pt-2 text-right text-xs text-slate-600">
              <div>Bendahara Penerima,</div>
              <div className="h-10"></div>
              <div className="font-extrabold text-slate-900 underline">{settings.namaBendahara}</div>
              <div className="text-[10px] text-slate-400">{settings.nipBendahara || 'NIP. -'}</div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Kuitansi</span>
              </button>
              <button
                onClick={() => setReceiptItem(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

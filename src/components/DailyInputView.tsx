import React, { useState } from 'react';
import { Kantin, IuranHarian, StatusPembayaran, MetodePembayaran, SchoolSettings } from '../types';
import {
  formatRupiah,
  formatDateIndonesian,
  getTodayIsoString,
} from '../utils/formatters';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Coffee,
  Send,
  Search,
  CheckCheck,
  CheckSquare,
  DollarSign,
  AlertCircle,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  ShieldCheck,
  Save,
  X,
} from 'lucide-react';

interface ConfirmModalState {
  type: 'single' | 'batch';
  kantin?: Kantin;
  status?: StatusPembayaran;
  metode?: MetodePembayaran;
  catatan?: string;
  tanggal: string;
}

interface DailyInputViewProps {
  kantinList: Kantin[];
  iuranRecords: IuranHarian[];
  settings: SchoolSettings;
  onUpdateRecord: (record: IuranHarian) => void;
  onBatchMarkAllPaid: (tanggal: string) => void;
  onOpenWaReminder: (kantin: Kantin, customTanggal?: string) => void;
  onOpenOwnerPortal?: (kantin: Kantin) => void;
}

export const DailyInputView: React.FC<DailyInputViewProps> = ({
  kantinList,
  iuranRecords,
  settings,
  onUpdateRecord,
  onBatchMarkAllPaid,
  onOpenWaReminder,
  onOpenOwnerPortal,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoString());
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMode, setMobileMode] = useState<boolean>(true);
  const [copiedKantinId, setCopiedKantinId] = useState<string | null>(null);

  // Confirmation Modal State before saving daily dues
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  const activeKantin = kantinList.filter((k) => k.status === 'Aktif');

  // Filter kantin based on search & payment status
  const filteredKantin = activeKantin.filter((kantin) => {
    const matchesSearch =
      kantin.namaKantin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kantin.namaPemilik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kantin.noWa.includes(searchQuery);

    const record = iuranRecords.find(
      (r) => r.kantinId === kantin.id && r.tanggal === selectedDate
    );
    const currentStatus = record ? record.statusBayar : 'Belum Bayar';

    if (filterStatus === 'Semua') return matchesSearch;
    if (filterStatus === 'Lunas') return matchesSearch && currentStatus === 'Lunas';
    if (filterStatus === 'Belum Bayar') return matchesSearch && currentStatus === 'Belum Bayar';
    if (filterStatus === 'Libur') return matchesSearch && currentStatus === 'Libur / Tutup';

    return matchesSearch;
  });

  // Today summary for selected date
  const selectedDateRecords = iuranRecords.filter((r) => r.tanggal === selectedDate);
  const totalTarget = activeKantin.reduce((sum, k) => sum + k.nominalIuran, 0);
  const totalCollected = selectedDateRecords.reduce((sum, r) => sum + r.nominalDibayar, 0);
  const countLunas = selectedDateRecords.filter((r) => r.statusBayar === 'Lunas').length;
  const countBelum = Math.max(0, activeKantin.length - countLunas);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openConfirmModalForStatus = (
    kantin: Kantin,
    targetStatus: StatusPembayaran,
    defaultMetode?: MetodePembayaran,
    defaultCatatan?: string
  ) => {
    const existing = iuranRecords.find(
      (r) => r.kantinId === kantin.id && r.tanggal === selectedDate
    );

    let initialMetode: MetodePembayaran =
      defaultMetode ||
      (existing?.metodePembayaran && existing.metodePembayaran !== '-'
        ? existing.metodePembayaran
        : 'Tunai');

    if (targetStatus !== 'Lunas') {
      initialMetode = '-';
    }

    setConfirmModal({
      type: 'single',
      kantin,
      status: targetStatus,
      metode: initialMetode,
      catatan: defaultCatatan !== undefined ? defaultCatatan : (existing?.catatan || ''),
      tanggal: selectedDate,
    });
  };

  const openConfirmModalForBatch = () => {
    setConfirmModal({
      type: 'batch',
      tanggal: selectedDate,
    });
  };

  const handleConfirmSave = () => {
    if (!confirmModal) return;

    if (confirmModal.type === 'batch') {
      onBatchMarkAllPaid(confirmModal.tanggal);
      showToast(
        `Semua kantin aktif ditandai Lunas untuk tanggal ${formatDateIndonesian(confirmModal.tanggal)}`
      );
      setConfirmModal(null);
      return;
    }

    if (confirmModal.type === 'single' && confirmModal.kantin && confirmModal.status) {
      const { kantin, status, metode = 'Tunai', catatan = '' } = confirmModal;
      const existing = iuranRecords.find(
        (r) => r.kantinId === kantin.id && r.tanggal === confirmModal.tanggal
      );

      let nominal = kantin.nominalIuran;
      let finalMetode = metode;
      if (status === 'Belum Bayar' || status === 'Libur / Tutup') {
        nominal = 0;
        finalMetode = '-';
      }

      const updatedRecord: IuranHarian = {
        id: existing ? existing.id : `iuran-${confirmModal.tanggal}-${kantin.id}`,
        kantinId: kantin.id,
        tanggal: confirmModal.tanggal,
        nominalDibayar: nominal,
        statusBayar: status,
        metodePembayaran: finalMetode,
        catatan: catatan,
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
      };

      onUpdateRecord(updatedRecord);
      showToast(`Iuran ${kantin.namaKantin} berhasil disimpan: ${status}`);
      setConfirmModal(null);
    }
  };

  const handleStatusChange = (
    kantin: Kantin,
    newStatus: StatusPembayaran,
    metode: MetodePembayaran = 'Tunai',
    catatan: string = ''
  ) => {
    const existing = iuranRecords.find(
      (r) => r.kantinId === kantin.id && r.tanggal === selectedDate
    );

    let nominal = kantin.nominalIuran;
    if (newStatus === 'Belum Bayar' || newStatus === 'Libur / Tutup') {
      nominal = 0;
      metode = '-';
    }

    const updatedRecord: IuranHarian = {
      id: existing ? existing.id : `iuran-${selectedDate}-${kantin.id}`,
      kantinId: kantin.id,
      tanggal: selectedDate,
      nominalDibayar: nominal,
      statusBayar: newStatus,
      metodePembayaran: metode,
      catatan: catatan || existing?.catatan || '',
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    onUpdateRecord(updatedRecord);
    showToast(`Status ${kantin.namaKantin} set: ${newStatus}`);
  };

  const handleMetodeChange = (kantin: Kantin, newMetode: MetodePembayaran) => {
    const existing = iuranRecords.find(
      (r) => r.kantinId === kantin.id && r.tanggal === selectedDate
    );

    const updatedRecord: IuranHarian = {
      id: existing ? existing.id : `iuran-${selectedDate}-${kantin.id}`,
      kantinId: kantin.id,
      tanggal: selectedDate,
      nominalDibayar: existing && existing.statusBayar === 'Lunas' ? existing.nominalDibayar : kantin.nominalIuran,
      statusBayar: 'Lunas',
      metodePembayaran: newMetode,
      catatan: existing?.catatan || '',
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    onUpdateRecord(updatedRecord);
    showToast(`Metode ${kantin.namaKantin}: ${newMetode}`);
  };

  const handleNoteChange = (kantin: Kantin, noteText: string) => {
    const existing = iuranRecords.find(
      (r) => r.kantinId === kantin.id && r.tanggal === selectedDate
    );

    const updatedRecord: IuranHarian = {
      id: existing ? existing.id : `iuran-${selectedDate}-${kantin.id}`,
      kantinId: kantin.id,
      tanggal: selectedDate,
      nominalDibayar: existing ? existing.nominalDibayar : 0,
      statusBayar: existing ? existing.statusBayar : 'Belum Bayar',
      metodePembayaran: existing ? existing.metodePembayaran : '-',
      catatan: noteText,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    onUpdateRecord(updatedRecord);
  };

  const handleCopyOwnerLink = (kantinId: string, namaKantin: string) => {
    const portalUrl = `${window.location.origin}${window.location.pathname}?kantinId=${kantinId}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedKantinId(kantinId);
    showToast(`Link portal ${namaKantin} berhasil disalin!`);
    setTimeout(() => setCopiedKantinId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        
        {/* Row 1: Title, Date & Mobile Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Pencatatan & Penagihan Iuran Kantin</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pencatatan status iuran harian, pembayaran kasir, dan bagikan link portal resmi pemilik kantin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Date Picker */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
              />
            </div>

            {/* Quick Today Button */}
            <button
              onClick={() => setSelectedDate(getTodayIsoString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                selectedDate === getTodayIsoString()
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>

            {/* Mobile View Toggle */}
            <button
              onClick={() => setMobileMode(!mobileMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                mobileMode
                  ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{mobileMode ? 'Mode Walkthrough HP' : 'Tampilan Tabel'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Status Filters & Search */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {['Semua', 'Belum Bayar', 'Lunas', 'Libur'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
                {status === 'Belum Bayar' && countBelum > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                    {countBelum}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kantin / pemilik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

        </div>

      </div>

      {/* Main Vendor Cards List */}
      {filteredKantin.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Coffee className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Tidak ada kantin ditemukan</p>
          <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci pencarian atau filter status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKantin.map((kantin) => {
            const record = iuranRecords.find(
              (r) => r.kantinId === kantin.id && r.tanggal === selectedDate
            );

            const statusBayar: StatusPembayaran = record ? record.statusBayar : 'Belum Bayar';
            const metodePembayaran: MetodePembayaran = record ? record.metodePembayaran : 'Tunai';
            const catatanText = record?.catatan || '';

            const isLunas = statusBayar === 'Lunas';
            const isBelum = statusBayar === 'Belum Bayar';
            const isLibur = statusBayar === 'Libur / Tutup';

            return (
              <div
                key={kantin.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
                  isLunas
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isLibur
                    ? 'border-slate-200 bg-slate-50 opacity-80'
                    : 'border-amber-300 bg-amber-50/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Vendor Main Info */}
                  <div className="flex items-start gap-3 min-w-60">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        isLunas
                          ? 'bg-emerald-600 text-white'
                          : isLibur
                          ? 'bg-slate-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {kantin.namaKantin.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {kantin.namaKantin}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {kantin.jenisDagangan}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-0.5">
                        Pemilik: <strong className="text-slate-800">{kantin.namaPemilik}</strong> • {kantin.noWa}
                      </p>

                      <p className="text-xs font-black text-blue-700 mt-1">
                        Nominal Standard: {formatRupiah(kantin.nominalIuran)}
                      </p>
                    </div>
                  </div>

                  {/* Quick 1-Click Status Selection */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => openConfirmModalForStatus(kantin, 'Lunas')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                        isLunas
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>LUNAS</span>
                    </button>

                    <button
                      onClick={() => openConfirmModalForStatus(kantin, 'Belum Bayar')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                        isBelum
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>BELUM</span>
                    </button>

                    <button
                      onClick={() => openConfirmModalForStatus(kantin, 'Libur / Tutup', '-', 'Toko Libur')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isLibur
                          ? 'bg-slate-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Coffee className="w-4 h-4" />
                      <span>LIBUR</span>
                    </button>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold hidden sm:inline">Metode:</span>
                    <select
                      disabled={!isLunas}
                      value={metodePembayaran}
                      onChange={(e) => openConfirmModalForStatus(kantin, 'Lunas', e.target.value as MetodePembayaran)}
                      className={`text-xs font-bold rounded-xl px-2.5 py-2 border transition outline-hidden ${
                        !isLunas
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-slate-300 focus:ring-2 focus:ring-blue-500/20 cursor-pointer'
                      }`}
                    >
                      <option value="Tunai">💵 Tunai</option>
                      <option value="Transfer">🏦 Transfer</option>
                      <option value="QRIS">📱 QRIS</option>
                    </select>
                  </div>

                  {/* Note Input */}
                  <div className="w-full lg:w-44">
                    <input
                      type="text"
                      placeholder="Catatan..."
                      value={catatanText}
                      onChange={(e) => handleNoteChange(kantin, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white"
                    />
                  </div>

                  {/* Action Group: WA Tagihan & Share Owner Portal */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onOpenWaReminder(kantin, selectedDate)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                      title="Kirim tagihan via WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Tagih WA</span>
                    </button>

                    <button
                      onClick={() => handleCopyOwnerLink(kantin.id, kantin.namaKantin)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition cursor-pointer border border-blue-200"
                      title="Salin Link Portal Kantin"
                    >
                      {copiedKantinId === kantin.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    {onOpenOwnerPortal && (
                      <button
                        onClick={() => onOpenOwnerPortal(kantin)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
                        title="Pratinjau Portal Pemilik"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom KPI Summaries & Batch Action */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-2">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
          Ringkasan Penagihan Harian
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Target Harian</span>
            <span className="text-sm sm:text-base font-black text-blue-900">{formatRupiah(totalTarget)}</span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Terkumpul ({countLunas} Lunas)</span>
            <span className="text-sm sm:text-base font-black text-emerald-900">{formatRupiah(totalCollected)}</span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Belum Lunas ({countBelum} Lapak)</span>
            <span className="text-sm sm:text-base font-black text-amber-900">
              {formatRupiah(Math.max(0, totalTarget - totalCollected))}
            </span>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-purple-700 block">Aksi Masal</span>
            <button
              onClick={openConfirmModalForBatch}
              className="w-full mt-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Semua Lunas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Saving */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 text-left space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl text-white shadow-md ${
                    confirmModal.type === 'batch'
                      ? 'bg-purple-600'
                      : confirmModal.status === 'Lunas'
                      ? 'bg-emerald-600'
                      : confirmModal.status === 'Libur / Tutup'
                      ? 'bg-slate-600'
                      : 'bg-amber-500'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {confirmModal.type === 'batch'
                      ? 'Konfirmasi Penagihan Masal'
                      : 'Konfirmasi Simpan Iuran'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {confirmModal.type === 'batch'
                      ? 'Tandai semua kantin aktif sekaligus'
                      : 'Periksa kembali rincian iuran sebelum disimpan'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setConfirmModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {confirmModal.type === 'batch' ? (
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-2 text-xs">
                <p className="font-bold text-purple-900 text-sm">
                  Apakah Anda yakin ingin menandai SEMUA kantin aktif sebagai LUNAS?
                </p>
                <p className="text-slate-600">
                  Tanggal Penagihan:{' '}
                  <strong className="text-slate-800">
                    {formatDateIndonesian(confirmModal.tanggal)}
                  </strong>
                </p>
                <p className="text-slate-600">
                  Total Lapak Aktif:{' '}
                  <strong className="text-slate-800">{activeKantin.length} Kantin</strong>
                </p>
                <p className="text-slate-600">
                  Total Nominal Iuran:{' '}
                  <strong className="text-emerald-700 font-extrabold">
                    {formatRupiah(totalTarget)}
                  </strong>
                </p>
              </div>
            ) : confirmModal.kantin ? (
              <div className="space-y-3 text-xs">
                {/* Vendor Card Detail */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {confirmModal.kantin.namaKantin}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        confirmModal.status === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : confirmModal.status === 'Libur / Tutup'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {confirmModal.status}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Pemilik:{' '}
                    <strong className="text-slate-800">{confirmModal.kantin.namaPemilik}</strong>
                  </p>
                  <p className="text-slate-600">
                    Tanggal Penagihan:{' '}
                    <strong className="text-slate-800">
                      {formatDateIndonesian(confirmModal.tanggal)}
                    </strong>
                  </p>
                  <p className="text-slate-600">
                    Nominal Iuran:{' '}
                    <strong className="text-blue-700 font-extrabold">
                      {formatRupiah(
                        confirmModal.status === 'Lunas'
                          ? confirmModal.kantin.nominalIuran
                          : 0
                      )}
                    </strong>
                  </p>
                </div>

                {/* Additional controls inside modal if Lunas */}
                {confirmModal.status === 'Lunas' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Metode Pembayaran:
                      </label>
                      <select
                        value={confirmModal.metode || 'Tunai'}
                        onChange={(e) =>
                          setConfirmModal({
                            ...confirmModal,
                            metode: e.target.value as MetodePembayaran,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="Tunai">💵 Tunai</option>
                        <option value="Transfer">🏦 Transfer</option>
                        <option value="QRIS">📱 QRIS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Catatan Tambahan (Opsional):
                      </label>
                      <input
                        type="text"
                        placeholder="misal: Setoran pagi..."
                        value={confirmModal.catatan || ''}
                        onChange={(e) =>
                          setConfirmModal({ ...confirmModal, catatan: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmSave}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Iuran Now</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

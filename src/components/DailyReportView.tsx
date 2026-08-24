import React, { useState } from 'react';
import { Kantin, IuranHarian, SchoolSettings, Pengeluaran } from '../types';
import {
  formatRupiah,
  formatDateIndonesian,
  getTodayIsoString,
} from '../utils/formatters';
import { exportDailyReportExcel } from '../utils/exportExcel';
import { exportDailyReportPdf } from '../utils/exportPdf';
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  Coffee,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Send,
  Download,
} from 'lucide-react';

interface DailyReportViewProps {
  kantinList: Kantin[];
  iuranRecords: IuranHarian[];
  pengeluaranList?: Pengeluaran[];
  settings: SchoolSettings;
  onOpenWaReminder: (kantin: Kantin, customTanggal?: string) => void;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  kantinList,
  iuranRecords,
  pengeluaranList = [],
  settings,
  onOpenWaReminder,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoString());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  const activeKantin = kantinList.filter((k) => k.status === 'Aktif');

  // Daily summary metrics
  const selectedDateRecords = iuranRecords.filter((r) => r.tanggal === selectedDate);
  const totalTarget = activeKantin.reduce((sum, k) => sum + k.nominalIuran, 0);
  const totalCollected = selectedDateRecords.reduce((sum, r) => sum + r.nominalDibayar, 0);
  const totalArrears = Math.max(0, totalTarget - totalCollected);

  const countLunas = selectedDateRecords.filter((r) => r.statusBayar === 'Lunas').length;
  const countBelum = activeKantin.length - countLunas;
  const countLibur = selectedDateRecords.filter((r) => r.statusBayar === 'Libur / Tutup').length;

  const percentCollected = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  // Filtered rows
  const reportRows = activeKantin.filter((kantin) => {
    const matchesSearch =
      kantin.namaKantin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kantin.namaPemilik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kantin.noWa.includes(searchQuery);

    const record = selectedDateRecords.find((r) => r.kantinId === kantin.id);
    const status = record ? record.statusBayar : 'Belum Bayar';

    if (statusFilter === 'Semua') return matchesSearch;
    if (statusFilter === 'Lunas') return matchesSearch && status === 'Lunas';
    if (statusFilter === 'Belum Bayar') return matchesSearch && status === 'Belum Bayar';
    if (statusFilter === 'Libur') return matchesSearch && status === 'Libur / Tutup';

    return matchesSearch;
  });

  const handleExportPdf = () => {
    exportDailyReportPdf(selectedDate, iuranRecords, kantinList, settings, pengeluaranList);
  };

  const handleExportExcel = () => {
    exportDailyReportExcel(selectedDate, iuranRecords, kantinList, settings);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Laporan Transaksi Iuran Harian</span>
            </h2>
            <p className="text-xs text-slate-500">
              Rincian transaksi dan status pembayaran iuran kantin per tanggal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-500 font-medium">Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Unduh Laporan (PDF)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
          </div>

        </div>

        {/* Dashboard Ringkasan Harian Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-800 block">Total Target Hari Ini</span>
            <span className="text-lg font-extrabold text-blue-900 block mt-0.5">
              {formatRupiah(totalTarget)}
            </span>
            <span className="text-[10px] text-blue-700">{activeKantin.length} Kantin Aktif</span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800 block">Total Terkumpul</span>
            <span className="text-lg font-extrabold text-emerald-900 block mt-0.5">
              {formatRupiah(totalCollected)}
            </span>
            <span className="text-[10px] text-emerald-700">{countLunas} Kantin Lunas ({percentCollected}%)</span>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 block">Sisa Tunggakan</span>
            <span className="text-lg font-extrabold text-amber-900 block mt-0.5">
              {formatRupiah(totalArrears)}
            </span>
            <span className="text-[10px] text-amber-700">{countBelum} Kantin Belum Bayar</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-700 block">Status Kehadiran</span>
            <span className="text-sm font-bold text-slate-900 block mt-1">
              ✅ {countLunas} Lunas • ❌ {countBelum} Belum
            </span>
            <span className="text-[10px] text-slate-500">☕ {countLibur} Libur/Tutup</span>
          </div>

        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
          {['Semua', 'Lunas', 'Belum Bayar', 'Libur'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kantin / pemilik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Rincian Transaksi Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Tabel Rincian Harian - {formatDateIndonesian(selectedDate)}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {reportRows.length} Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Kantin / Lapak</th>
                <th className="px-4 py-3">Pemilik</th>
                <th className="px-4 py-3">Target Iuran</th>
                <th className="px-4 py-3">Dibayar</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3 text-right">Aksi Tagih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500 font-medium">
                    Tidak ada transaksi ditemukan pada tanggal ini.
                  </td>
                </tr>
              ) : (
                reportRows.map((kantin, index) => {
                  const record = selectedDateRecords.find((r) => r.kantinId === kantin.id);
                  const status = record ? record.statusBayar : 'Belum Bayar';
                  const nominalDibayar = record ? record.nominalDibayar : 0;
                  const metode = record ? record.metodePembayaran : '-';
                  const catatan = record?.catatan || '-';

                  return (
                    <tr key={kantin.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{kantin.namaKantin}</td>
                      <td className="px-4 py-3">{kantin.namaPemilik}</td>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        {formatRupiah(kantin.nominalIuran)}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700">
                        {formatRupiah(nominalDibayar)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            status === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'Libur / Tutup'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{metode}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{catatan}</td>
                      <td className="px-4 py-3 text-right">
                        {status === 'Belum Bayar' ? (
                          <button
                            onClick={() => onOpenWaReminder(kantin, selectedDate)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition"
                          >
                            <Send className="w-3 h-3" />
                            <span>Tagih WA</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

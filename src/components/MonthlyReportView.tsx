import React, { useState } from 'react';
import { Kantin, IuranHarian, MonthlyKantinSummary, SchoolSettings, Pengeluaran, PemasukanLain } from '../types';
import {
  formatRupiah,
  formatMonthYearLabel,
  formatDateIndonesian,
} from '../utils/formatters';
import { exportMonthlyReportPdf } from '../utils/exportPdf';
import { exportMonthlyReportExcel } from '../utils/exportExcel';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Filter,
  Coins,
} from 'lucide-react';

interface CashFlowItem {
  id: string;
  tanggal: string;
  tipe: 'pemasukan' | 'pengeluaran';
  kategori: string;
  keterangan: string;
  sumberAtauTujuan: string;
  nominal: number;
  bukti: string;
}

interface MonthlyReportViewProps {
  kantinList: Kantin[];
  iuranRecords: IuranHarian[];
  pengeluaranList: Pengeluaran[];
  pemasukanLainList: PemasukanLain[];
  settings: SchoolSettings;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  kantinList,
  iuranRecords,
  pengeluaranList,
  pemasukanLainList,
  settings,
}) => {
  // Default to current month 'YYYY-MM'
  const todayIso = new Date().toISOString().substring(0, 7);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(todayIso);
  const [cashFlowSearch, setCashFlowSearch] = useState('');
  const [cashFlowFilter, setCashFlowFilter] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');

  const activeKantin = kantinList.filter((k) => k.status === 'Aktif');

  // Compute aggregated monthly data per kantin for selectedMonthYear
  const monthlySummaries: MonthlyKantinSummary[] = activeKantin.map((kantin) => {
    // Records matching kantin and month prefix (e.g. '2026-08')
    const recordsForMonth = iuranRecords.filter(
      (r) => r.kantinId === kantin.id && r.tanggal.startsWith(selectedMonthYear)
    );

    const totalHariBuka = recordsForMonth.filter((r) => r.statusBayar !== 'Libur / Tutup').length;
    const totalHariBayar = recordsForMonth.filter((r) => r.statusBayar === 'Lunas').length;
    const totalHariTunggakan = recordsForMonth.filter((r) => r.statusBayar === 'Belum Bayar').length;
    const totalHariLibur = recordsForMonth.filter((r) => r.statusBayar === 'Libur / Tutup').length;

    const totalIuranDibayar = recordsForMonth.reduce((acc, r) => acc + r.nominalDibayar, 0);
    const totalNominalHarusDibayar = totalHariBuka * kantin.nominalIuran;
    const totalTunggakan = Math.max(0, totalNominalHarusDibayar - totalIuranDibayar);

    return {
      kantinId: kantin.id,
      namaKantin: kantin.namaKantin,
      namaPemilik: kantin.namaPemilik,
      noWa: kantin.noWa,
      jenisDagangan: kantin.jenisDagangan,
      nominalIuranPerHari: kantin.nominalIuran,
      totalHariBuka,
      totalHariBayar,
      totalHariTunggakan,
      totalHariLibur,
      totalNominalHarusDibayar,
      totalIuranDibayar,
      totalTunggakan,
    };
  });

  // Grand Totals from Iuran
  const grandTarget = monthlySummaries.reduce((acc, s) => acc + s.totalNominalHarusDibayar, 0);
  const grandCollected = monthlySummaries.reduce((acc, s) => acc + s.totalIuranDibayar, 0);
  const grandArrears = monthlySummaries.reduce((acc, s) => acc + s.totalTunggakan, 0);
  const overallCompliance = grandTarget > 0 ? Math.round((grandCollected / grandTarget) * 100) : 0;

  // Monthly External Income
  const monthlyPemasukanLain = (pemasukanLainList || []).filter((item) => item.tanggal.startsWith(selectedMonthYear));
  const grandPemasukanLain = monthlyPemasukanLain.reduce((acc, item) => acc + item.nominal, 0);

  // Grand Total Pemasukan Kas (Iuran + Dana Luar)
  const grandTotalPemasukan = grandCollected + grandPemasukanLain;

  // Monthly Expenses
  const monthlyExpenses = pengeluaranList.filter((item) => item.tanggal.startsWith(selectedMonthYear));
  const grandExpense = monthlyExpenses.reduce((acc, item) => acc + item.nominal, 0);
  const netSurplus = grandTotalPemasukan - grandExpense;

  // Cumulative figures up to selected month
  const endOfMonthIso = selectedMonthYear + '-31';
  const recordsUpToMonth = iuranRecords.filter((r) => r.tanggal <= endOfMonthIso);
  const pemasukanLainUpToMonth = (pemasukanLainList || []).filter((item) => item.tanggal <= endOfMonthIso);
  const expensesUpToMonth = pengeluaranList.filter((p) => p.tanggal <= endOfMonthIso);

  const totalIuranCumulative = recordsUpToMonth.reduce((acc, r) => acc + r.nominalDibayar, 0);
  const totalPemasukanLainCumulative = pemasukanLainUpToMonth.reduce((acc, item) => acc + item.nominal, 0);
  const totalIncomeCumulative = totalIuranCumulative + totalPemasukanLainCumulative;
  const totalExpenseCumulative = expensesUpToMonth.reduce((acc, p) => acc + p.nominal, 0);
  const totalSavedCumulative = totalIncomeCumulative - totalExpenseCumulative;

  // Expense categories breakdown for selected month
  const expenseByCategoryMap: { [cat: string]: number } = {};
  monthlyExpenses.forEach((item) => {
    expenseByCategoryMap[item.kategori] = (expenseByCategoryMap[item.kategori] || 0) + item.nominal;
  });
  const expenseCategoryList = Object.entries(expenseByCategoryMap).map(([kategori, total]) => ({
    kategori,
    total,
  }));

  // Construct Cash Flow Items (Mutasi Keluar Masuk Dana) for selected month
  const iuranIncomeItems: CashFlowItem[] = iuranRecords
    .filter((r) => r.tanggal.startsWith(selectedMonthYear) && r.nominalDibayar > 0)
    .map((r) => {
      const kantin = kantinList.find((k) => k.id === r.kantinId);
      return {
        id: `in-iuran-${r.id}`,
        tanggal: r.tanggal,
        tipe: 'pemasukan',
        kategori: 'Iuran Kantin',
        keterangan: `Iuran Kantin (${r.statusBayar})`,
        sumberAtauTujuan: kantin ? `${kantin.namaKantin} (${kantin.namaPemilik})` : 'Kantin Sekolah',
        nominal: r.nominalDibayar,
        bukti: r.catatan ? `Catatan: ${r.catatan}` : 'Penerimaan Iuran',
      };
    });

  const externalIncomeItems: CashFlowItem[] = monthlyPemasukanLain.map((inc) => ({
    id: `in-luar-${inc.id}`,
    tanggal: inc.tanggal,
    tipe: 'pemasukan',
    kategori: inc.kategori,
    keterangan: `${inc.judul}${inc.keterangan ? ' - ' + inc.keterangan : ''}`,
    sumberAtauTujuan: `Dari: ${inc.sumberPemberi}`,
    nominal: inc.nominal,
    bukti: inc.noKwitansi ? `Kwitansi #${inc.noKwitansi}` : 'Dana Masuk Luar',
  }));

  const incomeItems: CashFlowItem[] = [...iuranIncomeItems, ...externalIncomeItems];

  const expenseItems: CashFlowItem[] = monthlyExpenses.map((p) => ({
    id: `out-${p.id}`,
    tanggal: p.tanggal,
    tipe: 'pengeluaran',
    kategori: p.kategori,
    keterangan: `${p.judul}${p.keterangan ? ' - ' + p.keterangan : ''}`,
    sumberAtauTujuan: p.penanggungJawab ? `PJ: ${p.penanggungJawab}` : 'Pengeluaran Kas Operasional',
    nominal: p.nominal,
    bukti: p.noNota ? `Nota #${p.noNota}` : '-',
  }));

  const combinedCashFlow: CashFlowItem[] = [...incomeItems, ...expenseItems].sort((a, b) =>
    b.tanggal.localeCompare(a.tanggal)
  );

  const filteredCashFlow = combinedCashFlow.filter((item) => {
    const matchesFilter =
      cashFlowFilter === 'semua' ||
      (cashFlowFilter === 'pemasukan' && item.tipe === 'pemasukan') ||
      (cashFlowFilter === 'pengeluaran' && item.tipe === 'pengeluaran');

    const query = cashFlowSearch.toLowerCase().trim();
    const matchesQuery =
      !query ||
      item.kategori.toLowerCase().includes(query) ||
      item.keterangan.toLowerCase().includes(query) ||
      item.sumberAtauTujuan.toLowerCase().includes(query) ||
      item.bukti.toLowerCase().includes(query) ||
      item.tanggal.includes(query);

    return matchesFilter && matchesQuery;
  });

  const handleExportPdf = () => {
    exportMonthlyReportPdf(
      selectedMonthYear,
      monthlySummaries,
      settings,
      {
        totalPemasukan: grandTotalPemasukan,
        totalPengeluaran: grandExpense,
        anggaranTersimpanBulanIni: netSurplus,
        totalAnggaranTersimpanKumulatif: totalSavedCumulative,
      },
      combinedCashFlow
    );
  };

  const handleExportExcel = () => {
    exportMonthlyReportExcel(
      selectedMonthYear,
      monthlySummaries,
      settings,
      {
        totalPemasukan: grandTotalPemasukan,
        totalPengeluaran: grandExpense,
        anggaranTersimpanBulanIni: netSurplus,
        totalAnggaranTersimpanKumulatif: totalSavedCumulative,
      },
      combinedCashFlow
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>Laporan Rekapitulasi & Ekspor Bulanan</span>
            </h2>
            <p className="text-xs text-slate-500">
              Rekapitulasi iuran bulanan, total pemasukan & pengeluaran, serta anggaran kas tersimpan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Month Year Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
              />
            </div>

            {/* PDF Export */}
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Unduh Laporan (PDF)</span>
            </button>

            {/* Excel Export */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
          </div>

        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-100">
          
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-800 block">Target Iuran</span>
            <span className="text-sm sm:text-base font-extrabold text-blue-900 block mt-0.5">
              {formatRupiah(grandTarget)}
            </span>
            <span className="text-[10px] text-blue-700">{formatMonthYearLabel(selectedMonthYear)}</span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-800 block">Total Pemasukan</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-900 block mt-0.5">
              {formatRupiah(grandTotalPemasukan)}
            </span>
            <span className="text-[10px] text-emerald-700">
              Iuran: {formatRupiah(grandCollected)} {grandPemasukanLain > 0 ? `| Luar: +${formatRupiah(grandPemasukanLain)}` : ''}
            </span>
          </div>

          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
            <span className="text-[11px] font-semibold text-rose-800 block">Total Pengeluaran</span>
            <span className="text-sm sm:text-base font-extrabold text-rose-900 block mt-0.5">
              {formatRupiah(grandExpense)}
            </span>
            <span className="text-[10px] text-rose-700">{monthlyExpenses.length} Transaksi keluar</span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 block">Sisa Tunggakan Iuran</span>
            <span className="text-sm sm:text-base font-extrabold text-amber-900 block mt-0.5">
              {formatRupiah(grandArrears)}
            </span>
            <span className="text-[10px] text-amber-700">Belum dibayar</span>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[11px] font-semibold text-indigo-800 block">Kas Bulan Ini</span>
            <span className={`text-sm sm:text-base font-black block mt-0.5 ${netSurplus >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
              {formatRupiah(netSurplus)}
            </span>
            <span className="text-[10px] text-indigo-700">Surplus kas bersih</span>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
            <span className="text-[11px] font-semibold text-purple-800 block">Total Anggaran Tersimpan</span>
            <span className="text-sm sm:text-base font-extrabold text-purple-900 block mt-0.5">
              {formatRupiah(totalSavedCumulative)}
            </span>
            <span className="text-[10px] text-purple-700">Kas Kumulatif Sekolah</span>
          </div>

        </div>

      </div>

      {/* Rincian Neraca Keuangan & Anggaran Kas Tersimpan */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              <span>Rincian Neraca Pemasukan, Pengeluaran & Anggaran Tersimpan</span>
            </h3>
            <p className="text-xs text-slate-500">
              Perhitungan komprehensif pemasukan iuran & dana luar, pengeluaran operasional, dan total anggaran kas yang tersimpan.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 self-start sm:self-auto">
            Periode {formatMonthYearLabel(selectedMonthYear)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card Pemasukan */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/40 rounded-xl p-4 border border-emerald-200/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  1. Total Pemasukan Kas
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200/60 text-emerald-900 rounded-md">
                  {overallCompliance}% Target Iuran
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-emerald-950 block">
                  {formatRupiah(grandTotalPemasukan)}
                </span>
                <div className="text-xs text-emerald-800 font-medium space-y-0.5 mt-1">
                  <p>• Iuran Kantin: <strong className="text-emerald-900">{formatRupiah(grandCollected)}</strong></p>
                  <p>• Dana Masuk Luar: <strong className="text-teal-900">+{formatRupiah(grandPemasukanLain)}</strong></p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-200/60 text-xs text-emerald-900 space-y-1.5">
              <div className="flex justify-between">
                <span>Sisa Tunggakan Iuran:</span>
                <span className="font-bold text-amber-700">{formatRupiah(grandArrears)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Pemasukan Kumulatif:</span>
                <span className="font-bold">{formatRupiah(totalIncomeCumulative)}</span>
              </div>
            </div>
          </div>

          {/* Card Pengeluaran */}
          <div className="bg-gradient-to-br from-rose-50/80 to-orange-50/40 rounded-xl p-4 border border-rose-200/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  2. Pengeluaran Kas
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-200/60 text-rose-900 rounded-md">
                  {monthlyExpenses.length} Transaksi
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-rose-950 block">
                  {formatRupiah(grandExpense)}
                </span>
                <span className="text-xs text-rose-700 font-medium block mt-1">
                  Total Pengeluaran Kas Operasional
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-rose-200/60 text-xs text-rose-900 space-y-1.5">
              {expenseCategoryList.length > 0 ? (
                expenseCategoryList.slice(0, 2).map((item) => (
                  <div key={item.kategori} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[140px]">{item.kategori}:</span>
                    <span className="font-semibold">{formatRupiah(item.total)}</span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-rose-600 italic">Belum ada transaksi pengeluaran bulan ini</div>
              )}
              <div className="flex justify-between pt-1 border-t border-rose-200/40 font-medium">
                <span>Total Pengeluaran Kumulatif:</span>
                <span className="font-bold">{formatRupiah(totalExpenseCumulative)}</span>
              </div>
            </div>
          </div>

          {/* Card Total Anggaran Tersimpan */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/80 rounded-xl p-4 border border-indigo-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  3. Total Anggaran Tersimpan
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    netSurplus >= 0 ? 'bg-indigo-200/80 text-indigo-900' : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {netSurplus >= 0 ? 'Surplus Kas' : 'Defisit Kas'}
                </span>
              </div>
              <div className="mt-3">
                <span
                  className={`text-2xl font-black block ${
                    netSurplus >= 0 ? 'text-indigo-950' : 'text-rose-600'
                  }`}
                >
                  {formatRupiah(netSurplus)}
                </span>
                <span className="text-xs text-indigo-700 font-medium block mt-1">
                  Surplus Bersih Kas Bulan Ini
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-indigo-200/80 text-xs space-y-2">
              <div className="p-2.5 rounded-lg bg-indigo-100/70 border border-indigo-200 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-indigo-950">
                    Total Anggaran Kas Tersimpan Kumulatif
                  </span>
                  <span className="block text-[10px] text-indigo-700">
                    Akumulasi Saldo Kas Seluruh Periode
                  </span>
                </div>
                <span className="text-sm font-black text-indigo-900">
                  {formatRupiah(totalSavedCumulative)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Rekapitulasi Iuran Per Kantin - {formatMonthYearLabel(selectedMonthYear)}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Format Laporan Siap Cetak
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Kantin / Lapak</th>
                <th className="px-4 py-3">Pemilik</th>
                <th className="px-4 py-3 text-center">Hari Buka</th>
                <th className="px-4 py-3 text-center">Hari Bayar</th>
                <th className="px-4 py-3 text-center">Tunggakan</th>
                <th className="px-4 py-3 text-right">Target Iuran</th>
                <th className="px-4 py-3 text-right">Terkumpul</th>
                <th className="px-4 py-3 text-right">Sisa Tunggakan</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {monthlySummaries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 font-medium">
                    Belum ada data transaksi tercatat untuk bulan ini.
                  </td>
                </tr>
              ) : (
                monthlySummaries.map((item, index) => {
                  const isLunas = item.totalTunggakan === 0;

                  return (
                    <tr key={item.kantinId} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.namaKantin}</td>
                      <td className="px-4 py-3">{item.namaPemilik}</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">{item.totalHariBuka} hr</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">{item.totalHariBayar} hr</td>
                      <td className="px-4 py-3 text-center font-bold text-amber-700">{item.totalHariTunggakan} hr</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-600">
                        {formatRupiah(item.totalNominalHarusDibayar)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {formatRupiah(item.totalIuranDibayar)}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-amber-600">
                        {item.totalTunggakan > 0 ? formatRupiah(item.totalTunggakan) : 'Rp 0'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isLunas
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isLunas ? 'Lunas' : 'Ada Tunggakan'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-extrabold text-slate-900 text-xs border-t-2 border-slate-300">
              <tr>
                <td colSpan={6} className="px-4 py-3 uppercase tracking-wider text-right">
                  TOTAL REKAPITULASI BULANAN:
                </td>
                <td className="px-4 py-3 text-right text-blue-900">{formatRupiah(grandTarget)}</td>
                <td className="px-4 py-3 text-right text-emerald-800">{formatRupiah(grandCollected)}</td>
                <td className="px-4 py-3 text-right text-amber-800">{formatRupiah(grandArrears)}</td>
                <td className="px-4 py-3 text-center text-emerald-800">{overallCompliance}% Lunas</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tabel Mutasi Keluar Masuk Dana Kas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
        
        {/* Table Header & Controls */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              <span>Tabel Mutasi Arus Kas (Keluar & Masuk Dana)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Daftar rinci seluruh transaksi pemasukan iuran kantin dan pengeluaran operasional kas bulan {formatMonthYearLabel(selectedMonthYear)}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter Buttons */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCashFlowFilter('semua')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  cashFlowFilter === 'semua'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({combinedCashFlow.length})
              </button>
              <button
                onClick={() => setCashFlowFilter('pemasukan')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  cashFlowFilter === 'pemasukan'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                Masuk ({incomeItems.length})
              </button>
              <button
                onClick={() => setCashFlowFilter('pengeluaran')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  cashFlowFilter === 'pengeluaran'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                Keluar ({expenseItems.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cashFlowSearch}
                onChange={(e) => setCashFlowSearch(e.target.value)}
                placeholder="Cari transaksi..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 w-40 sm:w-52"
              />
            </div>
          </div>
        </div>

        {/* Table Render */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-center">Jenis</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Keterangan / Transaksi</th>
                <th className="px-4 py-3">Sumber / Penerima</th>
                <th className="px-4 py-3 text-right text-emerald-800">Pemasukan (+)</th>
                <th className="px-4 py-3 text-right text-rose-800">Pengeluaran (-)</th>
                <th className="px-4 py-3 text-center">Catatan / Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCashFlow.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500 font-medium">
                    Tidak ada catatan transaksi keluar/masuk dana yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredCashFlow.map((item, index) => {
                  const isMasuk = item.tipe === 'pemasukan';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition ${
                        isMasuk ? 'bg-emerald-50/20' : 'bg-rose-50/20'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                        {formatDateIndonesian(item.tanggal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isMasuk ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                            <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                            PEMASUKAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            PENGELUARAN
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] border border-slate-200">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.keterangan}</td>
                      <td className="px-4 py-3 text-slate-600">{item.sumberAtauTujuan}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700">
                        {isMasuk ? `+ ${formatRupiah(item.nominal)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-rose-700">
                        {!isMasuk ? `- ${formatRupiah(item.nominal)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 font-mono text-[11px]">
                        {item.bukti}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-extrabold text-slate-900 text-xs border-t-2 border-slate-300">
              <tr>
                <td colSpan={6} className="px-4 py-3 uppercase tracking-wider text-right">
                  TOTAL MUTASI KAS BULAN INI:
                </td>
                <td className="px-4 py-3 text-right text-emerald-800 font-black">
                  + {formatRupiah(grandTotalPemasukan)}
                </td>
                <td className="px-4 py-3 text-right text-rose-800 font-black">
                  - {formatRupiah(grandExpense)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                      netSurplus >= 0 ? 'bg-indigo-100 text-indigo-900' : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    Saldo: {formatRupiah(netSurplus)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};

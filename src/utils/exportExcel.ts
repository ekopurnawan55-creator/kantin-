import * as XLSX from 'xlsx';
import { MonthlyKantinSummary, IuranHarian, Kantin, SchoolSettings, Pengeluaran, PemasukanLain } from '../types';
import { formatMonthYearLabel, formatDateIndonesian } from './formatters';

export function exportMonthlyReportExcel(
  monthYear: string,
  summaryList: MonthlyKantinSummary[],
  settings: SchoolSettings,
  financials?: {
    totalPemasukan: number;
    totalPengeluaran: number;
    anggaranTersimpanBulanIni: number;
    totalAnggaranTersimpanKumulatif: number;
  },
  cashFlowList?: any[]
) {
  const monthLabel = formatMonthYearLabel(monthYear);

  // Prepare header info rows
  const excelData: any[] = [
    [(settings.namaSekolah || settings.namaKantin).toUpperCase()],
    ...(settings.namaSekolah ? [[settings.namaKantin.toUpperCase()]] : []),
    [`LAPORAN REKAPITULASI & NERACA KEUANGAN - BULAN ${monthLabel.toUpperCase()}`],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [], // Empty row separator
    [
      'No',
      'Nama Kantin / Lapak',
      'Nama Pemilik',
      'No WhatsApp',
      'Jenis Dagangan',
      'Iuran / Hari (Rp)',
      'Total Hari Buka',
      'Total Hari Bayar',
      'Total Hari Tunggakan',
      'Total Target (Rp)',
      'Total Terkumpul (Rp)',
      'Sisa Tunggakan (Rp)',
      'Status Pembayaran',
    ],
  ];

  let grandTarget = 0;
  let grandCollected = 0;
  let grandArrears = 0;

  summaryList.forEach((item, index) => {
    grandTarget += item.totalNominalHarusDibayar;
    grandCollected += item.totalIuranDibayar;
    grandArrears += item.totalTunggakan;

    const statusStr =
      item.totalTunggakan === 0
        ? 'LUNAS'
        : `ADA TUNGGAKAN (${item.totalHariTunggakan} Hari)`;

    excelData.push([
      index + 1,
      item.namaKantin,
      item.namaPemilik,
      item.noWa,
      item.jenisDagangan,
      item.nominalIuranPerHari,
      item.totalHariBuka,
      item.totalHariBayar,
      item.totalHariTunggakan,
      item.totalNominalHarusDibayar,
      item.totalIuranDibayar,
      item.totalTunggakan,
      statusStr,
    ]);
  });

  // Summary Row
  excelData.push([]);
  excelData.push([
    '',
    'TOTAL REKAPITULASI IURAN',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    grandTarget,
    grandCollected,
    grandArrears,
    grandArrears === 0 ? 'LUNAS SEMUA' : 'MASIH ADA TUNGGAKAN',
  ]);

  // Financial Breakdown Rows
  const totalPemasukan = financials?.totalPemasukan ?? grandCollected;
  const totalPengeluaran = financials?.totalPengeluaran ?? 0;
  const tersimpanBulanIni = financials?.anggaranTersimpanBulanIni ?? (totalPemasukan - totalPengeluaran);
  const tersimpanKumulatif = financials?.totalAnggaranTersimpanKumulatif ?? tersimpanBulanIni;

  excelData.push([]);
  excelData.push(['RINCIAN NERACA KEUANGAN & ANGGARAN KAS']);
  excelData.push(['• Total Target Iuran Bulanan', grandTarget]);
  excelData.push(['• Total Pemasukan Iuran (Terkumpul)', totalPemasukan]);
  excelData.push(['• Total Pengeluaran Kas (Bulan Ini)', totalPengeluaran]);
  excelData.push(['• Total Anggaran Tersimpan (Bulan Ini)', tersimpanBulanIni]);
  excelData.push(['• Total Anggaran Tersimpan Kumulatif (S/d Bulan Ini)', tersimpanKumulatif]);

  if (cashFlowList && cashFlowList.length > 0) {
    excelData.push([]);
    excelData.push([`TABEL MUTASI KELUAR MASUK DANA (${monthLabel.toUpperCase()})`]);
    excelData.push([
      'No',
      'Tanggal',
      'Jenis',
      'Kategori',
      'Keterangan / Judul',
      'Sumber / Penerima / PJ',
      'Pemasukan (+)',
      'Pengeluaran (-)',
      'Keterangan / Catatan',
    ]);

    cashFlowList.forEach((item, idx) => {
      excelData.push([
        idx + 1,
        item.tanggal,
        item.tipe === 'pemasukan' ? 'PEMASUKAN (+)' : 'PENGELUARAN (-)',
        item.kategori,
        item.keterangan,
        item.sumberAtauTujuan,
        item.tipe === 'pemasukan' ? item.nominal : 0,
        item.tipe === 'pengeluaran' ? item.nominal : 0,
        item.bukti || '-',
      ]);
    });
  }

  excelData.push([]);
  excelData.push(['', '', '', '', '', '', '', '', '', 'Bendahara Kantin,']);
  excelData.push([]);
  excelData.push([]);
  excelData.push(['', '', '', '', '', '', '', '', '', settings.namaBendahara]);
  excelData.push(['', '', '', '', '', '', '', '', '', settings.nipBendahara]);

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 32 }, // Nama Kantin
    { wch: 22 }, // Pemilik
    { wch: 15 }, // WA
    { wch: 18 }, // Jenis
    { wch: 16 }, // Nominal
    { wch: 14 }, // Hari Buka
    { wch: 14 }, // Hari Bayar
    { wch: 18 }, // Hari Tunggakan
    { wch: 18 }, // Target
    { wch: 18 }, // Terkumpul
    { wch: 18 }, // Sisa
    { wch: 22 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Bulanan');

  XLSX.writeFile(workbook, `Laporan_Bulanan_Iuran_Kantin_${monthYear}.xlsx`);
}

export function exportDailyReportExcel(
  tanggal: string,
  records: IuranHarian[],
  kantinList: Kantin[],
  settings: SchoolSettings
) {
  const dateFormatted = formatDateIndonesian(tanggal);

  const excelData: any[] = [
    [(settings.namaSekolah || settings.namaKantin).toUpperCase()],
    [`LAPORAN PENAGIHAN IURAN HARIAN KANTIN - ${dateFormatted.toUpperCase()}`],
    [],
    [
      'No',
      'Nama Kantin / Lapak',
      'Nama Pemilik',
      'No WA',
      'Jenis Dagangan',
      'Nominal Target (Rp)',
      'Nominal Dibayar (Rp)',
      'Status Pembayaran',
      'Metode Pembayaran',
      'Catatan / Keterangan',
    ],
  ];

  let totalTarget = 0;
  let totalTerkumpul = 0;

  const activeKantin = kantinList.filter((k) => k.status === 'Aktif');

  activeKantin.forEach((kantin, index) => {
    const rec = records.find((r) => r.kantinId === kantin.id && r.tanggal === tanggal);
    const nominalTarget = kantin.nominalIuran;
    const nominalDibayar = rec ? rec.nominalDibayar : 0;
    const statusBayar = rec ? rec.statusBayar : 'Belum Bayar';
    const metode = rec ? rec.metodePembayaran : '-';
    const catatan = rec?.catatan || '-';

    totalTarget += nominalTarget;
    totalTerkumpul += nominalDibayar;

    excelData.push([
      index + 1,
      kantin.namaKantin,
      kantin.namaPemilik,
      kantin.noWa,
      kantin.jenisDagangan,
      nominalTarget,
      nominalDibayar,
      statusBayar,
      metode,
      catatan,
    ]);
  });

  excelData.push([]);
  excelData.push([
    '',
    'TOTAL HARIAN',
    '',
    '',
    '',
    totalTarget,
    totalTerkumpul,
    totalTerkumpul >= totalTarget ? 'TERKUMPUL FULL' : `KURANG Rp ${totalTarget - totalTerkumpul}`,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 32 },
    { wch: 22 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Harian ${tanggal}`);

  XLSX.writeFile(workbook, `Laporan_Harian_Iuran_Kantin_${tanggal}.xlsx`);
}

export function exportCanteenOwnerReportExcel(
  kantin: Kantin,
  records: IuranHarian[],
  settings: SchoolSettings
) {
  const kantinRecords = records
    .filter((r) => r.kantinId === kantin.id)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const excelData: any[] = [
    [(settings.namaSekolah || settings.namaKantin).toUpperCase()],
    [`LAPORAN TRANSAKSI IURAN KANTIN - LAPAK ${kantin.namaKantin.toUpperCase()}`],
    [`Pemilik: ${kantin.namaPemilik} | WA: ${kantin.noWa} | Jenis Dagangan: ${kantin.jenisDagangan}`],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    [
      'No',
      'Tanggal',
      'Target Iuran (Rp)',
      'Nominal Dibayar (Rp)',
      'Status Pembayaran',
      'Metode Pembayaran',
      'Catatan / Keterangan',
    ],
  ];

  let totalDibayar = 0;
  let totalTunggakan = 0;

  kantinRecords.forEach((item, index) => {
    totalDibayar += item.nominalDibayar;
    if (item.statusBayar === 'Belum Bayar') {
      totalTunggakan += kantin.nominalIuran;
    }

    excelData.push([
      index + 1,
      item.tanggal,
      kantin.nominalIuran,
      item.nominalDibayar,
      item.statusBayar,
      item.metodePembayaran,
      item.catatan || '-',
    ]);
  });

  excelData.push([]);
  excelData.push([
    '',
    'TOTAL DIBAYAR',
    '',
    totalDibayar,
    totalTunggakan > 0 ? `SISA TUNGGAKAN: Rp ${totalTunggakan.toLocaleString('id-ID')}` : 'LUNAS',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Lapak');

  const safeKantinName = kantin.namaKantin.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(workbook, `Laporan_Kantin_${safeKantinName}.xlsx`);
}

export function exportPengeluaranExcel(
  periodLabel: string,
  pengeluaranList: Pengeluaran[],
  settings: SchoolSettings
) {
  const excelData: any[] = [
    [(settings.namaSekolah || settings.namaKantin).toUpperCase()],
    ...(settings.namaSekolah ? [[settings.namaKantin.toUpperCase()]] : []),
    [`LAPORAN PENGELUARAN DANA KANTIN - PERIODE: ${periodLabel.toUpperCase()}`],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    [
      'No',
      'Tanggal',
      'No. Bukti / Nota',
      'Kategori',
      'Keterangan Pengeluaran',
      'Penerima Dana',
      'Metode Pembayaran',
      'Nominal (Rp)',
      'Catatan Tambahan',
    ],
  ];

  let totalPengeluaran = 0;

  pengeluaranList.forEach((item, index) => {
    totalPengeluaran += item.nominal;
    excelData.push([
      index + 1,
      item.tanggal,
      item.nomorBukti || '-',
      item.kategori,
      item.keterangan,
      item.penerima || '-',
      item.metodePembayaran,
      item.nominal,
      item.catatan || '-',
    ]);
  });

  // Total row
  excelData.push([]);
  excelData.push([
    '',
    'TOTAL PENGELUARAN',
    '',
    '',
    '',
    '',
    '',
    totalPengeluaran,
    '',
  ]);

  excelData.push([]);
  excelData.push(['', '', '', '', '', '', 'Bendahara Kantin,']);
  excelData.push([]);
  excelData.push([]);
  excelData.push(['', '', '', '', '', '', settings.namaBendahara]);
  excelData.push(['', '', '', '', '', '', settings.nipBendahara || '']);

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // Tanggal
    { wch: 18 }, // No Bukti
    { wch: 22 }, // Kategori
    { wch: 38 }, // Keterangan
    { wch: 24 }, // Penerima
    { wch: 18 }, // Metode
    { wch: 18 }, // Nominal
    { wch: 28 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengeluaran Kantin');

  XLSX.writeFile(workbook, `Laporan_Pengeluaran_Kantin_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}

export function exportPemasukanLainExcel(
  periodLabel: string,
  pemasukanList: PemasukanLain[],
  settings: SchoolSettings
) {
  const excelData: any[] = [
    [(settings.namaSekolah || settings.namaKantin).toUpperCase()],
    ['LAPORAN PEMASUKAN KAS DARI LUAR / DANA TAMBAHAN'],
    [`Periode: ${periodLabel}`],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    [
      'No',
      'Tanggal',
      'No Bukti / Kuitansi',
      'Kategori Pemasukan',
      'Uraian / Keterangan',
      'Sumber / Pemberi Dana',
      'Metode Pembayaran',
      'Nominal (Rp)',
      'Catatan Tambahan',
    ],
  ];

  let totalPemasukan = 0;

  pemasukanList.forEach((item, index) => {
    totalPemasukan += item.nominal;
    excelData.push([
      index + 1,
      item.tanggal,
      item.nomorBukti || '-',
      item.kategori,
      item.keterangan,
      item.sumberPemberi || '-',
      item.metodePembayaran,
      item.nominal,
      item.catatan || '-',
    ]);
  });

  // Total row
  excelData.push([]);
  excelData.push([
    '',
    'TOTAL DANA MASUK',
    '',
    '',
    '',
    '',
    '',
    totalPemasukan,
    '',
  ]);

  excelData.push([]);
  excelData.push(['', '', '', '', '', '', 'Bendahara Penerima,']);
  excelData.push([]);
  excelData.push([]);
  excelData.push(['', '', '', '', '', '', settings.namaBendahara]);
  excelData.push(['', '', '', '', '', '', settings.nipBendahara || '']);

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // Tanggal
    { wch: 20 }, // No Bukti
    { wch: 24 }, // Kategori
    { wch: 38 }, // Keterangan
    { wch: 26 }, // Sumber / Pemberi
    { wch: 18 }, // Metode
    { wch: 18 }, // Nominal
    { wch: 28 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemasukan Luar');

  XLSX.writeFile(workbook, `Laporan_Pemasukan_Luar_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}


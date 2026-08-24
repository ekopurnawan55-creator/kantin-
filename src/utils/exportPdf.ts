import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Kantin, IuranHarian, MonthlyKantinSummary, SchoolSettings, Pengeluaran, PemasukanLain } from '../types';
import { formatRupiah, formatMonthYearLabel, formatDateIndonesian } from './formatters';

export interface CashFlowPdfItem {
  tanggal: string;
  tipe: 'pemasukan' | 'pengeluaran';
  kategori: string;
  keterangan: string;
  sumberAtauTujuan: string;
  nominal: number;
  bukti: string;
}

export function exportDailyReportPdf(
  tanggal: string,
  iuranRecords: IuranHarian[],
  kantinList: Kantin[],
  settings: SchoolSettings,
  pengeluaranList: Pengeluaran[] = []
) {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const dateFormatted = formatDateIndonesian(tanggal);

  const activeKantin = kantinList.filter((k) => k.status === 'Aktif');
  const recordsForDate = iuranRecords.filter((r) => r.tanggal === tanggal);
  const expensesForDate = pengeluaranList.filter((p) => p.tanggal === tanggal);

  const totalTargetIuran = activeKantin.reduce((sum, k) => sum + k.nominalIuran, 0);
  const totalIuranTerkumpul = recordsForDate.reduce((sum, r) => sum + r.nominalDibayar, 0);
  const totalTunggakan = Math.max(0, totalTargetIuran - totalIuranTerkumpul);
  const totalPengeluaran = expensesForDate.reduce((sum, p) => sum + p.nominal, 0);
  const sisaKasBersih = totalIuranTerkumpul - totalPengeluaran;

  const countLunas = recordsForDate.filter((r) => r.statusBayar === 'Lunas').length;
  const countBelum = activeKantin.length - countLunas;
  const countLibur = recordsForDate.filter((r) => r.statusBayar === 'Libur / Tutup').length;

  // Header / Kop Surat
  doc.setFillColor(30, 58, 138); // Navy Blue Header line
  doc.rect(14, 12, 182, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text(
    (settings.namaSekolah ? settings.namaSekolah : settings.namaKantin).toUpperCase(),
    105,
    22,
    { align: 'center' }
  );

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    settings.namaSekolah ? settings.namaKantin.toUpperCase() : 'SISTEM PENGELOLAAN IURAN & KAS KANTIN TERPADU',
    105,
    28,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Laporan Harian Pemasukan Iuran & Pengeluaran Kas`, 105, 34, { align: 'center' });

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // Document Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`LAPORAN KEUANGAN HARIAN - TANGGAL: ${dateFormatted.toUpperCase()}`, 14, 46);

  // Executive Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 50, 182, 36, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('RINGKASAN PEMASUKAN IURAN & PENGELUARAN HARIAN:', 18, 56);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`• Total Target Iuran : ${formatRupiah(totalTargetIuran)}`, 18, 62);
  doc.text(`• Total Terkumpul     : ${formatRupiah(totalIuranTerkumpul)}`, 18, 67);
  doc.setTextColor(220, 38, 38);
  doc.text(`• Total Pengeluaran  : ${formatRupiah(totalPengeluaran)}`, 18, 72);
  doc.text(`• Total Tunggakan    : ${formatRupiah(totalTunggakan)}`, 18, 77);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`• Saldo Bersih Hari Ini  : ${formatRupiah(sisaKasBersih)}`, 110, 62);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`• Status Kantin Lunas   : ${countLunas} Kantin`, 110, 67);
  doc.text(`• Status Belum Bayar    : ${countBelum} Kantin`, 110, 72);
  doc.text(`• Status Libur / Tutup  : ${countLibur} Kantin`, 110, 77);

  // Table 1: Rincian Iuran per Lapak
  const tableHead = [
    ['No', 'Nama Kantin', 'Pemilik', 'Target', 'Dibayar', 'Sisa', 'Status', 'Metode', 'Catatan'],
  ];

  const tableBody = activeKantin.map((kantin, index) => {
    const record = recordsForDate.find((r) => r.kantinId === kantin.id);
    const dibayar = record ? record.nominalDibayar : 0;
    const sisa = Math.max(0, kantin.nominalIuran - dibayar);
    const status = record ? record.statusBayar : 'Belum Bayar';
    const metode = record ? record.metodePembayaran : '-';
    const catatan = record?.catatan || '-';

    return [
      index + 1,
      kantin.namaKantin,
      kantin.namaPemilik,
      formatRupiah(kantin.nominalIuran),
      formatRupiah(dibayar),
      sisa > 0 ? formatRupiah(sisa) : 'Rp 0',
      status,
      metode,
      catatan,
    ];
  });

  // Total row
  tableBody.push([
    '',
    'TOTAL HARIAN',
    '',
    formatRupiah(totalTargetIuran),
    formatRupiah(totalIuranTerkumpul),
    formatRupiah(totalTunggakan),
    `${countLunas} Lunas`,
    '',
    '',
  ]);

  autoTable(doc, {
    startY: 90,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 30 },
      2: { cellWidth: 24 },
      3: { halign: 'right', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 16 },
      8: { cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
      }
    },
  });

  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 180;

  // Table 2: Rincian Pengeluaran Harian (if any)
  if (expensesForDate.length > 0) {
    if (finalY > 220) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text(`RINCIAN PENGELUARAN HARIAN (${dateFormatted.toUpperCase()})`, 14, finalY);

    const expenseHead = [['No', 'Kategori', 'Keterangan / Catatan', 'Penerima', 'Nominal']];
    const expenseBody = expensesForDate.map((exp, idx) => [
      idx + 1,
      exp.kategori,
      exp.keterangan || '-',
      exp.penerima || '-',
      formatRupiah(exp.nominal),
    ]);

    expenseBody.push(['', 'TOTAL PENGELUARAN', '', '', formatRupiah(totalPengeluaran)]);

    autoTable(doc, {
      startY: finalY + 4,
      head: expenseHead,
      body: expenseBody,
      theme: 'grid',
      headStyles: {
        fillColor: [185, 28, 28],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 35 },
        2: { cellWidth: 75 },
        3: { cellWidth: 34 },
        4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.row.index === expenseBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [153, 27, 27];
        }
      },
    });

    finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : finalY + 40;
  }

  // Signature Block
  const signatureY = finalY > 230 ? (doc.addPage(), 25) : finalY;
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text(`Mencetak pada: ${todayFormatted}`, 130, signatureY);
  doc.text(`Mengetahui & Menyetujui,`, 130, signatureY + 5);
  doc.text(`Bendahara Kantin Sekolah`, 130, signatureY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(settings.namaBendahara, 130, signatureY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.nipBendahara || 'NIP. -', 130, signatureY + 35);

  doc.save(`Laporan_Harian_Iuran_${tanggal}.pdf`);
}

export function exportMonthlyReportPdf(
  monthYear: string,
  summaryList: MonthlyKantinSummary[],
  settings: SchoolSettings,
  financials?: {
    totalPemasukan: number;
    totalPengeluaran: number;
    anggaranTersimpanBulanIni: number;
    totalAnggaranTersimpanKumulatif: number;
  },
  cashFlowList?: CashFlowPdfItem[]
) {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const monthLabel = formatMonthYearLabel(monthYear);

  // Totals calculation
  const grandTotalHarusDibayar = summaryList.reduce((acc, item) => acc + item.totalNominalHarusDibayar, 0);
  const grandTotalIuranDibayar = summaryList.reduce((acc, item) => acc + item.totalIuranDibayar, 0);
  const grandTotalTunggakan = summaryList.reduce((acc, item) => acc + item.totalTunggakan, 0);
  const overallRate = grandTotalHarusDibayar > 0 ? Math.round((grandTotalIuranDibayar / grandTotalHarusDibayar) * 100) : 0;

  const totalPemasukan = financials?.totalPemasukan ?? grandTotalIuranDibayar;
  const totalPengeluaran = financials?.totalPengeluaran ?? 0;
  const anggaranTersimpanBulanIni = financials?.anggaranTersimpanBulanIni ?? (totalPemasukan - totalPengeluaran);
  const totalAnggaranTersimpanKumulatif = financials?.totalAnggaranTersimpanKumulatif ?? anggaranTersimpanBulanIni;

  // Header / Kop Surat
  doc.setFillColor(30, 58, 138); // Navy Blue Header line
  doc.rect(14, 12, 182, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text(
    (settings.namaSekolah ? settings.namaSekolah : settings.namaKantin).toUpperCase(),
    105,
    22,
    { align: 'center' }
  );

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    settings.namaSekolah ? settings.namaKantin.toUpperCase() : 'SISTEM PENGELOLAAN IURAN & KAS KANTIN TERPADU',
    105,
    28,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Laporan Rekapitulasi & Penagihan Iuran Kas Kantin', 105, 34, { align: 'center' });

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // Document Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`LAPORAN REKAPITULASI & NERACA KEUANGAN - ${monthLabel.toUpperCase()}`, 14, 46);

  // Executive Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 50, 182, 36, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('RINGKASAN ARUS KAS & ANGGARAN TERSIMPAN:', 18, 56);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`• Total Target Iuran : ${formatRupiah(grandTotalHarusDibayar)}`, 18, 62);
  doc.text(`• Total Pemasukan   : ${formatRupiah(totalPemasukan)} (${overallRate}% Lunas)`, 18, 67);
  
  doc.setTextColor(220, 38, 38);
  doc.text(`• Total Pengeluaran  : ${formatRupiah(totalPengeluaran)}`, 18, 72);
  doc.text(`• Sisa Tunggakan    : ${formatRupiah(grandTotalTunggakan)}`, 18, 77);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`• Anggaran Tersimpan Bulan Ini : ${formatRupiah(anggaranTersimpanBulanIni)}`, 110, 62);
  doc.setTextColor(30, 58, 138);
  doc.text(`• Total Anggaran Tersimpan (S/d Bulan Ini) : ${formatRupiah(totalAnggaranTersimpanKumulatif)}`, 110, 67);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`• Jumlah Lapak Aktif  : ${summaryList.length} Kantin`, 110, 72);
  doc.text(`• Tanggal Cetak PDF    : ${new Date().toLocaleDateString('id-ID')}`, 110, 77);

  // Table Data
  const tableHead = [
    [
      'No',
      'Nama Kantin / Lapak',
      'Pemilik',
      'Buka',
      'Bayar',
      'Tunggak',
      'Total Target',
      'Terkumpul',
      'Sisa Tunggakan',
    ],
  ];

  const tableBody = summaryList.map((item, index) => [
    index + 1,
    item.namaKantin,
    item.namaPemilik,
    `${item.totalHariBuka} hr`,
    `${item.totalHariBayar} hr`,
    `${item.totalHariTunggakan} hr`,
    formatRupiah(item.totalNominalHarusDibayar),
    formatRupiah(item.totalIuranDibayar),
    item.totalTunggakan > 0 ? formatRupiah(item.totalTunggakan) : 'Rp 0 (Lunas)',
  ]);

  // Total row
  tableBody.push([
    '',
    'TOTAL REKAPITULASI',
    '',
    '',
    '',
    '',
    formatRupiah(grandTotalHarusDibayar),
    formatRupiah(grandTotalIuranDibayar),
    formatRupiah(grandTotalTunggakan),
  ]);

  autoTable(doc, {
    startY: 90,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'right', cellWidth: 24 },
      7: { halign: 'right', cellWidth: 24 },
      8: { halign: 'right', cellWidth: 28 },
    },
    didParseCell: (data) => {
      // Style the total row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
      }
    },
  });

  // Get final Y after first table
  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 200;

  // Render Cash Flow Ledger Table if cashFlowList is provided
  if (cashFlowList && cashFlowList.length > 0) {
    if (finalY > 220) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(`RINCIAN MUTASI ARUS KAS KELUAR & MASUK (${monthLabel.toUpperCase()})`, 14, finalY);

    const cashFlowHead = [
      ['No', 'Tanggal', 'Jenis', 'Kategori', 'Keterangan & Sumber/Penerima', 'Pemasukan (+)', 'Pengeluaran (-)'],
    ];

    const cashFlowBody = cashFlowList.map((item, idx) => [
      idx + 1,
      item.tanggal,
      item.tipe === 'pemasukan' ? 'MASUK' : 'KELUAR',
      item.kategori,
      `${item.keterangan}\n[${item.sumberAtauTujuan}]`,
      item.tipe === 'pemasukan' ? formatRupiah(item.nominal) : '-',
      item.tipe === 'pengeluaran' ? formatRupiah(item.nominal) : '-',
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: cashFlowHead,
      body: cashFlowBody,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 16 },
        3: { cellWidth: 28 },
        4: { cellWidth: 55 },
        5: { halign: 'right', cellWidth: 27 },
        6: { halign: 'right', cellWidth: 28 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          if (data.cell.raw === 'MASUK') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : finalY + 50;
  }

  // Signature Block
  const signatureY = finalY > 230 ? (doc.addPage(), 25) : finalY;
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text(`Ditetapkan di: Jakarta`, 130, signatureY);
  doc.text(`Pada Tanggal : ${todayFormatted}`, 130, signatureY + 5);
  doc.text(`Mengetahui & Menyetujui,`, 130, signatureY + 11);
  doc.text(`Bendahara Kantin Sekolah`, 130, signatureY + 16);

  // Signature line
  doc.setFont('helvetica', 'bold');
  doc.text(settings.namaBendahara, 130, signatureY + 36);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.nipBendahara || 'NIP. -', 130, signatureY + 41);

  // Save File
  const filename = `Laporan_Iuran_Kantin_${monthYear}.pdf`;
  doc.save(filename);
}

export function exportCanteenOwnerReportPdf(
  kantin: Kantin,
  records: IuranHarian[],
  settings: SchoolSettings
) {
  const doc = new jsPDF('portrait', 'mm', 'a4');

  // Filter records for this canteen
  const kantinRecords = records
    .filter((r) => r.kantinId === kantin.id)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const totalHariBuka = kantinRecords.filter((r) => r.statusBayar !== 'Libur / Tutup').length;
  const totalHariBayar = kantinRecords.filter((r) => r.statusBayar === 'Lunas').length;
  const totalHariTunggakan = kantinRecords.filter((r) => r.statusBayar === 'Belum Bayar').length;
  const totalTunggakan = totalHariTunggakan * kantin.nominalIuran;
  const totalIuranDibayar = kantinRecords.reduce((sum, r) => sum + r.nominalDibayar, 0);

  // Header / Kop Surat
  doc.setFillColor(30, 58, 138); // Navy Blue Header line
  doc.rect(14, 12, 182, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text(
    (settings.namaSekolah ? settings.namaSekolah : settings.namaKantin).toUpperCase(),
    105,
    22,
    { align: 'center' }
  );

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    settings.namaSekolah ? settings.namaKantin.toUpperCase() : 'SISTEM PENGELOLAAN IURAN & KAS KANTIN TERPADU',
    105,
    28,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Laporan Pertanggungjawaban & Tagihan Iuran Lapak Kantin', 105, 34, { align: 'center' });

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`LAPORAN LAPAK: ${kantin.namaKantin.toUpperCase()}`, 14, 46);

  // Executive Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 50, 182, 30, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('INFORMASI LAPAK & RINGKASAN TAGIHAN:', 18, 56);

  doc.setFont('helvetica', 'normal');
  doc.text(`• Pemilik Lapak    : ${kantin.namaPemilik}`, 18, 62);
  doc.text(`• No. WhatsApp     : ${kantin.noWa}`, 18, 67);
  doc.text(`• Jenis Dagangan  : ${kantin.jenisDagangan}`, 18, 72);

  doc.text(`• Nominal Standard  : ${formatRupiah(kantin.nominalIuran)} / Hari`, 115, 62);
  doc.text(`• Total Telah Dibayar : ${formatRupiah(totalIuranDibayar)} (${totalHariBayar} Hari)`, 115, 67);

  doc.setFont('helvetica', 'bold');
  if (totalTunggakan > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text(`• Total Tunggakan    : ${formatRupiah(totalTunggakan)} (${totalHariTunggakan} Hari)`, 115, 72);
  } else {
    doc.setTextColor(22, 163, 74);
    doc.text(`• Status Tunggakan   : LUNAS (Tidak ada tunggakan)`, 115, 72);
  }

  // Table Data
  const tableHead = [
    ['No', 'Tanggal', 'Target Iuran', 'Dibayar', 'Status Pembayaran', 'Metode', 'Catatan'],
  ];

  const tableBody = kantinRecords.map((item, index) => [
    index + 1,
    item.tanggal,
    formatRupiah(kantin.nominalIuran),
    formatRupiah(item.nominalDibayar),
    item.statusBayar,
    item.metodePembayaran,
    item.catatan || '-',
  ]);

  autoTable(doc, {
    startY: 85,
    head: tableHead,
    body: tableBody.length > 0 ? tableBody : [['-', '-', '-', '-', 'Belum ada riwayat', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 32 },
      5: { halign: 'center', cellWidth: 20 },
      6: { cellWidth: 41 },
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 200;
  const currentY = finalY > 230 ? 230 : finalY;
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text(`Mencetak pada: ${todayFormatted}`, 130, currentY);
  doc.text(`Mengetahui & Menyetujui,`, 130, currentY + 6);
  doc.text(`Bendahara Kantin Sekolah`, 130, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(settings.namaBendahara, 130, currentY + 31);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.nipBendahara || 'NIP. -', 130, currentY + 36);

  const safeKantinName = kantin.namaKantin.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Laporan_Kantin_${safeKantinName}.pdf`);
}

export function exportPengeluaranPdf(
  periodLabel: string,
  pengeluaranList: Pengeluaran[],
  settings: SchoolSettings
) {
  const doc = new jsPDF('portrait', 'mm', 'a4');

  const totalPengeluaran = pengeluaranList.reduce((acc, item) => acc + item.nominal, 0);

  // Header / Kop Surat
  doc.setFillColor(185, 28, 28); // Red/Rose Header line for expenses
  doc.rect(14, 12, 182, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138);
  doc.text(
    (settings.namaSekolah ? settings.namaSekolah : settings.namaKantin).toUpperCase(),
    105,
    22,
    { align: 'center' }
  );

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    settings.namaSekolah ? settings.namaKantin.toUpperCase() : 'SISTEM PENGELOLAAN IURAN & KAS KANTIN TERPADU',
    105,
    28,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Laporan Rekapitulasi & Rincian Pengeluaran Dana Kas Kantin', 105, 34, { align: 'center' });

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`LAPORAN PENGELUARAN DANA KANTIN - PERIODE: ${periodLabel.toUpperCase()}`, 14, 46);

  // Summary box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14, 50, 182, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('RINGKASAN PENGELUARAN:', 18, 56);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`• Total Nominal Pengeluaran : ${formatRupiah(totalPengeluaran)}`, 18, 62);
  doc.text(`• Jumlah Transaksi           : ${pengeluaranList.length} Transaksi`, 18, 68);

  doc.text(`• Dicetak Oleh : ${settings.namaBendahara}`, 120, 62);
  doc.text(`• Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 120, 68);

  // Table
  const tableHead = [
    ['No', 'Tanggal', 'No. Bukti', 'Kategori', 'Keterangan', 'Penerima', 'Metode', 'Nominal'],
  ];

  const tableBody = pengeluaranList.map((item, index) => [
    index + 1,
    item.tanggal,
    item.nomorBukti || '-',
    item.kategori,
    item.keterangan,
    item.penerima || '-',
    item.metodePembayaran,
    formatRupiah(item.nominal),
  ]);

  // Total row
  tableBody.push([
    '',
    'TOTAL PENGELUARAN',
    '',
    '',
    '',
    '',
    '',
    formatRupiah(totalPengeluaran),
  ]);

  autoTable(doc, {
    startY: 80,
    head: tableHead,
    body: tableBody.length > 1 ? tableBody : [['-', '-', '-', '-', 'Belum ada catatan pengeluaran', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 28 },
      4: { cellWidth: 42 },
      5: { cellWidth: 24 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight total row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [254, 226, 226];
        data.cell.styles.textColor = [153, 27, 27];
      }
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 200;
  const currentY = finalY > 230 ? 230 : finalY;
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text(`Mencetak pada: ${todayFormatted}`, 130, currentY);
  doc.text(`Mengetahui & Menyetujui,`, 130, currentY + 6);
  doc.text(`Bendahara Kantin Sekolah`, 130, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(settings.namaBendahara, 130, currentY + 31);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.nipBendahara || 'NIP. -', 130, currentY + 36);

  doc.save(`Laporan_Pengeluaran_Kantin_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function exportPemasukanLainPdf(
  periodLabel: string,
  pemasukanList: PemasukanLain[],
  settings: SchoolSettings,
  totalPemasukan: number
) {
  const doc = new jsPDF('portrait', 'mm', 'a4');

  // Header / Kop Surat
  doc.setFillColor(16, 185, 129); // Emerald Green Line
  doc.rect(14, 12, 182, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(5, 150, 105);
  doc.text(
    (settings.namaSekolah ? settings.namaSekolah : settings.namaKantin).toUpperCase(),
    105,
    22,
    { align: 'center' }
  );

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'LAPORAN PEMASUKAN KAS DARI LUAR / DANA TAMBAHAN',
    105,
    28,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Periode: ${periodLabel}`, 105, 34, { align: 'center' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // Summary Card
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(167, 243, 208); // Emerald-200
  doc.roundedRect(14, 43, 182, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text('RINGKASAN TOTAL DANA MASUK LUAR', 20, 50);

  doc.setFontSize(14);
  doc.setTextColor(5, 150, 105);
  doc.text(formatRupiah(totalPemasukan), 20, 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Jumlah Transaksi: ${pemasukanList.length} transaksi penerimaan dana luar`, 20, 64);

  // Table
  const tableHead = [
    ['No', 'Tanggal', 'No. Bukti', 'Kategori', 'Keterangan', 'Sumber / Pemberi', 'Metode', 'Nominal'],
  ];

  const tableBody = pemasukanList.map((item, index) => [
    index + 1,
    item.tanggal,
    item.nomorBukti || '-',
    item.kategori,
    item.keterangan,
    item.sumberPemberi || '-',
    item.metodePembayaran,
    formatRupiah(item.nominal),
  ]);

  // Total row
  tableBody.push([
    '',
    'TOTAL DANA MASUK',
    '',
    '',
    '',
    '',
    '',
    formatRupiah(totalPemasukan),
  ]);

  autoTable(doc, {
    startY: 75,
    head: tableHead,
    body: tableBody.length > 1 ? tableBody : [['-', '-', '-', '-', 'Belum ada catatan pemasukan luar', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 28 },
      4: { cellWidth: 42 },
      5: { cellWidth: 24 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight total row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [209, 250, 229];
        data.cell.styles.textColor = [6, 95, 70];
      }
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 200;
  const currentY = finalY > 230 ? 230 : finalY;
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text(`Mencetak pada: ${todayFormatted}`, 130, currentY);
  doc.text(`Mengetahui & Menerima,`, 130, currentY + 6);
  doc.text(`Bendahara Kantin Sekolah`, 130, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(settings.namaBendahara, 130, currentY + 31);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.nipBendahara || 'NIP. -', 130, currentY + 36);

  doc.save(`Laporan_Pemasukan_Luar_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}


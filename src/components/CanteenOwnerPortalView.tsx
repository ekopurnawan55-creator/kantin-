import React, { useState, useEffect } from 'react';
import { Kantin, IuranHarian, SchoolSettings } from '../types';
import {
  formatRupiah,
  formatDateIndonesian,
  getTodayIsoString,
  generateWhatsAppLink,
} from '../utils/formatters';
import { exportCanteenOwnerReportPdf } from '../utils/exportPdf';
import { exportCanteenOwnerReportExcel } from '../utils/exportExcel';
import {
  Store,
  QrCode,
  Building,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Share2,
  Copy,
  Check,
  Send,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Coffee,
  DollarSign,
  ExternalLink,
  ChevronDown,
  ArrowDownToLine,
  Lock,
  Smartphone,
  X,
  Share,
  PlusSquare,
  Sparkles,
} from 'lucide-react';

interface CanteenOwnerPortalViewProps {
  kantinList: Kantin[];
  selectedKantin: Kantin;
  iuranRecords: IuranHarian[];
  settings: SchoolSettings;
  onSelectKantin: (kantin: Kantin) => void;
  onExitPortal?: () => void;
  isDirectLink?: boolean;
}

export const CanteenOwnerPortalView: React.FC<CanteenOwnerPortalViewProps> = ({
  kantinList,
  selectedKantin,
  iuranRecords,
  settings,
  onSelectKantin,
  onExitPortal,
  isDirectLink = false,
}) => {
  const todayIso = getTodayIsoString();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [showQrisPreview, setShowQrisPreview] = useState(false);
  const [qrisInstallSuccess, setQrisInstallSuccess] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installTab, setInstallTab] = useState<'android' | 'ios' | 'pc'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect OS for install instructions
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setInstallTab('ios');
    } else if (/android/.test(ua)) {
      setInstallTab('android');
    } else {
      setInstallTab('android');
    }

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone
    ) {
      setIsInstalled(true);
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallModal(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDownloadShortcut = () => {
    const urlContent = `[InternetShortcut]\nURL=${portalUrl}\nIconIndex=0`;
    const blob = new Blob([urlContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Aplikasi_Kantin_${selectedKantin.namaKantin.replace(/\s+/g, '_')}.url`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleInstallQris = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Red Header Bar
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, canvas.width, 100);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QRIS IURAN KANTIN RESMI', canvas.width / 2, 60);

    // Subtitle Card
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(settings.namaKantin.toUpperCase(), canvas.width / 2, 140);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${selectedKantin.namaKantin} - ${settings.namaSekolah}`, canvas.width / 2, 170);

    // QR Outer Box
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(100, 200, 400, 400, 24);
    ctx.fill();

    // QR Inner White
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(120, 220, 360, 360, 16);
    ctx.fill();

    // Draw QR Code Pattern
    const qrSize = 300;
    const startX = 150;
    const startY = 250;

    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, 70, 70);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 10, y + 10, 50, 50);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 20, y + 20, 30, 30);
    };

    drawCorner(startX, startY);
    drawCorner(startX + qrSize - 70, startY);
    drawCorner(startX, startY + qrSize - 70);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(startX + 100, startY + 10, 25, 25);
    ctx.fillRect(startX + 140, startY + 10, 40, 25);
    ctx.fillRect(startX + 100, startY + 50, 30, 30);
    ctx.fillRect(startX + 150, startY + 50, 40, 20);

    ctx.fillRect(startX + 10, startY + 100, 45, 25);
    ctx.fillRect(startX + 70, startY + 100, 25, 50);
    ctx.fillRect(startX + 110, startY + 100, 60, 35);
    ctx.fillRect(startX + 185, startY + 100, 40, 25);
    ctx.fillRect(startX + 240, startY + 100, 25, 50);

    ctx.fillRect(startX + 10, startY + 140, 35, 30);
    ctx.fillRect(startX + 115, startY + 145, 45, 35);
    ctx.fillRect(startX + 175, startY + 140, 50, 25);

    ctx.fillRect(startX + 100, startY + 200, 35, 50);
    ctx.fillRect(startX + 150, startY + 200, 50, 25);
    ctx.fillRect(startX + 215, startY + 200, 35, 35);
    ctx.fillRect(startX + 160, startY + 235, 65, 25);

    // Footer Text
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('NMAS: ID102938481239 - ' + settings.namaSekolah, canvas.width / 2, 630);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText('Mendukung GoPay, OVO, DANA, ShopeePay & Semua m-Banking', canvas.width / 2, 660);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Transfer Bank: ' + settings.bankAccountInfo, canvas.width / 2, 690);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QRIS_Kantin_${selectedKantin.namaKantin.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();

    setQrisInstallSuccess(true);
    setTimeout(() => setQrisInstallSuccess(false), 3000);
  };

  // Compute records for selected canteen
  const kantinRecords = iuranRecords
    .filter((r) => r.kantinId === selectedKantin.id)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  // Today's record
  const todayRecord = kantinRecords.find((r) => r.tanggal === todayIso);
  const todayStatus = todayRecord ? todayRecord.statusBayar : 'Belum Bayar';

  // Arrears computation (unpaid past records)
  const pastUnpaid = kantinRecords.filter(
    (r) => r.statusBayar === 'Belum Bayar' && r.tanggal !== todayIso
  );
  const totalPastArrears = pastUnpaid.length * selectedKantin.nominalIuran;

  // Total Arrears including today if unpaid
  const totalArrearsNow =
    todayStatus === 'Belum Bayar'
      ? totalPastArrears + selectedKantin.nominalIuran
      : totalPastArrears;

  const totalPaidAllTime = kantinRecords.reduce((sum, r) => sum + r.nominalDibayar, 0);

  // Filtered records for table view
  const displayRecords = kantinRecords.filter((r) => {
    const matchMonth = filterMonth ? r.tanggal.startsWith(filterMonth) : true;
    const matchStatus =
      filterStatus === 'Semua'
        ? true
        : filterStatus === 'Lunas'
        ? r.statusBayar === 'Lunas'
        : filterStatus === 'Belum Bayar'
        ? r.statusBayar === 'Belum Bayar'
        : r.statusBayar === 'Libur / Tutup';
    return matchMonth && matchStatus;
  });

  // Canteen Portal URL
  const portalUrl = `${window.location.origin}${window.location.pathname}?kantinId=${selectedKantin.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyBank = () => {
    navigator.clipboard.writeText(settings.bankAccountInfo);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // WhatsApp link to send confirmation to Bendahara with complete details
  const messageForBendahara = `Halo Ibu/Bapak Bendahara (${settings.namaBendahara || 'Bendahara Kantin'})\nSaya ingin konfirmasi/lapor pembayaran iuran harian kantin:\n- Stand / Lapak: *${selectedKantin.namaKantin}*\n- Pemilik: *${selectedKantin.namaPemilik}*\n- Tanggal: *${formatDateIndonesian(todayIso)}*\n- Nominal Iuran: *${formatRupiah(selectedKantin.nominalIuran)}*\n- Status Saat Ini: *${todayStatus}*\n\nBerikut bukti transfer / mohon diverifikasi. Terima kasih.`;
  const waBendaharaLink = generateWhatsAppLink(settings.noWaBendahara || '081234567890', messageForBendahara);

  // WhatsApp link to share portal url to vendor
  const messageSharePortal = `Halo Bp/Ibu ${selectedKantin.namaPemilik},\nBerikut adalah *Link Aplikasi Portal Resmi Kantin Anda* untuk cek tagihan, bayar QRIS, & unduh bukti pembayaran:\n👉 ${portalUrl}\n\nTerima kasih.`;
  const waSharePortalLink = generateWhatsAppLink(selectedKantin.noWa, messageSharePortal);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-6">
      
      {/* Top Stand Header & Switcher Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold mb-2">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aplikasi Portal Pemilik Kantin</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {selectedKantin.namaKantin}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Pemilik: <strong className="text-white">{selectedKantin.namaPemilik}</strong> • {selectedKantin.jenisDagangan} • {settings.namaSekolah || 'Kantin Sekolah'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download / Install App Button */}
            <button
              onClick={() => setShowInstallModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-emerald-950/40 cursor-pointer active:scale-98"
              title="Unduh / Pasang Aplikasi ke Layar Utama HP"
            >
              <Smartphone className="w-4 h-4 text-white" />
              <span>Download & Pasang Aplikasi</span>
            </button>

            {isDirectLink ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold shadow-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Akses Khusus Stand Ini</span>
              </div>
            ) : (
              onExitPortal && (
                <button
                  onClick={onExitPortal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Bendahara</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Today Billing Status & Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Status Today */}
        <div className={`p-5 rounded-2xl border shadow-xs ${
          todayStatus === 'Lunas'
            ? 'bg-emerald-50 border-emerald-200'
            : todayStatus === 'Libur / Tutup'
            ? 'bg-slate-50 border-slate-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Tagihan Hari Ini</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl font-black text-slate-900">
              {formatRupiah(selectedKantin.nominalIuran)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
              todayStatus === 'Lunas'
                ? 'bg-emerald-600 text-white'
                : todayStatus === 'Libur / Tutup'
                ? 'bg-slate-500 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {todayStatus === 'Lunas' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>LUNAS</span>
                </>
              ) : todayStatus === 'Libur / Tutup' ? (
                <>
                  <Coffee className="w-3.5 h-3.5" />
                  <span>LIBUR</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>BELUM BAYAR</span>
                </>
              )}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Standard iuran harian lapak: {formatRupiah(selectedKantin.nominalIuran)} / hari
          </p>
        </div>

        {/* Total Arrears Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tunggakan</span>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xl font-black ${totalArrearsNow > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatRupiah(totalArrearsNow)}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
              totalArrearsNow > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {totalArrearsNow > 0 ? `${pastUnpaid.length + (todayStatus === 'Belum Bayar' ? 1 : 0)} Hari` : 'Bebas Tunggakan'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {totalArrearsNow > 0 ? 'Harap segera dilunasi ke Bendahara' : 'Terima kasih telah tertib membayar'}
          </p>
        </div>

        {/* Total Paid All Time */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Terbayar</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl font-black text-blue-900">
              {formatRupiah(totalPaidAllTime)}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800">
              {kantinRecords.filter((r) => r.statusBayar === 'Lunas').length} Hari Lunas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Total akumulasi iuran terbayar ke sekolah
          </p>
        </div>

      </div>

      {/* Payment Options Section (QRIS & Bank Transfer) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Instruksi Pembayaran Iuran Kantin</span>
            </h3>
            <p className="text-xs text-slate-500">
              Lakukan pembayaran tunai ke Bendahara atau via Transfer Bank / QRIS Resmi.
            </p>
          </div>

          <a
            href={waBendaharaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Konfirmasi Bendahara WA</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* QRIS Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Bayar via QRIS Resmi</span>
              </span>
              <button
                onClick={() => setShowQrisPreview(!showQrisPreview)}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                {showQrisPreview ? 'Sembunyikan' : 'Tampilkan QR'}
              </button>
            </div>

            {showQrisPreview ? (
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center my-2">
                <svg
                  className="w-36 h-36 mx-auto"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                >
                  <rect x="5" y="5" width="25" height="25" rx="3" fill="#0f172a" />
                  <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
                  <rect x="13" y="13" width="9" height="9" fill="#0f172a" />
                  <rect x="70" y="5" width="25" height="25" rx="3" fill="#0f172a" />
                  <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
                  <rect x="78" y="13" width="9" height="9" fill="#0f172a" />
                  <rect x="5" y="70" width="25" height="25" rx="3" fill="#0f172a" />
                  <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
                  <rect x="13" y="78" width="9" height="9" fill="#0f172a" />
                  <rect x="35" y="10" width="8" height="8" fill="#0f172a" />
                  <rect x="48" y="10" width="12" height="8" fill="#0f172a" />
                  <rect x="35" y="22" width="10" height="10" fill="#0f172a" />
                  <rect x="50" y="22" width="12" height="6" fill="#0f172a" />
                  <rect x="10" y="38" width="14" height="8" fill="#0f172a" />
                  <rect x="28" y="38" width="8" height="18" fill="#0f172a" />
                  <rect x="40" y="38" width="20" height="12" fill="#0f172a" />
                  <rect x="65" y="38" width="12" height="8" fill="#0f172a" />
                  <rect x="82" y="38" width="8" height="16" fill="#0f172a" />
                  <rect x="10" y="52" width="12" height="10" fill="#0f172a" />
                  <rect x="42" y="54" width="14" height="12" fill="#0f172a" />
                  <rect x="62" y="52" width="15" height="8" fill="#0f172a" />
                  <rect x="35" y="72" width="12" height="18" fill="#0f172a" />
                  <rect x="52" y="72" width="18" height="8" fill="#0f172a" />
                  <rect x="74" y="72" width="12" height="12" fill="#0f172a" />
                  <rect x="55" y="84" width="22" height="8" fill="#0f172a" />
                </svg>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">Scan Pakai GoPay, OVO, Dana, m-Banking</p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 mb-3">
                Mendukung pembayaran digital GoPay, OVO, ShopeePay, Dana, & seluruh aplikasi m-Banking.
              </p>
            )}

            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleInstallQris}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                  qrisInstallSuccess
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {qrisInstallSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Gambar QRIS Berhasil Diinstal!</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-3.5 h-3.5 text-white" />
                    <span>Instal / Simpan Gambar QRIS</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowQrisPreview(!showQrisPreview)}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {showQrisPreview ? 'Tutup Kode QRIS' : 'Buka QRIS Pembayaran'}
              </button>
            </div>
          </div>

          {/* Bank Transfer Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mb-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Rekening Bank Resmi Sekolah</span>
              </span>
              <p className="text-xs font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed font-mono">
                {settings.bankAccountInfo}
              </p>
            </div>

            <button
              onClick={handleCopyBank}
              className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBank ? 'No. Rekening Tersalin!' : 'Salin Info Rekening Bank'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Transaction History & Report Download Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Header and Download Buttons */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Riwayat Transaksi & Laporan Lapak</span>
            </h3>
            <p className="text-xs text-slate-500">
              Daftar histori pembayaran iuran harian beserta fitur unduh laporan resmi.
            </p>
          </div>

          {/* Download Report Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportCanteenOwnerReportPdf(selectedKantin, iuranRecords, settings)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Laporan PDF</span>
            </button>

            <button
              onClick={() => exportCanteenOwnerReportExcel(selectedKantin, iuranRecords, settings)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Filter Status:</span>
            {(['Semua', 'Lunas', 'Belum Bayar', 'Libur'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Bulan:</span>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            {filterMonth && (
              <button
                onClick={() => setFilterMonth('')}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-right">Target Iuran</th>
                <th className="px-4 py-3 text-right">Dibayar</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Metode</th>
                <th className="px-4 py-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Tidak ada riwayat transaksi dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const isLunas = item.statusBayar === 'Lunas';
                  const isLibur = item.statusBayar === 'Libur / Tutup';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatDateIndonesian(item.tanggal)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-600">
                        {formatRupiah(selectedKantin.nominalIuran)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {formatRupiah(item.nominalDibayar)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isLunas
                            ? 'bg-emerald-100 text-emerald-800'
                            : isLibur
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.statusBayar}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{item.metodePembayaran}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{item.catatan || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* App Installation & Stand Tips Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 border border-blue-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-300 shrink-0 border border-white/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Pasang Aplikasi di Layar Utama HP</h4>
            <p className="text-xs text-blue-200 mt-0.5">
              Simpan link ini atau tambahkan ke Layar Utama HP (Add to Home Screen) agar mudah dibuka setiap hari tanpa mengetik ulang link.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowInstallModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Pasang / Unduh Aplikasi</span>
          </button>
        </div>
      </div>

      {/* Modal Unduh & Pasang Aplikasi Kantin */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-150 border border-slate-100 my-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 pr-8">
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>Pasang Aplikasi Stand Kantin</span>
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedKantin.namaKantin} ({selectedKantin.namaPemilik}) • {settings.namaSekolah}
                </p>
              </div>
            </div>

            {/* 1-Click Native Install Prompt if Supported */}
            {deferredPrompt && (
              <div className="mt-3.5 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Browser Mendukung 1-Klik Pasang!
                  </span>
                </div>
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>PASANG SEKARANG KE LAYAR UTAMA HP</span>
                </button>
              </div>
            )}

            {/* Tabs Platform Guide */}
            <div className="mt-4 flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setInstallTab('android')}
                className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  installTab === 'android'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>HP Android (Chrome)</span>
              </button>

              <button
                onClick={() => setInstallTab('ios')}
                className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  installTab === 'ios'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Share className="w-3.5 h-3.5" />
                <span>iPhone / iPad (Safari)</span>
              </button>

              <button
                onClick={() => setInstallTab('pc')}
                className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  installTab === 'pc'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Laptop / PC</span>
              </button>
            </div>

            {/* Platform Instructions */}
            <div className="mt-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2.5">
              {installTab === 'android' && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <span>Buka link ini di Google Chrome</span>
                  </div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <span>Ketuk menu titik tiga (⋮) di pojok kanan atas</span>
                  </div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                      3
                    </span>
                    <span>Pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong></span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Ikon aplikasi <strong>{selectedKantin.namaKantin}</strong> akan otomatis muncul di menu aplikasi HP Anda seperti aplikasi biasa.
                  </p>
                </div>
              )}

              {installTab === 'ios' && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <span>Buka link ini menggunakan browser <strong>Safari</strong></span>
                  </div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <span>Tekan tombol <strong>Bagikan / Share</strong> (ikon kotak tanda panah ke atas di bilah bawah)</span>
                  </div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                      3
                    </span>
                    <span>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong></span>
                  </div>
                </div>
              )}

              {installTab === 'pc' && (
                <div className="space-y-2">
                  <p className="font-medium">
                    Di Google Chrome / Microsoft Edge di komputer, klik ikon <strong>Instal</strong> di bilah alamat URL kanan atas, atau unduh file pintasan:
                  </p>
                  <button
                    onClick={handleDownloadShortcut}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Unduh File Shortcut Desktop (.url)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions at Bottom */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link Aplikasi Stand'}</span>
              </button>

              <button
                onClick={() => setShowInstallModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
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

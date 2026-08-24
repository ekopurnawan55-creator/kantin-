import React, { useState } from 'react';
import { SchoolSettings } from '../types';
import { QrCode, X, CheckCircle2, ArrowDownToLine, Check } from 'lucide-react';

interface QrisModalProps {
  settings: SchoolSettings;
  onClose: () => void;
}

export const QrisModal: React.FC<QrisModalProps> = ({ settings, onClose }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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
    ctx.fillText(settings.namaSekolah, canvas.width / 2, 170);

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

    ctx.fillStyle = '#0f172a';
    
    // Corner squares helper
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

    // Pattern Rectangles
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

    // Trigger download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QRIS_Kantin_${settings.namaSekolah.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-center animate-in fade-in zoom-in-95 duration-150">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="font-extrabold text-slate-900 text-lg">
          QRIS Iuran Kantin
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {settings.namaKantin} • {settings.namaSekolah}
        </p>

        {/* QRIS Visual Card */}
        <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl shadow-inner border border-slate-800">
          <div className="bg-white p-4 rounded-xl text-slate-900 inline-block shadow-md">
            {/* SVG QR Code Simulation */}
            <svg
              className="w-44 h-44 mx-auto"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Outer Corners */}
              <rect x="5" y="5" width="25" height="25" rx="3" fill="#0f172a" />
              <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
              <rect x="13" y="13" width="9" height="9" fill="#0f172a" />

              <rect x="70" y="5" width="25" height="25" rx="3" fill="#0f172a" />
              <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
              <rect x="78" y="13" width="9" height="9" fill="#0f172a" />

              <rect x="5" y="70" width="25" height="25" rx="3" fill="#0f172a" />
              <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
              <rect x="13" y="78" width="9" height="9" fill="#0f172a" />

              {/* Random QR Pattern Grid */}
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
          </div>

          <div className="mt-3 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>NMAS: ID102938481239 - SMAN 1</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Mendukung GoPay, OVO, Dana, ShopeePay, & Semua m-Banking.
          </p>
        </div>

        {/* Bank Transfer Info */}
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left">
          <p className="text-slate-500 text-[10px] uppercase font-bold">Atau Transfer Bank Rekening Resmi:</p>
          <p className="font-bold text-slate-900 mt-0.5">{settings.bankAccountInfo}</p>
        </div>

        {/* Install / Download QRIS Button */}
        <button
          onClick={handleInstallQris}
          className={`w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 shadow-md ${
            downloadSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Gambar QRIS Berhasil Diinstal!</span>
            </>
          ) : (
            <>
              <ArrowDownToLine className="w-4 h-4 text-white" />
              <span>Instal / Simpan Gambar QRIS</span>
            </>
          )}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Tutup QRIS
        </button>

      </div>
    </div>
  );
};


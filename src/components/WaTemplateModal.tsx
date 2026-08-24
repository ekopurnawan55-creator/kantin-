import React, { useState } from 'react';
import { Kantin, IuranHarian, SchoolSettings } from '../types';
import {
  formatRupiah,
  formatDateIndonesian,
  generateWhatsAppLink,
  getTodayIsoString,
} from '../utils/formatters';
import { X, Send, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react';

interface WaTemplateModalProps {
  kantin: Kantin;
  iuranRecords: IuranHarian[];
  settings: SchoolSettings;
  customTanggal?: string;
  onClose: () => void;
}

export const WaTemplateModal: React.FC<WaTemplateModalProps> = ({
  kantin,
  iuranRecords,
  settings,
  customTanggal,
  onClose,
}) => {
  const tanggalTagihan = customTanggal || getTodayIsoString();

  // Arrears computation for this vendor
  const arrearsRecords = iuranRecords.filter(
    (r) => r.kantinId === kantin.id && r.statusBayar === 'Belum Bayar' && r.tanggal !== tanggalTagihan
  );

  const totalTunggakanLama = arrearsRecords.reduce(
    (sum, r) => sum + (kantin.nominalIuran - r.nominalDibayar),
    0
  );

  let tunggakanInfo = '';
  if (totalTunggakanLama > 0) {
    tunggakanInfo = `⚠️ Catatan Tunggakan Sebelumnya: Rp ${totalTunggakanLama.toLocaleString('id-ID')} (${arrearsRecords.length} Hari belum lunas).\nTotal Yang Harus Dibayar: Rp ${(kantin.nominalIuran + totalTunggakanLama).toLocaleString('id-ID')}`;
  } else {
    tunggakanInfo = 'Status Tunggakan Sebelumnya: Lunas (Tidak ada tunggakan).';
  }

  // Pre-fill WhatsApp Template
  const portalUrl = `${window.location.origin}${window.location.pathname}?kantinId=${kantin.id}`;
  
  let rawMessage = settings.waMessageTemplate
    .replace(/{pemilik}/g, kantin.namaPemilik)
    .replace(/{kantin}/g, kantin.namaKantin)
    .replace(/{sekolah}/g, settings.namaSekolah)
    .replace(/{tanggal}/g, formatDateIndonesian(tanggalTagihan))
    .replace(/{nominal}/g, formatRupiah(kantin.nominalIuran))
    .replace(/{status}/g, 'Belum Dibayar')
    .replace(/{tunggakan_info}/g, tunggakanInfo)
    .replace(/{bank}/g, settings.bankAccountInfo)
    .replace(/{bendahara}/g, settings.namaBendahara);

  if (!rawMessage.includes('Link Aplikasi')) {
    rawMessage += `\n\n👉 *Link Aplikasi Resmi Stand Kantin Anda* (Klik untuk download & pasang di HP, cek tagihan, bayar QRIS, & unduh bukti):\n${portalUrl}`;
  }

  const [messageText, setMessageText] = useState(rawMessage);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const waLink = generateWhatsAppLink(kantin.noWa, messageText);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };


  const handleOpenWa = () => {
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Kirim Tagihan WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Ke: <strong className="text-slate-800">{kantin.namaKantin}</strong> ({kantin.namaPemilik})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Badge */}
        <div className="my-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
          <span className="text-emerald-900 font-medium">No. WhatsApp Tujuan:</span>
          <span className="font-extrabold text-emerald-800">{kantin.noWa}</span>
        </div>

        {/* Editable Text Area */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Draf Pesan Tagihan (Dapat Diubah):
          </label>
          <textarea
            rows={10}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-emerald-500/20 font-sans leading-relaxed"
          />
        </div>

        {/* Modal Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition cursor-pointer border border-blue-200"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link Portal'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleOpenWa}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka WhatsApp & Kirim</span>
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};

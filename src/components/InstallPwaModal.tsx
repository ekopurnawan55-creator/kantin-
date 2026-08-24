import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  Monitor,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Globe,
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface InstallPwaModalProps {
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc' | 'qr'>('android');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    // Detect iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Check device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setActiveTab('ios');
    } else if (/android/.test(userAgent)) {
      setActiveTab('android');
    } else {
      setActiveTab('qr');
    }

    // Check if already standalone
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone
    ) {
      setIsInstalled(true);
    }

    // Listen for PWA prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleOpenNewTab = () => {
    window.open(currentUrl, '_blank');
  };

  const handleDownloadShortcut = () => {
    const urlContent = `[InternetShortcut]\nURL=${currentUrl}\nIconIndex=0`;
    const blob = new Blob([urlContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Sistem_Iuran_Kantin_Sekolah.url';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    currentUrl
  )}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-left animate-in fade-in zoom-in-95 duration-150 border border-slate-100 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 pr-8">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Unduh & Pasang Aplikasi</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Buka aplikasi langsung dari Layar Utama HP / Laptop tanpa mengetik URL lagi.
            </p>
          </div>
        </div>

        {/* Alert for Iframe Preview */}
        {isInIframe && (
          <div className="mt-3.5 p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Tips Instalasi:</span> Karena saat ini aplikasi sedang dibuka di dalam jendela pratinjau, klik <strong>"Buka di Tab Baru"</strong> agar tombol instalasi browser HP dapat bekerja maksimal.
            </div>
          </div>
        )}

        {/* 1-Click Native Prompt Button (If Available) */}
        {deferredPrompt && (
          <div className="mt-3.5 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Browser Mendukung 1-Klik Instal!
              </span>
            </div>
            <button
              onClick={handleNativeInstall}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>PASANG SEKARANG KE LAYAR UTAMA</span>
            </button>
          </div>
        )}

        {/* Quick Action Buttons (Open in New Tab & Copy Link) */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleOpenNewTab}
            className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl border border-blue-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Buka di Tab Baru</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Salin Link URL</span>
              </>
            )}
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="mt-4 flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'android'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'ios'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share className="w-3.5 h-3.5" />
            <span>iPhone/iPad</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'qr'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR HP</span>
          </button>

          <button
            onClick={() => setActiveTab('pc')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'pc'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Laptop</span>
          </button>
        </div>

        {/* Platform Guide Content */}
        <div className="mt-3.5 text-xs text-slate-700">
          {activeTab === 'android' && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 font-medium text-blue-900">
                Cara Pasang di HP Android (Google Chrome / Samsung Internet):
              </div>
              <ol className="space-y-2">
                <li className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    Buka link aplikasi di browser <strong>Google Chrome</strong> di HP Anda.
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Ketuk menu <strong>Titik Tiga (⋮)</strong> di sudut kanan atas browser.
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    Pilih menu <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong>. Ikon aplikasi akan langsung terpasang di HP!
                  </div>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 font-medium text-indigo-900">
                Cara Pasang di iPhone / iPad (Browser Safari):
              </div>
              <ol className="space-y-2">
                <li className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    Buka aplikasi di browser <strong>Safari</strong> pada iPhone/iPad.
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Ketuk ikon <strong>Bagikan / Share (kotak berpintu panah ke atas ⎋)</strong> di bilah menu Safari bawah.
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    Pilih <strong>"Add to Home Screen" (Tambahkan ke Layar Utama ⊞)</strong> lalu ketuk <strong>"Add" (Tambah)</strong> di sudut kanan atas.
                  </div>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="text-center space-y-2.5">
              <p className="text-slate-600">
                Arahkan kamera HP Anda ke QR Code di bawah untuk langsung membuka & menginstal di HP:
              </p>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl inline-block shadow-md">
                <img
                  src={qrImageUrl}
                  alt="QR Code Link Aplikasi"
                  className="w-40 h-40 mx-auto rounded-lg"
                  onError={(e) => {
                    // Fallback if network fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Otomatis mendeteksi Android (Chrome) dan iOS (Safari).
              </p>
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 font-medium text-slate-800">
                Cara Pasang di Laptop / Komputer (Google Chrome / Edge):
              </div>
              <ol className="space-y-2">
                <li className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-5 h-5 rounded-md bg-slate-800 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    Buka aplikasi di Chrome atau Microsoft Edge di komputer Anda.
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="w-5 h-5 rounded-md bg-slate-800 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Klik ikon <strong>Instal (⊕)</strong> di ujung kanan bilah alamat (URL bar), atau lewat menu <strong>Titik Tiga &gt; Simpan dan Bagikan &gt; Pasang Halaman ini sebagai Aplikasi</strong>.
                  </div>
                </li>
              </ol>

              <button
                onClick={handleDownloadShortcut}
                className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Shortcut Desktop (.URL)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>PWA & Service Worker Aktif</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

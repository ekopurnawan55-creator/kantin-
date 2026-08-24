import React, { useState } from 'react';
import { Kantin, StatusKantin, SchoolSettings } from '../types';
import { formatRupiah, generateWhatsAppLink } from '../utils/formatters';
import {
  Store,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  User,
  Tag,
  DollarSign,
  CheckCircle2,
  XCircle,
  X,
  Building,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Send,
  Smartphone,
} from 'lucide-react';

interface KantinMasterViewProps {
  kantinList: Kantin[];
  settings: SchoolSettings;
  onAddKantin: (kantin: Kantin) => void;
  onUpdateKantin: (kantin: Kantin) => void;
  onDeleteKantin: (kantinId: string) => void;
}

export const KantinMasterView: React.FC<KantinMasterViewProps> = ({
  kantinList,
  settings,
  onAddKantin,
  onUpdateKantin,
  onDeleteKantin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');
  const [copiedKantinId, setCopiedKantinId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKantin, setEditingKantin] = useState<Kantin | null>(null);

  // Form Fields State
  const [namaKantin, setNamaKantin] = useState('');
  const [namaPemilik, setNamaPemilik] = useState('');
  const [noWa, setNoWa] = useState('');
  const [jenisDagangan, setJenisDagangan] = useState('Makanan Berat');
  const [nominalIuran, setNominalIuran] = useState<number>(settings.defaultNominalIuran || 10000);
  const [status, setStatus] = useState<StatusKantin>('Aktif');

  const filteredKantin = kantinList.filter((k) => {
    const matchesSearch =
      k.namaKantin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.namaPemilik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.noWa.includes(searchQuery) ||
      k.jenisDagangan.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'Semua') return matchesSearch;
    return matchesSearch && k.status === statusFilter;
  });

  const openAddModal = () => {
    setEditingKantin(null);
    setNamaKantin('');
    setNamaPemilik('');
    setNoWa('');
    setJenisDagangan('Makanan Berat');
    setNominalIuran(settings.defaultNominalIuran || 10000);
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const openEditModal = (k: Kantin) => {
    setEditingKantin(k);
    setNamaKantin(k.namaKantin);
    setNamaPemilik(k.namaPemilik);
    setNoWa(k.noWa);
    setJenisDagangan(k.jenisDagangan);
    setNominalIuran(k.nominalIuran);
    setStatus(k.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKantin || !namaPemilik || !noWa) {
      alert('Mohon lengkapi seluruh field wajib (Nama Kantin, Pemilik, Nomor WA).');
      return;
    }

    if (editingKantin) {
      const updated: Kantin = {
        ...editingKantin,
        namaKantin,
        namaPemilik,
        noWa,
        jenisDagangan,
        nominalIuran,
        status,
      };
      onUpdateKantin(updated);
    } else {
      const newKantin: Kantin = {
        id: `kantin-${Date.now()}`,
        namaKantin,
        namaPemilik,
        noWa,
        jenisDagangan,
        nominalIuran,
        status,
        createdAt: new Date().toISOString(),
      };
      onAddKantin(newKantin);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (k: Kantin) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data kantin "${k.namaKantin}"?`)) {
      onDeleteKantin(k.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <span>Data Master Kantin & Lapak Sekolah</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kelola data pedagang kantin, nominal iuran harian, serta status keaktifan lapak.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kantin / Lapak Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['Semua', 'Aktif', 'Non-Aktif'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st} ({st === 'Semua' ? kantinList.length : kantinList.filter((k) => k.status === st).length})
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kantin, pemilik, dagangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

      </div>

      {/* Kantin Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKantin.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada data kantin</p>
            <p className="text-xs text-slate-500">
              Silakan klik tombol "Tambah Kantin Baru" untuk menambah pendaftaran lapak.
            </p>
          </div>
        ) : (
          filteredKantin.map((k) => (
            <div
              key={k.id}
              className={`bg-white rounded-2xl p-5 border transition hover:shadow-md relative flex flex-col justify-between ${
                k.status === 'Aktif'
                  ? 'border-slate-200'
                  : 'border-slate-200 bg-slate-50/50 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        k.status === 'Aktif' ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'
                      }`}
                    >
                      {k.namaKantin.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {k.namaKantin}
                      </h3>
                      <span className="text-[10px] text-slate-500">{k.jenisDagangan}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      k.status === 'Aktif'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {k.status}
                  </span>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Pemilik:
                    </span>
                    <span className="font-semibold text-slate-800">{k.namaPemilik}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      No. WhatsApp:
                    </span>
                    <span className="font-semibold text-slate-800">{k.noWa}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                      Nominal Iuran:
                    </span>
                    <span className="font-extrabold text-blue-700">
                      {formatRupiah(k.nominalIuran)} / Hari
                    </span>
                  </div>
                </div>

                {/* Direct Link Khusus Portal Lapak */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-emerald-600" />
                      <span>Link Aplikasi Stand Kantin:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">?kantinId={k.id}</span>
                  </div>

                  {/* Share to WhatsApp & Copy & Open */}
                  {(() => {
                    const portalUrl = `${window.location.origin}${window.location.pathname}?kantinId=${k.id}`;
                    const waMsg = `Halo Bp/Ibu *${k.namaPemilik}* (Stand *${k.namaKantin}*),\n\nBerikut adalah *Link Aplikasi Resmi Stand Kantin Anda* di ${settings.namaSekolah || 'Kantin Sekolah'}:\n👉 ${portalUrl}\n\nSilakan klik link di atas dan pilih *Download / Pasang Aplikasi ke Layar Utama HP* agar aplikasi tersimpan di HP untuk cek tagihan harian, bayar QRIS, & unduh bukti pembayaran.\n\nTerima kasih.\n- ${settings.namaBendahara || 'Bendahara Kantin'}`;
                    const waLink = generateWhatsAppLink(k.noWa, waMsg);

                    return (
                      <div className="space-y-1.5">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim Link Aplikasi ke WA Pemilik</span>
                        </a>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(portalUrl);
                              setCopiedKantinId(k.id);
                              setTimeout(() => setCopiedKantinId(null), 2000);
                            }}
                            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                          >
                            {copiedKantinId === k.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Link Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>Salin Link App</span>
                              </>
                            )}
                          </button>

                          <a
                            href={portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Portal</span>
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(k)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(k)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Hapus Kantin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Add / Edit Kantin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingKantin ? 'Edit Data Kantin' : 'Pendaftaran Kantin Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kantin / Lapak *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kantin 01 - Soto Pak Joko"
                  value={namaKantin}
                  onChange={(e) => setNamaKantin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pemilik / Pedagang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Joko Widodo"
                  value={namaPemilik}
                  onChange={(e) => setNamaPemilik(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp / Telepon *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Dagangan
                  </label>
                  <select
                    value={jenisDagangan}
                    onChange={(e) => setJenisDagangan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Makanan Berat">Makanan Berat</option>
                    <option value="Minuman & Es">Minuman & Es</option>
                    <option value="Camilan & Snack">Camilan & Snack</option>
                    <option value="Roti & Kue">Roti & Kue</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Iuran / Hari (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={nominalIuran}
                    onChange={(e) => setNominalIuran(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Operasional
                </label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="Aktif"
                      checked={status === 'Aktif'}
                      onChange={() => setStatus('Aktif')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Aktif (Operasional)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="Non-Aktif"
                      checked={status === 'Non-Aktif'}
                      onChange={() => setStatus('Non-Aktif')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Non-Aktif</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Simpan Data Kantin
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

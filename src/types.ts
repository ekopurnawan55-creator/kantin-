export type StatusKantin = 'Aktif' | 'Non-Aktif';

export type StatusPembayaran = 'Lunas' | 'Belum Bayar' | 'Libur / Tutup';

export type MetodePembayaran = 'Tunai' | 'Transfer' | 'QRIS' | '-';

export interface Kantin {
  id: string;
  namaKantin: string;
  namaPemilik: string;
  noWa: string;
  jenisDagangan: string;
  nominalIuran: number;
  status: StatusKantin;
  createdAt: string;
}

export interface IuranHarian {
  id: string;
  kantinId: string;
  tanggal: string; // ISO date 'YYYY-MM-DD'
  nominalDibayar: number;
  statusBayar: StatusPembayaran;
  metodePembayaran: MetodePembayaran;
  catatan?: string;
  createdAt: string;
}

export interface DailySummary {
  tanggal: string;
  totalTarget: number;
  totalTerkumpul: number;
  sisaTunggakan: number;
  jumlahKantinAktif: number;
  jumlahBayar: number;
  jumlahBelumBayar: number;
  jumlahLibur: number;
  persentaseLunas: number;
}

export interface MonthlyKantinSummary {
  kantinId: string;
  namaKantin: string;
  namaPemilik: string;
  noWa: string;
  jenisDagangan: string;
  nominalIuranPerHari: number;
  totalHariBuka: number;
  totalHariBayar: number;
  totalHariTunggakan: number;
  totalHariLibur: number;
  totalNominalHarusDibayar: number;
  totalIuranDibayar: number;
  totalTunggakan: number;
}

export interface SchoolSettings {
  namaSekolah: string;
  namaKantin: string;
  namaBendahara: string;
  nipBendahara: string;
  noWaBendahara: string;
  defaultNominalIuran: number;
  anggaranBulanan?: number; // Target anggaran pengeluaran bulanan
  waMessageTemplate: string;
  bankAccountInfo: string;
  qrisImageUrl: string;
  screenOrientation?: 'auto' | 'portrait' | 'landscape';
}

export type KategoriPengeluaran =
  | 'Kebersihan & Sanitasi'
  | 'Listrik & Air'
  | 'Perbaikan Sarpras'
  | 'Operasional & ATK'
  | 'Keamanan & Ketertiban'
  | 'Konsumsi & Rapat'
  | 'Lain-lain';

export interface Pengeluaran {
  id: string;
  tanggal: string; // ISO date 'YYYY-MM-DD'
  kategori: string;
  keterangan: string;
  nominal: number;
  penerima: string;
  metodePembayaran: 'Tunai' | 'Transfer';
  nomorBukti?: string;
  catatan?: string;
  createdAt: string;
}

export type KategoriPemasukanLain =
  | 'Subsidi Sekolah / Dana BOS'
  | 'Modal Awal Kas'
  | 'Donasi / Hibah'
  | 'Sponsorship / Kerjasama'
  | 'Penjualan Barang Bekas / Kardus'
  | 'Bunga Bank / Jasa Giro'
  | 'Sewa Lahan / Acara Khusus'
  | 'Pemasukan Lain-lain';

export interface PemasukanLain {
  id: string;
  tanggal: string; // ISO date 'YYYY-MM-DD'
  kategori: string;
  keterangan: string;
  nominal: number;
  sumberPemberi: string;
  metodePembayaran: 'Tunai' | 'Transfer';
  nomorBukti?: string;
  catatan?: string;
  createdAt: string;
}

export type UserRole = 'bendahara' | 'kantin';

export interface UserAccount {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  kantinId?: string; // Set if role === 'kantin'
  password?: string;
  createdAt: string;
  namaSekolah?: string;
  namaKantin?: string;
  noWa?: string;
  bankAccountInfo?: string;
  defaultNominalIuran?: number;
  anggaranBulanan?: number;
}

export type ActiveTab =
  | 'dashboard'
  | 'input'
  | 'pemasukan-lain'
  | 'pengeluaran'
  | 'kantin'
  | 'reports'
  | 'daily'
  | 'monthly'
  | 'settings';

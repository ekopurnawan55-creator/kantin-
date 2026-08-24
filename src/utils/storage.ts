import { Kantin, IuranHarian, SchoolSettings, Pengeluaran, PemasukanLain, UserAccount } from '../types';
import { getTodayIsoString } from './formatters';

const STORAGE_KEYS = {
  KANTIN: 'kantin_sekolah_master_v1',
  IURAN: 'kantin_sekolah_iuran_v1',
  PENGELUARAN: 'kantin_sekolah_pengeluaran_v1',
  PEMASUKAN_LAIN: 'kantin_sekolah_pemasukan_lain_v1',
  SETTINGS: 'kantin_sekolah_settings_v1',
  AUTH_ACCOUNTS: 'kantin_auth_accounts_v1',
  AUTH_SESSION: 'kantin_auth_session_v1',
};

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-eko',
    email: 'ekopurnawan55@gmail.com',
    nama: 'Eko Purnawan (Bendahara Utama)',
    role: 'bendahara',
    password: 'password123',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const INITIAL_SETTINGS: SchoolSettings = {
  namaSekolah: '',
  namaKantin: 'Selamat Datang di Pengelola Kantin Terpadu',
  namaBendahara: 'Ibu Siti Rahmawati, S.Pd.',
  nipBendahara: 'NIP. 19850412 201001 2 021',
  noWaBendahara: '081234567800',
  defaultNominalIuran: 10000,
  anggaranBulanan: 1500000,
  waMessageTemplate: `Yth. Bapak/Ibu {pemilik} ({kantin}),

Pemberitahuan dari Bendahara {kantin}.
Berikut rincian tagihan iuran harian kantin:

🗓 Tanggal: {tanggal}
💵 Nominal Hari Ini: {nominal}
⚠️ Status: {status}
{tunggakan_info}

Mohon dapat melakukan pembayaran secara Tunai / Transfer ke:
🏦 {bank}
atau via QRIS Kantin.

Setelah transfer, mohon konfirmasi kirim bukti resi ke WA ini.
Terima kasih atas kerja samanya.

Salam hormat,
{bendahara}
Bendahara Pengelola Kantin`,
  bankAccountInfo: 'Bank Mandiri 132-00-889977-1 a.n Bendahara Kantin',
  qrisImageUrl: '',
  screenOrientation: 'auto',
};

export const INITIAL_KANTIN: Kantin[] = [
  {
    id: 'kantin-1',
    namaKantin: 'Kantin 01 - Soto & Bakso Pak Joko',
    namaPemilik: 'Joko Widodo',
    noWa: '081234567890',
    jenisDagangan: 'Makanan Berat',
    nominalIuran: 10000,
    status: 'Aktif',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'kantin-2',
    namaKantin: 'Kantin 02 - Anugerah Es & Juice Bu Tejo',
    namaPemilik: 'Rahayu Tejo',
    noWa: '081987654321',
    jenisDagangan: 'Minuman & Es',
    nominalIuran: 10000,
    status: 'Aktif',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'kantin-3',
    namaKantin: 'Kantin 03 - Batagor & Gorengan Kang Asep',
    namaPemilik: 'Asep Saepulloh',
    noWa: '085711223344',
    jenisDagangan: 'Camilan & Snack',
    nominalIuran: 10000,
    status: 'Aktif',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'kantin-4',
    namaKantin: 'Kantin 04 - Nasi Goreng & Mie Mbak Sri',
    namaPemilik: 'Sri Wahyuni',
    noWa: '082133445566',
    jenisDagangan: 'Makanan Berat',
    nominalIuran: 15000,
    status: 'Aktif',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'kantin-5',
    namaKantin: 'Kantin 05 - Dimsum & Siomay Bang Budi',
    namaPemilik: 'Budi Santoso',
    noWa: '087899887766',
    jenisDagangan: 'Camilan & Snack',
    nominalIuran: 12000,
    status: 'Aktif',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'kantin-6',
    namaKantin: 'Kantin 06 - Roti Bakar & Waffle Bu Ratna',
    namaPemilik: 'Ratna Sari',
    noWa: '081344556677',
    jenisDagangan: 'Roti & Kue',
    nominalIuran: 10000,
    status: 'Non-Aktif',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
];

// Helper to seed realistic records for past 10 days up to today
export function generateSeedIuran(): IuranHarian[] {
  const records: IuranHarian[] = [];
  const today = new Date();
  
  // Seed past 12 days
  for (let i = 12; i >= 0; i--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - i);
    const dateStr = dateObj.toISOString().split('T')[0];
    const isSunday = dateObj.getDay() === 0;

    INITIAL_KANTIN.forEach((k) => {
      if (k.status !== 'Aktif') return;

      let statusBayar: 'Lunas' | 'Belum Bayar' | 'Libur / Tutup' = 'Lunas';
      let nominalDibayar = k.nominalIuran;
      let metode: 'Tunai' | 'Transfer' | 'QRIS' | '-' = 'Tunai';

      if (isSunday) {
        statusBayar = 'Libur / Tutup';
        nominalDibayar = 0;
        metode = '-';
      } else if (i === 0) {
        // Today's mixed status
        if (k.id === 'kantin-1') {
          statusBayar = 'Lunas';
          metode = 'QRIS';
        } else if (k.id === 'kantin-2') {
          statusBayar = 'Lunas';
          metode = 'Tunai';
        } else if (k.id === 'kantin-3') {
          statusBayar = 'Belum Bayar';
          nominalDibayar = 0;
          metode = '-';
        } else if (k.id === 'kantin-4') {
          statusBayar = 'Lunas';
          metode = 'Transfer';
        } else if (k.id === 'kantin-5') {
          statusBayar = 'Belum Bayar';
          nominalDibayar = 0;
          metode = '-';
        }
      } else if (i === 1 && (k.id === 'kantin-3' || k.id === 'kantin-5')) {
        // Yesterday unpaid for kantin-3 and kantin-5 to simulate arrears
        statusBayar = 'Belum Bayar';
        nominalDibayar = 0;
        metode = '-';
      } else {
        // Mostly paid with variety of payment methods
        const rnd = Math.random();
        if (rnd > 0.85) {
          metode = 'QRIS';
        } else if (rnd > 0.6) {
          metode = 'Transfer';
        } else {
          metode = 'Tunai';
        }
      }

      records.push({
        id: `iuran-${dateStr}-${k.id}`,
        kantinId: k.id,
        tanggal: dateStr,
        nominalDibayar: nominalDibayar,
        statusBayar: statusBayar,
        metodePembayaran: metode,
        catatan: isSunday ? 'Hari Minggu sekolah libur' : '',
        createdAt: new Date().toISOString(),
      });
    });
  }

  return records;
}

// Storage Accessors
export function loadSettings(): SchoolSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      let modified = false;
      if (
        !parsed.namaKantin ||
        parsed.namaKantin === 'Kantin Terpadu & Kejujuran SMAN 1' ||
        parsed.namaKantin === 'Kantin Terpadu'
      ) {
        parsed.namaKantin = 'Selamat Datang di Pengelola Kantin Terpadu';
        modified = true;
      }
      if (
        parsed.namaSekolah &&
        (parsed.namaSekolah.includes('SMA NEGERI 1') ||
          parsed.namaSekolah.includes('SMA Negeri 1') ||
          parsed.namaSekolah.includes('SMAN 1'))
      ) {
        parsed.namaSekolah = '';
        modified = true;
      }
      if (parsed.bankAccountInfo && parsed.bankAccountInfo.includes('SMAN 1')) {
        parsed.bankAccountInfo = parsed.bankAccountInfo.replace(' SMAN 1', '');
        modified = true;
      }
      if (!parsed.anggaranBulanan || parsed.anggaranBulanan <= 0) {
        parsed.anggaranBulanan = 1500000;
        modified = true;
      }
      if (modified) {
        saveSettings(parsed);
      }
      return parsed;
    }
    return INITIAL_SETTINGS;
  } catch (e) {
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: SchoolSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadKantinMaster(): Kantin[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KANTIN);
    return data ? JSON.parse(data) : INITIAL_KANTIN;
  } catch (e) {
    return INITIAL_KANTIN;
  }
}

export function saveKantinMaster(kantinList: Kantin[]): void {
  localStorage.setItem(STORAGE_KEYS.KANTIN, JSON.stringify(kantinList));
}

export function loadIuranRecords(): IuranHarian[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.IURAN);
    if (data) {
      return JSON.parse(data);
    }
    const seed = generateSeedIuran();
    saveIuranRecords(seed);
    return seed;
  } catch (e) {
    const seed = generateSeedIuran();
    return seed;
  }
}

export function saveIuranRecords(records: IuranHarian[]): void {
  localStorage.setItem(STORAGE_KEYS.IURAN, JSON.stringify(records));
}

export function generateSeedPengeluaran(): Pengeluaran[] {
  const today = new Date();
  const getOffsetDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'exp-1',
      tanggal: getOffsetDate(0), // Hari ini
      kategori: 'Kebersihan & Sanitasi',
      keterangan: 'Beli sabun cuci tangan, karbol lantai, dan kantong sampah jumbo 10 pack',
      nominal: 85000,
      penerima: 'Toko Surya Plastik & Sabun',
      metodePembayaran: 'Tunai',
      nomorBukti: 'NOTA-0813-01',
      catatan: 'Untuk kebutuhan suplai kebersihan kantin terpadu',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      tanggal: getOffsetDate(2),
      kategori: 'Perbaikan Sarpras',
      keterangan: 'Penggantian 2 unit kran wastafel cuci piring stan kantin yang bocor',
      nominal: 120000,
      penerima: 'Toko Bangunan Sumber Makmur',
      metodePembayaran: 'Tunai',
      nomorBukti: 'KW-0811-04',
      catatan: 'Dipasang langsung oleh petugas sarpras sekolah',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-3',
      tanggal: getOffsetDate(5),
      kategori: 'Operasional & ATK',
      keterangan: 'Buku kas bendahara, kertas nota penagihan, map arsip & pulpen',
      nominal: 45000,
      penerima: 'Fotocopy & ATK Gemilang',
      metodePembayaran: 'Tunai',
      nomorBukti: 'NOTA-0808-12',
      catatan: 'Pengadaan ATK bulanan bendahara',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-4',
      tanggal: getOffsetDate(7),
      kategori: 'Kebersihan & Sanitasi',
      keterangan: 'Iuran retribusi angkutan sampah kantin mingguan',
      nominal: 50000,
      penerima: 'Petugas Pengangkut Sampah Lingkungan',
      metodePembayaran: 'Tunai',
      nomorBukti: 'RET-0806-01',
      catatan: 'Retribusi rutin mingguan',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-5',
      tanggal: getOffsetDate(10),
      kategori: 'Listrik & Air',
      keterangan: 'Beli 3 bohlam lampu LED Philips 14W untuk area lorong kantin',
      nominal: 105000,
      penerima: 'Toko Listrik Terang Abadi',
      metodePembayaran: 'Transfer',
      nomorBukti: 'TRF-0803-88',
      catatan: 'Penggantian lampu penerangan lorong kantin yang putus',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function loadPengeluaran(): Pengeluaran[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PENGELUARAN);
    if (data) {
      return JSON.parse(data);
    }
    const seed = generateSeedPengeluaran();
    savePengeluaran(seed);
    return seed;
  } catch (e) {
    const seed = generateSeedPengeluaran();
    return seed;
  }
}

export function savePengeluaran(list: Pengeluaran[]): void {
  localStorage.setItem(STORAGE_KEYS.PENGELUARAN, JSON.stringify(list));
}

// Seed Pemasukan Lain (External funds / outside canteen dues)
export function generateSeedPemasukanLain(): PemasukanLain[] {
  const getOffsetDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'in-ext-1',
      tanggal: getOffsetDate(12),
      kategori: 'Modal Awal Kas',
      keterangan: 'Penyertaan modal awal kas operasional dari pengelola kantin',
      nominal: 1000000,
      sumberPemberi: 'Kas Awal Pengelola Kantin',
      metodePembayaran: 'Transfer',
      nomorBukti: 'KM-0801-01',
      catatan: 'Saldo kas awal periode baru',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'in-ext-2',
      tanggal: getOffsetDate(8),
      kategori: 'Subsidi Sekolah / Dana BOS',
      keterangan: 'Bantuan subsidi peremajaan fasilitas sanitasi wastafel kantin',
      nominal: 500000,
      sumberPemberi: 'Pihak Sekolah (Komite/BOS)',
      metodePembayaran: 'Transfer',
      nomorBukti: 'BOS-0805-19',
      catatan: 'Subsidi khusus sanitasi area cuci tangan',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'in-ext-3',
      tanggal: getOffsetDate(4),
      kategori: 'Penjualan Barang Bekas / Kardus',
      keterangan: 'Hasil penjualan kardus bekas packing & botol plastik kemasan kantin',
      nominal: 75000,
      sumberPemberi: 'Pengepul Barang Bekas Berkah',
      metodePembayaran: 'Tunai',
      nomorBukti: 'NOTA-RONGSOK-08',
      catatan: 'Penjualan rongsok rutin mingguan kantin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'in-ext-4',
      tanggal: getOffsetDate(2),
      kategori: 'Sponsorship / Kerjasama',
      keterangan: 'Dana sponsorship branding banner & taplak meja dari distributor minuman',
      nominal: 350000,
      sumberPemberi: 'PT Mitra Sejahtera Beverage',
      metodePembayaran: 'Transfer',
      nomorBukti: 'SPON-0815-02',
      catatan: 'Kerjasama branding 3 bulan',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function loadPemasukanLain(): PemasukanLain[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PEMASUKAN_LAIN);
    if (data) {
      return JSON.parse(data);
    }
    const seed = generateSeedPemasukanLain();
    savePemasukanLain(seed);
    return seed;
  } catch (e) {
    const seed = generateSeedPemasukanLain();
    return seed;
  }
}

export function savePemasukanLain(list: PemasukanLain[]): void {
  localStorage.setItem(STORAGE_KEYS.PEMASUKAN_LAIN, JSON.stringify(list));
}

// Authentication Storage
export function loadUserAccounts(): UserAccount[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_ACCOUNTS);
    if (data) {
      return JSON.parse(data);
    }
    localStorage.setItem(STORAGE_KEYS.AUTH_ACCOUNTS, JSON.stringify(INITIAL_USER_ACCOUNTS));
    return INITIAL_USER_ACCOUNTS;
  } catch (e) {
    return INITIAL_USER_ACCOUNTS;
  }
}

export function saveUserAccount(user: UserAccount): UserAccount[] {
  const accounts = loadUserAccounts();
  const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === user.email.toLowerCase());
  let updated: UserAccount[];
  if (existingIdx >= 0) {
    updated = [...accounts];
    updated[existingIdx] = user;
  } else {
    updated = [user, ...accounts];
  }
  localStorage.setItem(STORAGE_KEYS.AUTH_ACCOUNTS, JSON.stringify(updated));
  return updated;
}

export function loadCurrentSession(): UserAccount | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function saveCurrentSession(user: UserAccount): void {
  localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
}

export function clearCurrentSession(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
}

// Database Reset & Synchronization Helpers
export function resetToCleanData(): {
  kantin: Kantin[];
  iuran: IuranHarian[];
  pengeluaran: Pengeluaran[];
  pemasukanLain: PemasukanLain[];
} {
  saveKantinMaster([]);
  saveIuranRecords([]);
  savePengeluaran([]);
  savePemasukanLain([]);
  return { kantin: [], iuran: [], pengeluaran: [], pemasukanLain: [] };
}

export function syncRegistrationDataToSettings(regData: {
  nama: string;
  namaSekolah?: string;
  namaKantin?: string;
  noWa?: string;
  bankAccountInfo?: string;
  defaultNominalIuran?: number;
  anggaranBulanan?: number;
}): SchoolSettings {
  const currentSettings = loadSettings();
  const updated: SchoolSettings = {
    ...currentSettings,
    namaBendahara: regData.nama.trim() || currentSettings.namaBendahara,
    namaSekolah: regData.namaSekolah !== undefined ? regData.namaSekolah.trim() : currentSettings.namaSekolah,
    namaKantin: regData.namaKantin?.trim() || currentSettings.namaKantin || 'Pengelola Kantin Terpadu',
    noWaBendahara: regData.noWa?.trim() || currentSettings.noWaBendahara,
    bankAccountInfo: regData.bankAccountInfo?.trim() || (regData.nama.trim() ? `Bank Transfer a.n ${regData.nama.trim()}` : currentSettings.bankAccountInfo),
    defaultNominalIuran: regData.defaultNominalIuran && regData.defaultNominalIuran > 0 ? regData.defaultNominalIuran : currentSettings.defaultNominalIuran,
    anggaranBulanan: regData.anggaranBulanan && regData.anggaranBulanan > 0 ? regData.anggaranBulanan : currentSettings.anggaranBulanan,
  };
  saveSettings(updated);
  return updated;
}

export function exportAppDataJson(): string {
  const settings = loadSettings();
  const kantin = loadKantinMaster();
  const iuran = loadIuranRecords();
  const pengeluaran = loadPengeluaran();
  const pemasukanLain = loadPemasukanLain();
  const accounts = loadUserAccounts();

  const backupObj = {
    appName: 'Aplikasi Pengelola Iuran Kantin Sekolah',
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings,
    kantin,
    iuran,
    pengeluaran,
    pemasukanLain,
    accounts,
  };

  return JSON.stringify(backupObj, null, 2);
}

export function importAppDataJson(jsonContent: string): {
  settings: SchoolSettings;
  kantin: Kantin[];
  iuran: IuranHarian[];
  pengeluaran: Pengeluaran[];
  pemasukanLain: PemasukanLain[];
} {
  const parsed = JSON.parse(jsonContent);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format file cadangan JSON tidak valid.');
  }

  if (parsed.settings && typeof parsed.settings === 'object') {
    saveSettings(parsed.settings);
  }

  if (Array.isArray(parsed.kantin)) {
    saveKantinMaster(parsed.kantin);
  }

  if (Array.isArray(parsed.iuran)) {
    saveIuranRecords(parsed.iuran);
  }

  if (Array.isArray(parsed.pengeluaran)) {
    savePengeluaran(parsed.pengeluaran);
  }

  if (Array.isArray(parsed.pemasukanLain)) {
    savePemasukanLain(parsed.pemasukanLain);
  }

  if (Array.isArray(parsed.accounts)) {
    localStorage.setItem(STORAGE_KEYS.AUTH_ACCOUNTS, JSON.stringify(parsed.accounts));
  }

  return {
    settings: loadSettings(),
    kantin: loadKantinMaster(),
    iuran: loadIuranRecords(),
    pengeluaran: loadPengeluaran(),
    pemasukanLain: loadPemasukanLain(),
  };
}


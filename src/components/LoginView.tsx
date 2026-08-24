import React, { useState } from 'react';
import { SchoolSettings, UserAccount, Kantin, IuranHarian, Pengeluaran } from '../types';
import {
  loadUserAccounts,
  saveUserAccount,
  saveCurrentSession,
  syncRegistrationDataToSettings,
  resetToCleanData,
} from '../utils/storage';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Store,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  ArrowLeft,
  Phone,
  CreditCard,
  Target,
  Sparkles,
} from 'lucide-react';

interface LoginViewProps {
  settings: SchoolSettings;
  kantinList: Kantin[];
  onLoginSuccess: (
    user: UserAccount,
    newSettings?: SchoolSettings,
    newKantinList?: Kantin[],
    newIuranRecords?: IuranHarian[],
    newPengeluaranList?: Pengeluaran[]
  ) => void;
  onBack?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  settings,
  kantinList,
  onLoginSuccess,
  onBack,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nama, setNama] = useState('');
  const [namaSekolah, setNamaSekolah] = useState('');
  const [namaKantin, setNamaKantin] = useState('Pengelola Kantin Terpadu');
  const [noWa, setNoWa] = useState('');
  const [bankAccountInfo, setBankAccountInfo] = useState('');
  const [defaultNominalIuran, setDefaultNominalIuran] = useState<number>(10000);
  const [anggaranBulanan, setAnggaranBulanan] = useState<number>(1500000);
  const [rememberMe, setRememberMe] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBackAction = () => {
    if (isRegister) {
      setIsRegister(false);
      setErrorMsg('');
      setSuccessMsg('');
      return;
    }
    setErrorMsg('Akses terkunci: Anda wajib login terlebih dahulu untuk mengakses sistem.');
    setTimeout(() => {
      setErrorMsg('');
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Alamat email wajib diisi.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Format email tidak valid (contoh: nama@email.com).');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const accounts = loadUserAccounts();

      if (isRegister) {
        // Handle Registration (Khusus Pembeli / Bendahara Baru)
        const existing = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (existing) {
          setErrorMsg('Email ini sudah terdaftar. Silakan gunakan menu Masuk Akun.');
          setIsLoading(false);
          return;
        }

        if (!nama.trim()) {
          setErrorMsg('Nama lengkap bendahara / pengelola wajib diisi.');
          setIsLoading(false);
          return;
        }

        const newUser: UserAccount = {
          id: `user-${Date.now()}`,
          email: email.trim().toLowerCase(),
          nama: nama.trim(),
          role: 'bendahara',
          password: password,
          createdAt: new Date().toISOString(),
          namaSekolah: namaSekolah.trim(),
          namaKantin: namaKantin.trim(),
          noWa: noWa.trim(),
          bankAccountInfo: bankAccountInfo.trim(),
          defaultNominalIuran: defaultNominalIuran || 10000,
          anggaranBulanan: anggaranBulanan || 1500000,
        };

        saveUserAccount(newUser);
        saveCurrentSession(newUser);

        // Synchronize registered data into SchoolSettings
        const syncedSettings = syncRegistrationDataToSettings({
          nama: nama.trim(),
          namaSekolah: namaSekolah.trim(),
          namaKantin: namaKantin.trim() || 'Pengelola Kantin Terpadu',
          noWa: noWa.trim(),
          bankAccountInfo: bankAccountInfo.trim() || `Bank Transfer a.n ${nama.trim()}`,
          defaultNominalIuran: defaultNominalIuran || 10000,
          anggaranBulanan: anggaranBulanan || 1500000,
        });

        // Initialize Database into clean state for new registered user
        const clean = resetToCleanData();
        const newKantin: Kantin[] = clean.kantin;
        const newIuran: IuranHarian[] = clean.iuran;
        const newPengeluaran: Pengeluaran[] = clean.pengeluaran;

        setIsLoading(false);
        setSuccessMsg('Pendaftaran & Singkronisasi Data Berhasil! Mengalihkan ke aplikasi...');
        setTimeout(() => {
          onLoginSuccess(newUser, syncedSettings, newKantin, newIuran, newPengeluaran);
        }, 500);
      } else {
        // Handle Login
        const target = accounts.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase()
        );

        if (!target) {
          setErrorMsg('Email belum terdaftar. Silakan periksa kembali atau buat akun baru.');
          setIsLoading(false);
          return;
        }

        if (target.password && target.password !== password) {
          setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
          setIsLoading(false);
          return;
        }

        saveCurrentSession(target);

        // If target account has profile info, sync it to settings
        let syncedSettings: SchoolSettings | undefined;
        if (target.role === 'bendahara' && (target.namaSekolah || target.noWa || target.bankAccountInfo)) {
          syncedSettings = syncRegistrationDataToSettings({
            nama: target.nama,
            namaSekolah: target.namaSekolah,
            namaKantin: target.namaKantin,
            noWa: target.noWa,
            bankAccountInfo: target.bankAccountInfo,
            defaultNominalIuran: target.defaultNominalIuran,
            anggaranBulanan: target.anggaranBulanan,
          });
        }

        setIsLoading(false);
        setSuccessMsg('Login berhasil! Selamat datang.');
        setTimeout(() => {
          onLoginSuccess(target, syncedSettings);
        }, 500);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Back Action Button */}
      <div className={`w-full ${isRegister ? 'max-w-xl' : 'max-w-md'} mb-3 flex items-center justify-between relative z-10 transition-all`}>
        <button
          type="button"
          onClick={handleBackAction}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-sm transition cursor-pointer active:scale-95"
          title="Kembali ke tampilan sebelumnya"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-300" />
          <span>Kembali</span>
        </button>
        <span className="text-[11px] text-slate-400 font-medium">
          {isRegister ? 'Pendaftaran & Singkronisasi Data' : 'Login Pengelola'}
        </span>
      </div>

      {/* Main Container Card */}
      <div className={`w-full ${isRegister ? 'max-w-xl' : 'max-w-md'} bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 transition-all`}>
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-6 sm:py-8 text-white text-center relative">
          <div className="mx-auto w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center mb-3 shadow-inner">
            <Store className="w-7 h-7 text-emerald-300" />
          </div>
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-snug">
            Selamat Datang di Pengelola Kantin Terpadu
          </h1>
          {settings.namaSekolah ? (
            <p className="text-xs sm:text-sm text-blue-200 mt-1 font-medium">
              {settings.namaSekolah}
            </p>
          ) : null}

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-[11px] font-bold border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistem Kas & Penagihan Iuran Digital</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-7">
          
          {/* Tab Switcher: Login vs Register */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isRegister
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span>Masuk Akun</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isRegister
                  ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daftar Akun Baru (Singkronkan)</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="font-semibold">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Registration Specific Form Fields */}
            {isRegister && (
              <>
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Pendaftaran Pembeli & Singkronisasi Aplikasi</span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-snug">
                    Data pendaftaran ini akan otomatis disinkronkan ke profil bendahara, kop kuitansi/laporan, dan pesan penagihan WhatsApp.
                  </p>
                </div>

                {/* Section 1: Profil Pengelola */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    1. Identitas Pengelola & Lembaga
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Bendahara / Petugas <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Eko Purnawan, S.Pd."
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Sekolah / Instansi (Opsional)
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="misal: SMA Harapan Bangsa"
                          value={namaSekolah}
                          onChange={(e) => setNamaSekolah(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        No. WhatsApp Bendahara
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          placeholder="081234567890"
                          value={noWa}
                          onChange={(e) => setNoWa(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Info Rekening Bank / Pembayaran
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Contoh: BCA 123-456-7890 a.n Bendahara"
                        value={bankAccountInfo}
                        onChange={(e) => setBankAccountInfo(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Keuangan & Pagu Anggaran */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    2. Konfigurasi Iuran & Anggaran
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Default Iuran Harian (Rp)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={defaultNominalIuran || ''}
                        onChange={(e) => setDefaultNominalIuran(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="10000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Target Anggaran Bulanan (Rp)
                      </label>
                      <input
                        type="number"
                        min="100000"
                        step="50000"
                        value={anggaranBulanan || ''}
                        onChange={(e) => setAnggaranBulanan(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="1500000"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email Login <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isRegister && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Ingat Saya</span>
                </label>
                <span className="text-blue-600 hover:underline font-semibold cursor-pointer text-[11px]">
                  Lupa Sandi?
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akun & Singkronkan Aplikasi</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Aplikasi</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch / Back Button */}
          <div className="mt-5 pt-3 flex items-center justify-center">
            {isRegister ? (
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold transition cursor-pointer py-1 px-3 rounded-lg hover:bg-blue-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Form Masuk Akun</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-semibold transition cursor-pointer py-1 px-3 rounded-lg hover:bg-slate-50"
              >
                <span>Belum punya akun bendahara?</span>
                <span className="text-blue-600 font-bold underline">Daftar di sini</span>
              </button>
            )}
          </div>

        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 py-3 px-6 text-center text-[10px] text-slate-500">
          Sistem Penagihan Iuran Kantin Sekolah • Data Tersinkronisasi Otomatis
        </div>

      </div>
    </div>
  );
};


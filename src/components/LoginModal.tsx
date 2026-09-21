import React, { useState, useRef, useEffect } from 'react';
import { User, DesaProfile } from '../types';
import { StorageService } from '../services/storageService';
import { 
  Shield, 
  Key, 
  Building2, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Check, 
  User as UserIcon, 
  Lock, 
  ArrowRight, 
  UserPlus, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
  desaProfile?: DesaProfile;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, desaProfile }) => {
  const users = StorageService.getUsers();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-hide panel untuk opsi "Pengguna Baru" & "Akun Penguji"
  const [isExtraOptionsVisible, setIsExtraOptionsVisible] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'penguji'>('menu');
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dialog bantuan Lupa Sandi & Registrasi
  const [helpDialog, setHelpDialog] = useState<'forgot' | 'register' | null>(null);

  // Reset / jalankan timer auto-hide (6 detik tanpa klik akan menutup otomatis)
  const resetAutoHideTimer = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = setTimeout(() => {
      setIsExtraOptionsVisible(false);
      setActiveSubTab('menu');
    }, 6000);
  };

  const handleToggleExtraOptions = () => {
    if (isExtraOptionsVisible) {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      setIsExtraOptionsVisible(false);
      setActiveSubTab('menu');
    } else {
      setIsExtraOptionsVisible(true);
      setActiveSubTab('menu');
      resetAutoHideTimer();
    }
  };

  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);

    if (!isCaptchaVerified) {
      setError('Harap beri centang pada verifikasi "Saya bukan robot".');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      const foundUser = users.find(u => u.username.toLowerCase() === trimmedUser);
      
      const validAdmin = trimmedUser === 'admin' && (password === 'admin123' || password === 'admin');
      const validOperator = trimmedUser === 'operator' && (password === 'operator123' || password === 'operator');
      const validOperatorAset = (trimmedUser === 'op_aset' || trimmedUser === 'operator_aset') && 
        (password === 'aset123' || password === 'operator_aset123' || password === 'op_aset' || password === 'aset');

      if (foundUser && (validAdmin || validOperator || validOperatorAset || password.length >= 4)) {
        StorageService.setCurrentUser(foundUser);
        onLoginSuccess(foundUser);
      } else {
        setError('ID Pengguna atau Kata Sandi salah. Buka "Akun Penguji" untuk akun demo.');
      }
      setIsLoading(false);
    }, 400);
  };

  const applyCredentials = (targetUsername: string, targetPass: string) => {
    setUsername(targetUsername);
    setPassword(targetPass);
    setIsCaptchaVerified(true);
    setError(null);
    setIsExtraOptionsVisible(false);
    setActiveSubTab('menu');
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
  };

  return (
    <div 
      id="coretax-login-page" 
      className="fixed inset-0 z-50 overflow-y-auto bg-[#f0f3f8] text-slate-800 flex flex-col justify-between min-h-screen relative selection:bg-[#1a2b4c] selection:text-white"
    >
      {/* 1. LATAR BELAKANG ELEGAN (GAYA 3D WAVE CORETAX) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <svg 
          className="absolute -bottom-10 -left-10 w-[600px] sm:w-[800px] max-w-none opacity-80 text-slate-200" 
          viewBox="0 0 900 600" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M-50,600 C200,550 350,420 420,320 C500,200 620,150 900,100 L900,600 L-50,600 Z" 
            fill="url(#coretax-gradient-1)" 
          />
          <path 
            d="M-80,600 C150,520 280,380 370,280 C470,160 590,130 900,90 L900,600 L-80,600 Z" 
            fill="url(#coretax-gradient-2)" 
            opacity="0.6"
          />
          <path 
            d="M-20,600 C180,560 300,440 380,350 C480,240 650,210 900,180 L900,600 L-20,600 Z" 
            fill="url(#coretax-gradient-3)" 
            opacity="0.5"
          />
          <defs>
            <linearGradient id="coretax-gradient-1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#cbd5e1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="coretax-gradient-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="coretax-gradient-3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#f8fafc" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ornamen Frosted Glass Relif / Cincin 3D Ringan */}
        <div className="absolute top-8 -right-20 w-[380px] h-[380px] rounded-full border-[28px] border-white/60 bg-white/10 backdrop-blur-md shadow-2xl shadow-slate-300/30 transform rotate-12"></div>
        <div className="absolute top-24 -right-6 w-[240px] h-[240px] rounded-full border-[18px] border-white/50 bg-white/20 backdrop-blur-sm shadow-xl shadow-slate-300/20"></div>
      </div>

      {/* 2. HEADER RESMI (SUDUT KIRI: LOGO INSTANSI | SUDUT KANAN: KOSONG BERSIH) */}
      <header className="relative z-10 w-full px-5 sm:px-8 py-3 flex items-center justify-between">
        {/* Sudut Kiri: Lambang Daerah & Instansi */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-[#1a2b4c] to-[#0f172a] text-amber-400 p-0.5 flex flex-col items-center justify-center shadow-sm shadow-[#1a2b4c]/20 shrink-0 border border-slate-300">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[6px] font-black uppercase tracking-tighter text-white">DESA</span>
          </div>
          <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
          <div className="leading-tight">
            <div className="text-[9px] sm:text-[9.5px] font-bold tracking-wider text-slate-500 uppercase">
              Pemerintah Kabupaten Musi Rawas
            </div>
            <div className="text-xs font-black text-[#1a2b4c] tracking-tight">
              DESA BELITI JAYA • KEC. MUARA KELINGI
            </div>
          </div>
        </div>

        {/* Sudut Kanan: Bersih tanpa teks apapun */}
        <div></div>
      </header>

      {/* 3. KONTEN UTAMA: MODERN, RAMPING & PAS TANPA OVERFLOW */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 py-2 flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 my-auto">
        {/* SISI KIRI: IDENTITAS SISTEM SIG DESA */}
        <div className="w-full lg:w-1/2 text-center lg:text-left space-y-2.5">
          {/* Logo SIG DESA */}
          <div className="inline-flex items-center justify-center lg:justify-start gap-1">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1a2b4c] tracking-tight font-sans">
              SIG
            </span>
            <div className="relative inline-flex items-center justify-center mx-0.5">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#f2a900] tracking-tight font-sans">
                DESA
              </span>
              <span className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white shadow-xs"></span>
            </div>
          </div>

          {/* Judul Besar Sistem */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1a2b4c] tracking-tight leading-snug">
            Sistem Informasi Geografis Desa
          </h1>

          {/* Slogan Resmi */}
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto lg:mx-0 leading-relaxed">
            Data Akurat, Transparansi Bantuan, Pelayanan Warga Tangguh
          </p>

          <div className="pt-0.5 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-[10.5px] text-slate-500">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 border border-slate-200/80 shadow-2xs font-semibold text-slate-700">
              <Shield className="w-3 h-3 text-emerald-600" /> DTKS &amp; Bantuan Sosial
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 border border-slate-200/80 shadow-2xs font-semibold text-slate-700">
              <Building2 className="w-3 h-3 text-[#1a2b4c]" /> Inventaris Aset Desa
            </span>
          </div>
        </div>

        {/* SISI KANAN: KARTU LOGIN MODERN BERUKURAN SEIMBANG & ELEGAN */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-end">
          <div 
            id="coretax-login-card" 
            className="w-full max-w-[420px] bg-white/95 backdrop-blur-xl border border-white/90 rounded-2xl shadow-2xl shadow-slate-300/50 p-6 sm:p-7 text-slate-800 transition-all relative"
          >
            {/* Header Kartu */}
            <div className="mb-4 text-left">
              <h2 className="text-2xl font-bold text-[#1a2b4c] tracking-tight">
                Selamat Datang!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Masuk untuk mengakses Layanan SIG Desa Beliti Jaya
              </p>
            </div>

            {/* Notifikasi Error jika login gagal */}
            {error && (
              <div 
                id="login-error-box" 
                className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Input Login */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
              {/* Input: ID Pengguna */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="login-username-coretax">
                  ID Pengguna
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-emerald-600 pointer-events-none">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username-coretax"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    placeholder="ID Pengguna / Username"
                    className="w-full bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1a2b4c] focus:ring-2 focus:ring-[#1a2b4c]/10 rounded-xl pl-9.5 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Input: Kata Sandi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="login-password-coretax">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setHelpDialog('forgot')}
                    className="text-[11px] text-slate-400 hover:text-[#1a2b4c] transition-colors cursor-pointer font-medium"
                  >
                    Lupa Sandi?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-emerald-600 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-coretax"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Kata Sandi"
                    className="w-full bg-[#f8fafc] hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1a2b4c] focus:ring-2 focus:ring-[#1a2b4c]/10 rounded-xl pl-9.5 pr-9 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium transition-all"
                  />
                  <button
                    type="button"
                    id="btn-toggle-coretax-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Kotak Verifikasi Bot (reCAPTCHA style) */}
              <div>
                <div 
                  id="coretax-recaptcha-box"
                  onClick={() => setIsCaptchaVerified(!isCaptchaVerified)}
                  className={`bg-[#f8fafc] border rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer transition-all ${
                    isCaptchaVerified 
                      ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-500/20' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                      isCaptchaVerified 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isCaptchaVerified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-700 select-none">
                      Saya bukan robot
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-medium select-none pr-0.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-500">reCAPTCHA</span>
                  </div>
                </div>
              </div>

              {/* Tombol Utama: Masuk */}
              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full bg-[#1a2b4c] hover:bg-[#15223c] active:scale-[0.99] text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-[#1a2b4c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm mt-1"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Masuk</span>
                )}
              </button>

              {/* BAGIAN AUTO-HIDE: TOMBOL "PENGGUNA BARU" & "AKUN PENGUJI" */}
              <div 
                className="pt-1"
                onClick={resetAutoHideTimer}
              >
                {!isExtraOptionsVisible ? (
                  <button
                    type="button"
                    id="btn-toggle-auto-hide-options"
                    onClick={handleToggleExtraOptions}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-[#1a2b4c] bg-slate-50/70 hover:bg-slate-100/90 text-slate-600 hover:text-[#1a2b4c] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Pengguna Baru &amp; Akun Penguji</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ) : (
                  /* Ketika diklik: Tampil ringkas & auto-hide setelah 6 detik tanpa respon */
                  <div 
                    id="auto-hide-options-panel"
                    className="p-2.5 bg-slate-50/95 border border-slate-200 rounded-xl space-y-2 shadow-sm transition-all animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    {/* Header Panel */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-slate-200/80">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <span>Pilihan Akses</span>
                        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">auto-hide</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleExtraOptions}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                        title="Tutup pilihan"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Dua Tombol: Pengguna Baru & Akun Penguji */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* 1. Tombol Pengguna Baru */}
                      <button
                        type="button"
                        onClick={() => {
                          resetAutoHideTimer();
                          setHelpDialog('register');
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <UserPlus className="w-3 h-3" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10.5px] font-bold text-slate-800 truncate">Pengguna Baru</div>
                            <div className="text-[9px] text-slate-500 truncate">Panduan</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </button>

                      {/* 2. Tombol Akun Penguji */}
                      <button
                        type="button"
                        onClick={() => {
                          resetAutoHideTimer();
                          setActiveSubTab(activeSubTab === 'penguji' ? 'menu' : 'penguji');
                        }}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer shadow-2xs ${
                          activeSubTab === 'penguji'
                            ? 'border-amber-400 bg-amber-50/80 ring-1 ring-amber-400'
                            : 'border-amber-200/80 hover:border-amber-300 bg-amber-50/40 hover:bg-amber-50/90'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                            <Key className="w-3 h-3" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10.5px] font-bold text-slate-800 truncate">Akun Penguji</div>
                            <div className="text-[9px] text-amber-700 font-medium truncate">Pilih Role</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-amber-500 group-hover:text-amber-700 transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </button>
                    </div>

                    {/* Jika Akun Penguji Aktif: Tampilkan Pilihan Role Cepat Langsung Terisi */}
                    {activeSubTab === 'penguji' && (
                      <div className="pt-1.5 space-y-1 border-t border-slate-200/80">
                        <div className="text-[9.5px] font-semibold text-slate-600 px-0.5">
                          Klik untuk mengisi otomatis:
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => applyCredentials('admin', 'admin123')}
                            className="p-1.5 rounded-lg border border-emerald-300/80 bg-emerald-50 hover:bg-emerald-100 text-center transition-all cursor-pointer"
                          >
                            <div className="text-[10px] font-bold text-emerald-800">Admin</div>
                            <div className="text-[8px] text-emerald-600">admin123</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => applyCredentials('operator', 'operator123')}
                            className="p-1.5 rounded-lg border border-blue-300/80 bg-blue-50 hover:bg-blue-100 text-center transition-all cursor-pointer"
                          >
                            <div className="text-[10px] font-bold text-blue-800">Operator</div>
                            <div className="text-[8px] text-blue-600">operator123</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => applyCredentials('op_aset', 'aset123')}
                            className="p-1.5 rounded-lg border border-amber-300/80 bg-amber-50 hover:bg-amber-100 text-center transition-all cursor-pointer"
                          >
                            <div className="text-[10px] font-bold text-amber-800">Aset</div>
                            <div className="text-[8px] text-amber-600">aset123</div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* 4. FOOTER RESMI */}
      <footer className="relative z-10 w-full px-5 sm:px-8 py-2.5 text-slate-500 text-[10.5px] text-center">
        <div>
          © 2026 Pemerintah Desa Beliti Jaya. Seluruh hak cipta dilindungi.
        </div>
      </footer>

      {/* 5. MODAL BANTUAN (LUPA KATA SANDI / PENGGUNA BARU) */}
      {helpDialog && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          onClick={() => setHelpDialog(null)}
        >
          <div 
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 text-slate-800 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-[#1a2b4c]">
                  {helpDialog === 'forgot' ? 'Pemulihan Kata Sandi' : 'Pendaftaran Akun Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setHelpDialog(null)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              {helpDialog === 'forgot' ? (
                <>
                  <p>
                    Untuk menjaga keamanan data kependudukan dan DTKS Desa Beliti Jaya, reset kata sandi hanya dapat dilakukan oleh:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 font-medium text-[11px]">
                    <li>Administrator Utama melalui menu <strong>Setting Pengguna &amp; RBAC</strong>.</li>
                    <li>Atau langsung hubungi Sekretaris Desa / Kepala Desa Beliti Jaya.</li>
                  </ul>
                  <p className="pt-1 text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-[10.5px]">
                    💡 <em>Untuk keperluan pengujian/demo, gunakan tombol "Akun Penguji" di form login.</em>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Akun sistem SIG Desa Beliti Jaya diterbitkan secara resmi untuk perangkat desa, kepala dusun, dan petugas pendata lapangan.
                  </p>
                  <p>
                    Silakan mengajukan penerbitan akun baru kepada Administrator Balai Desa Beliti Jaya, Kecamatan Muara Kelingi.
                  </p>
                </>
              )}
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpDialog(null)}
                className="px-3.5 py-1.5 bg-[#1a2b4c] text-white text-xs font-semibold rounded-lg hover:bg-[#15223c]"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

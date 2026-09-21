import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map, 
  BarChart3, 
  Maximize2, 
  Minimize2, 
  X, 
  Play, 
  Pause, 
  Clock, 
  Calendar, 
  Layers, 
  Users, 
  Home, 
  HeartHandshake, 
  Sparkles, 
  Activity, 
  MapPin, 
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Users2,
  Landmark
} from 'lucide-react';
import { Keluarga, Penduduk, User, DesaProfile, RolePermissions } from '../types';
import { MapLeaflet } from './MapLeaflet';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { FamilyDetailModal } from './FamilyDetailModal';
import { KioskOfficialsModal } from './KioskOfficialsModal';

interface KioskViewProps {
  isOpen: boolean;
  onClose: () => void;
  keluargaList: Keluarga[];
  pendudukList: Penduduk[];
  currentUser: User;
  desaProfile?: DesaProfile;
  permissions?: RolePermissions;
  onSelectKeluarga?: (keluarga: Keluarga) => void;
  onOpenVillageInfo?: (tab?: 'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText') => void;
}

export const KioskView: React.FC<KioskViewProps> = ({
  isOpen,
  onClose,
  keluargaList,
  pendudukList,
  currentUser,
  desaProfile,
  permissions,
  onSelectKeluarga,
  onOpenVillageInfo
}) => {
  const kioskContainerRef = useRef<HTMLDivElement>(null);

  // Tab State: 'map' (Peta Interaktif) atau 'analytics' (Dashboard Statistik)
  const [activeKioskTab, setActiveKioskTab] = useState<'map' | 'analytics'>('map');

  // Kiosk Resident Detail Modal State (Read-only, no edit/add buttons)
  const [kioskDetailKeluarga, setKioskDetailKeluarga] = useState<Keluarga | null>(null);

  // Kiosk Village Officials (Kades, Sekdes, Perangkat) Carousel Modal State
  const [isOfficialsModalOpen, setIsOfficialsModalOpen] = useState(false);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-Slide / Rotation State (berganti otomatis tiap 30 detik untuk monitor display)
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [rotateProgress, setRotateProgress] = useState(0); // 0 - 100%

  // Realtime Clock State (WIB)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync fullscreen state with document events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcut listener: ESC to exit, F11 / F to toggle fullscreen
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-Rotate Timer Logic
  useEffect(() => {
    if (!isOpen || !isAutoRotate) {
      setRotateProgress(0);
      return;
    }

    const DURATION = 30000; // 30 detik
    const INTERVAL = 200; // update progress tiap 200ms
    const step = (INTERVAL / DURATION) * 100;

    const intervalId = setInterval(() => {
      setRotateProgress(prev => {
        if (prev >= 100) {
          // Switch tab
          setActiveKioskTab(curr => (curr === 'map' ? 'analytics' : 'map'));
          return 0;
        }
        return prev + step;
      });
    }, INTERVAL);

    return () => clearInterval(intervalId);
  }, [isOpen, isAutoRotate]);

  // Toggle Browser Fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (kioskContainerRef.current?.requestFullscreen) {
          await kioskContainerRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  // Exit Kiosk Mode
  const handleExitKiosk = async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  // Key stats for Kiosk header & ticker
  const totalKeluarga = keluargaList.length;
  const totalPenduduk = pendudukList.length;
  const totalBansos = keluargaList.filter(k => k.penerimaBansos).length;
  const persentaseBansos = totalKeluarga > 0 ? Math.round((totalBansos / totalKeluarga) * 100) : 0;

  // Format Jam & Tanggal Indonesia (WIB)
  const timeString = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const dateString = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div
      ref={kioskContainerRef}
      id="kiosk-mode-container"
      className="fixed inset-0 z-[100] bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden"
    >
      {/* 1. KIOSK HEADER (Optimized for Large Monitors & Signage) */}
      <header className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 sm:px-6 sm:py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-2xl relative z-20">
        
        {/* Left: Village Identity & Monitor Badge */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
                {desaProfile?.logoDesa ? (
                  <img src={desaProfile.logoDesa} alt="Logo Desa" className="w-8 h-8 object-contain" />
                ) : (
                  <MapPin className="w-6 h-6 text-emerald-400" />
                )}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900 animate-ping" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight leading-none uppercase">
                {desaProfile?.namaDesa || 'Desa Beliti Jaya'}
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
              Kec. Muara Kelingi &bull; Kab. Musi Rawas &bull; Sumatera Selatan
            </p>
          </div>
        </div>

        {/* Center: DUA TOMBOL UTAMA (Peta Interaktif & Dashboard) */}
        <div className="flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner gap-1.5 backdrop-blur-xl">
          {/* Tombol 1: PETA INTERAKTIF */}
          <motion.button
            type="button"
            id="kiosk-btn-peta"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setActiveKioskTab('map');
              setRotateProgress(0);
            }}
            className={`relative flex items-center gap-2.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer select-none ${
              activeKioskTab === 'map'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
            }`}
          >
            <Map className="w-4 h-4 sm:w-5 sm:h-5" />
            <div className="text-left">
              <div className="leading-tight">Peta Interaktif</div>
              <div className="text-[10px] font-normal opacity-80 hidden md:block">Geospasial & Dusun</div>
            </div>
            {activeKioskTab === 'map' && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </motion.button>

          {/* Tombol 2: DASHBOARD */}
          <motion.button
            type="button"
            id="kiosk-btn-dashboard"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setActiveKioskTab('analytics');
              setRotateProgress(0);
            }}
            className={`relative flex items-center gap-2.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer select-none ${
              activeKioskTab === 'analytics'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <div className="text-left">
              <div className="leading-tight">Dashboard</div>
              <div className="text-[10px] font-normal opacity-80 hidden md:block">Statistik DTKS & Bansos</div>
            </div>
            {activeKioskTab === 'analytics' && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </motion.button>
        </div>

        {/* Right: Realtime Clock, Aparatur Desa, Auto-Rotate & Screen Controls (Icon Only) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Digital Clock Widget */}
          <div className="hidden lg:flex flex-col items-end px-3 py-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-black text-emerald-400 tracking-wider">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{timeString} WIB</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {dateString}
            </div>
          </div>

          {/* Tombol Aparatur Desa (Icon Only - Berada tepat di dekat tombol Auto Putar) */}
          <button
            type="button"
            id="kiosk-btn-aparatur"
            onClick={() => setIsOfficialsModalOpen(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 hover:bg-emerald-950/70 text-emerald-400 hover:text-emerald-200 border border-slate-700/70 hover:border-emerald-500/50 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 group"
            title="Pemerintah & Aparatur Desa Beliti Jaya (Klik untuk Buka Carousel & Profil)"
          >
            <Users2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          {/* Auto-Slide / Auto-Rotate Toggle Button (Icon Only) */}
          <button
            type="button"
            id="kiosk-btn-autorotate"
            onClick={() => {
              setIsAutoRotate(prev => !prev);
              setRotateProgress(0);
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              isAutoRotate
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-950/40'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/70 text-slate-400 hover:text-slate-200'
            }`}
            title={isAutoRotate ? 'Auto Putar Aktif (Berganti setiap 30 detik) - Klik untuk Berhenti' : 'Aktifkan Auto Putar Layar (Peta / Dashboard berganti otomatis setiap 30 detik)'}
          >
            {isAutoRotate ? (
              <Pause className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <Play className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Fullscreen Button (Icon Only) */}
          <button
            type="button"
            id="kiosk-btn-fullscreen"
            onClick={toggleFullscreen}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 hover:text-cyan-200 border border-slate-700/70 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95"
            title={isFullscreen ? 'Keluar dari Layar Penuh (Normal)' : 'Masuk ke Mode Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Exit Kiosk Button (Icon Only) */}
          <button
            type="button"
            id="kiosk-btn-exit"
            onClick={handleExitKiosk}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white border border-rose-500/60 transition-all cursor-pointer flex items-center justify-center shadow-md shadow-rose-950/50 active:scale-95"
            title="Keluar / Tutup Mode Kiosk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auto Rotate Progress Bar (visible when auto-rotate is active) */}
        {isAutoRotate && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-200"
              style={{ width: `${rotateProgress}%` }}
            />
          </div>
        )}
      </header>

      {/* 2. MAIN DISPLAY CONTENT (Full Viewport Height) */}
      <main className="flex-1 relative overflow-hidden bg-slate-950">
        
        {/* VIEW 1: PETA INTERAKTIF KIOSK */}
        {activeKioskTab === 'map' && (
          <div className="w-full h-full relative">
            <MapLeaflet
              keluargaList={keluargaList}
              selectedKeluargaId={kioskDetailKeluarga?.id}
              onSelectKeluarga={kel => {
                setKioskDetailKeluarga(kel);
                if (onSelectKeluarga) onSelectKeluarga(kel);
              }}
              currentUser={currentUser}
              onOpenVillageInfo={onOpenVillageInfo}
              onOpenOfficialsModal={() => setIsOfficialsModalOpen(true)}
              permissions={permissions}
              isKioskMode={true}
            />

            {/* Floating Kiosk Quick Statistics Pill Overlay (Bottom Right of Map) - Hidden while modal rincian biodata or modal aparatur is open */}
            {!kioskDetailKeluarga && !isOfficialsModalOpen && (
              <div 
                id="kiosk-quick-stats-pill"
                className="absolute bottom-5 right-5 z-30 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl hidden md:flex items-center gap-4 transition-all duration-300"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Keluarga</div>
                    <div className="text-sm font-bold text-white font-mono">{totalKeluarga} KK</div>
                  </div>
                </div>

                <div className="h-7 w-px bg-slate-800" />

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Penduduk</div>
                    <div className="text-sm font-bold text-white font-mono">{totalPenduduk} Jiwa</div>
                  </div>
                </div>

                <div className="h-7 w-px bg-slate-800" />

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Penerima Bansos</div>
                    <div className="text-sm font-bold text-rose-400 font-mono">{totalBansos} KK ({persentaseBansos}%)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DASHBOARD STATISTIK KIOSK */}
        {activeKioskTab === 'analytics' && (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6">
              <AnalyticsDashboard
                keluargaList={keluargaList}
                pendudukList={pendudukList}
              />
            </div>
          </div>
        )}

      </main>

      {/* 3. KIOSK FOOTER (Marquee Announcement Ticker & Live Status) */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-2 sm:px-6 flex items-center justify-between gap-4 shrink-0 text-xs text-slate-400 z-20">
        
        {/* Left: Live Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-semibold text-slate-200 text-[11px]">SISTEM ONLINE</span>
          <span className="hidden sm:inline text-slate-600">&bull;</span>
          <span className="hidden sm:inline text-[11px] text-slate-400">Balai Desa Beliti Jaya</span>
        </div>

        {/* Center: Running Text / Marquee Ticker */}
        <div className="flex-1 overflow-hidden whitespace-nowrap px-4 text-center">
          <div 
            className="inline-block animate-marquee text-[11px] sm:text-xs text-slate-200 font-medium"
            style={{
              animationDuration: 
                desaProfile?.runningTextSpeed === 'slow' ? '55s' : 
                desaProfile?.runningTextSpeed === 'fast' ? '22s' : '35s'
            }}
          >
            {desaProfile?.runningTextKiosk || (
              <>📢 <strong>SELAMAT DATANG DI ANJUNGAN KIOSK DIGITAL DESA BELITI JAYA</strong> &bull; Sistem Informasi Geografis Kependudukan & DTKS Berbasis Peta Digital &bull; Transparansi Data Bantuan Sosial (PKH, BPNT, BLT-DD, Bansos Beras) &bull; Pelayanan Administrasi Kantor Desa Buka Senin - Jumat Pukul 08:00 - 15:30 WIB &bull; Menuju Desa Cerdas, Maju dan Mandiri</>
            )}
          </div>
        </div>

        {/* Right: Quick Instructions / ESC hint */}
        <div className="shrink-0 text-[11px] text-slate-500 hidden md:flex items-center gap-2 font-mono">
          <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px]">ESC</kbd>
          <span>untuk keluar</span>
        </div>
      </footer>

      {/* Modal Detail Biodata Penduduk / Keluarga Khusus KIOSK (Hanya Baca: Tanpa Tombol Edit & Tambah) */}
      <FamilyDetailModal
        keluarga={kioskDetailKeluarga}
        onClose={() => setKioskDetailKeluarga(null)}
        onEdit={() => {}}
        onDelete={() => {}}
        currentUser={currentUser}
        permissions={permissions}
        isReadOnly={true}
        isKioskMode={true}
      />

      {/* Modal Carousel Aparatur & Pemerintah Desa (Kades, Sekdes, Perangkat) Khusus KIOSK */}
      <KioskOfficialsModal
        isOpen={isOfficialsModalOpen}
        onClose={() => setIsOfficialsModalOpen(false)}
        desaProfile={desaProfile}
      />
    </div>
  );
};

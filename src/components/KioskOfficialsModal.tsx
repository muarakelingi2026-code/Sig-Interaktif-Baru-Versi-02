import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Users, 
  UserCheck, 
  Award, 
  Briefcase, 
  Calendar, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Info,
  Eye,
  Layers
} from 'lucide-react';
import { DesaProfile, AparaturDesaItem } from '../types';
import { DEFAULT_VILLAGE_LOGO } from '../data/mockData';

interface KioskOfficialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  desaProfile?: DesaProfile;
}

export const KioskOfficialsModal: React.FC<KioskOfficialsModalProps> = ({
  isOpen,
  onClose,
  desaProfile
}) => {
  // Build official items list (Kepala Desa, Sekretaris Desa, and Perangkat Desa Lainnya)
  const allOfficials: AparaturDesaItem[] = React.useMemo(() => {
    if (!desaProfile) return [];
    const list: AparaturDesaItem[] = [];

    // 1. Kepala Desa
    if (desaProfile.kepalaDesa) {
      list.push({
        id: 'kades_01',
        nama: desaProfile.kepalaDesa.nama || 'M. HIDAYAT, S.IP',
        jabatan: 'Kepala Desa',
        kategori: 'Kepala Desa',
        nip: desaProfile.kepalaDesa.nip || '19780512 200604 1 008',
        nik: desaProfile.kepalaDesa.nik || '1631051205780001',
        noHp: desaProfile.kepalaDesa.noHp || '0813-6789-0123',
        periode: desaProfile.kepalaDesa.periode || '2021 - 2027',
        foto: desaProfile.kepalaDesa.foto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80',
        tugasPokok: 'Memimpin penyelenggaraan pemerintahan desa, pembinaan ketentraman dan ketertiban masyarakat desa, serta membina dan memajukan perekonomian dan kesejahteraan warga Desa Beliti Jaya.',
        sambutan: desaProfile.kepalaDesa.sambutan || 'Mewujudkan Desa Beliti Jaya yang Maju, Mandiri, Transparan berbasis Tata Kelola Data Spasial & Kesejahteraan Sosial yang Berkeadilan.',
        tingkatJabatan: 'Pimpinan Utama'
      });
    }

    // 2. Sekretaris Desa
    if (desaProfile.sekretarisDesa) {
      list.push({
        id: 'sekdes_01',
        nama: desaProfile.sekretarisDesa.nama || 'HERU PRASETYO, S.E.',
        jabatan: 'Sekretaris Desa',
        kategori: 'Sekretaris Desa',
        nip: desaProfile.sekretarisDesa.nip || '19840315 201001 1 012',
        nik: desaProfile.sekretarisDesa.nik || '1631051503840003',
        noHp: desaProfile.sekretarisDesa.noHp || '0812-7345-6789',
        periode: desaProfile.sekretarisDesa.periode || '2021 - 2027',
        foto: desaProfile.sekretarisDesa.foto || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
        tugasPokok: 'Memimpin kesekretariatan desa, penyusunan rancangan peraturan desa, perencanaan APBDes, pengelolaan administrasi umum dan koordinasi seluruh kepala urusan (Kaur) & kepala seksi (Kasi).',
        tingkatJabatan: 'Sekretariat'
      });
    }

    // 3. Perangkat Desa Lainnya (Kasi, Kaur, Kadus, BPD)
    if (desaProfile.perangkatLainnya && desaProfile.perangkatLainnya.length > 0) {
      desaProfile.perangkatLainnya.forEach(p => {
        let tingkat: AparaturDesaItem['tingkatJabatan'] = 'Pelaksana Teknis';
        if (p.kategori === 'Kaur') tingkat = 'Sekretariat';
        else if (p.kategori === 'Kepala Dusun') tingkat = 'Pelaksana Kewilayahan';
        else if (p.kategori === 'BPD') tingkat = 'Badan Permusyawaratan';

        list.push({
          ...p,
          foto: p.foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
          tingkatJabatan: tingkat
        });
      });
    }

    return list;
  }, [desaProfile]);

  // Carousel slide pagination state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Responsive items per page (1 on mobile, 2 on tablet, 3 on large screens)
  const [itemsPerPage, setItemsPerPage] = useState(3);

  // Auto-play state for carousel
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);

  // Detail Modal state when an official card is clicked
  const [selectedOfficial, setSelectedOfficial] = useState<AparaturDesaItem | null>(null);

  // Handle window resizing for responsive cards count
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredOfficials = allOfficials;
  const totalSlides = Math.ceil(filteredOfficials.length / itemsPerPage) || 1;

  // Reset slide to 0 when itemsPerPage changes
  useEffect(() => {
    setCurrentSlide(0);
    setAutoPlayProgress(0);
  }, [itemsPerPage]);

  // Next Slide Handler
  const handleNextSlide = () => {
    setSlideDirection('right');
    setCurrentSlide(prev => (prev + 1) % totalSlides);
    setAutoPlayProgress(0);
  };

  // Prev Slide Handler
  const handlePrevSlide = () => {
    setSlideDirection('left');
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
    setAutoPlayProgress(0);
  };

  // Auto-play Carousel Timer (slides every 6 seconds)
  useEffect(() => {
    if (!isOpen || !isAutoPlay || totalSlides <= 1 || selectedOfficial !== null) {
      setAutoPlayProgress(0);
      return;
    }

    const DURATION = 6000; // 6 detik per slide
    const INTERVAL = 100;
    const step = (INTERVAL / DURATION) * 100;

    const timer = setInterval(() => {
      setAutoPlayProgress(prev => {
        if (prev >= 100) {
          handleNextSlide();
          return 0;
        }
        return prev + step;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isOpen, isAutoPlay, totalSlides, currentSlide, selectedOfficial]);

  if (!isOpen) return null;

  // Get current visible slice of officials
  const startIndex = currentSlide * itemsPerPage;
  const currentVisibleOfficials = filteredOfficials.slice(startIndex, startIndex + itemsPerPage);

  // Category Badges Styling Helper
  const getCategoryColor = (kategori: string) => {
    switch (kategori) {
      case 'Kepala Desa':
        return {
          bg: 'bg-emerald-500/20',
          text: 'text-emerald-300',
          border: 'border-emerald-500/50',
          badge: 'bg-emerald-600',
          glow: 'from-emerald-500/20 via-slate-900 to-slate-950'
        };
      case 'Sekretaris Desa':
        return {
          bg: 'bg-teal-500/20',
          text: 'text-teal-300',
          border: 'border-teal-500/50',
          badge: 'bg-teal-600',
          glow: 'from-teal-500/20 via-slate-900 to-slate-950'
        };
      case 'Kasi':
        return {
          bg: 'bg-cyan-500/20',
          text: 'text-cyan-300',
          border: 'border-cyan-500/40',
          badge: 'bg-cyan-600',
          glow: 'from-cyan-500/20 via-slate-900 to-slate-950'
        };
      case 'Kaur':
        return {
          bg: 'bg-amber-500/20',
          text: 'text-amber-300',
          border: 'border-amber-500/40',
          badge: 'bg-amber-600',
          glow: 'from-amber-500/20 via-slate-900 to-slate-950'
        };
      case 'Kepala Dusun':
        return {
          bg: 'bg-purple-500/20',
          text: 'text-purple-300',
          border: 'border-purple-500/40',
          badge: 'bg-purple-600',
          glow: 'from-purple-500/20 via-slate-900 to-slate-950'
        };
      case 'BPD':
        return {
          bg: 'bg-rose-500/20',
          text: 'text-rose-300',
          border: 'border-rose-500/40',
          badge: 'bg-rose-600',
          glow: 'from-rose-500/20 via-slate-900 to-slate-950'
        };
      default:
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-300',
          border: 'border-blue-500/40',
          badge: 'bg-blue-600',
          glow: 'from-blue-500/20 via-slate-900 to-slate-950'
        };
    }
  };

  return (
    <div
      id="kiosk-officials-carousel-modal"
      className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-2 sm:p-4 lg:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget && !selectedOfficial) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="bg-slate-900/95 border border-slate-700/80 rounded-3xl w-full max-w-6xl shadow-2xl text-slate-100 flex flex-col h-[94vh] max-h-[850px] overflow-hidden relative select-none"
      >
        {/* ================= MODAL HEADER ================= */}
        <header className="p-4 sm:px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight">
                  Pemerintah & Aparatur Desa {desaProfile?.namaDesa || 'Beliti Jaya'}
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Kepala Desa, Sekretaris Desa & Perangkat Desa (Kasi, Kaur, Kepala Dusun, BPD)
              </p>
            </div>
          </div>

          {/* Right Controls: Auto-Play Toggle & Close */}
          <div className="flex items-center gap-2">
            {/* Auto-play toggle button */}
            <button
              type="button"
              id="kiosk-carousel-autoplay-btn"
              onClick={() => {
                setIsAutoPlay(prev => !prev);
                setAutoPlayProgress(0);
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 ${
                isAutoPlay
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isAutoPlay ? 'Jeda Carousel Otomatis' : 'Putar Carousel Otomatis'}
            >
              {isAutoPlay ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline">Auto Putar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden sm:inline">Mulai Putar</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="kiosk-carousel-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-md active:scale-95"
              title="Tutup Modal Aparatur"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Auto-play linear progress bar at the bottom of header */}
          {isAutoPlay && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-100"
                style={{ width: `${autoPlayProgress}%` }}
              />
            </div>
          )}
        </header>

        {/* ================= MAIN CAROUSEL STAGE ================= */}
        <div className="flex-1 relative flex items-center justify-between p-3 sm:p-5 lg:p-6 overflow-hidden bg-slate-950/40">
          
          {/* Left Arrow Button (Previous) - Bootstrap Carousel Control */}
          <button
            type="button"
            id="kiosk-carousel-prev-btn"
            onClick={handlePrevSlide}
            className="absolute left-3 sm:left-4 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-900/90 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-400 flex items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-90"
            title="Sebelumnya (Slide Sebelumnya)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Cards Container with Slide Effect */}
          <div className="w-full h-full px-12 sm:px-14 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`slide-${currentSlide}`}
                initial={{ opacity: 0, x: slideDirection === 'right' ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection === 'right' ? -60 : 60 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className={`w-full h-full grid gap-4 sm:gap-5 items-stretch ${
                  itemsPerPage === 1 
                    ? 'grid-cols-1 max-w-md mx-auto' 
                    : itemsPerPage === 2 
                    ? 'grid-cols-2 max-w-3xl mx-auto' 
                    : 'grid-cols-3'
                }`}
              >
                {currentVisibleOfficials.map((official) => {
                  const styleTheme = getCategoryColor(official.kategori);

                  return (
                    <motion.div
                      key={official.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      transition={{ duration: 0.2 }}
                      id={`kiosk-card-official-${official.id}`}
                      onClick={() => setSelectedOfficial(official)}
                      className={`group relative bg-gradient-to-b ${styleTheme.glow} rounded-3xl border ${styleTheme.border} p-3.5 sm:p-4 flex flex-col justify-between shadow-xl cursor-pointer hover:shadow-2xl hover:shadow-emerald-950/50 transition-all duration-300 overflow-hidden`}
                    >
                      {/* Subdued Background Glow Effect */}
                      <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

                      {/* ================= TOP SECTION: FOTO ADA DI ATAS ================= */}
                      <div className="w-full relative shrink-0">
                        {/* Photo Container */}
                        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative bg-slate-950 border border-slate-800 shadow-inner group-hover:border-emerald-500/40 transition-colors">
                          <img
                            src={official.foto}
                            alt={official.nama}
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80';
                            }}
                          />

                          {/* Gradient Overlay for Legibility */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                          {/* Top Left Badge: Kategori Jabatan */}
                          <div className="absolute top-2.5 left-2.5">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-white ${styleTheme.badge} shadow-md flex items-center gap-1`}>
                              <Shield className="w-3 h-3" />
                              <span>{official.kategori}</span>
                            </span>
                          </div>

                          {/* Top Right Badge: Periode Jabatan */}
                          <div className="absolute top-2.5 right-2.5">
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-slate-900/90 text-slate-300 border border-slate-700/80 backdrop-blur-sm">
                              {official.periode || '2021 - 2027'}
                            </span>
                          </div>

                          {/* Quick Inspect Pill on Hover */}
                          <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Rincian</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ================= BOTTOM SECTION: DETAIL ADA DI BAWAHNYA ================= */}
                      <div className="mt-3 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          {/* Nama Lengkap & Gelar */}
                          <h3 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-1">
                            {official.nama}
                          </h3>

                          {/* Jabatan Resmi */}
                          <div className={`text-xs font-bold ${styleTheme.text} mt-0.5 flex items-center gap-1.5`}>
                            <Briefcase className="w-3.5 h-3.5 shrink-0" />
                            <span className="line-clamp-1">{official.jabatan}</span>
                          </div>

                          {/* NIP or NIK Identifier */}
                          <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                            <span className="text-slate-500 font-semibold">NIP:</span>
                            <span className="text-slate-300 truncate">
                              {official.nip || official.nik || 'Dalam proses SK'}
                            </span>
                          </div>

                          {/* Tugas Pokok / Ringkasan Deskripsi */}
                          {official.tugasPokok && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1.5 border-t border-slate-800/80 pt-1.5">
                              {official.tugasPokok}
                            </p>
                          )}
                        </div>

                        {/* Interactive Click Bar (Bawah Kartu) */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-400 font-semibold transition-colors">
                            <span>Buka Detail Profil</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                            Sentuh / Klik
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Arrow Button (Next) - Bootstrap Carousel Control */}
          <button
            type="button"
            id="kiosk-carousel-next-btn"
            onClick={handleNextSlide}
            className="absolute right-3 sm:right-4 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-900/90 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-400 flex items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-90"
            title="Berikutnya (Slide Selanjutnya)"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* ================= MODAL FOOTER & CAROUSEL INDICATORS (DOTS) ================= */}
        <footer className="bg-slate-950/90 border-t border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0 relative z-20">
          
          {/* Quick Help Hint for Touch Kiosk */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-slate-300">Sentuh / Klik salah satu kartu aparatur</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">untuk membuka rincian lengkap biodata & wewenang</span>
          </div>

          {/* Bootstrap Carousel Indicators (Dots / Pills) */}
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                id={`kiosk-carousel-dot-${idx}`}
                onClick={() => {
                  setSlideDirection(idx > currentSlide ? 'right' : 'left');
                  setCurrentSlide(idx);
                  setAutoPlayProgress(0);
                }}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === idx
                    ? 'w-8 bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/50'
                    : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Pindah ke Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Slide Counter / Summary */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Total: <strong className="text-emerald-400">{filteredOfficials.length}</strong> Pejabat/Perangkat</span>
          </div>
        </footer>

        {/* ================= MODAL RINCIAN PROFIL APARATUR DESA (TAMPILAN ID CARD) ================= */}
        {/* Ketika salah satu kartu diklik, modal detail muncul dengan format ID Card */}
        <AnimatePresence>
          {selectedOfficial && (
            <div
              id="kiosk-official-detail-modal-overlay"
              className="absolute inset-0 z-50 bg-slate-950/92 backdrop-blur-2xl p-2 sm:p-4 flex items-center justify-center overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedOfficial(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                id="kiosk-official-id-card-modal"
                className="w-full max-w-[340px] sm:max-w-[365px] my-auto flex flex-col items-center relative z-10"
              >
                {/* ================= TAMPILAN ID CARD FISIK ================= */}
                <div 
                  id="kiosk-official-id-card"
                  className="w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl shadow-emerald-950/60 relative overflow-hidden text-center flex flex-col items-center"
                >
                  {/* Watermark Garis Ornamen */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
                  
                  {/* Lanyard Hole Clip / Slot Tali ID Card */}
                  <div className="w-12 h-1.5 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner mb-2 flex items-center justify-center">
                    <div className="w-8 h-0.5 rounded-full bg-slate-800" />
                  </div>

                  {/* ID Card Official Header dengan Logo Musi Rawas di atas Kop */}
                  <div className="w-full pb-2 border-b border-slate-800/90 flex flex-col items-center">
                    {/* Logo Musi Rawas ditaruh di atas kop */}
                    <div className="mb-1">
                      <img 
                        src={desaProfile?.logoDesa || DEFAULT_VILLAGE_LOGO} 
                        alt="Logo Musi Rawas" 
                        className="w-10 h-12 sm:w-11 sm:h-13 object-contain drop-shadow"
                      />
                    </div>
                    <div className="text-xs sm:text-[13px] font-black text-white uppercase tracking-wider text-center leading-tight">
                      Pemerintah Desa {desaProfile?.namaDesa || 'Beliti Jaya'}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-medium mt-0.5">
                      Kec. Muara Kelingi • Kab. Musi Rawas
                    </div>
                    <div className="mt-1 px-3 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">
                      Kartu Tanda Pengenal Aparatur
                    </div>
                  </div>

                  {/* 1. FOTO PROFIL DIPERBESAR SEDIKIT & TAJAM */}
                  <div className="my-2.5 sm:my-3 relative group">
                    <div className="w-32 h-40 sm:w-36 sm:h-46 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border-2 border-slate-700/80 bg-slate-950 ring-2 ring-emerald-500/50 relative">
                      <img
                        src={selectedOfficial.foto}
                        alt={selectedOfficial.nama}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      {/* Badge Kategori di Pojok Foto */}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/40 text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider shadow-md">
                        {selectedOfficial.kategori}
                      </span>
                    </div>
                  </div>

                  {/* 2. NAMA LENGKAP & JABATAN */}
                  <div className="w-full px-1">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase leading-tight">
                      {selectedOfficial.nama}
                    </h3>
                    
                    {/* Jabatan */}
                    <div className="mt-1 inline-block px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-extrabold text-[10px] sm:text-[11px] border border-emerald-500/35 uppercase tracking-wider">
                      {selectedOfficial.jabatan}
                    </div>
                  </div>

                  {/* 3. MASA JABATAN */}
                  <div className="w-full mt-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Masa Jabatan</span>
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-black text-amber-300">
                      {selectedOfficial.periode || '2021 - 2027'}
                    </div>
                  </div>

                  {/* ID Card Footer Security Line */}
                  <div className="w-full mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>ID: {selectedOfficial.id.toUpperCase()}</span>

                    {/* Tombol kembali ke carousel ditaruh dekat teks Resmi Pemdes dengan tampilan icon saja */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 text-[9px] sm:text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resmi Pemdes</span>
                      </span>

                      <button
                        type="button"
                        id="btn-return-to-carousel-icon"
                        onClick={() => setSelectedOfficial(null)}
                        className="p-1 sm:p-1.5 rounded-md bg-slate-800/90 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700/80 hover:border-emerald-500 shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center group"
                        title="Kembali ke Carousel"
                        aria-label="Kembali ke Carousel"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

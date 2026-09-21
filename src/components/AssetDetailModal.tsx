import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AsetDesa } from '../types';
import { 
  resolveImageUrl, 
  isGoogleDriveUrl, 
  extractGoogleDriveFileId,
  getGoogleDriveThumbnailUrl 
} from '../utils/imageUtils';
import { 
  X, 
  MapPin, 
  Building2, 
  HardHat, 
  Calendar, 
  Landmark, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Copy,
  ExternalLink,
  Compass,
  FileSpreadsheet,
  Layers,
  Camera,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';

interface AssetDetailModalProps {
  aset: AsetDesa | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBukuInventaris?: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  aset: propAset,
  isOpen,
  onClose,
  onOpenBukuInventaris
}) => {
  const [cachedAset, setCachedAset] = useState<AsetDesa | null>(propAset);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string; originalUrl: string } | null>(null);

  // Cache asset data so exit animation has full data during unmount
  useEffect(() => {
    if (propAset) {
      setCachedAset(propAset);
    }
  }, [propAset]);

  const aset = propAset || cachedAset;

  // Reset photo index and error state whenever a different asset is selected
  useEffect(() => {
    setSelectedPhotoIdx(0);
    setImageLoadError(false);
  }, [aset?.id]);

  // Reset image error state whenever active photo index changes
  useEffect(() => {
    setImageLoadError(false);
  }, [selectedPhotoIdx]);

  // Handle ESC key to close modal or lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomedImage) {
          setZoomedImage(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoomedImage, onClose]);

  // Compile valid photos list synchronized with Buku Inventaris Desa
  const validPhotos = useMemo(() => {
    if (!aset) return [];
    const list: string[] = [];

    if (Array.isArray(aset.fotoList) && aset.fotoList.length > 0) {
      aset.fotoList.forEach(p => {
        if (p && typeof p === 'string' && p.trim().length > 0) {
          list.push(p.trim());
        }
      });
    }

    // Ensure primary photo is present
    if (aset.foto && typeof aset.foto === 'string' && aset.foto.trim().length > 0) {
      const primaryTrim = aset.foto.trim();
      if (!list.includes(primaryTrim)) {
        list.unshift(primaryTrim);
      }
    }

    return list;
  }, [aset]);

  const isPembangunan = aset?.kategori === 'pembangunan';
  const activePhoto = validPhotos[selectedPhotoIdx] || validPhotos[0] || aset?.foto || '';
  const isDrive = isGoogleDriveUrl(activePhoto);
  const resolvedActivePhoto = resolveImageUrl(activePhoto);

  const handleCopyCoords = () => {
    if (!aset) return;
    const text = `${aset.koordinat.lat}, ${aset.koordinat.lng}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const getKondisiBadge = (kondisi: string) => {
    if (kondisi === 'Baik') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Kondisi: Baik
        </span>
      );
    }
    if (kondisi === 'Rusak Ringan') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Kondisi: Rusak Ringan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        Kondisi: Rusak Berat
      </span>
    );
  };

  // Official documentation angle names matching Buku Inventaris Desa
  const photoButtonLabels = ['Foto Satu', 'Foto Dua', 'Foto Tiga', 'Foto 4'];
  const photoAngleLabels = [
    'Tampak Depan',
    'Tampak Samping / Fisik',
    'Papan Nama / Prasasti / KIB',
    'Pemanfaatan Warga'
  ];

  const formatRupiah = (val?: number) => {
    if (typeof val !== 'number' || isNaN(val)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && aset && (
        <motion.div 
          id="modal-asset-detail-overlay"
          key="modal-asset-detail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-16 inset-x-0 bottom-0 z-[80] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto custom-scrollbar"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            id="modal-asset-detail-card"
            key="modal-asset-detail-card"
            initial={{ opacity: 0, scale: 0.95, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl xl:max-w-6xl bg-slate-900/95 border border-slate-700/90 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden my-auto max-h-[calc(100vh-5rem)] flex flex-col"
          >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${
                isPembangunan 
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400' 
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              }`}>
                {isPembangunan ? <HardHat className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
              </div>
              <div>
                {/* 1. Judul Rincian Data Aset Desa di posisi Atas */}
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight">
                  Rincian Data Aset Desa
                </h3>
                {/* 2. Keterangan Aset Pembangunan Fisik & KIB dibuat Di Bawah Judul */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs ${
                    isPembangunan
                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span>
                      {isPembangunan ? 'Aset Pembangunan Fisik & KIB' : 'Aset Non-Pembangunan & KIB'}
                      {aset.subKategori ? ` (${aset.subKategori})` : ''}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/80">
                    {aset.kodeRegister}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-close-asset-detail-modal"
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/70 hover:border-rose-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xs active:scale-90"
                title="Tutup Rincian Data Aset"
                aria-label="Tutup Form Rincian Data Aset"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body (Form Memanjang Kesamping) */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
              
              {/* KOLOM KIRI (Visual & Dokumentasi Foto Aset) - lg:col-span-6 */}
              <div className="lg:col-span-6 space-y-4">
                {/* Foto Aset Banner & Title Overview */}
                <div className="space-y-2.5">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group">
                    <div className="h-56 sm:h-64 lg:h-72 w-full relative bg-slate-950 flex items-center justify-center">
                      {activePhoto && !imageLoadError ? (
                        <div 
                          className="w-full h-full relative cursor-pointer group"
                          onClick={() => setZoomedImage({
                            url: resolvedActivePhoto,
                            title: `${aset.namaAset} - ${photoButtonLabels[selectedPhotoIdx] || `Foto ${selectedPhotoIdx + 1}`} (${photoAngleLabels[selectedPhotoIdx] || ''})`,
                            originalUrl: activePhoto
                          })}
                          title="Klik untuk perbesar foto dokumentasi aset"
                        >
                          <AnimatePresence mode="wait">
                            <motion.img
                              key={resolvedActivePhoto}
                              src={resolvedActivePhoto}
                              alt={aset.namaAset}
                              referrerPolicy="no-referrer"
                              initial={{ opacity: 0, scale: 1.015 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.985 }}
                              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                              className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                              onError={() => {
                                setImageLoadError(true);
                              }}
                            />
                          </AnimatePresence>

                          {/* Hover Overlay Prompt to Zoom */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                            <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Klik untuk Perbesar Foto</span>
                            </div>
                          </div>
                        </div>
                      ) : activePhoto && imageLoadError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900/80 text-slate-300 gap-2.5">
                          <ImageIcon className="w-10 h-10 text-amber-400/80" />
                          <div>
                            <p className="text-xs font-semibold text-slate-200">Pratinjau Foto Langsung Tidak Tersedia</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                              {isDrive 
                                ? "Tautan Google Drive memerlukan izin akses publik ('Siapa saja yang memiliki link')."
                                : "Browser membatasi pemuatan langsung gambar dari server sumber ini."}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={activePhoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-950/50"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Link Foto Asli</span>
                            </a>
                            {onOpenBukuInventaris && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenBukuInventaris();
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>Buka Buku Inventaris</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-500 gap-2">
                          <Building2 className="w-12 h-12 text-slate-600" />
                          <span className="text-xs">Foto aset belum diunggah di Buku Inventaris</span>
                        </div>
                      )}

                      {/* Gradient Scrim for Top & Bottom Elements */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none"></div>

                      {/* Top Badges & Direct Links */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">
                          {getKondisiBadge(aset.kondisi)}
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-slate-300 border border-white/10">
                            {aset.subKategori}
                          </span>
                          {isDrive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 backdrop-blur-md">
                              <span>Google Drive</span>
                            </span>
                          )}
                        </div>

                        {/* Action buttons on photo */}
                        {activePhoto && (
                          <div className="flex items-center gap-1.5 pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => setZoomedImage({
                                url: resolvedActivePhoto,
                                title: `${aset.namaAset} - ${photoButtonLabels[selectedPhotoIdx] || `Foto ${selectedPhotoIdx + 1}`} (${photoAngleLabels[selectedPhotoIdx] || ''})`,
                                originalUrl: activePhoto
                              })}
                              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer"
                              title="Perbesar Foto (Lightbox)"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
                            </button>
                            <a
                              href={activePhoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-white/15 backdrop-blur-md transition-all flex items-center gap-1 text-xs font-semibold"
                              title="Buka Tautan Link Foto Asli (Tab Baru)"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Bottom Overlay Info */}
                      <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                        <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight drop-shadow-md">
                          {aset.namaAset}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <MapPin className="w-3.5 h-3.5" />
                            {aset.dusun}
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">Desa Beliti Jaya</span>
                          {validPhotos.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold">
                                {photoButtonLabels[selectedPhotoIdx] || `Foto ${selectedPhotoIdx + 1}`}
                                {photoAngleLabels[selectedPhotoIdx] ? ` (${photoAngleLabels[selectedPhotoIdx]})` : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keterangan Tombol Foto: Foto Satu, Foto Dua, Foto Tiga & Foto 4 */}
                  {validPhotos.length > 0 && (
                    <div className="p-2.5 bg-slate-950/90 rounded-2xl border border-slate-800/90 space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pilihan Sudut Foto Dokumentasi:</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Math.min(validPhotos.length, 4)} Foto Terlampir
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {validPhotos.slice(0, 4).map((pUrl, idx) => {
                          const btnLabel = photoButtonLabels[idx] || `Foto ${idx + 1}`;
                          const angleLabel = photoAngleLabels[idx] || '';
                          const isSelected = selectedPhotoIdx === idx;
                          const resolvedUrl = resolveImageUrl(pUrl);

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedPhotoIdx(idx);
                                setImageLoadError(false);
                              }}
                              className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl text-left transition-all duration-200 ease-out cursor-pointer border ${
                                isSelected
                                  ? 'bg-emerald-600/25 text-white border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-950/40 scale-[1.02]'
                                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white hover:border-slate-700 hover:scale-[1.01]'
                              }`}
                              title={`Lihat ${btnLabel} - ${angleLabel}`}
                            >
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-700/60">
                                <img
                                  src={resolvedUrl}
                                  alt={btnLabel}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.opacity = '0.3';
                                  }}
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-emerald-500/20 ring-1 ring-emerald-400"></div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                                  {btnLabel}
                                </div>
                                {angleLabel && (
                                  <div className="text-[9px] text-slate-400 truncate leading-tight mt-0.5">
                                    {angleLabel}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Highlight Administrasi & Lokasi Spasial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/60 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" />
                      <span>Tahun Pengadaan</span>
                    </div>
                    <div className="text-base font-bold text-white">
                      Tahun {aset.tahunPengadaan}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Kondisi: {aset.kondisi}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/60 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Status Pemanfaatan</span>
                    </div>
                    <div className="text-sm font-bold text-white truncate">
                      {aset.statusPemanfaatan}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      Oleh: {aset.penanggungJawab}
                    </div>
                  </div>
                </div>

                {/* Lokasi Spasial Koordinat GPS */}
                <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Koordinat Lokasi Aset (GPS)</div>
                      <div className="font-mono text-slate-300 text-[11px]">
                        {aset.koordinat.lat.toFixed(6)}, {aset.koordinat.lng.toFixed(6)}
                      </div>
                      <div className="text-[10px] text-emerald-400/90 mt-0.5">
                        Titik Awal: Kantor Desa Beliti Jaya (-2.971973, 103.152321)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      id="btn-copy-asset-coords"
                      onClick={handleCopyCoords}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      title="Salin Koordinat GPS"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCoords ? 'Tersalin!' : 'Salin GPS'}</span>
                    </button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=-2.971973,103.152321&destination=${aset.koordinat.lat},${aset.koordinat.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold shadow-md shadow-blue-950/50"
                      title="Buka Rute Google Maps dari Kantor Desa Beliti Jaya (-2.971973, 103.152321) menuju titik aset ini"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Rute Maps</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* KOLOM KANAN (Tabel Spesifikasi Lengkap KIB & Catatan Riwayat) - lg:col-span-6 */}
              <div className="lg:col-span-6 space-y-4">
                {/* Spesifikasi Lengkap Tabel Data KIB */}
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Spesifikasi & Dokumen Inventaris (KIB)</span>
                    </div>
                    {onOpenBukuInventaris && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenBukuInventaris();
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Buka Lembar KIB</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Kode Inventaris / KIB</span>
                      <span className="font-mono font-semibold text-slate-200">{aset.kodeRegister}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Klasifikasi KIB</span>
                      <span className="font-semibold text-slate-200">{aset.subKategori}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Kategori Aset</span>
                      <span className="font-semibold text-slate-200">
                        {isPembangunan ? 'Aset Pembangunan Fisik' : 'Aset Non-Pembangunan'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Nilai Perolehan</span>
                      <span className="font-bold text-emerald-300">{formatRupiah(aset.nilaiPerolehan)}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Sumber Perolehan</span>
                      <span className="font-semibold text-slate-200 text-right">{aset.asalUsul || 'Pengadaan APBDes'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Sumber Pembiayaan / Dana</span>
                      <span className="font-semibold text-slate-200 text-right">{aset.sumberDana}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Luas / Volume Fisik</span>
                      <span className="font-semibold text-slate-200">{aset.luasAtauVolume || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Penanggung Jawab</span>
                      <span className="font-semibold text-slate-200">{aset.penanggungJawab}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Wilayah Dusun</span>
                      <span className="font-semibold text-slate-200">{aset.dusun}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Tahun Pengadaan</span>
                      <span className="font-semibold text-slate-200">{aset.tahunPengadaan}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Kondisi Fisik</span>
                      <span className="font-semibold text-slate-200">{aset.kondisi}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                      <span className="text-slate-400">Status Pemanfaatan</span>
                      <span className="font-semibold text-slate-200">{aset.statusPemanfaatan}</span>
                    </div>
                  </div>

                  {/* Keterangan / Deskripsi Riwayat */}
                  {aset.keterangan && (
                    <div className="pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400 block mb-1 font-semibold">Deskripsi / Catatan Riwayat Aset:</span>
                      <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                        {aset.keterangan}
                      </p>
                    </div>
                  )}

                  {/* Ringkasan Status Dokumentasi Foto */}
                  <div className="pt-2 border-t border-slate-800 text-xs flex items-center justify-between text-slate-400">
                    <span>Dokumentasi Tersedia:</span>
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      {photoButtonLabels.slice(0, Math.min(validPhotos.length, 4)).map((btnLbl, bIdx) => (
                        <span key={bIdx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-300">
                          {btnLbl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Box Legalitas & Info Pemerintahan Desa Beliti Jaya */}
                <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-3.5 text-xs text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Landmark className="w-4 h-4 text-amber-400" />
                    <span>Pemerintah Desa Beliti Jaya, Kec. Muara Kelingi</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Aset ini terdaftar secara sah dalam Buku Inventaris Desa Beliti Jaya sesuai Permendagri No. 1 Tahun 2016 tentang Pengelolaan Aset Desa dan tersinkronisasi dalam Peta Spasial SIG Desa.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
            {onOpenBukuInventaris ? (
              <button
                type="button"
                id="btn-switch-to-buku-inventaris"
                onClick={() => {
                  onClose();
                  onOpenBukuInventaris();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors py-1.5 px-2.5 rounded-xl hover:bg-amber-500/10"
                title="Buka Buku Inventaris Lengkap Seluruh Aset Desa"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Buka Buku Inventaris Desa</span>
              </button>
            ) : <div />}

            {/* Tombol Tutup Rincian Aset Dibuat Kecil */}
            <button
              type="button"
              id="btn-close-asset-detail-bottom"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Tutup Rincian Aset"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup Rincian Aset</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}

      {/* Lightbox Zoom Modal for High-Resolution Image Viewing */}
      {zoomedImage && (
        <motion.div 
          id="modal-asset-photo-lightbox"
          key="modal-asset-photo-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[700] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setZoomedImage(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-3 overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 px-2 text-white border-b border-slate-800">
              <span className="text-xs sm:text-sm font-bold truncate max-w-md">{zoomedImage.title}</span>
              <div className="flex items-center gap-2">
                {zoomedImage.originalUrl && (
                  <a
                    href={zoomedImage.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1 transition-all border border-slate-700"
                    title="Buka File Foto Asli"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Sumber Asli</span>
                  </a>
                )}
                <button 
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/70 hover:border-rose-500/30 transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-90"
                  title="Tutup Pratinjau Foto"
                  aria-label="Tutup Pratinjau Foto"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center overflow-auto rounded-2xl bg-black/50 p-1">
              <img 
                src={zoomedImage.url} 
                alt={zoomedImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};

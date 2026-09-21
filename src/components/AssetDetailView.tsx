import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { AsetDesa, DesaProfile, User } from '../types';
import { 
  resolveImageUrl, 
  isGoogleDriveUrl 
} from '../utils/imageUtils';
import { generateAssetProfilePDF, formatRupiah } from '../utils/pdfExport';
import { 
  ArrowLeft,
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
  Check,
  ExternalLink,
  Compass,
  FileSpreadsheet,
  Layers,
  Camera,
  Maximize2,
  Printer,
  Edit3,
  Image as ImageIcon,
  ShieldCheck,
  Tag,
  Coins,
  Navigation,
  FileText,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Sparkles,
  Activity,
  Wrench,
  FileCheck
} from 'lucide-react';

interface AssetDetailViewProps {
  aset: AsetDesa;
  onBack: () => void;
  onOpenBukuInventaris?: () => void;
  onEditAset?: (aset: AsetDesa) => void;
  desaProfile?: DesaProfile;
  currentUser?: User | null;
  backLabel?: string;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({
  aset,
  onBack,
  onOpenBukuInventaris,
  onEditAset,
  desaProfile,
  currentUser,
  backLabel = 'Kembali ke Peta'
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string; originalUrl: string } | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'spesifikasi' | 'analisis' | 'legalitas'>('spesifikasi');

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);

  // Kantor Desa Beliti Jaya Coordinates
  const KANTOR_DESA_COORDS = { lat: -2.971973, lng: 103.152321 };

  // Calculate distance in meters using Haversine formula
  const distanceInfo = useMemo(() => {
    if (!aset?.koordinat) return null;
    const R = 6371e3; // metres
    const φ1 = (KANTOR_DESA_COORDS.lat * Math.PI) / 180;
    const φ2 = (aset.koordinat.lat * Math.PI) / 180;
    const Δφ = ((aset.koordinat.lat - KANTOR_DESA_COORDS.lat) * Math.PI) / 180;
    const Δλ = ((aset.koordinat.lng - KANTOR_DESA_COORDS.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    const distanceFormatted = d >= 1000 ? `${(d / 1000).toFixed(2)} km` : `${Math.round(d)} meter`;
    // Estimasi waktu tempuh sepeda motor (~30 km/jam)
    const travelTimeMinutes = Math.max(1, Math.round((d / 1000 / 30) * 60));

    return {
      rawMeters: d,
      formatted: distanceFormatted,
      travelTime: `${travelTimeMinutes} mnt perjalanan`
    };
  }, [aset?.koordinat]);

  // Usia Aset & Estimasi Siklus Pemeliharaan
  const assetAgeInfo = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const tahunPengadaan = Number(aset.tahunPengadaan) || currentYear;
    const usiaTahun = Math.max(0, currentYear - tahunPengadaan);
    return {
      usiaTahun,
      text: usiaTahun === 0 ? 'Tahun Berjalan (Baru)' : `${usiaTahun} Tahun Operasional`,
      nextInspectionYear: currentYear + 1
    };
  }, [aset?.tahunPengadaan]);

  // Reset photo index and error state when asset changes
  useEffect(() => {
    setSelectedPhotoIdx(0);
    setImageLoadError(false);
  }, [aset?.id]);

  useEffect(() => {
    setImageLoadError(false);
  }, [selectedPhotoIdx]);

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomedImage) {
          setZoomedImage(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage, onBack]);

  // Initialize Interactive Leaflet Mini Map
  useEffect(() => {
    if (!miniMapContainerRef.current || !aset?.koordinat) return;

    if (miniMapInstanceRef.current) {
      miniMapInstanceRef.current.remove();
      miniMapInstanceRef.current = null;
    }

    try {
      const miniMap = L.map(miniMapContainerRef.current, {
        center: [aset.koordinat.lat, aset.koordinat.lng],
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false
      });

      // Satellite Imagery Layer
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(miniMap);

      // Custom pulsing pin icon
      const isPembangunan = aset.kategori === 'pembangunan';
      const pinColor = isPembangunan ? '#0284c7' : '#059669';
      const pinBorder = isPembangunan ? '#38bdf8' : '#34d399';
      const categoryIcon = isPembangunan ? '🏗️' : '🏛️';

      const customIcon = L.divIcon({
        className: 'asset-detail-mini-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 42px;
              height: 42px;
              border-radius: 50%;
              border: 2px solid ${pinBorder};
              animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
              background-color: rgba(56, 189, 248, 0.25);
            "></div>
            <div style="
              width: 34px;
              height: 34px;
              background: linear-gradient(135deg, ${pinColor}, #0f172a);
              border: 2.5px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 14px rgba(0,0,0,0.65);
            ">
              <span style="transform: rotate(45deg); font-size: 14px;">${categoryIcon}</span>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      L.marker([aset.koordinat.lat, aset.koordinat.lng], { icon: customIcon }).addTo(miniMap);

      // Radius circle indicating approximate asset perimeter
      L.circle([aset.koordinat.lat, aset.koordinat.lng], {
        radius: 35,
        color: pinBorder,
        fillColor: pinColor,
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '3, 6'
      }).addTo(miniMap);

      miniMapInstanceRef.current = miniMap;

      // Invalidate size initially and on container resize
      setTimeout(() => {
        miniMap.invalidateSize();
      }, 150);

      const resizeObserver = new ResizeObserver(() => {
        if (miniMapInstanceRef.current) {
          miniMapInstanceRef.current.invalidateSize();
        }
      });
      if (miniMapContainerRef.current) {
        resizeObserver.observe(miniMapContainerRef.current);
      }
    } catch (e) {
      console.warn('Mini-map initialization notice:', e);
    }

    return () => {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
    };
  }, [aset?.id, aset?.koordinat?.lat, aset?.koordinat?.lng, aset?.kategori]);

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

  const isPembangunan = aset.kategori === 'pembangunan';
  const activePhoto = validPhotos[selectedPhotoIdx] || validPhotos[0] || aset.foto || '';
  const isDrive = isGoogleDriveUrl(activePhoto);
  const resolvedActivePhoto = resolveImageUrl(activePhoto);

  const handleCopyCoords = () => {
    if (!aset?.koordinat) return;
    const text = `${aset.koordinat.lat}, ${aset.koordinat.lng}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2200);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await generateAssetProfilePDF(aset, desaProfile);
    } catch (err) {
      console.error('Gagal mencetak dokumen KIB Aset:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const photoButtonLabels = ['Foto Satu', 'Foto Dua', 'Foto Tiga', 'Foto 4'];
  const photoAngleLabels = [
    'Tampak Depan Utama',
    'Tampak Samping & Konstruksi',
    'Papan Nama / Prasasti KIB',
    'Pemanfaatan Warga Desa'
  ];

  const handlePrevPhoto = () => {
    if (validPhotos.length <= 1) return;
    setSelectedPhotoIdx(prev => (prev === 0 ? validPhotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    if (validPhotos.length <= 1) return;
    setSelectedPhotoIdx(prev => (prev === validPhotos.length - 1 ? 0 : prev + 1));
  };

  // Status Gauge & Condition Helpers
  const conditionConfig = useMemo(() => {
    if (aset.kondisi === 'Baik') {
      return {
        label: 'Kondisi: Baik (Prima)',
        percentage: 100,
        color: 'emerald',
        textColor: 'text-emerald-300',
        borderColor: 'border-emerald-500/40',
        bgColor: 'bg-emerald-500/15',
        dotColor: 'bg-emerald-400',
        barColor: 'from-emerald-600 to-teal-400',
        statusNote: 'Aset berfungsi normal tanpa kendala fisik dan layak pakai melayani masyarakat desa.'
      };
    }
    if (aset.kondisi === 'Rusak Ringan') {
      return {
        label: 'Kondisi: Rusak Ringan',
        percentage: 65,
        color: 'amber',
        textColor: 'text-amber-300',
        borderColor: 'border-amber-500/40',
        bgColor: 'bg-amber-500/15',
        dotColor: 'bg-amber-400',
        barColor: 'from-amber-600 to-yellow-400',
        statusNote: 'Ditemukan penurunan fungsi non-struktural, direkomendasikan perbaikan preventif.'
      };
    }
    return {
      label: 'Kondisi: Rusak Berat',
      percentage: 25,
      color: 'rose',
      textColor: 'text-rose-300',
      borderColor: 'border-rose-500/40',
      bgColor: 'bg-rose-500/15',
      dotColor: 'bg-rose-400',
      barColor: 'from-rose-600 to-red-400',
      statusNote: 'Fisik rusak parah / tidak berfungsi. Perlu renovasi total atau pengusulan penghapusan aset.'
    };
  }, [aset.kondisi]);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'operator_aset';

  // KIB Category Label Generator
  const getKibClassification = () => {
    const sub = (aset.subKategori || '').toLowerCase();
    if (sub.includes('tanah') || sub.includes('lahan')) {
      return { code: 'KIB A', title: 'Tanah & Lahan Kas Desa' };
    }
    if (sub.includes('mesin') || sub.includes('kendaraan') || sub.includes('peralatan')) {
      return { code: 'KIB B', title: 'Peralatan & Mesin Desa' };
    }
    if (sub.includes('gedung') || sub.includes('bangunan') || sub.includes('kantor') || sub.includes('posko')) {
      return { code: 'KIB C', title: 'Gedung & Bangunan' };
    }
    if (sub.includes('jalan') || sub.includes('jembatan') || sub.includes('irigasi') || sub.includes('drainase') || sub.includes('siring')) {
      return { code: 'KIB D', title: 'Jalan, Irigasi & Jaringan' };
    }
    return { code: isPembangunan ? 'KIB D' : 'KIB E', title: isPembangunan ? 'Sarana Prasarana Fisik' : 'Aset Tetap Lainnya' };
  };

  const kibInfo = getKibClassification();

  return (
    <motion.div 
      id="view-asset-detail-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-7xl mx-auto space-y-6 pb-20 pt-1 text-slate-100"
    >
      {/* ========================================================================= */}
      {/* 2. HERO COMMAND-CENTER HEADER BANNER                                      */}
      {/* ========================================================================= */}
      <div className={`relative overflow-hidden rounded-3xl border ${
        isPembangunan
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/50 border-blue-500/30'
          : 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/50 border-emerald-500/30'
      } p-6 sm:p-8 shadow-2xl`}>
        
        {/* Ambient Spatial Glow FX */}
        <div className={`absolute -top-28 -right-28 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
          isPembangunan ? 'bg-blue-500/15' : 'bg-emerald-500/15'
        }`}></div>
        <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          
          {/* Top Classification Badges Row with Clean Back Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Navigasi Kembali Cepat */}
            <button
              type="button"
              id="btn-back-hero"
              onClick={onBack}
              className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800/95 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/90 hover:border-emerald-500/50 transition-all cursor-pointer shadow-md active:scale-95"
              title={`${backLabel} (Tekan ESC)`}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 transition-transform group-hover:-translate-x-0.5" />
              <span>{backLabel}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900/90 text-slate-400 border border-slate-700 ml-0.5">
                ESC
              </kbd>
            </button>

            {/* Category Pill */}
            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md ${
              isPembangunan
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/50'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
            }`}>
              {isPembangunan ? <HardHat className="w-3.5 h-3.5 text-blue-400" /> : <Building2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPembangunan ? 'Aset Pembangunan Fisik (Infrastruktur / Sarpras)' : 'Aset Non-Pembangunan (KIB A-B-E)'}</span>
            </span>

            {/* KIB Classification Pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-800/90 text-amber-300 border border-amber-500/40 shadow-xs">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>{kibInfo.code} • {kibInfo.title}</span>
            </span>

            {/* Kode Register */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-xs">
              <span>Reg: {aset.kodeRegister}</span>
            </span>

            {/* Dusun Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 text-emerald-300 border border-emerald-500/30 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{aset.dusun}</span>
            </span>

            {/* Dynamic Condition Badge */}
            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${conditionConfig.bgColor} ${conditionConfig.textColor} border ${conditionConfig.borderColor} shadow-xs`}>
              <span className={`w-2.5 h-2.5 rounded-full ${conditionConfig.dotColor} animate-pulse`}></span>
              <span>{conditionConfig.label}</span>
            </span>
          </div>

          {/* Title & Core Details */}
          <div className="space-y-2 pt-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
              {aset.namaAset}
            </h1>
            
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 flex-wrap font-medium">
              <span className="text-slate-200 font-semibold">{aset.subKategori || 'Aset Milik Desa'}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">Pemerintah Desa Beliti Jaya, Kec. Muara Kelingi, Kab. Musi Rawas</span>
              {distanceInfo && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-400/95 font-semibold flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    <span>± {distanceInfo.formatted} dari Kantor Desa ({distanceInfo.travelTime})</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Condition Health Bar Meter */}
          <div className="pt-2 max-w-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Indeks Kelayakan Fisik Aset:</span>
              </span>
              <span className={`font-mono font-bold ${conditionConfig.textColor}`}>
                {conditionConfig.percentage}% ({aset.kondisi})
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${conditionConfig.percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${conditionConfig.barColor} shadow-md`}
              />
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {conditionConfig.statusNote}
            </p>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. KEY METRICS STATS SUMMARY BAR                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Nilai Perolehan */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Nilai Perolehan Aset</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {formatRupiah(aset.nilaiPerolehan)}
            </div>
            <div className="text-xs text-emerald-400/90 mt-1 font-medium">
              Asal Usul: {aset.asalUsul || 'Pengadaan APBDes'}
            </div>
          </div>
        </div>

        {/* Metric 2: Tahun Pengadaan & Usia */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between hover:border-blue-500/40 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Tahun Pengadaan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Tahun {aset.tahunPengadaan}
            </div>
            <div className="text-xs text-blue-300/90 mt-1 font-medium truncate" title={aset.sumberDana}>
              {assetAgeInfo.text} • {aset.sumberDana}
            </div>
          </div>
        </div>

        {/* Metric 3: Penanggung Jawab */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Penanggung Jawab</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-white tracking-tight truncate" title={aset.penanggungJawab}>
              {aset.penanggungJawab}
            </div>
            <div className="text-xs text-amber-400/90 mt-1 font-medium truncate">
              Wilayah Operasional {aset.dusun}
            </div>
          </div>
        </div>

        {/* Metric 4: Dimensi / Volume Fisik */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-5 shadow-lg flex flex-col justify-between hover:border-purple-500/40 transition-all group">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Volume / Dimensi Fisik</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-white tracking-tight truncate" title={aset.luasAtauVolume || '-'}>
              {aset.luasAtauVolume || 'Tercatat dalam KIB'}
            </div>
            <div className="text-xs text-purple-300/90 mt-1 font-medium">
              Pemanfaatan: {aset.statusPemanfaatan}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT GRID: FOTO LAPANGAN (KIRI) & GEOSPASIAL GIS (KANAN)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ------------------------------------------------------------------------- */}
        {/* KOLOM KIRI (7 Kolom): GALERI FOTO INTERAKTIF MODERN                       */}
        {/* ------------------------------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col h-full">
          
          <div className="bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-5 sm:p-6 shadow-xl flex flex-col h-full justify-between space-y-4">
            
            {/* Gallery Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Galeri Dokumentasi Foto Aset</h3>
                  <p className="text-xs text-slate-400">Verifikasi fisik lapangan 4 sudut pandang resmi inventaris</p>
                </div>
              </div>

              {validPhotos.length > 0 && (
                <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-slate-800 text-emerald-300 border border-emerald-500/30">
                  Foto {selectedPhotoIdx + 1} dari {validPhotos.length}
                </span>
              )}
            </div>

            {/* Main Interactive Photo Viewer with In-Image Next/Prev Buttons */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group flex-1 min-h-[260px] sm:min-h-[290px] flex flex-col">
              <div className="w-full h-full min-h-[260px] sm:min-h-[290px] relative bg-slate-950 flex items-center justify-center select-none flex-1">
                
                {activePhoto && !imageLoadError ? (
                  <div className="w-full h-full relative">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={resolvedActivePhoto}
                        src={resolvedActivePhoto}
                        alt={aset.namaAset}
                        referrerPolicy="no-referrer"
                        initial={{ opacity: 0, scale: 1.01 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full object-cover object-center cursor-pointer transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        onClick={() => setZoomedImage({
                          url: resolvedActivePhoto,
                          title: `${aset.namaAset} - ${photoButtonLabels[selectedPhotoIdx] || `Foto ${selectedPhotoIdx + 1}`} (${photoAngleLabels[selectedPhotoIdx] || ''})`,
                          originalUrl: activePhoto
                        })}
                        onError={() => setImageLoadError(true)}
                      />
                    </AnimatePresence>

                    {/* Gradient Overlay for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/25 pointer-events-none"></div>

                    {/* Left & Right In-Image Navigation Arrows */}
                    {validPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrevPhoto();
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/80 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 hover:border-emerald-400 flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer z-10 opacity-85 hover:opacity-100"
                          title="Foto Sebelumnya (Panah Kiri)"
                          aria-label="Foto Sebelumnya"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextPhoto();
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/80 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 hover:border-emerald-400 flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer z-10 opacity-85 hover:opacity-100"
                          title="Foto Berikutnya (Panah Kanan)"
                          aria-label="Foto Berikutnya"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {/* Angle Badge Tag (Top Left) */}
                    <div className="absolute top-3.5 left-3.5 pointer-events-none z-10">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/40 shadow-lg flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{photoAngleLabels[selectedPhotoIdx] || `Sudut Pandang #${selectedPhotoIdx + 1}`}</span>
                      </span>
                    </div>

                    {/* Zoom Trigger Pill (Top Right) */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => setZoomedImage({
                          url: resolvedActivePhoto,
                          title: `${aset.namaAset} - ${photoButtonLabels[selectedPhotoIdx] || `Foto ${selectedPhotoIdx + 1}`} (${photoAngleLabels[selectedPhotoIdx] || ''})`,
                          originalUrl: activePhoto
                        })}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md text-white border border-white/20 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                        title="Perbesar Foto (Mode Lightbox)"
                      >
                        <Maximize2 className="w-4 h-4 text-slate-200" />
                      </button>
                    </div>

                    {/* Bottom Caption Overlay & Pagination Dots */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-3 pointer-events-none z-10">
                      <div>
                        <div className="text-sm font-bold text-white drop-shadow-md flex items-center gap-2">
                          <span>{photoButtonLabels[selectedPhotoIdx] || `Foto ${selectedPhotoIdx + 1}`}</span>
                          <span>—</span>
                          <span className="text-emerald-300">{photoAngleLabels[selectedPhotoIdx] || ''}</span>
                        </div>
                        <div className="text-xs text-slate-300 drop-shadow-sm mt-0.5">
                          Dokumentasi resmi {aset.namaAset} ({aset.dusun})
                        </div>
                      </div>

                      {/* Clean Pagination Dots (when multiple photos exist) */}
                      {validPhotos.length > 1 && (
                        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 shadow-lg shrink-0">
                          {validPhotos.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhotoIdx(idx);
                                setImageLoadError(false);
                              }}
                              className={`h-2 rounded-full transition-all cursor-pointer ${
                                selectedPhotoIdx === idx
                                  ? 'w-6 bg-emerald-400 shadow-sm'
                                  : 'w-2 bg-white/40 hover:bg-white/80'
                              }`}
                              title={`Pindah ke Foto ${idx + 1} (${photoAngleLabels[idx] || ''})`}
                              aria-label={`Pindah ke Foto ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : activePhoto && imageLoadError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 text-slate-300 gap-3">
                    <ImageIcon className="w-12 h-12 text-amber-400/80" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Pratinjau Foto Langsung Tidak Tersedia</p>
                      <p className="text-xs text-slate-400 max-w-md">
                        {isDrive 
                          ? "Tautan Google Drive memerlukan izin akses publik ('Siapa saja yang memiliki link'). Anda tetap dapat membuka file asli melalui tombol di bawah."
                          : "Foto tidak dapat dimuat langsung oleh browser dari tautan sumber."}
                      </p>
                    </div>
                    <a
                      href={activePhoto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka File Foto Asli</span>
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/60 text-slate-400 gap-2.5 p-6 text-center">
                    <Building2 className="w-12 h-12 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-300">Belum ada foto dokumentasi diunggah</span>
                    <span className="text-xs text-slate-500">Gunakan tombol Edit Aset untuk memperbarui foto dokumentasi</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compact 4-Photo Perspective Cards (Sesuai Desain Foto Pilihan Ukuran Diperkecil) */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold px-0.5">
                <span className="text-slate-300">Pilih Sudut Pandang Foto Dokumentasi:</span>
                <span className="text-[11px] text-slate-500 font-normal">Klik sudut pandang untuk melihat</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((idx) => {
                  const pUrl = validPhotos[idx];
                  const btnLabel = photoButtonLabels[idx];
                  const angleLabel = photoAngleLabels[idx];
                  const isSelected = selectedPhotoIdx === idx;
                  const hasPhoto = Boolean(pUrl);
                  const resolvedUrl = pUrl ? resolveImageUrl(pUrl) : '';

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (hasPhoto) {
                          setSelectedPhotoIdx(idx);
                          setImageLoadError(false);
                        }
                      }}
                      className={`flex flex-col p-1.5 sm:p-2 rounded-xl sm:rounded-2xl text-left transition-all duration-200 border relative ${
                        !hasPhoto
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'bg-slate-950/90 border-emerald-500/90 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/40 scale-[1.01] cursor-pointer'
                            : 'bg-slate-950/70 border-slate-800/90 hover:bg-slate-900/90 hover:border-slate-700 text-slate-300 cursor-pointer'
                      }`}
                      title={hasPhoto ? `Lihat ${btnLabel} - ${angleLabel}` : 'Belum ada foto dokumentasi untuk sudut ini'}
                    >
                      {/* Compact Photo Thumbnail */}
                      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800/80 mb-1.5 shrink-0 flex items-center justify-center">
                        {hasPhoto ? (
                          <>
                            <img
                              src={resolvedUrl}
                              alt={btnLabel}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = '0.35';
                              }}
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-emerald-500/10 ring-1 ring-emerald-400/40 pointer-events-none"></div>
                            )}
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-500 flex flex-col items-center justify-center gap-0.5">
                            <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                            <span>Kosong</span>
                          </div>
                        )}

                        {/* Status dot in top right */}
                        <span 
                          className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 shadow-xs ${
                            hasPhoto ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                          title={hasPhoto ? 'Foto tersedia' : 'Foto belum diunggah'}
                        />
                      </div>

                      {/* Labels */}
                      <div className="min-w-0 px-0.5">
                        <div className={`text-xs sm:text-[11px] font-bold truncate leading-snug ${
                          isSelected ? 'text-emerald-400' : hasPhoto ? 'text-slate-100' : 'text-slate-500'
                        }`}>
                          {btnLabel}
                        </div>
                        <div className="text-[9.5px] sm:text-[10px] text-slate-400 truncate mt-0.5 leading-snug">
                          {angleLabel}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clean Gallery Footer Bar: Current Angle Info & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 font-semibold">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{photoAngleLabels[selectedPhotoIdx] || `Dokumentasi #${selectedPhotoIdx + 1}`}</span>
                </span>
                {validPhotos.length > 1 && (
                  <span className="text-[11px] text-slate-400">
                    Klik panah kiri/kanan pada foto untuk melihat sudut lainnya ({validPhotos.length} foto)
                  </span>
                )}
              </div>

              {canEdit && onEditAset && (
                <button
                  type="button"
                  onClick={() => onEditAset(aset)}
                  className="text-xs text-indigo-300 hover:text-white font-semibold flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl hover:bg-indigo-600/20 border border-indigo-500/30 transition-all cursor-pointer self-end sm:self-auto"
                  title="Perbarui atau lengkapi foto dokumentasi aset"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Perbarui / Tambah Foto</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* KOLOM KANAN (5 Kolom): PETA SPASIAL MINI & ALAT GEOGRAFIS (SUSUNAN PAS)    */}
        {/* ------------------------------------------------------------------------- */}
        <div className="lg:col-span-5 flex flex-col h-full">
          
          <div className="bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-5 sm:p-6 shadow-xl flex flex-col h-full justify-between space-y-4">
            
            {/* Header Mini Map */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Peta Lokasi Spasial Aset</h3>
                  <p className="text-xs text-slate-400">Citra satelit resolusi tinggi koordinat terverifikasi</p>
                </div>
              </div>

              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Aktif Terpetakan</span>
              </span>
            </div>

            {/* Embedded Live Leaflet Satellite Mini Map */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group flex-1 min-h-[230px] sm:min-h-[250px] flex flex-col">
              <div 
                ref={miniMapContainerRef} 
                className="w-full h-full min-h-[230px] sm:min-h-[250px] relative z-0 flex-1"
              />

              {/* Floating Coordinates Tag inside map */}
              <div className="absolute top-3 left-3 z-10">
                <div className="px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md text-[11px] font-mono text-emerald-300 border border-emerald-500/40 shadow-lg flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{aset.koordinat.lat.toFixed(6)}, {aset.koordinat.lng.toFixed(6)}</span>
                </div>
              </div>

              {/* Floating Return Shortcut */}
              <div className="absolute bottom-3 right-3 z-10">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md text-slate-200 hover:text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
                  title="Lihat Titik Ini pada Peta GIS Utama"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  <span>Fokuskan di Peta Utama</span>
                </button>
              </div>
            </div>

            {/* Geolocation Details & Distance */}
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
              
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Titik Koordinat (GPS)</span>
                <span className="font-mono font-bold text-slate-200">
                  {aset.koordinat.lat.toFixed(6)}, {aset.koordinat.lng.toFixed(6)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Titik Titik Tolok / Origin</span>
                <span className="text-slate-200 text-right">
                  Kantor Desa Beliti Jaya
                </span>
              </div>

              {distanceInfo && (
                <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Estimasi Jarak dari Kantor</span>
                  <span className="font-bold text-amber-400">
                    ± {distanceInfo.formatted} ({distanceInfo.travelTime})
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Wilayah Dusun</span>
                <span className="font-semibold text-emerald-400">
                  {aset.dusun}, Desa Beliti Jaya
                </span>
              </div>

              {/* SUSUNAN TOMBOL SPASIAL DI SISI YANG SANGAT PAS (Tepat di Bawah Peta & Koordinat) */}
              <div className="pt-2.5 grid grid-cols-2 gap-2">
                {/* Tombol Kiri: Salin Koordinat */}
                <button
                  type="button"
                  id="btn-spatial-copy-coords"
                  onClick={handleCopyCoords}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Salin Koordinat GPS ke Clipboard"
                >
                  {copiedCoords ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Salin GPS</span>
                    </>
                  )}
                </button>

                {/* Tombol Kanan: Buka Rute Google Maps */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${KANTOR_DESA_COORDS.lat},${KANTOR_DESA_COORDS.lng}&destination=${aset.koordinat.lat},${aset.koordinat.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-950/50 active:scale-95 cursor-pointer"
                  title="Buka Navigasi Arah dari Kantor Desa menuju titik aset ini di Google Maps"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Rute Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-blue-200" />
                </a>
              </div>
            </div>

            {/* Quick Digital QR Tag Audit Stamp */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Inventaris Digital Terverifikasi</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ID Aset: <span className="font-mono text-slate-300">{aset.id}</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                KIB DESA
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. TABBED SECTION: SPESIFIKASI KIB, ANALISIS USIA, & AUDIT LEGALITAS     */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-5 sm:p-7 shadow-xl space-y-6">
        
        {/* Tab Headers with Pro Modern Styling */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubTab('spesifikasi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'spesifikasi'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Spesifikasi KIB Lengkap</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('analisis')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'analisis'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Analisis & Usia Aset</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('legalitas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'legalitas'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Legalitas & Standar</span>
            </button>
          </div>

          {/* Quick Action on Tab Header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-emerald-500/10 border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Lembar KIB</span>
            </button>
          </div>

        </div>

        {/* TAB 1: SPESIFIKASI KIB LENGKAP */}
        {activeSubTab === 'spesifikasi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Group 1: Identitas Registrasi */}
              <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 space-y-3">
                <div className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Identitas Registrasi KIB</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kode Inventaris / KIB</span>
                    <span className="font-mono font-bold text-white bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                      {aset.kodeRegister}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Nama Aset Terdaftar</span>
                    <span className="font-semibold text-slate-200 text-right truncate max-w-[200px]" title={aset.namaAset}>
                      {aset.namaAset}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Klasifikasi KIB</span>
                    <span className="font-semibold text-slate-200 text-right">{kibInfo.code} - {aset.subKategori || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kategori Sifat Aset</span>
                    <span className="font-semibold text-slate-200">
                      {isPembangunan ? 'Aset Pembangunan Fisik (KIB C-D)' : 'Aset Non-Pembangunan (KIB A-B-E)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group 2: Aspek Keuangan & Anggaran */}
              <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 space-y-3">
                <div className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Anggaran & Pembiayaan</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Nilai Perolehan</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {formatRupiah(aset.nilaiPerolehan)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Sumber Pembiayaan</span>
                    <span className="font-semibold text-slate-200 text-right">{aset.sumberDana || 'APBDes'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Asal Usul Perolehan</span>
                    <span className="font-semibold text-slate-200 text-right">{aset.asalUsul || 'Pengadaan APBDes'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tahun Pembukuan</span>
                    <span className="font-semibold text-slate-200">Tahun {aset.tahunPengadaan}</span>
                  </div>
                </div>
              </div>

              {/* Group 3: Fisik & Lapangan */}
              <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 space-y-3">
                <div className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                  <HardHat className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dimensi Fisik & Lapangan</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kondisi Fisik Terkini</span>
                    <span className={`font-semibold ${conditionConfig.textColor}`}>{aset.kondisi}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Volume / Dimensi Fisik</span>
                    <span className="font-semibold text-slate-200">{aset.luasAtauVolume || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Wilayah Lokasi Dusun</span>
                    <span className="font-semibold text-emerald-400">{aset.dusun}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status Pemanfaatan</span>
                    <span className="font-semibold text-slate-200">{aset.statusPemanfaatan}</span>
                  </div>
                </div>
              </div>

              {/* Group 4: Tata Kelola & Legalitas */}
              <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 space-y-3">
                <div className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Landmark className="w-3.5 h-3.5 text-teal-400" />
                  <span>Tata Kelola & Legalitas</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Penanggung Jawab</span>
                    <span className="font-semibold text-slate-200 text-right">{aset.penanggungJawab}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Pemerintah Desa</span>
                    <span className="font-semibold text-slate-200">Desa Beliti Jaya</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kecamatan / Kabupaten</span>
                    <span className="font-semibold text-slate-200">Muara Kelingi / Musi Rawas</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Regulasi Acuan</span>
                    <span className="font-semibold text-slate-300">Permendagri 1/2016</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Deskripsi Riwayat & Catatan Lapangan */}
            {aset.keterangan && (
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-xs space-y-2">
                <div className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deskripsi Riwayat Pengadaan & Catatan Lapangan:</span>
                </div>
                <p className="text-slate-200 leading-relaxed bg-slate-900/70 p-3.5 rounded-xl border border-slate-800/80">
                  {aset.keterangan}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANALISIS USIA & PEMELIHARAAN */}
        {activeSubTab === 'analisis' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Siklus Operasional Aset</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {assetAgeInfo.usiaTahun} Tahun
                </div>
                <p className="text-xs text-slate-400">
                  Aset diadakan pada tahun {aset.tahunPengadaan}. Telah aktif melayani kepentingan umum di wilayah {aset.dusun}.
                </p>
              </div>

              <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Status Kebugaran Fisik</span>
                </div>
                <div className={`text-2xl font-black ${conditionConfig.textColor}`}>
                  {aset.kondisi}
                </div>
                <p className="text-xs text-slate-400">
                  Indeks fungsi fisik terukur pada angka {conditionConfig.percentage}%.
                </p>
              </div>

              <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Jadwal Audit Fisik</span>
                </div>
                <div className="text-2xl font-black text-amber-300">
                  Tahun {assetAgeInfo.nextInspectionYear}
                </div>
                <p className="text-xs text-slate-400">
                  Pemeriksaan berkala tahunan oleh Kaur Perencanaan & Kaur Pembangunan Desa Beliti Jaya.
                </p>
              </div>

            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Rekomendasi Pemeliharaan & Tindak Lanjut:</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {aset.kondisi === 'Baik' 
                  ? 'Kondisi fisik aset terpelihara dengan sangat prima. Lanjutkan pemantauan rutin dan pembersihan area sekitar agar daya tahan aset bertahan hingga usia ekonomis maksimal.'
                  : aset.kondisi === 'Rusak Ringan'
                    ? 'Diperlukan alokasi anggaran pemeliharaan rutin pada RKPDes tahun berjalan untuk perbaikan bagian yang aus sebelum kerusakan meluas ke elemen struktur utama.'
                    : 'Disarankan segera dilakukan musyawarah desa bersama BPD untuk menentukan prioritas rehab total atau pengajuan mutasi/penghapusan aset sesuai Permendagri No. 1/2016.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: LEGALITAS & STANDAR AUDIT */}
        {activeSubTab === 'legalitas' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Buku Inventaris Sah</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Tercatat dalam Buku Inventaris Aset Desa Beliti Jaya berdasarkan Peraturan Menteri Dalam Negeri Nomor 1 Tahun 2016 tentang Pengelolaan Aset Desa.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Geolokasi Presisi</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Data geospasial telah diverifikasi melalui pemetaan satelit SIG dan dapat diaudit secara real-time melalui navigasi GPS lapangan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dokumentasi 4 Sudut</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Dilengkapi bukti dokumentasi visual fisik lapangan untuk akuntabilitas pelaporan keuangan dan pertanggungjawaban kepada masyarakat.
                </p>
              </div>

            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Pemerintah Desa Beliti Jaya</div>
                  <div className="text-[11px] text-slate-400">
                    Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unduh Surat Keterangan KIB (PDF)</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM FLOATING ACTION BAR (ERGONOMI SEMPURNA KETIKA USER SCROLL KE BAWAH) */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-3 sm:px-6 rounded-3xl shadow-2xl sticky bottom-4 z-40">
        
        {/* Sisi Kiri: Kembali */}
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          title={backLabel}
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>{backLabel}</span>
        </button>

        {/* Sisi Kanan: Rute Maps, Cetak & Edit */}
        <div className="flex items-center gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${KANTOR_DESA_COORDS.lat},${KANTOR_DESA_COORDS.lng}&destination=${aset.koordinat.lat},${aset.koordinat.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex px-3.5 py-2.5 rounded-2xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Buka Navigasi Rute Maps"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Rute Maps</span>
          </a>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-emerald-400 hover:text-white" />
            <span>{isExportingPDF ? 'PDF...' : 'Cetak KIB'}</span>
          </button>

          {canEdit && onEditAset && (
            <button
              type="button"
              onClick={() => onEditAset(aset)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-950/60 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Aset</span>
            </button>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 7. LIGHTBOX MODAL FOR FULL RESOLUTION IMAGE PREVIEW                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            id="modal-asset-photo-lightbox"
            key="modal-asset-photo-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[700] flex items-center justify-center bg-black/92 backdrop-blur-md p-4"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-4 overflow-hidden shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 px-2 text-white border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold truncate max-w-md">{zoomedImage.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {zoomedImage.originalUrl && (
                    <a
                      href={zoomedImage.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
                      title="Buka File Foto Asli pada Tab Baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Sumber Asli</span>
                    </a>
                  )}
                  <button 
                    type="button"
                    onClick={() => setZoomedImage(null)}
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-90"
                    title="Tutup Pratinjau Foto"
                    aria-label="Tutup Pratinjau Foto"
                  >
                    <X className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center overflow-auto rounded-2xl bg-black/60 p-2">
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
    </motion.div>
  );
};

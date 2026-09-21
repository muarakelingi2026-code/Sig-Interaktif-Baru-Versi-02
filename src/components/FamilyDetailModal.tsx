import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keluarga, Penduduk, User, RolePermissions } from '../types';
import { generateFamilyProfilePDF, generateResidentProfilePDF } from '../utils/pdfExport';
import { 
  X, 
  Home, 
  Users, 
  HeartHandshake, 
  MapPin, 
  Edit3, 
  Trash2, 
  Printer, 
  Calendar, 
  GraduationCap, 
  Briefcase, 
  Coins, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  FileText,
  Tv,
  Compass,
  Copy,
  Maximize2,
  Phone,
  ShieldAlert,
  Sparkles,
  Layers,
  Droplets,
  Zap,
  Check,
  Building,
  Activity,
  Info,
  LayoutGrid,
  Table2,
  Eye,
  IdCard
} from 'lucide-react';

interface FamilyDetailModalProps {
  keluarga: Keluarga | null;
  onClose: () => void;
  onEdit: (keluarga: Keluarga) => void;
  onDelete: (keluarga: Keluarga) => void;
  currentUser: User;
  permissions?: RolePermissions;
  isReadOnly?: boolean;
  isKioskMode?: boolean;
}

export const FamilyDetailModal: React.FC<FamilyDetailModalProps> = ({
  keluarga,
  onClose,
  onEdit,
  onDelete,
  currentUser,
  permissions,
  isReadOnly = false,
  isKioskMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'biodata' | 'bansos' | 'rumah'>('biodata');
  const [memberViewMode, setMemberViewMode] = useState<'grid' | 'table'>('grid');
  const [viewingMember, setViewingMember] = useState<Penduduk | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);
  const [selectedMemberNik, setSelectedMemberNik] = useState<string | null>(null);
  const [copiedNik, setCopiedNik] = useState(false);

  // Auto select head of family or first member on open
  useEffect(() => {
    if (keluarga?.anggotaKeluarga && keluarga.anggotaKeluarga.length > 0) {
      const kepala = keluarga.anggotaKeluarga.find(m => m.nik === keluarga.nikKepala) || keluarga.anggotaKeluarga[0];
      setSelectedMemberNik(kepala.nik);
    }
  }, [keluarga]);

  // Keyboard shortcut (Escape) to close photo preview, viewing member, or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewPhoto) {
          setPreviewPhoto(null);
        } else if (viewingMember) {
          setViewingMember(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPhoto, viewingMember, onClose]);

  if (!keluarga) return null;

  const handleCopyCoords = () => {
    const text = `${keluarga.koordinat.lat}, ${keluarga.koordinat.lng}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const isOperator = currentUser.role === 'operator';
  const isOperatorAset = currentUser.role === 'operator_aset';
  const isRestricted = isOperator && (permissions?.operatorOnlyAddKK ?? true);
  const allowEdit = !isReadOnly && !isKioskMode && !isOperatorAset && (!isRestricted || (permissions?.allowOperatorEditKK ?? false));
  const allowDelete = !isReadOnly && !isKioskMode && !isOperatorAset && (!isRestricted || (permissions?.allowOperatorDeleteKK ?? false));
  const allowExport = !isKioskMode && !isOperatorAset && (!isRestricted || (permissions?.allowOperatorExport ?? false));

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const totalPenghasilanKeluarga = keluarga.anggotaKeluarga.reduce(
    (acc, m) => acc + (m.penghasilanBulanan || 0),
    0
  );

  const getDesilBadge = (status: string) => {
    if (status.includes('Desil 1')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          Desil 1 • Sangat Miskin
        </span>
      );
    }
    if (status.includes('Desil 2')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
          Desil 2 • Miskin
        </span>
      );
    }
    if (status.includes('Desil 3')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Desil 3 • Rentan Miskin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        Non-DTKS • Keluarga Mampu
      </span>
    );
  };

  const tabs = [
    { id: 'biodata' as const, label: `Biodata Anggota (${keluarga.anggotaKeluarga.length})`, icon: Users },
    { id: 'bansos' as const, label: 'Bantuan Sosial & DTKS', icon: HeartHandshake },
    { id: 'rumah' as const, label: 'Kondisi Fisik Hunian', icon: Home }
  ];

  return (
    <div 
      id="family-detail-overlay" 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2.5 sm:p-4 md:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 18 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        id="family-detail-card" 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        
        {/* TOP BAR / HEADER IDENTITAS KEPENDUDUKAN */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Rincian Data Penduduk
                </span>
                <span className="text-[11px] font-mono text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700">
                  No. KK: {keluarga.noKk}
                </span>
                {isReadOnly || isKioskMode ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                    <Tv className="w-3 h-3" /> Mode Baca Kiosk
                  </span>
                ) : null}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white truncate tracking-tight mt-0.5">
                Keluarga: {keluarga.namaKepalaKeluarga}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              id="btn-close-family-detail"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer flex items-center justify-center shadow-xs"
              title="Tutup (Esc)"
              aria-label="Tutup form detail penduduk"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </motion.button>
          </div>
        </div>

        {/* HERO BANNER & STATISTIK KEPENDUDUKAN ELEGAN */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 border-b border-slate-800/80 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Foto Rumah Mini Preview + Info Wilayah */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div 
                className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 border border-white/15 shadow-md cursor-pointer group bg-slate-950"
                onClick={() => setPreviewPhoto({
                  url: keluarga.fotoRumah,
                  title: `Foto Dokumentasi Fisik Rumah - ${keluarga.namaKepalaKeluarga} (No. KK: ${keluarga.noKk})`
                })}
                title="Klik untuk melihat foto rumah resolusi tinggi"
              >
                <img 
                  src={keluarga.fotoRumah} 
                  alt="Foto Rumah" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-4 h-4 text-white" />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xs text-[9px] text-center font-bold text-slate-200 py-0.5">
                  Foto Rumah
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{keluarga.alamat}, {keluarga.dusun}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Kepala Keluarga:</span>
                  <span className="text-white font-semibold">{keluarga.namaKepalaKeluarga}</span>
                  <span className="font-mono text-emerald-300">({keluarga.nikKepala})</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {getDesilBadge(keluarga.statusKesejahteraan)}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    (keluarga.statusPenduduk || 'Tetap') === 'Sementara'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {(keluarga.statusPenduduk || 'Tetap') === 'Sementara' ? '⏳ Penduduk Sementara' : '✓ Penduduk Tetap'}
                  </span>
                  {keluarga.penerimaBansos ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Penerima Bansos
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Mandiri
                    </span>
                  )}
                  {keluarga.statusVerifikasi === 'pending_approval' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-xs">
                      <AlertCircle className="w-3 h-3" /> Menunggu Persetujuan Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-white/10 shrink-0 shadow-inner">
              <div className="px-2.5 py-1.5 text-center border-r border-white/5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Anggota</div>
                <div className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center justify-center gap-1">
                  <span>{keluarga.anggotaKeluarga.length}</span>
                  <span className="text-xs font-normal text-slate-400">Jiwa</span>
                </div>
              </div>
              <div className="px-2.5 py-1.5 text-center border-r border-white/5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Penghasilan</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-1 font-mono">
                  {totalPenghasilanKeluarga > 0 ? formatRupiah(totalPenghasilanKeluarga) : 'Rp 0'}
                </div>
              </div>
              <div className="px-2.5 py-1.5 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bansos / Bln</div>
                <div className="text-xs sm:text-sm font-bold text-teal-400 mt-1 font-mono">
                  {keluarga.totalNominalBantuanBulanan > 0 ? formatRupiah(keluarga.totalNominalBantuanBulanan) : 'Rp 0'}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* NAVIGATION TABS - CENTERED APPLE SEGMENTED CONTROL */}
        <div className="bg-slate-900/95 px-4 sm:px-6 py-2.5 border-b border-slate-800 flex items-center justify-center shrink-0">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-white/10 shadow-inner overflow-x-auto max-w-full scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`tab-detail-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 sm:px-5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer select-none whitespace-nowrap ${
                    isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-family-detail-tab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400/40 shadow-md shadow-emerald-950/50"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SCROLLABLE CONTENT BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          
          {/* TAB 1: BIODATA ANGGOTA KELUARGA */}
          {activeTab === 'biodata' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    Daftar Anggota Keluarga ({keluarga.anggotaKeluarga.length} Jiwa)
                  </h3>
                </div>

                {/* Dua Tombol Pengalih Tampilan: Tampilan Grid Kartu & Tampilan Tabel Resmi */}
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/10 shadow-inner self-start sm:self-auto">
                  <button
                    type="button"
                    id="btn-view-member-grid"
                    onClick={() => setMemberViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                      memberViewMode === 'grid'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title="Tampilan Grid Kartu Biodata Anggota Keluarga"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Tampilan Grid Kartu</span>
                  </button>

                  <button
                    type="button"
                    id="btn-view-member-table"
                    onClick={() => setMemberViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                      memberViewMode === 'table'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title="Tampilan Tabel Resmi Format Kartu Keluarga"
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span>Tampilan Tabel Resmi</span>
                  </button>
                </div>
              </div>

              {/* TAMPILAN GRID KARTU */}
              {memberViewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {keluarga.anggotaKeluarga.map((member, idx) => {
                    const isKepala = member.nik === keluarga.nikKepala || member.statusKeluarga === 'Kepala Keluarga';
                    return (
                      <motion.div
                        key={member.id || idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.24 }}
                        className={`relative bg-slate-950/60 backdrop-blur-md border rounded-2xl p-4 transition-all duration-200 ${
                          member.statusKematian === 'Meninggal'
                            ? 'border-slate-800 opacity-70 bg-slate-950/40'
                            : isKepala
                              ? 'border-emerald-500/35 bg-gradient-to-br from-slate-900 to-emerald-950/20 shadow-md shadow-emerald-950/20'
                              : 'border-white/10 hover:border-slate-600 bg-slate-900/60'
                        }`}
                      >
                        {/* Badge Kepala Keluarga */}
                        {isKepala && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            <span>Kepala Keluarga</span>
                          </div>
                        )}

                        <div className="flex items-start gap-3.5">
                          {/* Member Photo with Click-to-Preview */}
                          <div 
                            className="relative shrink-0 cursor-pointer group/photo"
                            onClick={() => setPreviewPhoto({
                              url: member.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80',
                              title: `Foto Profil: ${member.nama} (${member.statusKeluarga}) • NIK: ${member.nik}`
                            })}
                            title="Klik untuk perbesar foto profil"
                          >
                            <img
                              src={member.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                              alt={member.nama}
                              className="w-14 h-14 rounded-2xl object-cover ring-1 ring-white/15 shadow-md transition-all duration-200 group-hover/photo:scale-105 group-hover/photo:ring-emerald-400"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/photo:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                              <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                            {member.statusKematian === 'Meninggal' && (
                              <span className="absolute -bottom-1 -right-1 bg-slate-950 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-rose-500/40">
                                Wafat
                              </span>
                            )}
                          </div>

                          {/* Biodata info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 pr-20 sm:pr-0">
                              <h4 className="font-bold text-sm text-white truncate">
                                {member.nama}
                              </h4>
                              {!isKepala && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium shrink-0 border border-white/5">
                                  {member.statusKeluarga}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <span className="text-slate-500">NIK:</span>
                              <span className="text-emerald-300 font-medium">{member.nik}</span>
                            </div>

                            {/* Data Rinci Grid */}
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-2.5 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                              <div>
                                <span className="text-slate-500 text-[11px] block">Jenis Kelamin:</span>
                                <span className="text-slate-200 font-medium">{member.jenisKelamin}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] block">Usia & Tgl Lahir:</span>
                                <span className="text-slate-200 font-medium">
                                  {calculateAge(member.tanggalLahir)} Thn <span className="text-slate-400 text-[10px]">({member.tanggalLahir || '-'})</span>
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] block">Pendidikan Terakhir:</span>
                                <span className="text-emerald-300 font-medium">{member.pendidikan}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px] block">Status Pernikahan:</span>
                                <span className="text-slate-200 font-medium">{member.statusPerkawinan}</span>
                              </div>
                              <div className="col-span-2 pt-1 border-t border-white/5 flex items-center justify-between">
                                <span className="text-slate-500 text-[11px]">Status Penduduk:</span>
                                <span className={`font-semibold text-xs px-2 py-0.5 rounded-md border ${
                                  (member.statusPenduduk || keluarga.statusPenduduk || 'Tetap') === 'Sementara'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                }`}>
                                  {(member.statusPenduduk || keluarga.statusPenduduk || 'Tetap')}
                                </span>
                              </div>
                              <div className="col-span-2 pt-1 border-t border-white/5 flex items-center justify-between">
                                <span className="text-slate-500 text-[11px]">Pekerjaan:</span>
                                <span className="text-slate-200 font-medium">{member.pekerjaan}</span>
                              </div>
                              <div className="col-span-2 flex items-center justify-between pt-0.5">
                                <span className="text-slate-500 text-[11px]">Penghasilan:</span>
                                <span className="text-emerald-400 font-bold font-mono text-xs">
                                  {member.penghasilanBulanan > 0 ? formatRupiah(member.penghasilanBulanan) : 'Tidak Berpenghasilan'}
                                </span>
                              </div>
                            </div>

                            {/* Special tags: Bansos individu & disabilitas */}
                            {(member.bantuanPribadi?.length || member.disabilitas) ? (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {member.bantuanPribadi?.map((b, bi) => (
                                  <span key={bi} className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-semibold">
                                    {b}
                                  </span>
                                ))}
                                {member.disabilitas && (
                                  <span className="text-[10px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 font-semibold">
                                    Disabilitas: {member.disabilitas}
                                  </span>
                                )}
                              </div>
                            ) : null}

                            {/* Action Buttons: View Data & PDF Export */}
                            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-end gap-2">
                              <motion.button
                                whileTap={{ scale: 0.94 }}
                                type="button"
                                id={`btn-view-member-grid-${member.nik}`}
                                onClick={() => setViewingMember(member)}
                                className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title={`Lihat Rincian Lengkap Biodata ${member.nama}`}
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>View Data</span>
                              </motion.button>

                              {allowExport && (
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  onClick={() => generateResidentProfilePDF(member, keluarga)}
                                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                  title={`Cetak Profil Biodata Resmi untuk ${member.nama}`}
                                >
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  <span>Cetak PDF</span>
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* TAMPILAN TABEL RESMI FORMAT KARTU KELUARGA */}
              {memberViewMode === 'table' && (
                <div className="bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden shadow-lg">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 border-b border-white/10 text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-3 text-center w-10">No</th>
                          <th className="py-3 px-3">Nama Lengkap & NIK</th>
                          <th className="py-3 px-3">Hub. Keluarga</th>
                          <th className="py-3 px-3">JK / Usia</th>
                          <th className="py-3 px-3">Pendidikan</th>
                          <th className="py-3 px-3">Pekerjaan</th>
                          <th className="py-3 px-3">Status Kawin</th>
                          <th className="py-3 px-3 text-right">Penghasilan</th>
                          <th className="py-3 px-3">Bansos Pribadi</th>
                          <th className="py-3 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {keluarga.anggotaKeluarga.map((member, idx) => {
                          const isKepala = member.nik === keluarga.nikKepala || member.statusKeluarga === 'Kepala Keluarga';
                          return (
                            <tr 
                              key={member.id || idx}
                              className={`transition-colors hover:bg-slate-800/40 ${
                                isKepala ? 'bg-emerald-950/15' : ''
                              }`}
                            >
                              <td className="py-3 px-3 text-center text-slate-400 font-mono">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div 
                                    className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 cursor-pointer border border-white/15 hover:border-emerald-400 group/tablephoto"
                                    onClick={() => setPreviewPhoto({
                                      url: member.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80',
                                      title: `Foto Profil: ${member.nama} (${member.statusKeluarga}) • NIK: ${member.nik}`
                                    })}
                                    title="Klik untuk melihat foto"
                                  >
                                    <img 
                                      src={member.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                                      alt={member.nama} 
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/tablephoto:opacity-100 transition-opacity flex items-center justify-center">
                                      <Maximize2 className="w-3 h-3 text-white" />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>{member.nama}</span>
                                      {isKepala && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                          KK
                                        </span>
                                      )}
                                      {member.statusKematian === 'Meninggal' && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                                          Wafat
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400">
                                      {member.nik}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                  isKepala 
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                                    : 'bg-slate-800 text-slate-300 border-white/5'
                                }`}>
                                  {member.statusKeluarga}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-200">
                                <div>{member.jenisKelamin === 'Laki-laki' ? 'L' : 'P'} • {calculateAge(member.tanggalLahir)} Thn</div>
                                <div className="text-[10px] text-slate-400">{member.tanggalLahir || '-'}</div>
                              </td>
                              <td className="py-3 px-3 text-slate-300 font-medium">
                                {member.pendidikan}
                              </td>
                              <td className="py-3 px-3 text-slate-300">
                                {member.pekerjaan}
                              </td>
                              <td className="py-3 px-3 text-slate-300">
                                {member.statusPerkawinan}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                                {member.penghasilanBulanan > 0 ? formatRupiah(member.penghasilanBulanan) : '-'}
                              </td>
                              <td className="py-3 px-3">
                                {member.bantuanPribadi && member.bantuanPribadi.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {member.bantuanPribadi.map((b, bi) => (
                                      <span key={bi} className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-medium">
                                        {b}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    id={`btn-view-member-table-${member.nik}`}
                                    onClick={() => setViewingMember(member)}
                                    className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium"
                                    title={`Lihat Rincian Biodata ${member.nama}`}
                                  >
                                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>View Data</span>
                                  </motion.button>

                                  {allowExport && (
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      type="button"
                                      onClick={() => generateResidentProfilePDF(member, keluarga)}
                                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                                      title={`Cetak Surat Biodata PDF ${member.nama}`}
                                    >
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    </motion.button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar Table */}
                  <div className="px-4 py-2.5 bg-slate-900 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div>
                      Total: <strong className="text-white">{keluarga.anggotaKeluarga.length} Jiwa</strong> (L: {keluarga.anggotaKeluarga.filter(m => m.jenisKelamin === 'Laki-laki').length}, P: {keluarga.anggotaKeluarga.filter(m => m.jenisKelamin === 'Perempuan').length})
                    </div>
                    <div>
                      Total Akumulasi Penghasilan: <strong className="text-emerald-400 font-mono">{formatRupiah(totalPenghasilanKeluarga)} / bln</strong>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: DATA BANTUAN SOSIAL & DTKS */}
          {activeTab === 'bansos' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Total Alokasi Bantuan Diterima
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-0.5">
                      {formatRupiah(keluarga.totalNominalBantuanBulanan)} <span className="text-xs font-normal text-slate-400">/ bulan</span>
                    </div>
                  </div>
                  <div>
                    {getDesilBadge(keluarga.statusKesejahteraan)}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-rose-400" />
                    <span>Daftar Program Bantuan Sosial Aktif</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {keluarga.daftarBansos.map((bansos, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-900/80 border border-white/10 rounded-2xl shadow-sm">
                        <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                          <HeartHandshake className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{bansos}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">Aktif</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {bansos === 'PKH' && 'Program Keluarga Harapan - Bantuan Bersyarat Kemensos RI'}
                            {bansos === 'BPNT/Sembako' && 'Bantuan Pangan Non Tunai / Program Kartu Sembako'}
                            {bansos === 'BLT-Dana Desa' && 'Bantuan Langsung Tunai APBDes Desa Beliti Jaya'}
                            {bansos === 'Bansos Beras (PBP)' && 'Penerima Cadangan Pangan Pemerintah (10 kg beras/bulan)'}
                            {bansos === 'PIP (Pendidikan)' && 'Program Indonesia Pintar untuk Anggota Usia Sekolah'}
                            {bansos === 'KIS/PBI-JK' && 'Jaminan Kesehatan Nasional Gratis BPJS Penerima Bantuan Iuran'}
                            {bansos === 'Tidak Menerima' && 'Keluarga Mandiri (Non-Penerima Bantuan Sosial Apapun)'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status DTKS Verification Box */}
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Verifikasi Data Terpadu Kesejahteraan Sosial (DTKS) Desa Beliti Jaya</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Data kependudukan dan status sosial-ekonomi keluarga ini sinkron dengan basis data Pemutakhiran Berkelanjutan Sistem Informasi Geografis Desa Beliti Jaya, Kecamatan Muara Kelingi, Kabupaten Musi Rawas.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-slate-400 border-t border-white/5">
                    <span>Terakhir Diperbarui: <strong className="text-slate-200">{new Date(keluarga.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                    <span>Petugas Pemutakhir: <strong className="text-emerald-300 font-mono">{keluarga.lastModifiedBy}</strong></span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: KONDISI FISIK HUNIAN & FOTO */}
          {activeTab === 'rumah' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Visual Dokumentasi Foto Rumah (col-span-5) */}
                <div className="lg:col-span-5 space-y-2.5">
                  <div 
                    className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-md cursor-pointer group relative"
                    onClick={() => setPreviewPhoto({
                      url: keluarga.fotoRumah,
                      title: `Foto Fisik Bangunan Tempat Tinggal - ${keluarga.namaKepalaKeluarga} (${keluarga.noKk})`
                    })}
                    title="Klik untuk perbesar foto fisik rumah"
                  >
                    <div className="h-60 sm:h-64 w-full relative overflow-hidden bg-slate-950">
                      <img
                        src={keluarga.fotoRumah}
                        alt="Foto Fisik Rumah"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                        <div className="px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 shadow-lg">
                          <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Klik untuk Perbesar Foto</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 text-xs text-slate-300 bg-slate-900/95 border-t border-white/5 flex items-center justify-between">
                      <span className="truncate font-medium">Dokumentasi Bangunan Tempat Tinggal</span>
                      <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                        <Maximize2 className="w-3 h-3" /> Perbesar
                      </span>
                    </div>
                  </div>

                  {/* Lokasi GIS Quick Nav */}
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Titik Koordinat GIS:</span>
                      </div>
                      <button
                        type="button"
                        id="btn-copy-family-coords"
                        onClick={handleCopyCoords}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer transition-colors border border-white/5"
                        title="Salin Koordinat"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedCoords ? 'Tersalin!' : 'Salin'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-emerald-300 text-xs bg-slate-900 px-2.5 py-1.5 rounded-xl border border-white/5">
                      {keluarga.koordinat.lat}, {keluarga.koordinat.lng}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Basis rute: Kantor Desa Beliti Jaya (-2.971973, 103.152321)
                    </div>
                  </div>
                </div>

                {/* Spesifikasi Lengkap Kondisi Hunian (col-span-7) */}
                <div className="lg:col-span-7 bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      <span>Parameter Kelayakan & Kondisi Fisik Rumah</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Standar Kemensos / BPS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[11px]">Tipe Bangunan:</div>
                      <div className="font-bold text-white mt-0.5">{keluarga.kondisiRumah.tipeBangunan}</div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[11px]">Luas Bangunan:</div>
                      <div className="font-bold text-white mt-0.5">{keluarga.kondisiRumah.luasBangunanM2} m²</div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[11px]">Status Kepemilikan:</div>
                      <div className="font-bold text-white mt-0.5">{keluarga.kondisiRumah.statusKepemilikan}</div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[11px]">Daya Listrik PLN:</div>
                      <div className="font-bold text-emerald-300 mt-0.5">{keluarga.kondisiRumah.dayaListrik}</div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[11px]">Sumber Air Minum:</div>
                      <div className="font-bold text-white mt-0.5">{keluarga.kondisiRumah.sumberAirMinum}</div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[11px]">Fasilitas Jamban:</div>
                      <div className="font-bold text-white mt-0.5">{keluarga.kondisiRumah.fasilitasJamban}</div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[11px]">Material Lantai:</div>
                      <div className="font-bold text-white mt-0.5">{keluarga.kondisiRumah.kondisiLantai}</div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5">
                      <div className="text-slate-400 text-[11px]">Material Dinding:</div>
                      <div className="font-bold text-white mt-0.5">{keluarga.kondisiRumah.kondisiDinding}</div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-200 flex items-start gap-2">
                      <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Kondisi tempat tinggal merupakan salah satu indikator primer penentu desil kesejahteraan keluarga dan pertimbangan usulan program Bantuan Stimulan Perumahan Swadaya (BSPS) / Bedah Rumah.
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </div>

        {/* MODAL FOOTER DENGAN TOMBOL BERDAMPINGAN & PRESISI */}
        <div className="bg-slate-950/90 px-5 sm:px-6 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>ID Data: <strong className="font-mono text-slate-200">{keluarga.id}</strong></span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-emerald-400">Terverifikasi Titik GIS</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            {allowEdit && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                id="btn-footer-edit-family"
                onClick={() => onEdit(keluarga)}
                className="px-3.5 py-1.5 sm:py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Edit Data Keluarga & Anggota"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </motion.button>
            )}

            {allowDelete && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                id="btn-footer-delete-family"
                onClick={() => onDelete(keluarga)}
                className="px-3.5 py-1.5 sm:py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                title={currentUser.role === 'admin' ? 'Hapus Data Keluarga' : 'Ajukan Hapus ke Admin'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{currentUser.role === 'admin' ? 'Hapus' : 'Ajukan Hapus'}</span>
              </motion.button>
            )}

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=-2.971973,103.152321&destination=${keluarga.koordinat.lat},${keluarga.koordinat.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              id="btn-footer-gmaps-family"
              className="px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-semibold shadow-md shadow-blue-950/40 flex items-center gap-1.5 transition-all cursor-pointer border border-blue-400/40 active:scale-95"
              title="Buka Rute Google Maps dari Kantor Desa Beliti Jaya (-2.971973, 103.152321) menuju rumah ini"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Rute Google Maps</span>
            </a>

            {allowExport && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                id="btn-footer-print-family"
                onClick={() => generateFamilyProfilePDF(keluarga)}
                className="px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-semibold shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-400/30 active:scale-95"
                title="Unduh & Cetak Profil Lengkap KK dalam format PDF resmi"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Profil</span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              id="btn-footer-close-family"
              onClick={onClose}
              className="px-4 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-semibold shadow-sm transition-all cursor-pointer border border-white/10 active:scale-95"
            >
              Tutup
            </motion.button>
          </div>
        </div>

      </motion.div>

      {/* MODAL VIEW DATA ANGGOTA KELUARGA (PROFESIONAL, BERSIH, NYAMAN DIBACA DENGAN TOMBOL CLOSE X) */}
      <AnimatePresence>
        {viewingMember && (
          <div
            id="member-detail-overlay"
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
            onClick={() => setViewingMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              id="member-detail-card"
              className="relative max-w-2xl sm:max-w-3xl w-full bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh] my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Header Card - Official Citizen Credential Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                        Biodata Resmi Kependudukan
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                        Pemerintah Desa Beliti Jaya
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                      Detail Data: {viewingMember.nama}
                    </h3>
                  </div>
                </div>

                {/* Tombol Close (X) Bersih, Elegan, dan Nyaman Digunakan */}
                <button
                  type="button"
                  id="btn-close-member-view-data"
                  onClick={() => setViewingMember(null)}
                  className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs active:scale-95"
                  title="Tutup Form View Data (Esc)"
                  aria-label="Tutup Form View Data Penduduk"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Modal View Data - Terstruktur Rapi, Nyaman Dibaca, Tidak Kaku */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
                
                {/* 1. Header Banner Profil & Identitas Utama */}
                <div className="bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-md flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Foto Profil dengan Lightbox Zoom */}
                  <div 
                    className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden shrink-0 border-2 border-slate-700 hover:border-emerald-400/80 shadow-lg cursor-pointer group bg-slate-950 transition-all"
                    onClick={() => setPreviewPhoto({
                      url: viewingMember.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80',
                      title: `Foto Profil: ${viewingMember.nama} (${viewingMember.statusKeluarga}) • NIK: ${viewingMember.nik}`
                    })}
                    title="Klik untuk melihat foto resolusi penuh"
                  >
                    <img
                      src={viewingMember.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'}
                      alt={viewingMember.nama}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Informasi Ringkas Penduduk */}
                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs ${
                        viewingMember.statusKeluarga === 'Kepala Keluarga'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}>
                        {viewingMember.statusKeluarga}
                      </span>

                      {viewingMember.statusKematian === 'Meninggal' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Meninggal Dunia ({viewingMember.tanggalMeninggal || '-'})</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Status: Hidup</span>
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
                        {viewingMember.jenisKelamin} • {calculateAge(viewingMember.tanggalLahir)} Tahun
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {viewingMember.nama}
                    </h2>

                    {/* NIK & No. KK Bar dengan Tombol Salin Cepat */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(viewingMember.nik);
                          setCopiedNik(true);
                          setTimeout(() => setCopiedNik(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-emerald-300 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Klik untuk menyalin Nomor Induk Kependudukan (NIK)"
                      >
                        <span className="text-slate-400">NIK:</span>
                        <span className="font-bold">{viewingMember.nik}</span>
                        {copiedNik ? (
                          <span className="text-[10px] text-emerald-400 font-sans font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Tersalin!
                          </span>
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-300 shadow-xs">
                        <span className="text-slate-400">No. KK:</span>
                        <span className="font-semibold text-slate-200">{viewingMember.noKk}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 pt-0.5">
                      Kepala Keluarga: <strong className="text-slate-200">{keluarga.namaKepalaKeluarga}</strong> • Wilayah: <span className="text-emerald-400 font-medium">{keluarga.dusun}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Grid Rincian Informasi (3 Kolom Cardlet Bersahabat & Nyaman Dibaca) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Cardlet A: Data Identitas & Kelahiran */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Identitas Pribadi & Kelahiran</span>
                    </div>
                    
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Tempat & Tanggal Lahir:</span>
                        <span className="font-semibold text-white">
                          {viewingMember.tempatLahir || 'Beliti Jaya'}, {viewingMember.tanggalLahir || '-'} ({calculateAge(viewingMember.tanggalLahir)} Tahun)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/50">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Jenis Kelamin:</span>
                          <span className="font-medium text-slate-200">{viewingMember.jenisKelamin}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Agama:</span>
                          <span className="font-medium text-slate-200">{viewingMember.agama || 'Islam'}</span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-slate-800/50">
                        <span className="text-slate-400 text-[11px] block">Status Perkawinan:</span>
                        <span className="font-medium text-slate-200">{viewingMember.statusPerkawinan}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cardlet B: Pendidikan, Profesi & Penghasilan */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                      <GraduationCap className="w-4 h-4 text-teal-400" />
                      <span>Pendidikan & Pekerjaan</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Pendidikan Terakhir:</span>
                        <span className="font-semibold text-emerald-300">{viewingMember.pendidikan}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-800/50">
                        <span className="text-slate-400 text-[11px] block">Pekerjaan / Mata Pencaharian:</span>
                        <span className="font-medium text-slate-200">{viewingMember.pekerjaan}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-800/50 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Penghasilan Bulanan:</span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">
                            {viewingMember.penghasilanBulanan > 0 ? formatRupiah(viewingMember.penghasilanBulanan) : 'Tidak Berpenghasilan'}
                          </span>
                        </div>
                        {viewingMember.penghasilanBulanan > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                            Mandiri Finansial
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cardlet C: Domisili & Kontak */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>Domisili & Alamat Tempat Tinggal</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Alamat Tinggal / Dusun:</span>
                        <span className="font-medium text-slate-200 leading-relaxed">
                          {keluarga.alamat}, Dusun {keluarga.dusun}, Desa Beliti Jaya
                        </span>
                      </div>
                      <div className="pt-1 border-t border-slate-800/50">
                        <span className="text-slate-400 text-[11px] block">Nomor Telepon / WhatsApp:</span>
                        {viewingMember.nomorTelepon ? (
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="font-semibold text-emerald-300 font-mono flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{viewingMember.nomorTelepon}</span>
                            </span>
                            <a
                              href={`https://wa.me/${viewingMember.nomorTelepon.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-md text-[10px] font-semibold border border-emerald-500/30 inline-flex items-center gap-1 transition-all"
                            >
                              Hubungi WA
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Tidak tercatat / belum diisi</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cardlet D: Bantuan Sosial & Disabilitas */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                      <HeartHandshake className="w-4 h-4 text-rose-400" />
                      <span>Jaminan Sosial & Catatan Khusus</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block mb-1">Bantuan Sosial Perorangan / Afirmasi:</span>
                        {viewingMember.bantuanPribadi && viewingMember.bantuanPribadi.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {viewingMember.bantuanPribadi.map((b, bi) => (
                              <span key={bi} className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                                {b}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Tidak terdaftar sebagai penerima bantuan individu khusus.</span>
                        )}
                      </div>

                      {viewingMember.disabilitas && (
                        <div className="pt-2 border-t border-slate-800/50">
                          <span className="text-slate-400 text-[11px] block mb-1">Ragam Disabilitas:</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>{viewingMember.disabilitas}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Footer Modal View Data dengan Tombol Cetak PDF & Tutup */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Data tersinkronisasi dengan Master Database Kependudukan Desa Beliti Jaya</span>
                </div>

                <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
                  {allowExport && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => generateResidentProfilePDF(viewingMember, keluarga)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer border border-emerald-400/30"
                      title="Unduh & Cetak Profil Biodata Resmi PDF dengan Kop Surat Desa"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Biodata PDF</span>
                    </motion.button>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setViewingMember(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer border border-slate-700 flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tutup</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX PREVIEW FOTO MODAL DENGAN TOMBOL CLOSE (X) KECIL */}
      <AnimatePresence>
        {previewPhoto && (
          <div
            id="family-photo-preview-overlay"
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
            onClick={() => setPreviewPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              id="family-photo-preview-card"
              className="relative max-w-4xl max-h-[92vh] w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header with Small Close (X) Button */}
              <div className="flex items-center justify-between gap-3 pb-2.5 mb-2 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {previewPhoto.title}
                  </h3>
                </div>

                {/* Tombol Close (X) dibuat kecil saja */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  id="btn-close-photo-lightbox"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-1 sm:p-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/15 transition-colors cursor-pointer shrink-0 shadow-sm"
                  title="Tutup Pratinjau (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* High-res Photo Container */}
              <div className="flex-1 overflow-hidden flex items-center justify-center rounded-2xl bg-black/60 p-1.5 min-h-[260px]">
                <img
                  src={previewPhoto.url}
                  alt={previewPhoto.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

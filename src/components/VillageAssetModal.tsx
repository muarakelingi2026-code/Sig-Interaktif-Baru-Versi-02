import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AsetDesa, KategoriAset, KondisiAset, SumberDanaAset, StatusPemanfaatanAset, DusunWilayah, User } from '../types';
import { 
  resolveImageUrl, 
  isGoogleDriveUrl, 
  extractGoogleDriveFileId, 
  getGoogleDriveThumbnailUrl 
} from '../utils/imageUtils';
import { 
  Building2, 
  Building,
  HardHat, 
  Landmark, 
  Truck, 
  Tractor, 
  TreePine, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Printer, 
  X, 
  Calendar, 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Layers, 
  FileSpreadsheet,
  Compass,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Info,
  Image as ImageIcon,
  Camera,
  Maximize2,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  FolderCheck,
  Check,
  Lock
} from 'lucide-react';

interface VillageAssetModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBackToMap?: () => void;
  isFullPage?: boolean;
  asetList: AsetDesa[];
  onSaveAset: (aset: Omit<AsetDesa, 'id' | 'createdAt' | 'updatedAt'>, editingId?: string) => void;
  onDeleteAset: (id: string) => void;
  onFocusOnMap: (aset: AsetDesa) => void;
  currentUser: User | null;
  initialKategori?: 'all' | 'pembangunan' | 'non_pembangunan';
  targetAsetId?: string | null;
  onOpenAssetDetail?: (aset: AsetDesa) => void;
}

export const VillageAssetModal: React.FC<VillageAssetModalProps> = ({
  isOpen = true,
  onClose,
  onBackToMap,
  isFullPage = false,
  asetList,
  onSaveAset,
  onDeleteAset,
  onFocusOnMap,
  currentUser,
  initialKategori = 'all',
  targetAsetId,
  onOpenAssetDetail
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pembangunan' | 'non_pembangunan'>(initialKategori);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDusun, setSelectedDusun] = useState<string>('all');
  const [selectedKondisi, setSelectedKondisi] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Selected single asset for full inspector detail
  const [detailAset, setDetailAset] = useState<AsetDesa | null>(null);

  // Synchronize activeTab and ensure direct access to main inventory form when modal or full-page is opened
  useEffect(() => {
    if (isOpen || isFullPage) {
      if (initialKategori) {
        setActiveTab(initialKategori);
      }
      // Pastikan selalu langsung menampilkan form utama "Buku Inventaris & Peta Sebaran Aset Desa"
      setDetailAset(null);
      if (targetAsetId) {
        const found = asetList.find(a => a.id === targetAsetId);
        if (found && found.kategori) {
          setActiveTab(found.kategori);
          setSearchQuery(found.namaAset);
        }
      }
    }
  }, [isOpen, isFullPage, initialKategori, targetAsetId, asetList]);

  // Keep detailAset synchronized if asetList is modified
  useEffect(() => {
    if (detailAset) {
      const refreshed = asetList.find(a => a.id === detailAset.id);
      if (refreshed && refreshed !== detailAset) {
        setDetailAset(refreshed);
      }
    }
  }, [asetList]);
  
  // Form modal state for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAset, setEditingAset] = useState<AsetDesa | null>(null);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formKode, setFormKode] = useState('');
  const [formKategori, setFormKategori] = useState<KategoriAset>('pembangunan');
  const [formSubKategori, setFormSubKategori] = useState('');
  const [formTahun, setFormTahun] = useState<number>(new Date().getFullYear());
  const [formSumberDana, setFormSumberDana] = useState<SumberDanaAset>('Dana Desa (APBN)');
  const [formNilai, setFormNilai] = useState<number>(100000000);
  const [formKondisi, setFormKondisi] = useState<KondisiAset>('Baik');
  const [formDusun, setFormDusun] = useState<DusunWilayah>('Dusun I');
  const [formLat, setFormLat] = useState<number>(-2.9661);
  const [formLng, setFormLng] = useState<number>(103.1581);
  const [formLuas, setFormLuas] = useState('');
  const [formPenanggungJawab, setFormPenanggungJawab] = useState('');
  const [formStatusPemanfaatan, setFormStatusPemanfaatan] = useState<StatusPemanfaatanAset>('Digunakan Aktif');
  const [formFoto, setFormFoto] = useState('');
  // Support minimal 4 foto links
  const [formFotoList, setFormFotoList] = useState<string[]>(['', '', '', '']);
  const [formKeterangan, setFormKeterangan] = useState('');

  // Zoomed image lightbox modal
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);
  // Active photo in detail inspector
  const [detailActivePhotoIdx, setDetailActivePhotoIdx] = useState<number>(0);
  // Guide for Google Drive photo links
  const [showDriveGuide, setShowDriveGuide] = useState<boolean>(false);
  const [copiedDriveExample, setCopiedDriveExample] = useState<boolean>(false);

  // Format currency
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // High-level statistics
  const stats = useMemo(() => {
    const totalCount = asetList.length;
    const totalNilai = asetList.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);

    const pembangunanList = asetList.filter(a => a.kategori === 'pembangunan');
    const nonPembangunanList = asetList.filter(a => a.kategori === 'non_pembangunan');

    const pembangunanNilai = pembangunanList.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);
    const nonPembangunanNilai = nonPembangunanList.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);

    const kondisiBaik = asetList.filter(a => a.kondisi === 'Baik').length;
    const kondisiRusak = totalCount - kondisiBaik;

    return {
      totalCount,
      totalNilai,
      pembangunanCount: pembangunanList.length,
      pembangunanNilai,
      nonPembangunanCount: nonPembangunanList.length,
      nonPembangunanNilai,
      kondisiBaik,
      kondisiRusak
    };
  }, [asetList]);

  // Filtered asset list
  const filteredList = useMemo(() => {
    return asetList.filter(item => {
      // Tab filter
      if (activeTab === 'pembangunan' && item.kategori !== 'pembangunan') return false;
      if (activeTab === 'non_pembangunan' && item.kategori !== 'non_pembangunan') return false;

      // Search query - Multi-Field Deep Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.namaAset?.toLowerCase().includes(query);
        const matchKode = item.kodeRegister?.toLowerCase().includes(query);
        const matchSub = item.subKategori?.toLowerCase().includes(query);
        const matchPj = item.penanggungJawab?.toLowerCase().includes(query);
        const matchDusun = item.dusun?.toLowerCase().includes(query);
        const matchDana = item.sumberDana?.toLowerCase().includes(query);
        const matchKondisi = item.kondisi?.toLowerCase().includes(query);
        const matchStatus = item.statusPemanfaatan?.toLowerCase().includes(query);
        const matchLuas = item.luasAtauVolume?.toLowerCase().includes(query);
        const matchKet = item.keterangan?.toLowerCase().includes(query);
        const matchTahun = item.tahunPengadaan ? String(item.tahunPengadaan).includes(query) : false;

        if (!matchName && !matchKode && !matchSub && !matchPj && !matchDusun && !matchDana && !matchKondisi && !matchStatus && !matchLuas && !matchKet && !matchTahun) {
          return false;
        }
      }

      // Dusun filter
      if (selectedDusun !== 'all' && item.dusun !== selectedDusun) return false;

      // Kondisi filter
      if (selectedKondisi !== 'all' && item.kondisi !== selectedKondisi) return false;

      return true;
    });
  }, [asetList, activeTab, searchQuery, selectedDusun, selectedKondisi]);

  // Otorisasi fitur Tambah Aset: Hanya bisa diakses oleh Administrator dan Operator Aset
  const canAddAsset = currentUser?.role === 'admin' || currentUser?.role === 'operator_aset';

  const openAddForm = () => {
    if (!canAddAsset) {
      alert('Akses Dibatasi: Fitur Tambah Aset hanya dapat diakses oleh Administrator dan Operator Aset Desa.');
      return;
    }
    setEditingAset(null);
    setFormNama('');
    setFormKode(`KIB-${activeTab === 'non_pembangunan' ? 'A' : 'C'}/${String(asetList.length + 1).padStart(3, '0')}/BLT/${new Date().getFullYear()}`);
    setFormKategori(activeTab === 'non_pembangunan' ? 'non_pembangunan' : 'pembangunan');
    setFormSubKategori(activeTab === 'non_pembangunan' ? 'Tanah Kas Desa (KIB A)' : 'Gedung & Bangunan Publik');
    setFormTahun(new Date().getFullYear());
    setFormSumberDana('Dana Desa (APBN)');
    setFormNilai(125000000);
    setFormKondisi('Baik');
    setFormDusun('Dusun I');
    setFormLat(-2.9615);
    setFormLng(103.1525);
    setFormLuas('');
    setFormPenanggungJawab('Kaur Tata Usaha & Umum');
    setFormStatusPemanfaatan('Digunakan Aktif');
    
    // Inisialisasi minimal 4 link foto default dokumentasi
    const defaultPhotos = activeTab === 'non_pembangunan' ? [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80'
    ] : [
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80'
    ];
    setFormFoto(defaultPhotos[0]);
    setFormFotoList(defaultPhotos);
    setFormKeterangan('');
    setIsFormOpen(true);
  };

  const openEditForm = (item: AsetDesa) => {
    setEditingAset(item);
    setFormNama(item.namaAset);
    setFormKode(item.kodeRegister);
    setFormKategori(item.kategori);
    setFormSubKategori(item.subKategori);
    setFormTahun(item.tahunPengadaan);
    setFormSumberDana(item.sumberDana);
    setFormNilai(item.nilaiPerolehan);
    setFormKondisi(item.kondisi);
    setFormDusun(item.dusun);
    setFormLat(item.koordinat.lat);
    setFormLng(item.koordinat.lng);
    setFormLuas(item.luasAtauVolume || '');
    setFormPenanggungJawab(item.penanggungJawab);
    setFormStatusPemanfaatan(item.statusPemanfaatan);
    setFormFoto(item.foto || '');
    
    // Pastikan minimal 4 link foto pada form edit
    const existingPhotos = item.fotoList && item.fotoList.length > 0
      ? [...item.fotoList]
      : (item.foto ? [item.foto] : []);
    while (existingPhotos.length < 4) {
      existingPhotos.push('');
    }
    setFormFotoList(existingPhotos);
    setFormKeterangan(item.keterangan || '');
    setIsFormOpen(true);
  };

  // Helper pengubah tautan foto
  const handlePhotoUrlChange = (index: number, value: string) => {
    setFormFotoList(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleClearPhotoSlot = (index: number) => {
    setFormFotoList(prev => {
      const next = [...prev];
      next[index] = '';
      return next;
    });
  };

  const handleAddExtraPhotoSlot = () => {
    setFormFotoList(prev => [...prev, '']);
  };

  const handleRemovePhotoSlot = (index: number) => {
    if (formFotoList.length <= 4) {
      handleClearPhotoSlot(index);
      return;
    }
    setFormFotoList(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyPresetPhotos = (type: 'pembangunan' | 'non_pembangunan') => {
    if (type === 'pembangunan') {
      setFormFotoList([
        'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80'
      ]);
    } else {
      setFormFotoList([
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80'
      ]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    // Bersihkan daftar foto dan pastikan URL gambar (termasuk tautan Google Drive) otomatis disiapkan
    const cleanedPhotos = formFotoList.map(p => p.trim());
    const resolvedPhotos = cleanedPhotos.map(p => p ? resolveImageUrl(p) : '');
    while (resolvedPhotos.length < 4) {
      resolvedPhotos.push('');
    }
    // Foto utama adalah foto pertama yang valid, atau fallback standar
    const primaryFoto = resolvedPhotos.find(p => p.length > 0) || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80';

    onSaveAset({
      namaAset: formNama.trim(),
      kodeRegister: formKode.trim(),
      kategori: formKategori,
      subKategori: formSubKategori.trim(),
      tahunPengadaan: Number(formTahun),
      sumberDana: formSumberDana,
      nilaiPerolehan: Number(formNilai),
      kondisi: formKondisi,
      dusun: formDusun,
      koordinat: { lat: Number(formLat), lng: Number(formLng) },
      luasAtauVolume: formLuas.trim(),
      penanggungJawab: formPenanggungJawab.trim(),
      statusPemanfaatan: formStatusPemanfaatan,
      foto: primaryFoto,
      fotoList: resolvedPhotos,
      keterangan: formKeterangan.trim()
    }, editingAset?.id);

    setIsFormOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenRincianAset = (aset: AsetDesa) => {
    if (onOpenAssetDetail) {
      if (!isFullPage && onClose) {
        onClose();
      }
      onOpenAssetDetail(aset);
    } else {
      setDetailAset(aset);
    }
  };

  if (!isOpen && !isFullPage) return null;

  const bottomStickyBar = (
    <div className="sticky bottom-4 z-40 mt-4 px-1 pointer-events-none">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-3 sm:px-5 flex items-center justify-between gap-3 pointer-events-auto">
        {/* Sisi Kiri: Kembali ke Peta */}
        <div className="flex items-center gap-2">
          {onBackToMap ? (
            <button
              type="button"
              id="btn-sticky-back-to-map"
              onClick={onBackToMap}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-600 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              title="Kembali ke Portal Peta GIS"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span>Kembali ke Peta</span>
            </button>
          ) : (
            onClose && (
              <button
                type="button"
                id="btn-sticky-close-modal"
                onClick={onClose}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-600 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                title="Tutup Modal"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300" />
                <span>Kembali / Tutup</span>
              </button>
            )
          )}
        </div>

        {/* Sisi Kanan: Cetak/Ekspor, Tambah Aset */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            id="btn-sticky-print-aset"
            onClick={handlePrint}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-600 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md active:scale-95"
            title="Cetak / Ekspor Buku Inventaris Aset"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Cetak / Ekspor</span>
          </button>

          {canAddAsset ? (
            <button
              type="button"
              id="btn-sticky-add-aset"
              onClick={openAddForm}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 border border-emerald-400/40"
              title="Tambah Data Aset Desa Baru"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Aset</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-sticky-add-aset-disabled"
              onClick={() => {
                alert('Akses Dibatasi: Fitur Tambah Aset hanya dapat diakses oleh Administrator dan Operator Aset Desa.');
              }}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-800/80 text-slate-400 hover:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700/60 transition-all flex items-center gap-1.5 sm:gap-2 cursor-not-allowed opacity-80"
              title="Akses Dibatasi: Hanya Admin dan Operator Aset yang dapat menambah aset desa baru"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>+ Tambah Aset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const contentCard = (
    <div className={`relative w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col ${
      isFullPage ? '' : 'max-w-6xl max-h-[92vh] overflow-hidden'
    }`}>
      {!isFullPage && onClose && (
        <button
          type="button"
          id="btn-close-asset-modal"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 text-slate-400 hover:text-white bg-slate-950/70 hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-slate-800 backdrop-blur-sm shadow-md"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Metric Summary Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 sm:px-7 bg-slate-900/90 border-b border-slate-800/80 rounded-t-3xl">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-emerald-400 flex items-center justify-center shrink-0 border border-slate-700/60">
              <Coins className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400 font-medium">Total Nilai Aset Desa</div>
              <div className="text-sm sm:text-base font-bold text-white truncate font-mono">
                {formatRupiah(stats.totalNilai)}
              </div>
              <div className="text-[10px] text-slate-500">{stats.totalCount} item tercatat</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-cyan-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-800/60">
              <HardHat className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-cyan-300 font-medium">Aset Pembangunan</div>
              <div className="text-sm sm:text-base font-bold text-cyan-100 truncate font-mono">
                {formatRupiah(stats.pembangunanNilai)}
              </div>
              <div className="text-[10px] text-cyan-400/80">{stats.pembangunanCount} unit fisik / konstruksi</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-amber-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/60">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-amber-300 font-medium">Aset Non-Pembangunan</div>
              <div className="text-sm sm:text-base font-bold text-amber-100 truncate font-mono">
                {formatRupiah(stats.nonPembangunanNilai)}
              </div>
              <div className="text-[10px] text-amber-400/80">{stats.nonPembangunanCount} unit (tanah, mesin, SDA)</div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-emerald-400 flex items-center justify-center shrink-0 border border-slate-700/60">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400 font-medium">Status Kondisi Aset</div>
              <div className="text-sm sm:text-base font-bold text-emerald-300 truncate">
                {stats.kondisiBaik} Baik <span className="text-xs text-slate-400 font-normal">({Math.round((stats.kondisiBaik / stats.totalCount) * 100)}%)</span>
              </div>
              <div className="text-[10px] text-amber-400">{stats.kondisiRusak} butuh pemeliharaan</div>
            </div>
          </div>
        </div>

        {/* Tab & Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 sm:px-7 bg-slate-900/70 border-b border-slate-800">
          {/* Main Category Filter Tabs */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Semua Kategori</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/60 text-slate-300 font-mono">
                {asetList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pembangunan')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pembangunan'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-950/50'
                  : 'text-cyan-400 hover:text-cyan-200'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Aset Pembangunan (Fisik)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-200 font-mono">
                {stats.pembangunanCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('non_pembangunan')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'non_pembangunan'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Aset Non-Pembangunan</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-200 font-mono">
                {stats.nonPembangunanCount}
              </span>
            </button>
          </div>

          {/* Search, Dusun, Kondisi & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="modal-asset-search-input"
                placeholder="Cari nama, KIB, dusun, PJ, sumber dana..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  id="btn-modal-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Hapus kata kunci pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dusun Filter */}
            <select
              value={selectedDusun}
              onChange={e => setSelectedDusun(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Dusun</option>
              <option value="Dusun I">Dusun I</option>
              <option value="Dusun II">Dusun II</option>
              <option value="Dusun III">Dusun III</option>
              <option value="Dusun IV">Dusun IV</option>
            </select>

            {/* Kondisi Filter */}
            <select
              value={selectedKondisi}
              onChange={e => setSelectedKondisi(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Kondisi</option>
              <option value="Baik">Kondisi Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Grid Kartu"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Tabel Resmi KIB"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status indicator saat sedang mencari */}
          {searchQuery.trim() && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                <span>Ditemukan <strong>{filteredList.length}</strong> aset untuk "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white font-bold ml-1 cursor-pointer"
                  title="Reset pencarian"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Area: Grid or Table */}
        <div className={`p-4 sm:p-7 space-y-4 ${isFullPage ? '' : 'overflow-y-auto flex-1'}`}>
          {filteredList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400 mb-3 border border-slate-700 shadow-inner">
                <Search className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white">Tidak Ada Aset yang Sesuai</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {searchQuery.trim()
                  ? `Tidak ditemukan aset yang cocok dengan kata kunci "${searchQuery}".`
                  : 'Silakan ubah filter kategori, dusun, atau kondisi aset.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDusun('all');
                    setSelectedKondisi('all');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Reset Pencarian & Filter
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map(item => {
                const isPembangunan = item.kategori === 'pembangunan';

                return (
                  <div
                    key={item.id}
                    className="group bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header & Photo */}
                      <div 
                        onClick={() => handleOpenRincianAset(item)}
                        className="relative h-40 w-full overflow-hidden bg-slate-900 cursor-pointer group/photo"
                        title="Klik untuk membuka Rincian Data Aset Desa"
                      >
                        <img
                          src={resolveImageUrl(item.foto)}
                          alt={item.namaAset}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            // Fallback if image breaks
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                        {/* Top Category Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          {isPembangunan ? (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-md border border-blue-400/40 flex items-center gap-1 shadow-md">
                              <HardHat className="w-3 h-3" />
                              <span>Pembangunan Fisik</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-600/90 text-white backdrop-blur-md border border-emerald-400/40 flex items-center gap-1 shadow-md">
                              <Landmark className="w-3 h-3" />
                              <span>Non-Pembangunan</span>
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono bg-black/60 text-slate-300 backdrop-blur-md border border-white/10">
                            {item.kodeRegister}
                          </span>
                        </div>

                        {/* Condition Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            item.kondisi === 'Baik' 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                              : item.kondisi === 'Rusak Ringan' 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {item.kondisi}
                          </span>
                        </div>

                        {/* Bottom overlay title on photo */}
                        <div className="absolute bottom-2.5 left-3 right-3">
                          <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                            {item.subKategori}
                          </div>
                          <h4 className="text-sm font-bold text-white truncate drop-shadow-sm group-hover/photo:text-emerald-300 transition-colors" title={item.namaAset}>
                            {item.namaAset}
                          </h4>
                        </div>
                      </div>

                      {/* Card Body Info */}
                      <div className="p-4 space-y-2.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-slate-400">Nilai Perolehan / Anggaran:</span>
                          <span className="font-bold text-white font-mono text-xs sm:text-sm">
                            {formatRupiah(item.nilaiPerolehan)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Tahun {item.tahunPengadaan}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-slate-200 font-medium">{item.dusun}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 space-y-1">
                          <div className="flex items-start justify-between">
                            <span className="text-slate-500">Sumber Dana:</span>
                            <span className="text-slate-300 font-medium text-right truncate max-w-[170px]">{item.sumberDana}</span>
                          </div>
                          {item.luasAtauVolume && (
                            <div className="flex items-start justify-between">
                              <span className="text-slate-500">Volume/Ukuran:</span>
                              <span className="text-slate-300 font-medium">{item.luasAtauVolume}</span>
                            </div>
                          )}
                          <div className="flex items-start justify-between">
                            <span className="text-slate-500">Penanggung Jawab:</span>
                            <span className="text-slate-300 font-medium">{item.penanggungJawab}</span>
                          </div>
                        </div>

                        {item.keterangan && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                            "{item.keterangan}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onFocusOnMap(item);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Tampilkan dan zoom ke titik aset pada peta"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Lihat di Peta</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          id={`btn-open-asset-detail-grid-${item.id}`}
                          onClick={() => handleOpenRincianAset(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Rincian Data Aset Desa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canAddAsset && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditForm(item)}
                              className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Aset"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus pencatatan aset "${item.namaAset}"?`)) {
                                  onDeleteAset(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Aset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View (Resmi KIB) */
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-3">No</th>
                      <th className="py-3 px-3">Kode KIB</th>
                      <th className="py-3 px-4">Nama Aset & Spesifikasi</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3">Dusun</th>
                      <th className="py-3 px-3">Tahun</th>
                      <th className="py-3 px-3 text-right">Nilai Perolehan</th>
                      <th className="py-3 px-3">Kondisi</th>
                      <th className="py-3 px-3">Pengelola</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">{item.kodeRegister}</td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenRincianAset(item)}
                            className="font-bold text-white hover:text-emerald-400 text-left transition-colors cursor-pointer block"
                            title="Klik untuk membuka Rincian Data Aset Desa"
                          >
                            {item.namaAset}
                          </button>
                          <div className="text-[10px] text-slate-400">{item.subKategori} {item.luasAtauVolume ? `(${item.luasAtauVolume})` : ''}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.kategori === 'pembangunan' 
                              ? 'bg-blue-900/40 text-blue-300 border border-blue-800' 
                              : 'bg-emerald-900/40 text-emerald-300 border border-emerald-800'
                          }`}>
                            {item.kategori === 'pembangunan' ? 'Pembangunan' : 'Non-Pembangunan'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{item.dusun}</td>
                        <td className="py-3 px-3 font-mono">{item.tahunPengadaan}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {formatRupiah(item.nilaiPerolehan)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.kondisi === 'Baik' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {item.kondisi}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[130px]">
                          {item.penanggungJawab}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onFocusOnMap(item);
                                onClose();
                              }}
                              className="p-1 text-emerald-400 hover:text-white hover:bg-emerald-600/30 rounded"
                              title="Pusatkan Peta"
                            >
                              <Compass className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              id={`btn-open-asset-detail-table-${item.id}`}
                              onClick={() => handleOpenRincianAset(item)}
                              className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded cursor-pointer"
                              title="Rincian Data Aset Desa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canAddAsset && (
                              <button
                                type="button"
                                onClick={() => openEditForm(item)}
                                className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded cursor-pointer"
                                title="Edit Data Aset"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="p-3 sm:px-7 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Menampilkan <strong>{filteredList.length}</strong> dari total <strong>{asetList.length}</strong> aset terdaftar Desa Beliti Jaya
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Terhubung langsung dengan layer sebaran marker pada Peta GIS Leaflet
          </div>
        </div>
      </div>
  );

  const subModals = (
    <>
      {/* SUB-MODAL: Form Tambah / Edit Aset */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6"
            >
              <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingAset ? 'Edit Pencatatan Aset Desa' : 'Tambah Aset Desa Baru'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Format standar Kartu Inventaris Barang (KIB) Permendagri No. 1/2016
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-5 sm:px-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Kategori Aset: Pembangunan vs Non-Pembangunan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kategori Sifat Aset Desa <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formKategori === 'pembangunan'
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="kategoriAset"
                        value="pembangunan"
                        checked={formKategori === 'pembangunan'}
                        onChange={() => {
                          setFormKategori('pembangunan');
                          setFormSubKategori('Gedung & Bangunan Publik');
                        }}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-bold text-xs">Aset Pembangunan</div>
                        <div className="text-[10px] text-slate-400">Fisik, Gedung, Jalan, Irigasi, Sarana Publik</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formKategori === 'non_pembangunan'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="kategoriAset"
                        value="non_pembangunan"
                        checked={formKategori === 'non_pembangunan'}
                        onChange={() => {
                          setFormKategori('non_pembangunan');
                          setFormSubKategori('Tanah Kas Desa (KIB A)');
                        }}
                        className="text-emerald-600"
                      />
                      <div>
                        <div className="font-bold text-xs">Aset Non-Pembangunan</div>
                        <div className="text-[10px] text-slate-400">Tanah Kas, SDA Alami, Kendaraan, Mesin/Alat</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Nama Aset & Kode Register */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Aset <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formNama}
                      onChange={e => setFormNama(e.target.value)}
                      placeholder="Contoh: Gedung Poskesdes Beliti Jaya"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kode Register Aset (KIB) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formKode}
                      onChange={e => setFormKode(e.target.value)}
                      placeholder="Contoh: KIB-C/005/BLT/2023"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Sub Kategori & Dusun */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sub-Kategori Aset
                    </label>
                    <input
                      type="text"
                      value={formSubKategori}
                      onChange={e => setFormSubKategori(e.target.value)}
                      placeholder="Contoh: Jalan Usaha Tani / Sarana Kesehatan"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Lokasi Dusun <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formDusun}
                      onChange={e => setFormDusun(e.target.value as DusunWilayah)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Dusun I">Dusun I</option>
                      <option value="Dusun II">Dusun II</option>
                      <option value="Dusun III">Dusun III</option>
                      <option value="Dusun IV">Dusun IV</option>
                    </select>
                  </div>
                </div>

                {/* Nilai Perolehan & Tahun */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nilai Perolehan / Anggaran (Rp) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000000}
                      value={formNilai}
                      onChange={e => setFormNilai(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                      {formatRupiah(formNilai)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tahun Pengadaan / Pembangunan
                    </label>
                    <input
                      type="number"
                      value={formTahun}
                      onChange={e => setFormTahun(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Sumber Dana & Kondisi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sumber Dana
                    </label>
                    <select
                      value={formSumberDana}
                      onChange={e => setFormSumberDana(e.target.value as SumberDanaAset)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Dana Desa (APBN)">Dana Desa (APBN)</option>
                      <option value="Alokasi Dana Desa (ADD)">Alokasi Dana Desa (ADD)</option>
                      <option value="Bantuan Keuangan Provinsi">Bantuan Keuangan Provinsi</option>
                      <option value="Pendapatan Asli Desa (PADes)">Pendapatan Asli Desa (PADes)</option>
                      <option value="Hibah / Swadaya Masyarakat">Hibah / Swadaya Masyarakat</option>
                      <option value="Asal Usul Desa">Asal Usul Desa</option>
                      <option value="Penyertaan Modal BUMDes">Penyertaan Modal BUMDes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kondisi Fisik Saat Ini
                    </label>
                    <select
                      value={formKondisi}
                      onChange={e => setFormKondisi(e.target.value as KondisiAset)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Baik">Baik (Berfungsi Normal)</option>
                      <option value="Rusak Ringan">Rusak Ringan (Perlu Perawatan)</option>
                      <option value="Rusak Berat">Rusak Berat (Tidak Berfungsi)</option>
                    </select>
                  </div>
                </div>

                {/* Volume & Penanggung Jawab */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Luas / Volume / Kapasitas
                    </label>
                    <input
                      type="text"
                      value={formLuas}
                      onChange={e => setFormLuas(e.target.value)}
                      placeholder="Misal: 450 m² / 1.200 meter / 1 Unit"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Pengelola / Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={formPenanggungJawab}
                      onChange={e => setFormPenanggungJawab(e.target.value)}
                      placeholder="Misal: Kaur Tata Usaha / BUMDes"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Koordinat GPS Peta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Latitude (Garis Lintang) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formLat}
                      onChange={e => setFormLat(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Longitude (Garis Bujur) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formLng}
                      onChange={e => setFormLng(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* ── DOKUMENTASI MINIMAL 4 LINK FOTO & LIVE PREVIEW ── */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-400" />
                        <label className="text-xs font-bold text-white uppercase tracking-wider">
                          Link Foto Dokumentasi Aset Desa
                        </label>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Minimal 4 Foto & Live Preview
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Sesuai standar inventaris KIB, cantumkan minimal 4 link foto dokumentasi dari berbagai sudut (Tampak Depan, Samping/Konstruksi, Prasasti/Papan Nama, & Pemanfaatan Warga). Pratinjau foto langsung tampil secara visual.
                      </p>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowDriveGuide(!showDriveGuide)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                          showDriveGuide 
                            ? 'bg-amber-500/30 text-amber-200 border-amber-400 shadow-sm' 
                            : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                        }`}
                        title="Petunjuk cara memakai link foto Google Drive"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bisa Pakai Google Drive</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetPhotos(formKategori)}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Isi otomatis dengan 4 link foto contoh resmi"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Contoh 4 Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormFotoList(['', '', '', ''])}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Kosongkan semua link foto"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-400" />
                        <span>Kosongkan</span>
                      </button>
                    </div>
                  </div>

                  {/* Panduan Penggunaan Link Google Drive */}
                  <AnimatePresence>
                    {showDriveGuide && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-4 rounded-2xl border border-amber-500/40 text-xs text-slate-300 space-y-3 shadow-lg"
                      >
                        <div className="flex items-center justify-between text-amber-300 font-bold text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                              GD
                            </span>
                            <span>Panduan Memakai Link Foto Google Drive:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowDriveGuide(false)}
                            className="text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer text-[11px]"
                          >
                            Tutup
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 text-[10px] flex items-center justify-center font-mono">1</span>
                              <span>Pilih File di Google Drive</span>
                            </div>
                            <p className="text-slate-400 text-[10px] leading-relaxed">
                              Buka Google Drive di laptop atau HP, klik kanan pada file foto aset lalu pilih menu <strong>Bagikan (Share)</strong>.
                            </p>
                          </div>

                          <div className="bg-slate-950/70 p-3 rounded-xl border border-amber-500/30 space-y-1">
                            <div className="font-bold text-amber-300 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">2</span>
                              <span>Ubah Akses ke "Publik"</span>
                            </div>
                            <p className="text-slate-300 text-[10px] leading-relaxed">
                              Ubah <em>"Akses Umum"</em> dari <strong>Dibatasi</strong> menjadi <strong className="text-emerald-400">"Siapa saja yang memiliki link"</strong> (Pelihat/Viewer).
                            </p>
                          </div>

                          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 text-[10px] flex items-center justify-center font-mono">3</span>
                              <span>Salin & Tempel Link</span>
                            </div>
                            <p className="text-slate-400 text-[10px] leading-relaxed">
                              Klik tombol <strong>Salin link</strong>, lalu tempel (paste) ke salah satu slot foto di bawah. Aplikasi otomatis mengonversinya ke foto langsung!
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                          <span className="truncate">
                            Format link yang didukung: <code className="text-amber-300 font-mono text-[10px]">drive.google.com/file/d/.../view?usp=sharing</code>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const driveExample = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing';
                              navigator.clipboard.writeText(driveExample);
                              setCopiedDriveExample(true);
                              setTimeout(() => setCopiedDriveExample(false), 2000);
                            }}
                            className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                          >
                            {copiedDriveExample ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Link Contoh Disalin!</span>
                              </>
                            ) : (
                              <span>Salin Contoh Format Link</span>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Ringkasan Galeri 4 Foto (Live Preview Bar) */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                        <Camera className="w-3.5 h-3.5 text-teal-400" />
                        <span>Pratinjau Galeri 4 Foto Aset (Klik foto untuk memperbesar):</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formFotoList.filter(f => f.trim().length > 0).length} / {formFotoList.length} Foto Terisi
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {formFotoList.slice(0, 4).map((url, idx) => {
                        const labels = [
                          'Foto 1 (Utama / Depan)',
                          'Foto 2 (Samping / Fisik)',
                          'Foto 3 (Plang / Prasasti)',
                          'Foto 4 (Pemanfaatan)'
                        ];
                        const isFilled = url.trim().length > 0;
                        const isDrive = isGoogleDriveUrl(url.trim());
                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              if (isFilled) {
                                setZoomedImage({ url: resolveImageUrl(url.trim()), title: `${labels[idx]} - ${formNama || 'Aset Desa'}` });
                              }
                            }}
                            className={`relative h-24 rounded-xl overflow-hidden border transition-all ${
                              isFilled 
                                ? 'border-emerald-500/50 bg-slate-950 cursor-pointer hover:border-emerald-400 hover:shadow-lg hover:scale-[1.02]' 
                                : 'border-dashed border-slate-700/80 bg-slate-950/40 flex flex-col items-center justify-center'
                            }`}
                          >
                            {isFilled ? (
                              <>
                                <img
                                  src={resolveImageUrl(url.trim())}
                                  alt={`Pratinjau ${labels[idx]}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/20" />
                                
                                {isDrive && (
                                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500/80 backdrop-blur-xs rounded text-[8px] font-bold text-slate-950">
                                    Drive
                                  </div>
                                )}

                                <div className="absolute top-1 right-1 p-1 bg-black/60 rounded-md text-white backdrop-blur-xs">
                                  <Maximize2 className="w-2.5 h-2.5" />
                                </div>
                                <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-white truncate max-w-[85%]">
                                    {labels[idx]}
                                  </span>
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400"></span>
                                </div>
                              </>
                            ) : (
                              <div className="text-center p-1.5">
                                <Camera className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                                <div className="text-[9px] font-medium text-slate-500 leading-tight">
                                  {labels[idx]}
                                </div>
                                <div className="text-[8px] text-amber-400/80 mt-0.5">Belum terisi</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kolom Input & Pratinjau Detail Setiap Link Foto */}
                  <div className="space-y-3.5">
                    {formFotoList.map((photoUrl, index) => {
                      const slotTitles = [
                        { name: 'Foto 1 (Foto Utama / Tampak Depan)', desc: 'Foto sampul utama kartu inventaris & ikon peta GIS', wajib: true },
                        { name: 'Foto 2 (Tampak Samping / Konstruksi Fisik)', desc: 'Sudut pandang fisik penunjang atau detail struktur', wajib: true },
                        { name: 'Foto 3 (Papan Nama Proyek / Nomor KIB / Prasasti)', desc: 'Bukti nomor registrasi, prasasti peresmian, atau spesifikasi', wajib: true },
                        { name: 'Foto 4 (Kondisi Pemanfaatan / Lingkungan Sekitar)', desc: 'Kondisi riil pemanfaatan oleh masyarakat desa', wajib: true }
                      ];

                      const currentSlotInfo = index < slotTitles.length 
                        ? slotTitles[index] 
                        : { name: `Foto ${index + 1} (Dokumentasi Tambahan)`, desc: 'Foto dokumentasi pelengkap lainnya', wajib: false };

                      const hasValidUrl = photoUrl.trim().length > 0;
                      const isDrive = hasValidUrl && isGoogleDriveUrl(photoUrl.trim());
                      const driveFileId = isDrive ? extractGoogleDriveFileId(photoUrl.trim()) : null;

                      return (
                        <div 
                          key={index}
                          className={`bg-slate-900/70 p-3 sm:p-3.5 rounded-xl border transition-colors ${
                            isDrive ? 'border-amber-500/40 bg-slate-900/90' : 'border-slate-800/90 hover:border-slate-700'
                          }`}
                        >
                          {/* Slot Header */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                hasValidUrl ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {index + 1}
                              </span>
                              <div>
                                <span className="text-xs font-semibold text-slate-200">
                                  {currentSlotInfo.name}
                                </span>
                                {currentSlotInfo.wajib && (
                                  <span className="ml-1.5 text-[10px] text-emerald-400 font-bold">
                                    [Slot {index + 1} dari 4]
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {hasValidUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleClearPhotoSlot(index)}
                                  className="text-[10px] text-slate-400 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Kosongkan link ini"
                                >
                                  Hapus Link
                                </button>
                              )}
                              {index >= 4 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhotoSlot(index)}
                                  className="text-[10px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Hapus slot foto tambahan"
                                >
                                  Hapus Slot
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 mb-2">
                            {currentSlotInfo.desc}
                          </div>

                          {/* Input Bar */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <ImageIcon className="w-3.5 h-3.5" />
                              </div>
                              <input
                                type="url"
                                value={photoUrl}
                                onChange={e => handlePhotoUrlChange(index, e.target.value)}
                                placeholder={`https://drive.google.com/... atau https://... (URL foto ${index + 1})`}
                                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>

                            {hasValidUrl && (
                              <a
                                href={photoUrl.trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors shrink-0"
                                title="Buka tautan di tab baru"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          {/* Google Drive Detection Indicator */}
                          {isDrive && (
                            <div className="mt-2 flex items-center justify-between gap-2 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px]">
                              <div className="flex items-center gap-1.5 text-amber-300">
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 font-bold text-[9px] uppercase tracking-wider">
                                  Google Drive
                                </span>
                                <span className="text-[10px]">
                                  ID File: <strong className="font-mono text-white">{driveFileId ? `${driveFileId.substring(0, 14)}...` : 'Terdeteksi'}</strong>
                                </span>
                              </div>
                              <span className="text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Otomatis Dikonversi
                              </span>
                            </div>
                          )}

                          {/* Live Preview Per-Slot */}
                          <div className="mt-2.5">
                            {hasValidUrl ? (
                              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 h-36 sm:h-44 group">
                                <img
                                  src={resolveImageUrl(photoUrl.trim())}
                                  alt={`Pratinjau ${currentSlotInfo.name}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const errorNotice = document.createElement('div');
                                      errorNotice.className = 'w-full h-full flex flex-col items-center justify-center p-3 text-center text-rose-300 text-xs bg-rose-950/40';
                                      if (isDrive) {
                                        errorNotice.innerHTML = '<span class="font-bold mb-1 text-rose-300">Foto Google Drive Belum Publik</span><span class="text-[10px] text-slate-300 mb-1 leading-tight">Pastikan opsi <strong>"Akses Umum"</strong> di Google Drive diatur ke <strong>"Siapa saja yang memiliki link"</strong> (Pelihat/Viewer).</span><span class="text-[9px] text-amber-400">Jika masih "Dibatasi", browser tidak dapat menampilkan gambarnya.</span>';
                                      } else {
                                        errorNotice.innerHTML = '<span class="font-bold mb-1">Tautan gambar tidak dapat dimuat</span><span class="text-[10px] text-rose-400">Pastikan URL link gambar bersifat publik dan dapat diakses langsung.</span>';
                                      }
                                      parent.appendChild(errorNotice);
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                                
                                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                  {isDrive ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/90 text-slate-950 shadow-md flex items-center gap-1 font-bold">
                                      <CheckCircle2 className="w-3 h-3 text-slate-950" />
                                      <span>Google Drive Aktif</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>Pratinjau Live Aktif</span>
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setZoomedImage({ url: resolveImageUrl(photoUrl.trim()), title: `${currentSlotInfo.name} - ${formNama || 'Aset Desa'}` })}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white backdrop-blur-md transition-all cursor-pointer shadow-md flex items-center gap-1 text-[10px] font-medium"
                                  title="Perbesar gambar"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                  <span>Perbesar</span>
                                </button>

                                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 font-medium">
                                  <span className="truncate max-w-[80%]">{currentSlotInfo.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">Siap disimpan</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-20 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 flex items-center justify-center gap-2.5 p-3 text-slate-500">
                                <Camera className="w-4 h-4 text-slate-600 shrink-0" />
                                <span className="text-[11px] text-slate-500 text-center">
                                  Belum ada link foto. Masukkan link web atau <strong>Google Drive</strong> di atas untuk melihat <strong>pratinjau langsung</strong>.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tombol Tambah Slot Foto Tambahan */}
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleAddExtraPhotoSlot}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tambah Slot Foto Dokumentasi Tambahan (Foto ke-{formFotoList.length + 1})</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Keterangan & Catatan Pemanfaatan
                  </label>
                  <textarea
                    rows={2}
                    value={formKeterangan}
                    onChange={e => setFormKeterangan(e.target.value)}
                    placeholder="Deskripsi pemanfaatan aset, penerima manfaat warga, atau riwayat pembangunan..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {editingAset ? 'Simpan Perubahan' : 'Tambahkan Aset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUB-MODAL: Detail Lengkap Inspector */}
      <AnimatePresence>
        {detailAset && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Photo Display Banner with Multi-Photo Gallery Selector */}
              {(() => {
                const photos = detailAset.fotoList && detailAset.fotoList.length > 0
                  ? detailAset.fotoList.filter(p => p && p.trim().length > 0)
                  : [detailAset.foto];
                const activePhotoUrl = photos[detailActivePhotoIdx] || photos[0] || detailAset.foto;

                return (
                  <div>
                    <div className="relative h-52 sm:h-60 w-full bg-slate-950 group">
                      <img
                        src={resolveImageUrl(activePhotoUrl)}
                        alt={detailAset.namaAset}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setZoomedImage({ url: resolveImageUrl(activePhotoUrl), title: `${detailAset.namaAset} (Foto ${detailActivePhotoIdx + 1})` })}
                          className="p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md cursor-pointer transition-colors"
                          title="Perbesar foto ini"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailAset(null)}
                          className="p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-4 right-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                            detailAset.kategori === 'pembangunan' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {detailAset.kategori === 'pembangunan' ? 'Aset Pembangunan (Fisik)' : 'Aset Non-Pembangunan'}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                            Foto {detailActivePhotoIdx + 1} dari {photos.length}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-1.5 leading-tight">{detailAset.namaAset}</h3>
                        <div className="text-xs text-emerald-400 font-mono">{detailAset.kodeRegister}</div>
                      </div>
                    </div>

                    {/* Multi-Photo Thumbnail Bar */}
                    {photos.length > 1 && (
                      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-emerald-400" />
                          Sudut Foto:
                        </span>
                        <div className="flex items-center gap-2">
                          {photos.map((pUrl, pIdx) => {
                            const pLabels = ['Tampak Depan', 'Tampak Samping', 'Papan Nama/Prasasti', 'Pemanfaatan Warga'];
                            const label = pIdx < pLabels.length ? pLabels[pIdx] : `Foto ${pIdx + 1}`;
                            const isSelected = detailActivePhotoIdx === pIdx;
                            return (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setDetailActivePhotoIdx(pIdx)}
                                className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                                  isSelected 
                                    ? 'border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400/50' 
                                    : 'border-slate-800 bg-slate-900/80 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={resolveImageUrl(pUrl)}
                                  alt={label}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded object-cover"
                                />
                                <span className={`text-[10px] pr-1.5 font-medium ${isSelected ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                                  {label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                  <div>
                    <div className="text-slate-400 text-[11px]">Nilai Perolehan / Buku</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">
                      {formatRupiah(detailAset.nilaiPerolehan)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]">Kondisi & Status</div>
                    <div className="text-sm font-bold text-emerald-300 mt-0.5">
                      {detailAset.kondisi} ({detailAset.statusPemanfaatan})
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-slate-300 divide-y divide-slate-800">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Sub-Kategori:</span>
                    <span className="font-medium text-white">{detailAset.subKategori}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Tahun Pengadaan / Bangun:</span>
                    <span className="font-mono text-white">{detailAset.tahunPengadaan}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Sumber Pembiayaan:</span>
                    <span className="font-medium text-white">{detailAset.sumberDana}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Lokasi Dusun:</span>
                    <span className="font-semibold text-emerald-400">{detailAset.dusun}</span>
                  </div>
                  {detailAset.luasAtauVolume && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Volume / Luas:</span>
                      <span className="font-medium text-white">{detailAset.luasAtauVolume}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Penanggung Jawab / Pengelola:</span>
                    <span className="font-medium text-white">{detailAset.penanggungJawab}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Koordinat GPS:</span>
                    <span className="font-mono text-slate-300">{detailAset.koordinat.lat}, {detailAset.koordinat.lng}</span>
                  </div>
                </div>

                {detailAset.keterangan && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-slate-300">
                    <div className="text-[11px] text-slate-400 font-medium mb-1">Catatan & Manfaat bagi Warga:</div>
                    <p className="text-xs leading-relaxed">{detailAset.keterangan}</p>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                  {onOpenAssetDetail && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = detailAset;
                        setDetailAset(null);
                        onClose();
                        onOpenAssetDetail(target);
                      }}
                      className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer text-xs sm:text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka Halaman Rincian Web</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onFocusOnMap(detailAset);
                      setDetailAset(null);
                      onClose();
                    }}
                    className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer text-xs sm:text-sm"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Fokuskan di Peta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailAset(null)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer text-xs sm:text-sm"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUB-MODAL: Lightbox Zoom Pratinjau Foto Penuh */}
      <AnimatePresence>
        {zoomedImage && (
          <div 
            className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white truncate max-w-md">{zoomedImage.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={zoomedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Sumber Asli</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setZoomedImage(null)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-2 overflow-auto max-h-[75vh] flex items-center justify-center bg-black/60">
                <img
                  src={resolveImageUrl(zoomedImage.url)}
                  alt={zoomedImage.title}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[72vh] object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Klik di luar area foto atau tombol Tutup untuk kembali</span>
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  if (isFullPage) {
    return (
      <div id="village-inventory-page" className="space-y-4 pb-8 relative">
        {contentCard}
        {bottomStickyBar}
        {subModals}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-6xl my-auto flex flex-col"
      >
        {contentCard}
        {bottomStickyBar}
      </motion.div>
      {subModals}
    </div>
  );
};

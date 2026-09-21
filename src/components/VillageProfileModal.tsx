import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DesaProfile, PerangkatDesa, User } from '../types';
import { DEFAULT_VILLAGE_LOGO } from '../data/mockData';
import { 
  Building, 
  UserCheck, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Compass, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  X, 
  Shield, 
  FileText, 
  Layers, 
  CheckCircle2, 
  Image as ImageIcon,
  RotateCcw,
  Briefcase,
  Calendar,
  Eye,
  Info,
  Camera,
  Upload,
  User as UserIcon,
  Megaphone,
  Tv,
  Play,
  Pause,
  Sliders,
  Radio,
  ArrowLeft
} from 'lucide-react';

const RUNNING_TEXT_PRESETS = [
  {
    id: 'standar',
    title: 'Standar Pelayanan Balai Desa',
    desc: 'Jadwal jam kerja kantor desa, layanan persuratan kependudukan & transparansi publik',
    text: '📢 SELAMAT DATANG DI ANJUNGAN KIOSK DIGITAL DESA BELITI JAYA • Sistem Informasi Geografis Kependudukan & DTKS Berbasis Peta Digital • Transparansi Data Bantuan Sosial (PKH, BPNT, BLT-DD, Bansos Beras) • Pelayanan Administrasi Kantor Desa Buka Senin - Jumat Pukul 08:00 - 15:30 WIB • Menuju Desa Cerdas, Maju dan Mandiri'
  },
  {
    id: 'bansos',
    title: 'Pengumuman Bansos & Pembaruan DTKS',
    desc: 'Sosialisasi penyaluran PKH, BPNT, BLT-Dana Desa dan verifikasi kelayakan keluarga',
    text: '💰 INFORMASI BANTUAN SOSIAL: Penyaluran Bansos PKH, BPNT, dan BLT-Dana Desa Beliti Jaya Dilaksanakan Tepat Sasaran Berdasarkan Data DTKS Terverifikasi • Pengaduan dan Validasi Data Terbuka Melalui Kasi Kesejahteraan / Kadus Setempat'
  },
  {
    id: 'musdes',
    title: 'Musyawarah Desa (Musdes / Musrenbangdes)',
    desc: 'Pengumuman agenda musyawarah rencana kerja dan pembangunan desa',
    text: '📋 AGENDA DESA: Musyawarah Rencana Pembangunan Desa (Musrenbangdes) Beliti Jaya • Mari Bersama Membangun Desa yang Maju, Bersih, Transparan, dan Sejahtera • Sampaikan Aspirasi Dusun Melalui Kepala Dusun dan BPD'
  },
  {
    id: 'gotong_royong',
    title: 'Imbauan Warga, Kamtibmas & Gotong Royong',
    desc: 'Jadwal kerja bakti dusun, kebersihan lingkungan, posyandu dan ketertiban desa',
    text: '🌿 IMBAUAN WARGA: Jadwal Kerja Bakti Kebersihan Lingkungan Dusun I - IV Setiap Hari Minggu Pagi Pukul 07:30 WIB • Tingkatkan Kewaspadaan Kamtibmas dan Jaga Kebersihan Saluran Air Desa Beliti Jaya'
  }
];

/**
 * Client-side image compression to lightweight Base64 (supporting PNG transparency & SVG)
 */
const compressImage = (file: File, maxWidth = 500, maxHeight = 500, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If SVG, preserve raw vector data URL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const isPng = file.type === 'image/png';
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface VillageProfileModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  desaProfile: DesaProfile;
  onSaveProfile: (updatedProfile: DesaProfile) => void;
  currentUser: User | null;
  isFullPage?: boolean;
  onBackToMap?: () => void;
  initialTab?: 'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText';
}

export const VillageProfileModal: React.FC<VillageProfileModalProps> = ({
  isOpen = true,
  onClose,
  desaProfile,
  onSaveProfile,
  currentUser,
  isFullPage = true,
  onBackToMap,
  initialTab = 'profil'
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText'>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<DesaProfile>(desaProfile);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [runningTextSavedSuccess, setRunningTextSavedSuccess] = useState(false);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);

  // Synchronize activeTab when initialTab changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Perangkat Modal (for Adding or Editing single Perangkat Desa)
  const [editingPerangkat, setEditingPerangkat] = useState<PerangkatDesa | null>(null);
  const [isPerangkatModalOpen, setIsPerangkatModalOpen] = useState(false);
  const [isNewPerangkat, setIsNewPerangkat] = useState(false);

  // Perangkat form state
  const [perangkatForm, setPerangkatForm] = useState<PerangkatDesa>({
    id: '',
    nama: '',
    jabatan: '',
    nip: '',
    nik: '',
    noHp: '',
    email: '',
    foto: '',
    kategori: 'Kasi',
    periode: '2021 - 2027',
    tugasPokok: ''
  });

  // Sync state whenever desaProfile changes or modal opens
  React.useEffect(() => {
    setFormData(desaProfile);
  }, [desaProfile, isOpen]);

  // Keyboard shortcut listener (ESC to go back)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPerangkatModalOpen) {
          setIsPerangkatModalOpen(false);
          return;
        }
        if (onBackToMap) {
          onBackToMap();
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPerangkatModalOpen, onBackToMap, onClose]);

  if (!isOpen && !isFullPage) return null;

  const handleGeneralChange = (field: keyof DesaProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDirectUpdateLogo = (dataUrl: string) => {
    const updated: DesaProfile = {
      ...formData,
      logoDesa: dataUrl,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: currentUser?.nama || 'Admin Desa'
    };
    setFormData(updated);
    if (onSaveProfile) {
      onSaveProfile(updated);
    }
  };

  const handleBatasChange = (arah: 'utara' | 'selatan' | 'timur' | 'barat', value: string) => {
    setFormData(prev => ({
      ...prev,
      batasWilayah: {
        ...prev.batasWilayah,
        [arah]: value
      }
    }));
  };

  const handleKepalaDesaChange = (field: keyof DesaProfile['kepalaDesa'], value: string) => {
    setFormData(prev => ({
      ...prev,
      kepalaDesa: {
        ...prev.kepalaDesa,
        [field]: value
      }
    }));
  };

  const handleSekdesChange = (field: keyof DesaProfile['sekretarisDesa'], value: string) => {
    setFormData(prev => ({
      ...prev,
      sekretarisDesa: {
        ...prev.sekretarisDesa,
        [field]: value
      }
    }));
  };

  // Helper to process image file upload from device or camera
  const handleProcessImageFile = async (file: File, onDone: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file format gambar (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Harap pilih gambar di bawah 12MB.');
      return;
    }
    try {
      const compressed = await compressImage(file, 500, 500, 0.85);
      onDone(compressed);
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      alert('Terjadi kesalahan saat memproses gambar.');
    }
  };

  // Quick update photo for Perangkat Desa
  const handleQuickUpdatePerangkatFoto = (id: string, fotoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      perangkatLainnya: prev.perangkatLainnya.map(p => p.id === id ? { ...p, foto: fotoUrl } : p)
    }));
  };

  const handleMisiChange = (index: number, value: string) => {
    const newMisi = [...(formData.misi || [])];
    newMisi[index] = value;
    setFormData(prev => ({ ...prev, misi: newMisi }));
  };

  const handleAddMisi = () => {
    setFormData(prev => ({
      ...prev,
      misi: [...(prev.misi || []), '']
    }));
  };

  const handleRemoveMisi = (index: number) => {
    setFormData(prev => ({
      ...prev,
      misi: (prev.misi || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveAll = () => {
    const updated: DesaProfile = {
      ...formData,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: currentUser ? currentUser.name : 'Administrator'
    };
    onSaveProfile(updated);
    setIsEditing(false);
  };

  const handleSaveRunningText = (customText?: string, customSpeed?: 'slow' | 'normal' | 'fast') => {
    const textToSave = customText !== undefined ? customText : (formData.runningTextKiosk || '');
    const speedToSave = customSpeed !== undefined ? customSpeed : (formData.runningTextSpeed || 'normal');
    const updated: DesaProfile = {
      ...formData,
      runningTextKiosk: textToSave,
      runningTextSpeed: speedToSave,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: currentUser ? currentUser.name : 'Administrator'
    };
    setFormData(updated);
    onSaveProfile(updated);
    setRunningTextSavedSuccess(true);
    setTimeout(() => setRunningTextSavedSuccess(false), 3500);
  };

  const handleInsertSymbol = (symbol: string) => {
    const current = formData.runningTextKiosk || '';
    const updated = current ? `${current} ${symbol} ` : `${symbol} `;
    setFormData(prev => ({ ...prev, runningTextKiosk: updated }));
  };

  const handleApplyPreset = (presetText: string) => {
    setFormData(prev => ({ ...prev, runningTextKiosk: presetText }));
  };

  // Open modal to add new Perangkat
  const handleOpenAddPerangkat = () => {
    setPerangkatForm({
      id: `prk_${Date.now()}`,
      nama: '',
      jabatan: '',
      nip: '',
      nik: '',
      noHp: '',
      email: '',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      kategori: 'Kasi',
      periode: '2021 - 2027',
      tugasPokok: ''
    });
    setIsNewPerangkat(true);
    setIsPerangkatModalOpen(true);
  };

  // Open modal to edit existing Perangkat
  const handleOpenEditPerangkat = (prk: PerangkatDesa) => {
    setEditingPerangkat(prk);
    setPerangkatForm({ ...prk });
    setIsNewPerangkat(false);
    setIsPerangkatModalOpen(true);
  };

  // Save Perangkat (Add or Update)
  const handleSavePerangkat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perangkatForm.nama.trim() || !perangkatForm.jabatan.trim()) return;

    if (isNewPerangkat) {
      const updatedList = [...formData.perangkatLainnya, { ...perangkatForm, id: `prk_${Date.now()}` }];
      const updatedProfile = { ...formData, perangkatLainnya: updatedList };
      setFormData(updatedProfile);
      onSaveProfile(updatedProfile);
    } else {
      const updatedList = formData.perangkatLainnya.map(p => 
        p.id === perangkatForm.id ? perangkatForm : p
      );
      const updatedProfile = { ...formData, perangkatLainnya: updatedList };
      setFormData(updatedProfile);
      onSaveProfile(updatedProfile);
    }

    setIsPerangkatModalOpen(false);
    setEditingPerangkat(null);
  };

  // Delete Perangkat
  const handleDeletePerangkat = (id: string, nama: string) => {
    if (window.confirm(`Hapus data perangkat desa "${nama}"?`)) {
      const updatedList = formData.perangkatLainnya.filter(p => p.id !== id);
      const updatedProfile = { ...formData, perangkatLainnya: updatedList };
      setFormData(updatedProfile);
      onSaveProfile(updatedProfile);
    }
  };

  const contentCard = (
    <div className={`bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 flex flex-col overflow-hidden backdrop-blur-xl ${
      isFullPage ? 'rounded-3xl' : 'rounded-3xl w-full max-w-5xl max-h-[92vh] my-auto'
    }`}>
      {/* Header with Title and Mode Controls (Only in modal mode) */}
      {!isFullPage && (
        <div className="p-5 sm:px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-inner overflow-hidden p-1">
              {formData.logoDesa ? (
                <img src={formData.logoDesa} alt={`Logo Desa ${formData.namaDesa}`} className="w-9 h-9 object-contain drop-shadow" />
              ) : (
                '🏛️'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Pemerintahan & Profil Desa {formData.namaDesa}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {formData.kecamatan} • {formData.kabupaten}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kelola data profil wilayah, Kepala Desa, Sekretaris Desa, dan seluruh Perangkat Desa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switch Button */}
            {!isEditing ? (
              <motion.button
                whileTap={{ scale: 0.94 }}
                type="button"
                id="btn-enable-edit-village"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Data Desa</span>
              </motion.button>
            ) : (
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => {
                    setFormData(desaProfile);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                >
                  Batal
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  id="btn-save-village-profile"
                  onClick={handleSaveAll}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 border border-emerald-400/30 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </motion.button>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              id="btn-close-village-modal"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
        <div className="bg-slate-950/40 px-5 sm:px-6 pt-3 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profil'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Data Wilayah & Kontak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pimpinan')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pimpinan'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Kepala Desa & Sekdes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('perangkat')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'perangkat'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Perangkat Desa ({formData.perangkatLainnya.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('struktur')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'struktur'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Bagan Struktur Organisasi</span>
          </button>

          <button
            type="button"
            id="tab-village-running-text"
            onClick={() => setActiveTab('runningText')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'runningText'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Running Text (Kiosk)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Ticker
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className={`p-5 sm:p-7 space-y-6 flex-1 text-xs sm:text-sm ${isFullPage ? '' : 'overflow-y-auto max-h-[calc(92vh-130px)]'}`}>
          {/* TAB 1: PROFIL & WILAYAH DESA */}
          {activeTab === 'profil' && (
            <div className="space-y-6">
              {/* Alert Status Editing */}
              {isEditing && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-emerald-300">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Mode Edit Aktif: Ubah data umum desa dan batas wilayah di bawah ini, lalu klik tombol <strong>Simpan Perubahan</strong>.</span>
                </div>
              )}

              {/* SECTION: LOGO & IDENTITAS VISUAL DESA */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Logo & Lambang Resmi Desa
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Otomatis tampil di Navbar SIG & Kop Surat Ekspor Laporan
                  </span>
                </div>

                <div 
                  className={`flex flex-col md:flex-row items-start md:items-center gap-5 p-4 rounded-2xl border transition-all ${
                    isDraggingLogo 
                      ? 'bg-emerald-500/10 border-emerald-400/80 shadow-lg ring-2 ring-emerald-500/30' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleProcessImageFile(e.dataTransfer.files[0], (dataUrl) => {
                        if (isEditing) {
                          handleGeneralChange('logoDesa', dataUrl);
                        } else {
                          handleDirectUpdateLogo(dataUrl);
                        }
                      });
                    }
                  }}
                >
                  {/* Logo Preview & Dropzone */}
                  <div className="relative group shrink-0 mx-auto md:mx-0">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-950/80 border-2 border-emerald-500/30 flex items-center justify-center p-2.5 shadow-inner overflow-hidden relative">
                      {formData.logoDesa ? (
                        <img
                          src={formData.logoDesa}
                          alt={`Logo Desa ${formData.namaDesa}`}
                          className="max-w-full max-h-full object-contain drop-shadow-md"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500 text-center p-2">
                          <Shield className="w-9 h-9 text-slate-600 mb-1" />
                          <span className="text-[10px] text-slate-400">Belum Ada Logo</span>
                        </div>
                      )}

                      {/* Hover Overlay Button to change logo */}
                      <label 
                        className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all text-white text-[11px] font-semibold border-2 border-emerald-400 backdrop-blur-xs"
                        title="Klik untuk upload foto/logo desa baru"
                      >
                        <Camera className="w-6 h-6 text-emerald-400 mb-1" />
                        <span>Ganti Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                if (isEditing) {
                                  handleGeneralChange('logoDesa', dataUrl);
                                } else {
                                  handleDirectUpdateLogo(dataUrl);
                                }
                              });
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>

                    {formData.logoDesa && (
                      <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-md flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Aktif
                      </span>
                    )}
                  </div>

                  {/* Details, Instructions & Actions */}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">
                          Lambang Resmi Desa {formData.namaDesa}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Kec. {formData.kecamatan}, Kab. {formData.kabupaten}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Unggah file lambang daerah atau logo resmi desa (format <strong>PNG transparan</strong> sangat direkomendasikan, JPG, atau WebP). Ukuran maksimal 12MB. Logo ini akan digunakan pada kop surat resmi ekspor PDF dan lambang instansi pada SIG.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Primary Upload Button */}
                        <label className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 border border-emerald-400/30">
                          <Upload className="w-4 h-4" />
                          <span>{formData.logoDesa ? 'Unggah Logo Baru' : 'Upload File Logo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                  if (isEditing) {
                                    handleGeneralChange('logoDesa', dataUrl);
                                  } else {
                                    handleDirectUpdateLogo(dataUrl);
                                  }
                                });
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>

                        {/* Reset to Default Beliti Jaya Emblem */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              handleGeneralChange('logoDesa', DEFAULT_VILLAGE_LOGO);
                            } else {
                              handleDirectUpdateLogo(DEFAULT_VILLAGE_LOGO);
                            }
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                          title="Pakai lambang bawaan khas Desa Beliti Jaya (Musi Rawas)"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Gunakan Lambang Default</span>
                        </button>

                        {/* Delete Logo */}
                        {formData.logoDesa && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus logo desa ini?')) {
                                if (isEditing) {
                                  handleGeneralChange('logoDesa', '');
                                } else {
                                  handleDirectUpdateLogo('');
                                }
                              }
                            }}
                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-medium border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Logo</span>
                          </button>
                        )}
                      </div>

                      {/* URL input field when editing */}
                      {isEditing && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] text-slate-400 shrink-0">Atau Tautan URL Logo:</span>
                          <input
                            type="text"
                            value={formData.logoDesa || ''}
                            onChange={(e) => handleGeneralChange('logoDesa', e.target.value)}
                            placeholder="https://... atau data:image/..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:border-emerald-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 1: Identitas Administratif */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Building className="w-4 h-4 text-emerald-400" />
                  Identitas Wilayah Administratif
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium">Nama Desa</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.namaDesa}
                        onChange={(e) => handleGeneralChange('namaDesa', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <div className="text-white font-bold text-sm bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">{formData.namaDesa}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium">Kode Kemendagri Desa</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.kodeDesa}
                        onChange={(e) => handleGeneralChange('kodeDesa', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <div className="text-slate-200 font-mono text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">{formData.kodeDesa}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium">Kecamatan</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.kecamatan}
                        onChange={(e) => handleGeneralChange('kecamatan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <div className="text-slate-200 font-semibold bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">{formData.kecamatan}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium">Kabupaten</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.kabupaten}
                        onChange={(e) => handleGeneralChange('kabupaten', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <div className="text-slate-200 font-semibold bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">{formData.kabupaten}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium">Provinsi</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.provinsi}
                        onChange={(e) => handleGeneralChange('provinsi', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <div className="text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">{formData.provinsi}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium">Kode Pos</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.kodePos}
                        onChange={(e) => handleGeneralChange('kodePos', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <div className="text-emerald-400 font-mono font-bold bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">{formData.kodePos}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium">Luas Wilayah (Hektar / Ha)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.luasWilayahHa}
                        onChange={(e) => handleGeneralChange('luasWilayahHa', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <div className="text-emerald-400 font-bold bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">{formData.luasWilayahHa.toLocaleString('id-ID')} Ha</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium">Luas Wilayah (Km²)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={formData.luasWilayahKm2}
                        onChange={(e) => handleGeneralChange('luasWilayahKm2', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <div className="text-slate-200 font-bold bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">± {formData.luasWilayahKm2} km²</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      Alamat Kantor Kepala Desa
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={formData.alamatKantor}
                        onChange={(e) => handleGeneralChange('alamatKantor', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none resize-none"
                      />
                    ) : (
                      <div className="text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">{formData.alamatKantor}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-medium flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      Email & Telepon Resmi Desa
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="email"
                          placeholder="Email Resmi"
                          value={formData.emailDesa}
                          onChange={(e) => handleGeneralChange('emailDesa', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:border-emerald-500 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Telepon / Hotline"
                          value={formData.teleponDesa}
                          onChange={(e) => handleGeneralChange('teleponDesa', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="text-blue-400 font-mono flex items-center gap-1.5">
                          <Mail className="w-3 h-3" /> {formData.emailDesa}
                        </div>
                        <div className="text-slate-300 font-mono flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-400" /> {formData.teleponDesa}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 2: Batas Wilayah Administrasi */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Batas-Batas Administrasi Wilayah
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">Sebelah Utara:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.batasWilayah.utara}
                        onChange={(e) => handleBatasChange('utara', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <span className="text-slate-200 font-medium">{formData.batasWilayah.utara}</span>
                    )}
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">Sebelah Selatan:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.batasWilayah.selatan}
                        onChange={(e) => handleBatasChange('selatan', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <span className="text-slate-200 font-medium">{formData.batasWilayah.selatan}</span>
                    )}
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">Sebelah Timur:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.batasWilayah.timur}
                        onChange={(e) => handleBatasChange('timur', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <span className="text-slate-200 font-medium">{formData.batasWilayah.timur}</span>
                    )}
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">Sebelah Barat:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.batasWilayah.barat}
                        onChange={(e) => handleBatasChange('barat', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500 outline-none"
                      />
                    ) : (
                      <span className="text-slate-200 font-medium">{formData.batasWilayah.barat}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 3: Visi & Misi Desa */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Visi & Misi Pembangunan Desa
                </h3>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-medium">Visi Desa:</label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={formData.visi || ''}
                      onChange={(e) => handleGeneralChange('visi', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-emerald-500 outline-none resize-none"
                    />
                  ) : (
                    <div className="text-emerald-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-medium italic">
                      "{formData.visi}"
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-slate-400 text-[11px] font-medium">Misi Pembangunan Desa:</label>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleAddMisi}
                        className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] flex items-center gap-1 hover:bg-emerald-600/30"
                      >
                        <Plus className="w-3 h-3" /> Tambah Poin Misi
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(formData.misi || []).map((m, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={m}
                              onChange={(e) => handleMisiChange(idx, e.target.value)}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:border-emerald-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveMisi(idx)}
                              className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-200 leading-relaxed">{m}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEPALA DESA & SEKRETARIS DESA */}
          {activeTab === 'pimpinan' && (
            <div className="space-y-6">
              {/* Alert Status Editing */}
              {isEditing && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-emerald-300">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Mode Edit Aktif: Ubah data profil, NIP, NIK, No HP, dan Foto resmi Kepala Desa serta Sekretaris Desa.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KEPALA DESA CARD */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-5 rounded-3xl border border-emerald-500/30 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500/20 border-b border-l border-emerald-500/30 rounded-bl-2xl text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Pimpinan Utama
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative group shrink-0">
                      <img
                        src={formData.kepalaDesa.foto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80'}
                        alt={formData.kepalaDesa.nama}
                        className="w-20 h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                      />
                      {isEditing && (
                        <label 
                          className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-semibold border-2 border-emerald-400"
                          title="Klik untuk upload / ganti foto Kepala Desa"
                        >
                          <Camera className="w-5 h-5 text-emerald-400 mb-0.5" />
                          <span>Ganti Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                  handleKepalaDesaChange('foto', dataUrl);
                                });
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                        Kepala Desa
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">
                        {formData.kepalaDesa.nama}
                      </h3>
                      <p className="text-slate-400 text-[11px] font-mono">
                        NIP: {formData.kepalaDesa.nip || '-'}
                      </p>
                      <p className="text-emerald-400 text-[11px] font-medium">
                        Periode: {formData.kepalaDesa.periode || '2021 - 2027'}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Nama Lengkap & Gelar</label>
                        <input
                          type="text"
                          value={formData.kepalaDesa.nama}
                          onChange={(e) => handleKepalaDesaChange('nama', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-1">NIP</label>
                          <input
                            type="text"
                            value={formData.kepalaDesa.nip || ''}
                            onChange={(e) => handleKepalaDesaChange('nip', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-[11px] focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-1">NIK</label>
                          <input
                            type="text"
                            value={formData.kepalaDesa.nik || ''}
                            onChange={(e) => handleKepalaDesaChange('nik', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-[11px] focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-1">No HP / WhatsApp</label>
                          <input
                            type="text"
                            value={formData.kepalaDesa.noHp || ''}
                            onChange={(e) => handleKepalaDesaChange('noHp', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-1">Masa Jabatan (Periode)</label>
                          <input
                            type="text"
                            value={formData.kepalaDesa.periode || ''}
                            onChange={(e) => handleKepalaDesaChange('periode', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                      {/* MODUL UPLOAD FOTO KEPALA DESA */}
                      <div className="bg-slate-900/90 p-3 rounded-2xl border border-emerald-500/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Foto Resmi Kepala Desa</span>
                          </label>
                          {formData.kepalaDesa.foto && (
                            <button
                              type="button"
                              onClick={() => handleKepalaDesaChange('foto', '')}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                            >
                              Hapus Foto
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {formData.kepalaDesa.foto ? (
                              <img
                                src={formData.kepalaDesa.foto}
                                alt="Foto Kades"
                                className="w-14 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow"
                              />
                            ) : (
                              <div className="w-14 h-16 rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                                <span className="text-[8px] mt-0.5">Pas Foto</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95 border border-emerald-400/30">
                                <Upload className="w-3.5 h-3.5" />
                                <span>{formData.kepalaDesa.foto ? 'Ganti File Foto' : 'Unggah File Foto'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                        handleKepalaDesaChange('foto', dataUrl);
                                      });
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                              <span className="text-[10px] text-slate-400">JPG, PNG, WebP (Maks 12MB)</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 shrink-0">Atau URL:</span>
                              <input
                                type="text"
                                value={formData.kepalaDesa.foto || ''}
                                onChange={(e) => handleKepalaDesaChange('foto', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-[10px] focus:border-emerald-500 outline-none font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Sambutan / Kutipan Kepala Desa</label>
                        <textarea
                          rows={2}
                          value={formData.kepalaDesa.sambutan || ''}
                          onChange={(e) => handleKepalaDesaChange('sambutan', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-800/50 p-2 rounded-xl">
                          <span className="text-slate-400 block text-[10px]">NIK</span>
                          <span className="font-mono text-slate-200">{formData.kepalaDesa.nik || '-'}</span>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded-xl">
                          <span className="text-slate-400 block text-[10px]">Kontak HP/WA</span>
                          <span className="text-emerald-400 font-mono font-medium">{formData.kepalaDesa.noHp || '-'}</span>
                        </div>
                      </div>
                      {formData.kepalaDesa.sambutan && (
                        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                          <span className="text-slate-400 block text-[10px] font-semibold mb-1">Sambutan Kepala Desa:</span>
                          <p className="text-slate-300 italic text-[11px] leading-relaxed">
                            "{formData.kepalaDesa.sambutan}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SEKRETARIS DESA CARD */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-5 rounded-3xl border border-teal-500/30 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-teal-500/20 border-b border-l border-teal-500/30 rounded-bl-2xl text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                    Pimpinan Administrasi
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative group shrink-0">
                      <img
                        src={formData.sekretarisDesa.foto || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'}
                        alt={formData.sekretarisDesa.nama}
                        className="w-20 h-24 rounded-2xl object-cover border-2 border-teal-500/50 shadow-md"
                      />
                      {isEditing && (
                        <label 
                          className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-semibold border-2 border-teal-400"
                          title="Klik untuk upload / ganti foto Sekretaris Desa"
                        >
                          <Camera className="w-5 h-5 text-teal-400 mb-0.5" />
                          <span>Ganti Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                  handleSekdesChange('foto', dataUrl);
                                });
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                        Sekretaris Desa
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">
                        {formData.sekretarisDesa.nama}
                      </h3>
                      <p className="text-slate-400 text-[11px] font-mono">
                        NIP: {formData.sekretarisDesa.nip || '-'}
                      </p>
                      <p className="text-teal-400 text-[11px] font-medium">
                        Periode: {formData.sekretarisDesa.periode || '2021 - 2027'}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Nama Lengkap & Gelar</label>
                        <input
                          type="text"
                          value={formData.sekretarisDesa.nama}
                          onChange={(e) => handleSekdesChange('nama', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:border-teal-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-1">NIP</label>
                          <input
                            type="text"
                            value={formData.sekretarisDesa.nip || ''}
                            onChange={(e) => handleSekdesChange('nip', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-[11px] focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-1">NIK</label>
                          <input
                            type="text"
                            value={formData.sekretarisDesa.nik || ''}
                            onChange={(e) => handleSekdesChange('nik', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-[11px] focus:border-teal-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-1">No HP / WhatsApp</label>
                          <input
                            type="text"
                            value={formData.sekretarisDesa.noHp || ''}
                            onChange={(e) => handleSekdesChange('noHp', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] mb-1">Masa Jabatan (Periode)</label>
                          <input
                            type="text"
                            value={formData.sekretarisDesa.periode || ''}
                            onChange={(e) => handleSekdesChange('periode', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:border-teal-500 outline-none"
                          />
                        </div>
                      </div>
                      {/* MODUL UPLOAD FOTO SEKRETARIS DESA */}
                      <div className="bg-slate-900/90 p-3 rounded-2xl border border-teal-500/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-teal-400 text-xs font-semibold flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Foto Resmi Sekretaris Desa</span>
                          </label>
                          {formData.sekretarisDesa.foto && (
                            <button
                              type="button"
                              onClick={() => handleSekdesChange('foto', '')}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                            >
                              Hapus Foto
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {formData.sekretarisDesa.foto ? (
                              <img
                                src={formData.sekretarisDesa.foto}
                                alt="Foto Sekdes"
                                className="w-14 h-16 rounded-xl object-cover border-2 border-teal-500 shadow"
                              />
                            ) : (
                              <div className="w-14 h-16 rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                                <span className="text-[8px] mt-0.5">Pas Foto</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95 border border-teal-400/30">
                                <Upload className="w-3.5 h-3.5" />
                                <span>{formData.sekretarisDesa.foto ? 'Ganti File Foto' : 'Unggah File Foto'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                        handleSekdesChange('foto', dataUrl);
                                      });
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                              <span className="text-[10px] text-slate-400">JPG, PNG, WebP (Maks 12MB)</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 shrink-0">Atau URL:</span>
                              <input
                                type="text"
                                value={formData.sekretarisDesa.foto || ''}
                                onChange={(e) => handleSekdesChange('foto', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-[10px] focus:border-teal-500 outline-none font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-800/50 p-2 rounded-xl">
                          <span className="text-slate-400 block text-[10px]">NIK</span>
                          <span className="font-mono text-slate-200">{formData.sekretarisDesa.nik || '-'}</span>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded-xl">
                          <span className="text-slate-400 block text-[10px]">Kontak HP/WA</span>
                          <span className="text-teal-400 font-mono font-medium">{formData.sekretarisDesa.noHp || '-'}</span>
                        </div>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                        <span className="text-slate-400 block text-[10px] font-semibold mb-1">Tugas & Fungsi Utama:</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Memimpin kesekretariatan desa, menyusun kebijakan administrasi, perencanaan APBDes, serta koordinasi seluruh Kepala Urusan (Kaur) dan Kepala Seksi (Kasi).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DAFTAR PERANGKAT DESA LAINNYA */}
          {activeTab === 'perangkat' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Struktur Aparatur & Perangkat Desa
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kasi, Kaur, Kepala Dusun (Kadus I - IV), dan Badan Permusyawaratan Desa (BPD)
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  id="btn-add-perangkat-desa"
                  onClick={handleOpenAddPerangkat}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 border border-emerald-400/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Perangkat Desa</span>
                </motion.button>
              </div>

              {/* Grid of Apparatus Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {formData.perangkatLainnya.map((prk) => {
                  let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  if (prk.kategori === 'Kasi') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  if (prk.kategori === 'Kaur') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  if (prk.kategori === 'Kepala Dusun') badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                  if (prk.kategori === 'BPD') badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';

                  return (
                    <div 
                      key={prk.id}
                      className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 relative group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative group/photo shrink-0">
                          <img
                            src={prk.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={prk.nama}
                            className="w-12 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                          <label 
                            className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover/photo:opacity-100 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[8px] font-semibold border border-emerald-400/80"
                            title="Klik untuk upload foto langsung"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                    handleQuickUpdatePerangkatFoto(prk.id, dataUrl);
                                  });
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${badgeColor}`}>
                            {prk.jabatan}
                          </span>
                          <h4 className="font-bold text-white text-xs mt-1 truncate">
                            {prk.nama}
                          </h4>
                          {prk.nip && (
                            <p className="text-[10px] text-slate-400 font-mono">NIP: {prk.nip}</p>
                          )}
                          {prk.noHp && (
                            <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" /> {prk.noHp}
                            </p>
                          )}
                        </div>
                      </div>

                      {prk.tugasPokok && (
                        <div className="bg-slate-900/80 p-2 rounded-xl text-[10px] text-slate-300 leading-snug border border-slate-800">
                          <span className="text-slate-400 block font-semibold text-[9px]">Uraian Tugas:</span>
                          {prk.tugasPokok}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                        <span className="text-slate-400">{prk.periode || '2021 - 2027'}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPerangkat(prk)}
                            className="p-1.5 bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 rounded-lg transition-colors border border-slate-700"
                            title="Edit Data Perangkat"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePerangkat(prk.id, prk.nama)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 rounded-lg transition-colors border border-slate-700"
                            title="Hapus Perangkat"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: BAGAN STRUKTUR ORGANISASI */}
          {activeTab === 'struktur' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h3 className="text-sm font-bold text-white">Struktur Organisasi Pemerintahan Desa {formData.namaDesa}</h3>
                <p className="text-[11px] text-slate-400">Hierarki kepemimpinan, sekretariat desa, seksi teknis, dan kewilayahan dusun</p>
              </div>

              {/* Hierarchy Tree */}
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Level 1: Kepala Desa & BPD */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {/* Kepala Desa */}
                  <div className="bg-emerald-950/40 border-2 border-emerald-500/50 p-4 rounded-2xl text-center w-64 shadow-xl">
                    <img
                      src={formData.kepalaDesa.foto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80'}
                      alt={formData.kepalaDesa.nama}
                      className="w-14 h-16 rounded-xl object-cover mx-auto mb-2 border border-emerald-400/40"
                    />
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Kepala Desa</div>
                    <div className="font-bold text-white text-xs mt-0.5">{formData.kepalaDesa.nama}</div>
                    <div className="text-[10px] text-slate-400 font-mono">NIP: {formData.kepalaDesa.nip || '-'}</div>
                  </div>

                  {/* BPD (Mitra Kerja Sejajar) */}
                  {formData.perangkatLainnya.find(p => p.kategori === 'BPD') && (
                    <div className="bg-rose-950/30 border-2 border-dashed border-rose-500/40 p-4 rounded-2xl text-center w-64 shadow-xl">
                      <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Badan Permusyawaratan Desa (BPD)</div>
                      <div className="font-bold text-white text-xs mt-1">
                        {formData.perangkatLainnya.find(p => p.kategori === 'BPD')?.nama}
                      </div>
                      <div className="text-[10px] text-slate-400">Mitra Pengawasan & Aspirasi</div>
                    </div>
                  )}
                </div>

                <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

                {/* Level 2: Sekretaris Desa */}
                <div className="flex justify-center">
                  <div className="bg-teal-950/40 border-2 border-teal-500/50 p-4 rounded-2xl text-center w-64 shadow-xl">
                    <img
                      src={formData.sekretarisDesa.foto || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'}
                      alt={formData.sekretarisDesa.nama}
                      className="w-14 h-16 rounded-xl object-cover mx-auto mb-2 border border-teal-400/40"
                    />
                    <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Sekretaris Desa</div>
                    <div className="font-bold text-white text-xs mt-0.5">{formData.sekretarisDesa.nama}</div>
                    <div className="text-[10px] text-slate-400 font-mono">NIP: {formData.sekretarisDesa.nip || '-'}</div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-slate-700 mx-auto" />

                {/* Level 3: Kaur & Kasi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* KAUR */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-amber-500/30 space-y-2.5">
                    <div className="font-bold text-amber-400 text-xs border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Kepala Urusan (Pelaksana Kesekretariatan)
                    </div>
                    <div className="space-y-2">
                      {formData.perangkatLainnya.filter(p => p.kategori === 'Kaur').map(p => (
                        <div key={p.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white text-[11px]">{p.jabatan}</div>
                            <div className="text-[10px] text-slate-300">{p.nama}</div>
                          </div>
                          {p.nip && <span className="text-[9px] font-mono text-slate-400">NIP: {p.nip}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KASI */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-emerald-500/30 space-y-2.5">
                    <div className="font-bold text-emerald-400 text-xs border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Kepala Seksi (Pelaksana Teknis Lapangan)
                    </div>
                    <div className="space-y-2">
                      {formData.perangkatLainnya.filter(p => p.kategori === 'Kasi').map(p => (
                        <div key={p.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white text-[11px]">{p.jabatan}</div>
                            <div className="text-[10px] text-slate-300">{p.nama}</div>
                          </div>
                          {p.nip && <span className="text-[9px] font-mono text-slate-400">NIP: {p.nip}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Level 4: Kepala Wilayah / Dusun */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-purple-500/30 space-y-2.5">
                  <div className="font-bold text-purple-400 text-xs border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Kepala Wilayah Dusun (Pelaksana Kewilayahan)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {formData.perangkatLainnya.filter(p => p.kategori === 'Kepala Dusun').map(p => (
                      <div key={p.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-1">
                        <div className="font-bold text-purple-300 text-xs">{p.jabatan}</div>
                        <div className="font-semibold text-white text-[11px]">{p.nama}</div>
                        {p.noHp && <div className="text-[10px] text-emerald-400 font-mono">{p.noHp}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PENGATURAN RUNNING TEXT (TICKER KIOSK BALAI DESA) */}
          {activeTab === 'runningText' && (
            <div className="space-y-6">
              {/* Alert Feedback Berhasil Disimpan */}
              <AnimatePresence>
                {runningTextSavedSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 shadow-lg shadow-emerald-950/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-xs">
                        Teks berjalan Kiosk berhasil disimpan dan langsung diterapkan ke seluruh monitor display balai desa!
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                      TERVERIFIKASI
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header Box Penjelasan */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      Pengaturan Ticker & Running Text Kiosk Balai Desa
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Digital Signage
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ubah pengumuman teks berjalan yang ditayangkan di bagian bawah monitor besar balai desa (Mode KIOSK).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleSaveRunningText()}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer border border-emerald-400/30 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Teks Kiosk</span>
                  </motion.button>
                </div>
              </div>

              {/* LIVE SIMULATOR MONITOR DISPLAY KIOSK */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/90 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase font-mono">
                      Simulasi Tampilan Running Text Monitor Balai Desa
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviewPaused(!isPreviewPaused)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isPreviewPaused
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={isPreviewPaused ? 'Lanjutkan animasi running text' : 'Jeda animasi running text'}
                    >
                      {isPreviewPaused ? (
                        <>
                          <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>Lanjutkan Animasi</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 text-slate-400" />
                          <span>Jeda Animasi</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60 hidden sm:inline">
                      Kecepatan: {formData.runningTextSpeed === 'slow' ? '55s' : formData.runningTextSpeed === 'fast' ? '22s' : '35s'}
                    </span>
                  </div>
                </div>

                {/* Simulated Ticker Bar */}
                <div className="p-3 bg-slate-900/90 flex items-center justify-between gap-3 overflow-hidden">
                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    <span>ONLINE</span>
                  </div>

                  <div className="flex-1 overflow-hidden whitespace-nowrap px-2">
                    <div
                      className="inline-block animate-marquee text-xs text-slate-100 font-medium"
                      style={{
                        animationDuration:
                          formData.runningTextSpeed === 'slow' ? '55s' :
                          formData.runningTextSpeed === 'fast' ? '22s' : '35s',
                        animationPlayState: isPreviewPaused ? 'paused' : 'running'
                      }}
                    >
                      {formData.runningTextKiosk || (
                        <span className="text-slate-500 italic">Belum ada teks pengumuman yang ditulis...</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-[10px] text-slate-500 font-mono hidden md:block">
                    Display TV Balai Desa
                  </div>
                </div>
              </div>

              {/* EDITOR FORM AREA */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800/90 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Teks Berjalan Pengumuman Balai Desa</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {(formData.runningTextKiosk || '').length} Karakter
                    </span>
                  </div>
                </div>

                <textarea
                  id="input-kiosk-running-text"
                  rows={4}
                  value={formData.runningTextKiosk || ''}
                  onChange={(e) => handleGeneralChange('runningTextKiosk', e.target.value)}
                  placeholder="Tulis pesan pengumuman yang akan berjalan terus-menerus di monitor balai desa..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-3.5 text-slate-100 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-y leading-relaxed font-sans shadow-inner transition-colors"
                />

                {/* TOMBOL CEPAT SISIP SIMBOL & PEMISAH */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Sisip Cepat Simbol & Pemisah Teks:
                    </span>
                    <span className="text-[10px] text-slate-500">Klik untuk menambahkan ke pesan</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { icon: '•', label: 'Pemisah Titik (•)' },
                      { icon: '📢', label: 'Pengumuman (📢)' },
                      { icon: '💰', label: 'Bansos (💰)' },
                      { icon: '📍', label: 'Lokasi (📍)' },
                      { icon: '⏰', label: 'Jam Buka (⏰)' },
                      { icon: '📋', label: 'Persuratan (📋)' },
                      { icon: '✅', label: 'Terverifikasi (✅)' },
                      { icon: '🌿', label: 'Lingkungan (🌿)' },
                      { icon: '⚠️', label: 'Perhatian (⚠️)' }
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleInsertSymbol(item.icon)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/70 text-[11px] font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PENGATURAN KECEPATAN ANIMASI BERJALAN */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Kecepatan Berjalan Teks (Animasi Ticker)</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        value: 'slow' as const,
                        label: 'Lambat (55 Detik)',
                        desc: 'Sangat santai, cocok untuk pengumuman panjang agar mudah dibaca'
                      },
                      {
                        value: 'normal' as const,
                        label: 'Normal / Sedang (35 Detik)',
                        desc: 'Standar rekomendasi, seimbang antara kecepatan dan keterbacaan'
                      },
                      {
                        value: 'fast' as const,
                        label: 'Cepat (22 Detik)',
                        desc: 'Laju dinamis, cocok untuk teks pengumuman ringkas dan singkat'
                      }
                    ].map((spd) => {
                      const isSelected = (formData.runningTextSpeed || 'normal') === spd.value;
                      return (
                        <button
                          key={spd.value}
                          type="button"
                          onClick={() => handleGeneralChange('runningTextSpeed', spd.value)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                              {spd.label}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <p className="text-[10px] leading-relaxed text-slate-400">{spd.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PRESET TEMPLATE SIAP PAKAI */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Template Pesan Pengumuman Siap Pakai</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Pilih template untuk mengisi otomatis</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {RUNNING_TEXT_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-2.5 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-200 text-xs">{preset.title}</div>
                          <div className="text-[10px] text-slate-400">{preset.desc}</div>
                          <div className="text-[10px] font-mono text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/70 line-clamp-2">
                            {preset.text}
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(preset.text)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-300 text-slate-300 rounded-xl text-[10px] font-semibold border border-slate-700/80 hover:border-emerald-500/50 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Gunakan Template</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultText = '📢 SELAMAT DATANG DI ANJUNGAN KIOSK DIGITAL DESA BELITI JAYA • Sistem Informasi Geografis Kependudukan & DTKS Berbasis Peta Digital • Transparansi Data Bantuan Sosial (PKH, BPNT, BLT-DD, Bansos Beras) • Pelayanan Administrasi Kantor Desa Buka Senin - Jumat Pukul 08:00 - 15:30 WIB • Menuju Desa Cerdas, Maju dan Mandiri';
                      handleGeneralChange('runningTextKiosk', defaultText);
                      handleGeneralChange('runningTextSpeed', 'normal');
                    }}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembalikan ke Teks Standar</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      id="btn-save-running-text"
                      onClick={() => handleSaveRunningText()}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer border border-emerald-400/30 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan & Terapkan ke Kiosk</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (Only in modal mode) */}
        {!isFullPage && (
          <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span>Sistem Informasi Geospasial & DTKS Desa Beliti Jaya</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-700"
            >
              Tutup
            </button>
          </div>
        )}
    </div>
  );

  return (
    <>
      {isFullPage ? (
        <div 
          id="village-profile-view" 
          className="w-full max-w-7xl mx-auto space-y-6 pb-28 pt-1 text-slate-100 animate-fadeIn"
        >
          {/* Top Hero Command-Center Header */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="relative group w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl font-bold shadow-inner overflow-hidden p-1.5 shrink-0">
                {formData.logoDesa ? (
                  <img src={formData.logoDesa} alt={`Logo Desa ${formData.namaDesa}`} className="w-11 h-11 object-contain drop-shadow" />
                ) : (
                  '🏛️'
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Pemerintahan & Profil Desa {formData.namaDesa}
                  </h1>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Kec. {formData.kecamatan} • Kab. {formData.kabupaten}
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Pusat data pemerintahan desa, aparatur pamong, batas administratif spasial, dan integrasi pengumuman digital.
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/80 text-amber-300 font-mono">
                    Kode Pos: 31663
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/80 text-teal-300">
                    {formData.perangkatLainnya.length + 2} Pejabat & Pamong
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/80 text-slate-300">
                    Luas: {formData.luasWilayah || '18.4 km²'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info badge ringkas di sisi kanan */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Data Profil Terverifikasi
              </span>
            </div>
          </div>

          {/* Main Content Card */}
          {contentCard}

          {/* Bar Aksi Melayang Bawah (Bottom Sticky Bar) */}
          <div className="sticky bottom-4 z-40 flex items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-3 sm:px-6 rounded-3xl shadow-2xl">
            {/* Sisi Kiri: Kembali ke Peta */}
            <div>
              {onBackToMap && (
                <button
                  type="button"
                  id="btn-sticky-village-back"
                  onClick={onBackToMap}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Kembali ke Peta Spasial GIS Desa"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400" />
                  <span>Kembali ke Peta</span>
                </button>
              )}
            </div>

            {/* Sisi Kanan: Status & Edit/Simpan */}
            <div className="flex items-center gap-2 sm:gap-3">
              {!isEditing ? (
                <button
                  type="button"
                  id="btn-sticky-edit-village"
                  onClick={() => setIsEditing(true)}
                  className="px-5 sm:px-6 py-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Data Desa</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(desaProfile);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs sm:text-sm font-medium border border-slate-700 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    id="btn-sticky-save-village"
                    onClick={handleSaveAll}
                    className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-2 border border-emerald-400/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div 
          id="village-profile-modal-overlay" 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-3 sm:p-5 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            id="village-profile-modal-container"
            className="w-full max-w-5xl my-auto"
          >
            {contentCard}
          </motion.div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT PERANGKAT DESA INDIVIDUAL */}
      <AnimatePresence>
        {isPerangkatModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {isNewPerangkat ? 'Tambah Perangkat Desa Baru' : 'Edit Data Perangkat Desa'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Lengkapi identitas jabatan dan kontak aparatur</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPerangkatModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePerangkat} className="p-5 overflow-y-auto space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={perangkatForm.nama}
                    onChange={(e) => setPerangkatForm({ ...perangkatForm, nama: e.target.value })}
                    placeholder="Contoh: Ir. Ahmad Syahputra, S.Sos"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Kategori Aparatur *</label>
                    <select
                      value={perangkatForm.kategori}
                      onChange={(e) => setPerangkatForm({ ...perangkatForm, kategori: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="Kasi">Kasi (Seksi Teknis)</option>
                      <option value="Kaur">Kaur (Urusan Umum/Keu/Ren)</option>
                      <option value="Kepala Dusun">Kepala Dusun (Kadus)</option>
                      <option value="BPD">BPD (Badan Permusyawaratan)</option>
                      <option value="Lainnya">Staf / Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Nama Jabatan Resmi *</label>
                    <input
                      type="text"
                      required
                      value={perangkatForm.jabatan}
                      onChange={(e) => setPerangkatForm({ ...perangkatForm, jabatan: e.target.value })}
                      placeholder="Contoh: Kepala Seksi Pemerintahan"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">NIP (Opsional)</label>
                    <input
                      type="text"
                      value={perangkatForm.nip || ''}
                      onChange={(e) => setPerangkatForm({ ...perangkatForm, nip: e.target.value })}
                      placeholder="19820711..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">NIK (Opsional)</label>
                    <input
                      type="text"
                      value={perangkatForm.nik || ''}
                      onChange={(e) => setPerangkatForm({ ...perangkatForm, nik: e.target.value })}
                      placeholder="163105..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Nomor WhatsApp / HP</label>
                    <input
                      type="text"
                      value={perangkatForm.noHp || ''}
                      onChange={(e) => setPerangkatForm({ ...perangkatForm, noHp: e.target.value })}
                      placeholder="0813-..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Masa Jabatan / Periode</label>
                    <input
                      type="text"
                      value={perangkatForm.periode || ''}
                      onChange={(e) => setPerangkatForm({ ...perangkatForm, periode: e.target.value })}
                      placeholder="2021 - 2027"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* MODUL UPLOAD PAS FOTO PERANGKAT DESA */}
                <div className="bg-slate-900/90 p-3 rounded-2xl border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pas Foto Perangkat Desa</span>
                    </label>
                    {perangkatForm.foto && (
                      <button
                        type="button"
                        onClick={() => setPerangkatForm({ ...perangkatForm, foto: '' })}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {perangkatForm.foto ? (
                        <img
                          src={perangkatForm.foto}
                          alt="Pas Foto Perangkat"
                          className="w-14 h-16 rounded-xl object-cover border-2 border-emerald-500/70 shadow"
                        />
                      ) : (
                        <div className="w-14 h-16 rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                          <UserIcon className="w-5 h-5 text-slate-400" />
                          <span className="text-[8px] mt-0.5">Pas Foto</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95 border border-emerald-400/30">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{perangkatForm.foto ? 'Ganti File Foto' : 'Unggah File Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                  setPerangkatForm(prev => ({ ...prev, foto: dataUrl }));
                                });
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                        <span className="text-[10px] text-slate-400">JPG, PNG, WebP (Maks 12MB)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 shrink-0">Atau URL:</span>
                        <input
                          type="text"
                          value={perangkatForm.foto || ''}
                          onChange={(e) => setPerangkatForm({ ...perangkatForm, foto: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-[10px] focus:border-emerald-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Uraian Tugas Pokok & Fungsi</label>
                  <textarea
                    rows={2}
                    value={perangkatForm.tugasPokok || ''}
                    onChange={(e) => setPerangkatForm({ ...perangkatForm, tugasPokok: e.target.value })}
                    placeholder="Contoh: Mengelola administrasi pelayanan kependudukan dan persuratan warga."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPerangkatModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-950/40"
                  >
                    Simpan Perangkat
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, VerificationNotification, DesaProfile, RolePermissions, AsetDesa, Keluarga } from '../types';
import { 
  Map, 
  BarChart3, 
  Database, 
  FileText, 
  Bell, 
  MapPin, 
  UserCog, 
  Lock, 
  ShieldCheck, 
  Settings, 
  History, 
  Tv, 
  Search, 
  Sun, 
  HelpCircle, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  Building2, 
  BookOpen, 
  Users, 
  Home, 
  LogOut, 
  Key, 
  Shield, 
  ExternalLink,
  Layers,
  Sparkles,
  Command,
  X
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  activeTab: 'map' | 'analytics' | 'crud' | 'inventory' | 'export' | 'settings' | 'village';
  setActiveTab: (tab: 'map' | 'analytics' | 'crud' | 'inventory' | 'export' | 'settings' | 'village') => void;
  notifications: VerificationNotification[];
  onOpenNotifications: () => void;
  onOpenAuthLogs?: () => void;
  authLogsCount?: number;
  onOpenKiosk?: () => void;
  onLogout?: () => void;
  onSwitchRole?: () => void;
  onResetData?: () => void;
  onOpenVillageProfile?: () => void;
  desaProfile?: DesaProfile;
  permissions?: RolePermissions;
  onOpenUserSettings?: () => void;
  onOpenUserProfile?: () => void;
  onOpenAssetModal?: (category?: 'all' | 'pembangunan' | 'non_pembangunan') => void;
  onOpenVillageInfo?: (tab?: 'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText') => void;
  keluargaList?: Keluarga[];
  asetList?: AsetDesa[];
  onSelectSearchedKeluarga?: (kel: Keluarga) => void;
  onSelectSearchedAsset?: (aset: AsetDesa) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  notifications,
  onOpenNotifications,
  onOpenAuthLogs,
  authLogsCount,
  onOpenKiosk,
  onLogout,
  onOpenVillageProfile,
  desaProfile,
  permissions,
  onOpenUserSettings,
  onOpenUserProfile,
  onOpenAssetModal,
  onOpenVillageInfo,
  keluargaList = [],
  asetList = [],
  onSelectSearchedKeluarga,
  onSelectSearchedAsset
}) => {
  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const isOperator = currentUser.role === 'operator';
  const isAdmin = currentUser.role === 'admin';
  const isOperatorAset = currentUser.role === 'operator_aset';
  const isRestrictedOperator = isOperator && (permissions?.operatorOnlyAddKK ?? true);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [openDropdownMenu, setOpenDropdownMenu] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
        setOpenDropdownMenu(null);
        setShowHelpModal(false);
        setShowLangMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Filter search results
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { families: [], assets: [] };

    const matchedFamilies = keluargaList.filter(k => 
      k.namaKepalaKeluarga.toLowerCase().includes(q) ||
      k.nomorKk.toLowerCase().includes(q) ||
      k.nikKepalaKeluarga.toLowerCase().includes(q) ||
      k.anggotaKeluarga.some(m => m.nama.toLowerCase().includes(q) || m.nik.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedAssets = asetList.filter(a =>
      a.namaAset.toLowerCase().includes(q) ||
      a.kodeAset.toLowerCase().includes(q) ||
      a.kategori.toLowerCase().includes(q) ||
      a.lokasiDusun.toLowerCase().includes(q)
    ).slice(0, 5);

    return { families: matchedFamilies, assets: matchedAssets };
  }, [searchQuery, keluargaList, asetList]);

  // Handle Tab Navigations
  const handleTabClick = (tabId: 'map' | 'analytics' | 'crud' | 'inventory' | 'export' | 'settings' | 'village') => {
    setOpenDropdownMenu(null);
    if (tabId === 'inventory') {
      if (onOpenAssetModal) {
        onOpenAssetModal('all');
      } else {
        setActiveTab('inventory');
      }
      return;
    }
    if (tabId === 'crud') {
      if (isOperatorAset) {
        alert('Akses Dibatasi: Menu Data Kependudukan tidak dapat diakses oleh Operator Aset. Akun Operator Aset dikhususkan untuk pengelolaan Aset Desa & Buku Inventaris.');
        return;
      }
      setActiveTab('crud');
      return;
    }
    if (tabId === 'export') {
      if (isOperatorAset) {
        alert('Akses Dibatasi: Menu Cetak dan Enkripsi tidak dapat diakses oleh Operator Aset.');
        return;
      }
      if (isRestrictedOperator && !permissions?.allowOperatorExport) {
        alert('Akses Dibatasi: Menu Cetak dan Enkripsi dibatasi untuk Operator.');
        return;
      }
      setActiveTab('export');
      return;
    }
    if (tabId === 'village') {
      if (isOperatorAset) {
        alert('Akses Dibatasi: Menu Data Desa tidak dapat diakses oleh Operator Aset.');
        return;
      }
      if (isRestrictedOperator && !permissions?.allowOperatorVillageProfile) {
        alert('Akses Dibatasi: Menu Data Desa hanya dapat diakses oleh Administrator.');
        return;
      }
      setActiveTab('village');
      return;
    }
    if (tabId === 'settings') {
      if (!isAdmin) {
        alert('Akses Dibatasi: Menu Setting User & RBAC hanya dapat diakses oleh Administrator Sistem.');
        return;
      }
      if (onOpenUserSettings) {
        onOpenUserSettings();
      } else {
        setActiveTab('settings');
      }
      return;
    }
    if (tabId === 'analytics') {
      if (isRestrictedOperator && !permissions?.allowOperatorAnalytics) {
        alert('Akses Dibatasi: Dashboard Analitik hanya dapat diakses oleh Administrator.');
        return;
      }
      setActiveTab('analytics');
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <header id="main-header" className="sticky top-0 z-[100] bg-slate-900 border-b border-slate-800 text-slate-100 shadow-xl select-none font-sans">
      
      {/* ========================================================
          BARIS ATAS (TOP BAR): Logo Resmi, Core Branding, Search, Quick Tools, Profil
          Sesuai referensi resmi CoreTax DJP / Portal Nasional
          ======================================================== */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* SISI KIRI: Logo Kementerian/Kabupaten & Core Brand SIG */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Logo Instansi Lambang Garuda / Musi Rawas */}
            <div 
              onClick={() => {
                if (!isOperator && !isOperatorAset && onOpenVillageProfile) {
                  onOpenVillageProfile();
                }
              }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity"
              title="Pemerintah Kabupaten Musi Rawas • Desa Beliti Jaya"
            >
              {desaProfile?.logoDesa ? (
                <img
                  src={desaProfile.logoDesa}
                  alt={`Logo ${desaProfile.namaDesa}`}
                  className="h-8 sm:h-9 w-auto object-contain drop-shadow-md"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-1 flex items-center justify-center shadow-md">
                  <Shield className="w-5 h-5 text-slate-950 fill-current" />
                </div>
              )}

              {/* Logo SIG Beliti Jaya bergaya CoreTax */}
              <div className="flex items-center">
                {/* Logo Kotak DJP/SIG Icon */}
                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/80 shadow-inner">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-xs"></span>
                  <span className="font-black tracking-tight text-xs text-white">SIG</span>
                </div>

                {/* Divider Tegak */}
                <div className="h-6 w-px bg-slate-700 mx-2.5"></div>

                {/* Teks Logo Gaya CORETAX */}
                <div className="flex items-center text-sm sm:text-base font-extrabold tracking-tight">
                  <span className="text-white font-black">BELITI</span>
                  <div className="w-3.5 h-3.5 mx-0.5 rounded-full border-2 border-rose-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                  </div>
                  <span className="text-amber-400 font-black">JAYA</span>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN TENGAH: Global Quick Search (Cari Layanan / Penduduk / Aset...) */}
          <div ref={searchDropdownRef} className="flex-1 max-w-xl mx-2 relative hidden md:block">
            <div 
              onClick={() => {
                setIsSearchOpen(true);
                searchInputRef.current?.focus();
              }}
              className="w-full flex items-center bg-slate-900/90 hover:bg-slate-900 text-slate-300 rounded-xl border border-slate-700/80 hover:border-slate-600 px-3.5 py-1.5 transition-all shadow-inner cursor-text group"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0 mr-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari layanan, NIK warga, nama penduduk, aset desa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                  }}
                  className="p-1 text-slate-400 hover:text-white mr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-center gap-1 shrink-0 ml-1.5 bg-slate-800/90 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border border-slate-700 text-slate-300">
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </div>

            {/* Dropdown Hasil Pencarian Global Popover */}
            <AnimatePresence>
              {isSearchOpen && searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs divide-y divide-slate-800"
                >
                  <div className="p-2.5 bg-slate-950/60 font-semibold text-slate-400 flex items-center justify-between text-[11px]">
                    <span>Hasil Pencarian Cepat</span>
                    <span className="font-mono text-slate-400 font-normal text-[10px]">
                      {searchResults.families.length + searchResults.assets.length} item ditemukan
                    </span>
                  </div>

                  {/* Bagian Penduduk */}
                  <div className="max-h-48 overflow-y-auto p-1.5 space-y-1">
                    <div className="text-[10px] font-bold text-amber-400 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Data Penduduk & Kepala Keluarga
                    </div>
                    {searchResults.families.length > 0 ? (
                      searchResults.families.map((fam) => (
                        <div
                          key={fam.id}
                          onClick={() => {
                            setActiveTab('map');
                            if (onSelectSearchedKeluarga) onSelectSearchedKeluarga(fam);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-2 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                              {fam.namaKepalaKeluarga}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              No. KK: {fam.nomorKk} • {fam.dusun}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Lihat di Peta
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic px-2 py-1 text-[11px]">
                        Tidak ada data penduduk yang cocok.
                      </div>
                    )}
                  </div>

                  {/* Bagian Aset Desa */}
                  <div className="max-h-48 overflow-y-auto p-1.5 space-y-1 bg-slate-950/40">
                    <div className="text-[10px] font-bold text-purple-400 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> Inventaris Aset Desa
                    </div>
                    {searchResults.assets.length > 0 ? (
                      searchResults.assets.map((aset) => (
                        <div
                          key={aset.id}
                          onClick={() => {
                            setActiveTab('map');
                            if (onSelectSearchedAsset) onSelectSearchedAsset(aset);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-2 hover:bg-slate-800/80 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-bold text-white group-hover:text-purple-300 transition-colors">
                              {aset.namaAset}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {aset.kategori} • {aset.lokasiDusun}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            Fokus Pin
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic px-2 py-1 text-[11px]">
                        Tidak ada aset desa yang cocok.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SISI KANAN: Bantuan, Tema/Mode, Notifikasi, Bahasa (ID), Pill Profil Resmi, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Tombol Panduan / Bantuan (?) */}
            <button
              id="btn-header-help"
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="Bantuan & Panduan Sistem"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Mode Terang/Siang (Sesuai Ikon Matahari CoreTax) */}
            <button
              id="btn-header-theme"
              type="button"
              onClick={() => alert('Mode Tampilan Sistem: Kontras Tinggi Pemerintahan (Default Dark Theme Aktif).')}
              className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="Mode Tampilan Sistem"
            >
              <Sun className="w-4 h-4" />
            </button>

            {/* Lonceng Notifikasi */}
            <button
              id="btn-header-notifications"
              type="button"
              onClick={onOpenNotifications}
              className="relative w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="Notifikasi Verifikasi & Perubahan Data"
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-slate-950 animate-bounce">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Dropdown Bahasa (🇮🇩 ID) */}
            <div className="relative">
              <button
                id="btn-header-lang"
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
                title="Pilih Bahasa Sistem"
              >
                <span className="text-sm leading-none">🇮🇩</span>
                <span>ID</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-1 text-xs">
                  <button
                    onClick={() => setShowLangMenu(false)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-2"
                  >
                    <span>🇮🇩</span> Bahasa Indonesia
                  </button>
                </div>
              )}
            </div>

            {/* PILL PROFIL PENGGUNA RESMI (Gaya CoreTax: ID/NIP di atas, NAMA PENGGUNA di bawah, Dropdown Arrow) */}
            <div ref={userMenuRef} className="relative">
              <button
                id="btn-coretax-user-profile"
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer group shadow-sm text-left active:scale-98"
                title="Klik untuk membuka menu akun & profil pengguna"
              >
                {/* Avatar Icon */}
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* ID & Nama Pengguna */}
                <div className="hidden sm:block min-w-0 pr-1">
                  <div className="text-[10px] text-slate-400 font-mono leading-none tracking-tight">
                    {currentUser.role === 'admin' 
                      ? '1808032508930001 (ADMIN)' 
                      : currentUser.role === 'operator_aset'
                      ? '1808032508930003 (OP-ASET)'
                      : '1808032508930006 (OP-KK)'}
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors uppercase tracking-tight truncate mt-0.5">
                    {currentUser.name.toUpperCase()}
                  </div>
                </div>

                {/* Dropdown Chevron */}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover Menu Profil Pengguna */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 text-xs divide-y divide-slate-800"
                  >
                    {/* Header Info User */}
                    <div className="p-2.5 space-y-1">
                      <div className="font-bold text-white text-sm">{currentUser.name}</div>
                      <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {currentUser.role === 'admin' 
                            ? 'Administrator Sistem' 
                            : currentUser.role === 'operator_aset'
                            ? 'Operator Aset Desa'
                            : 'Operator Data KK'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{currentUser.jabatan}</div>
                    </div>

                    {/* Menu Pilihan */}
                    <div className="py-1.5 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onOpenUserProfile) onOpenUserProfile();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lihat Profil Pengguna</span>
                      </button>

                      {isAdmin && onOpenUserSettings && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenUserSettings();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-amber-300 hover:text-amber-200 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <UserCog className="w-3.5 h-3.5 text-amber-400" />
                          <span>Kelola Akses Pengguna (RBAC)</span>
                        </button>
                      )}

                      {onOpenAuthLogs && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAuthLogs();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5 text-slate-400" />
                            <span>Log Riwayat Login</span>
                          </span>
                          {authLogsCount && authLogsCount > 0 ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-400 text-[10px] font-mono border border-slate-700">
                              {authLogsCount}
                            </span>
                          ) : null}
                        </button>
                      )}

                      {!isOperator && onOpenKiosk && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenKiosk();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-500/15 text-emerald-300 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Tv className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Mode KIOSK Layar Sentuh</span>
                        </button>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="pt-1.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/15 text-rose-300 hover:text-rose-200 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Keluar Sistem (Logout)</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tombol Fullscreen / Layar Penuh */}
            <button
              id="btn-header-fullscreen"
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer hidden sm:flex"
              title={isFullscreen ? 'Keluar Mode Layar Penuh' : 'Mode Layar Penuh (Fullscreen)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

          </div>

        </div>
      </div>

      {/* ========================================================
          BARIS BAWAH (NAVIGATION BAR MENU HORIZONTAL)
          Tombol Menu Navigasi Terpusat (Center Balanced):
          1. Portal Peta GIS
          2. Dashboard Analitik
          3. Kependudukan
          4. Buku Inventaris
          5. Cetak & Enkripsi
          6. Data Desa
          (Efek aktif: Warna Hijau / Emerald)
          ======================================================== */}
      <div className="bg-slate-900 border-b border-slate-800/90 px-3 sm:px-6 py-2 overflow-x-auto scrollbar-none shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-center flex-wrap gap-2 sm:gap-2.5">
          
          {/* 1. Portal Peta GIS */}
          <div className="relative">
            <button
              id="menu-nav-portal"
              type="button"
              onClick={() => handleTabClick('map')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400/60 ring-2 ring-emerald-500/40 scale-[1.02]'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600/80 font-medium'
              }`}
              title="Portal Peta Spasial GIS Interaktif"
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                activeTab === 'map' ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'
              }`}>
                <Map className="w-2.5 h-2.5" />
              </div>
              <span>Portal Peta GIS</span>
              {activeTab === 'map' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse shrink-0" />}
            </button>
          </div>

          {/* 2. Dashboard Analitik */}
          <div className="relative">
            <button
              id="menu-nav-analytics"
              type="button"
              onClick={() => handleTabClick('analytics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400/60 ring-2 ring-emerald-500/40 scale-[1.02]'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600/80 font-medium'
              }`}
              title="Statistik Demografi, Bansos, dan Analitik Aset Desa"
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                activeTab === 'analytics' ? 'bg-white/20 text-white' : 'bg-cyan-600 text-white'
              }`}>
                <BarChart3 className="w-2.5 h-2.5" />
              </div>
              <span>Dashboard Analitik</span>
              {activeTab === 'analytics' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse shrink-0" />}
            </button>
          </div>

          {/* 3. Kependudukan */}
          <div className="relative">
            <button
              id="menu-nav-crud"
              type="button"
              onClick={() => handleTabClick('crud')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'crud'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400/60 ring-2 ring-emerald-500/40 scale-[1.02]'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600/80 font-medium'
              }`}
              title={isOperatorAset ? 'Terkunci untuk Operator Aset' : 'Kelola Data Kepala Keluarga & Penduduk'}
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                activeTab === 'crud' ? 'bg-white/20 text-white' : 'bg-amber-500 text-slate-950 font-bold'
              }`}>
                <Users className="w-2.5 h-2.5" />
              </div>
              <span>Kependudukan</span>
              {isOperatorAset ? (
                <Lock className="w-3 h-3 text-rose-400" />
              ) : activeTab === 'crud' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse shrink-0" />
              ) : null}
            </button>
          </div>

          {/* 4. Buku Inventaris */}
          <div className="relative">
            <button
              id="menu-nav-aset"
              type="button"
              onClick={() => handleTabClick('inventory')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400/60 ring-2 ring-emerald-500/40 scale-[1.02]'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600/80 font-medium'
              }`}
              title="Buku Inventaris Aset Desa (Pembangunan & Non Pembangunan)"
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-purple-600 text-white'
              }`}>
                <BookOpen className="w-2.5 h-2.5" />
              </div>
              <span>Buku Inventaris</span>
              {activeTab === 'inventory' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse shrink-0" />}
            </button>
          </div>

          {/* 5. Cetak & Enkripsi */}
          <div className="relative">
            <button
              id="menu-nav-export"
              type="button"
              onClick={() => handleTabClick('export')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400/60 ring-2 ring-emerald-500/40 scale-[1.02]'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600/80 font-medium'
              }`}
              title="Cetak Laporan Kependudukan & Backup AES-256"
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                activeTab === 'export' ? 'bg-white/20 text-white' : 'bg-emerald-600 text-white'
              }`}>
                <FileText className="w-2.5 h-2.5" />
              </div>
              <span>Cetak & Enkripsi</span>
              {activeTab === 'export' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse shrink-0" />}
            </button>
          </div>

          {/* 6. Data Desa */}
          <div className="relative">
            <button
              id="menu-nav-village"
              type="button"
              onClick={() => handleTabClick('village')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'village'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400/60 ring-2 ring-emerald-500/40 scale-[1.02]'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600/80 font-medium'
              }`}
              title="Data Wilayah, Kepala Desa, dan Perangkat Desa"
            >
              <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 shadow-xs ${
                activeTab === 'village' ? 'bg-white/20 text-white' : 'bg-teal-600 text-white'
              }`}>
                <Building2 className="w-2.5 h-2.5" />
              </div>
              <span>Data Desa</span>
              {activeTab === 'village' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse shrink-0" />}
            </button>
          </div>

        </div>
      </div>

      {/* MODAL PANDUAN & BANTUAN SISTEM (?) */}
      <AnimatePresence>
        {showHelpModal && (
          <div 
            id="modal-help-overlay"
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl shadow-2xl p-6 text-slate-200 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Panduan Navigasi Sistem</h3>
                    <p className="text-xs text-slate-400">SIG Terpadu Desa Beliti Jaya (Core Portal)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-3 leading-relaxed text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Command className="w-3.5 h-3.5" />
                    <span>Pencarian Global Instan (Ctrl + K)</span>
                  </div>
                  <p>Gunakan kotak pencarian di bagian atas atau tekan tombol kombinasi <strong>Ctrl + K</strong> untuk mencari nama warga, NIK kependudukan, No. Kartu Keluarga, atau aset desa secara cepat.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Struktur Menu Navigasi Berjenjang</span>
                  </div>
                  <p>Baris navigasi menyediakan akses langsung ke modul utama: Portal Peta GIS, Dashboard Analitik, Kependudukan, Buku Inventaris, Cetak & Enkripsi, dan Data Desa.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Pill Akun & Pengaturan Pengguna</span>
                  </div>
                  <p>Klik nama akun Anda di pojok kanan atas untuk memeriksa NIP/Role, membuka log aktivitas riwayat login, atau mengaktifkan mode KIOSK layar sentuh.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Mengerti & Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </header>
  );
};

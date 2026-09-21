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
  Layers, 
  Sparkles, 
  Command, 
  X,
  CreditCard,
  FileCheck,
  Award,
  Compass,
  CheckCircle2
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
  const navMenuRef = useRef<HTMLDivElement>(null);

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
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) {
        setOpenDropdownMenu(null);
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
    <header id="main-header" className="sticky top-0 z-[100] px-2 sm:px-4 pt-2 sm:pt-3 pb-1.5 select-none font-sans bg-slate-950/80 backdrop-blur-md">
      
      {/* ========================================================
          WADAH TUNGGAL SATU KOTAK (SINGLE CARD CONTAINER)
          Menyatu dengan tema gelap slate & emerald SIG Desa
          Header dan Menu horizontal di dalam satu rounded card elegan
          ======================================================== */}
      <div className="max-w-7xl mx-auto bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-slate-800 text-slate-100 transition-all">
        
        {/* ----------------------------------------------------
            BARIS ATAS: Logo Resmi, Brand SIG, Search, Utility, Profil
            ---------------------------------------------------- */}
        <div className="px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* SISI KIRI: Logo Instansi & Brand SIG CoreTax Style */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Logo Instansi Lambang Musi Rawas / Desa Beliti Jaya */}
            <div 
              onClick={() => {
                if (!isOperator && !isOperatorAset && onOpenVillageProfile) {
                  onOpenVillageProfile();
                }
              }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              title="Pemerintah Kabupaten Musi Rawas • Desa Beliti Jaya"
            >
              {desaProfile?.logoDesa ? (
                <img
                  src={desaProfile.logoDesa}
                  alt={`Logo ${desaProfile.namaDesa}`}
                  className="h-8 sm:h-9 w-auto object-contain drop-shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-1 flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5 text-white fill-current" />
                </div>
              )}

              {/* Logo SIG Beliti Jaya bergaya CoreTax Terpadu */}
              <div className="flex items-center">
                {/* Logo Kotak SIG Icon */}
                <div className="flex items-center gap-1 bg-blue-900/70 px-2 py-0.5 rounded-lg border border-blue-500/40 shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-xs"></span>
                  <span className="font-black tracking-tight text-xs text-blue-100">SIG</span>
                </div>

                {/* Divider Tegak */}
                <div className="h-6 w-px bg-slate-700 mx-2 sm:mx-2.5"></div>

                {/* Teks Logo Gaya CORETAX */}
                <div className="flex items-center text-sm sm:text-base font-extrabold tracking-tight">
                  <span className="text-white font-black">BELITI</span>
                  <div className="w-3.5 h-3.5 mx-1 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                  </div>
                  <span className="text-emerald-400 font-black">JAYA</span>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN TENGAH: Global Quick Search (Cari Layanan / Penduduk / Aset...) */}
          <div ref={searchDropdownRef} className="flex-1 max-w-md lg:max-w-lg mx-1 sm:mx-2 relative hidden md:block">
            <div 
              onClick={() => {
                setIsSearchOpen(true);
                searchInputRef.current?.focus();
              }}
              className="w-full flex items-center bg-slate-950/70 hover:bg-slate-950 text-slate-200 rounded-xl border border-slate-700/80 hover:border-slate-600 px-3 py-1.5 transition-all shadow-inner cursor-text group"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari layanan, NIK, nama penduduk, aset desa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-200 mr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-center gap-1 shrink-0 ml-1.5 bg-slate-800/90 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 shadow-2xs">
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
                  className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs divide-y divide-slate-800 text-slate-200 backdrop-blur-xl"
                >
                  <div className="p-2.5 bg-slate-800/80 font-semibold text-slate-300 flex items-center justify-between text-[11px]">
                    <span>Hasil Pencarian Cepat</span>
                    <span className="font-mono text-slate-400 font-normal text-[10px]">
                      {searchResults.families.length + searchResults.assets.length} item ditemukan
                    </span>
                  </div>

                  {/* Bagian Penduduk */}
                  <div className="max-h-48 overflow-y-auto p-1.5 space-y-1">
                    <div className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1.5">
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
                            <div className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                              {fam.namaKepalaKeluarga}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              No. KK: {fam.nomorKk} • {fam.dusun}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/70 font-medium">
                            Lihat di Peta
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic px-2 py-1 text-[11px]">
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
                            <div className="font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                              {aset.namaAset}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {aset.kategori} • {aset.lokasiDusun}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/70 font-medium">
                            Fokus Pin
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 italic px-2 py-1 text-[11px]">
                        Tidak ada aset desa yang cocok.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SISI KANAN: Bantuan, Tema/Mode, Notifikasi, Bahasa (ID), Pill Profil Resmi, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Tombol Panduan / Bantuan (?) */}
            <button
              id="btn-header-help"
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Bantuan & Panduan Sistem"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Mode Terang/Siang */}
            <button
              id="btn-header-theme"
              type="button"
              onClick={() => alert('Mode Tampilan Sistem: Tema Gelap Spasial SIG Pemerintahan')}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Mode Tampilan Sistem"
            >
              <Sun className="w-4 h-4" />
            </button>

            {/* Lonceng Notifikasi */}
            <button
              id="btn-header-notifications"
              type="button"
              onClick={onOpenNotifications}
              className="relative w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Notifikasi Verifikasi & Perubahan Data"
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-slate-900 animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Dropdown Bahasa (🇮🇩 ID) */}
            <div className="relative hidden sm:block">
              <button
                id="btn-header-lang"
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Pilih Bahasa Sistem"
              >
                <span className="text-sm leading-none">🇮🇩</span>
                <span>ID</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1.5 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1 text-xs">
                  <button
                    onClick={() => setShowLangMenu(false)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-950/70 text-emerald-300 font-semibold flex items-center gap-2 border border-emerald-800/50"
                  >
                    <span>🇮🇩</span> Bahasa Indonesia
                  </button>
                </div>
              )}
            </div>

            {/* PILL PROFIL PENGGUNA RESMI (ID di atas, NAMA di bawah, Chevron) */}
            <div ref={userMenuRef} className="relative">
              <button
                id="btn-coretax-user-profile"
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer group shadow-xs text-left"
                title="Klik untuk membuka menu akun & profil pengguna"
              >
                {/* Avatar Icon */}
                <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 overflow-hidden text-slate-300">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-4 h-4 text-slate-300" />
                  )}
                </div>

                {/* ID & Nama Pengguna */}
                <div className="hidden sm:block min-w-0 pr-1">
                  <div className="text-[10px] text-slate-400 font-mono leading-none tracking-tight">
                    {currentUser.role === 'admin' 
                      ? '1808032508930001' 
                      : currentUser.role === 'operator_aset'
                      ? '1808032508930003'
                      : '1808032508930006'}
                  </div>
                  <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-tight truncate mt-0.5">
                    {currentUser.name.toUpperCase()}
                  </div>
                </div>

                {/* Dropdown Chevron */}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover Menu Profil Pengguna */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 text-xs divide-y divide-slate-800 text-slate-200 backdrop-blur-xl"
                  >
                    {/* Header Info User */}
                    <div className="p-2.5 space-y-1">
                      <div className="font-bold text-white text-sm">{currentUser.name}</div>
                      <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
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
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
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
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-950/40 text-amber-300 hover:text-amber-200 flex items-center gap-2 transition-colors cursor-pointer font-medium"
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
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5 text-slate-400" />
                            <span>Log Riwayat Login</span>
                          </span>
                          {authLogsCount && authLogsCount > 0 ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-blue-400 text-[10px] font-mono border border-slate-700">
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
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 flex items-center gap-2 transition-colors cursor-pointer font-medium"
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
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
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
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs hidden sm:flex"
              title={isFullscreen ? 'Keluar Mode Layar Penuh' : 'Mode Layar Penuh (Fullscreen)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

          </div>

        </div>

        {/* ----------------------------------------------------
            GARIS PEMBAGI HORIZONTAL DI DALAM SATU KOTAK
            Pembatas tipis antara header dan menu
            ---------------------------------------------------- */}
        <div className="border-t border-slate-800 mx-3 sm:mx-5"></div>

        {/* ----------------------------------------------------
            BARIS BAWAH: Deretan Menu Horizontal Sesuai Format CoreTax
            Format: [Icon Colorful] [Nama Menu] [Chevron Down v]
            ---------------------------------------------------- */}
        <div ref={navMenuRef} className="px-3 sm:px-5 py-1.5 sm:py-2 flex items-center justify-start flex-nowrap sm:flex-wrap gap-1 sm:gap-2 overflow-x-auto scrollbar-none text-xs font-semibold">
          
          {/* 1. Portal Peta GIS */}
          <div className="relative shrink-0">
            <button
              id="menu-nav-portal"
              type="button"
              onClick={() => handleTabClick('map')}
              onContextMenu={(e) => {
                e.preventDefault();
                setOpenDropdownMenu(openDropdownMenu === 'portal' ? null : 'portal');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Portal Peta Spasial GIS Interaktif"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-emerald-400">
                <Map className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span>Portal Peta GIS</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'portal' ? null : 'portal');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Menu Portal */}
            {openDropdownMenu === 'portal' && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl z-50 p-1.5 text-xs text-slate-200 backdrop-blur-xl">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modul Peta GIS</div>
                <button
                  onClick={() => {
                    handleTabClick('map');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Map className="w-3.5 h-3.5 text-blue-400" />
                  <span>Peta Spasial Utama</span>
                </button>
                <button
                  onClick={() => {
                    handleTabClick('map');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sebaran Dusun I - IV</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Dashboard Analitik */}
          <div className="relative shrink-0">
            <button
              id="menu-nav-analytics"
              type="button"
              onClick={() => handleTabClick('analytics')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Statistik Demografi & Grafik Bantuan Sosial"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-amber-400">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span>Statistik & Analitik</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'analytics' ? null : 'analytics');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Analitik */}
            {openDropdownMenu === 'analytics' && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl z-50 p-1.5 text-xs text-slate-200 backdrop-blur-xl">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modul Analitik</div>
                <button
                  onClick={() => {
                    handleTabClick('analytics');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ringkasan Statistik</span>
                </button>
                <button
                  onClick={() => {
                    handleTabClick('analytics');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Grafik Bansos & Demografi</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Data Kependudukan */}
          <div className="relative shrink-0">
            <button
              id="menu-nav-crud"
              type="button"
              onClick={() => handleTabClick('crud')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'crud'
                  ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title={isOperatorAset ? 'Terkunci untuk Operator Aset' : 'Data Penduduk, KK, dan Bansos'}
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-cyan-400">
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span>Kependudukan</span>
              {isOperatorAset ? (
                <Lock className="w-3 h-3 text-rose-400" />
              ) : (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownMenu(openDropdownMenu === 'crud' ? null : 'crud');
                  }}
                  className="p-0.5 hover:bg-slate-700/60 rounded"
                >
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              )}
            </button>

            {/* Dropdown Kependudukan */}
            {openDropdownMenu === 'crud' && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl z-50 p-1.5 text-xs text-slate-200 backdrop-blur-xl">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modul Kependudukan</div>
                <button
                  onClick={() => {
                    handleTabClick('crud');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Daftar Kartu Keluarga (KK)</span>
                </button>
                <button
                  onClick={() => {
                    onOpenNotifications();
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Verifikasi Data Masuk</span>
                  </span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 border border-rose-700/60 font-bold text-[10px]">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 4. Buku Inventaris */}
          <div className="relative shrink-0">
            <button
              id="menu-nav-aset"
              type="button"
              onClick={() => handleTabClick('inventory')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Buku Inventaris Aset Desa (Pembangunan & Non Pembangunan)"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-indigo-400">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span>Buku Inventaris</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'inventory' ? null : 'inventory');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Inventaris */}
            {openDropdownMenu === 'inventory' && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl z-50 p-1.5 text-xs text-slate-200 backdrop-blur-xl">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Inventaris</div>
                <button
                  onClick={() => {
                    if (onOpenAssetModal) onOpenAssetModal('all');
                    else setActiveTab('inventory');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Semua Aset Desa</span>
                </button>
                <button
                  onClick={() => {
                    if (onOpenAssetModal) onOpenAssetModal('pembangunan');
                    else setActiveTab('inventory');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aset Fisik & Pembangunan</span>
                </button>
                <button
                  onClick={() => {
                    if (onOpenAssetModal) onOpenAssetModal('non_pembangunan');
                    else setActiveTab('inventory');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>Aset Non-Pembangunan / Kantor</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Cetak & Enkripsi */}
          <div className="relative shrink-0">
            <button
              id="menu-nav-export"
              type="button"
              onClick={() => handleTabClick('export')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'export'
                  ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Cetak Laporan PDF Resmi & Ekspor Excel"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-sky-400">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span>Cetak & Enkripsi</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'export' ? null : 'export');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Cetak & Enkripsi */}
            {openDropdownMenu === 'export' && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl z-50 p-1.5 text-xs text-slate-200 backdrop-blur-xl">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format Laporan</div>
                <button
                  onClick={() => {
                    handleTabClick('export');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cetak Dokumen PDF Resmi</span>
                </button>
                <button
                  onClick={() => {
                    handleTabClick('export');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ekspor Data Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    handleTabClick('export');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Backup Enkripsi AES-256</span>
                </button>
              </div>
            )}
          </div>

          {/* 6. Profil Desa */}
          <div className="relative shrink-0">
            <button
              id="menu-nav-village"
              type="button"
              onClick={() => handleTabClick('village')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'village'
                  ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Data Wilayah, Kepala Desa, dan Perangkat Desa"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-teal-400">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <span>Data Desa</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'village' ? null : 'village');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Data Desa */}
            {openDropdownMenu === 'village' && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl z-50 p-1.5 text-xs text-slate-200 backdrop-blur-xl">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informasi Pemerintahan</div>
                <button
                  onClick={() => {
                    if (onOpenVillageInfo) onOpenVillageInfo('profil');
                    else handleTabClick('village');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Profil & Wilayah Desa</span>
                </button>
                <button
                  onClick={() => {
                    if (onOpenVillageInfo) onOpenVillageInfo('pimpinan');
                    else handleTabClick('village');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kepala Desa & Perangkat</span>
                </button>
                <button
                  onClick={() => {
                    if (onOpenVillageInfo) onOpenVillageInfo('struktur');
                    else handleTabClick('village');
                    setOpenDropdownMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Struktur Organisasi</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. Manajemen Akses */}
          <div className="relative shrink-0">
            <button
              id="menu-nav-settings"
              type="button"
              onClick={() => handleTabClick('settings')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent font-medium'
              }`}
              title="Pengaturan Hak Akses Pengguna & RBAC"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-purple-400">
                <Key className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span>Manajemen Akses</span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownMenu(openDropdownMenu === 'access' ? null : 'access');
                }}
                className="p-0.5 hover:bg-slate-700/60 rounded"
              >
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* Dropdown Manajemen Akses */}
            {openDropdownMenu === 'access' && (
              <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-60 bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl z-50 p-1.5 text-xs text-slate-200 backdrop-blur-xl">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akses & Keamanan</div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (onOpenUserSettings) onOpenUserSettings();
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                  >
                    <UserCog className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kelola Pengguna & Role (RBAC)</span>
                  </button>
                )}
                {onOpenAuthLogs && (
                  <button
                    onClick={() => {
                      onOpenAuthLogs();
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Log Riwayat Aktivitas Login</span>
                  </button>
                )}
                {!isOperator && onOpenKiosk && (
                  <button
                    onClick={() => {
                      onOpenKiosk();
                      setOpenDropdownMenu(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white"
                  >
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mode KIOSK Layar Sentuh</span>
                  </button>
                )}
              </div>
            )}
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
              className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl shadow-2xl p-6 text-slate-300 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-950/70 text-blue-400 border border-blue-800/60">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Panduan Navigasi Satu Pintu</h3>
                    <p className="text-xs text-slate-400">SIG Terpadu Desa Beliti Jaya (Format Terpadu)</p>
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
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Command className="w-3.5 h-3.5" />
                    <span>Pencarian Global Terpadu (Ctrl + K)</span>
                  </div>
                  <p className="text-slate-400">Ketik langsung nama warga, NIK kependudukan, Nomor KK, atau inventaris aset desa di kotak pencarian bagian atas.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Menu Navigasi Terpadu (Satu Kotak)</span>
                  </div>
                  <p className="text-slate-400">Heder dan Menu telah dipadukan dalam satu wadah berbingkai elegan untuk akses cepat: Peta Spasial, Statistik Analitik, Data Kependudukan, Buku Inventaris, Cetak Laporan, Data Desa, dan Manajemen Akses.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Pill Akun Resmi Pengguna</span>
                  </div>
                  <p className="text-slate-400">Klik nama akun Anda di sebelah kanan atas untuk mengakses rincian profil, manajemen RBAC, riwayat login, atau keluar sistem.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
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

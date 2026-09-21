import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FilterOptions, AsetDesa, User, Keluarga } from '../types';
import { 
  Filter, 
  Search, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal,
  X,
  Clock,
  Check,
  Building2,
  Users,
  Home,
  MapPin
} from 'lucide-react';

interface FilterPanelProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  totalKeluarga: number;
  filteredKeluargaCount: number;
  totalPenduduk: number;
  filteredPendudukCount: number;
  currentUser?: User;
  // Fitur Pencarian Aset Desa
  asetList?: AsetDesa[];
  assetSearchQuery?: string;
  setAssetSearchQuery?: (query: string) => void;
  focusedAsetId?: string | null;
  setFocusedAsetId?: (id: string | null) => void;
  onSelectSearchedAsset?: (aset: AsetDesa) => void;
  // Fitur Pencarian Penduduk & Fokus Pin
  keluargaList?: Keluarga[];
  focusedKeluargaId?: string | null;
  setFocusedKeluargaId?: (id: string | null) => void;
  onSelectSearchedKeluarga?: (kel: Keluarga) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  setFilters,
  totalKeluarga,
  filteredKeluargaCount,
  totalPenduduk,
  filteredPendudukCount,
  currentUser,
  asetList = [],
  assetSearchQuery = '',
  setAssetSearchQuery,
  focusedAsetId,
  setFocusedAsetId,
  onSelectSearchedAsset,
  keluargaList = [],
  focusedKeluargaId,
  setFocusedKeluargaId,
  onSelectSearchedKeluarga
}) => {
  // Role-based access control: 
  // 1. Fitur pencarian aset hanya dapat diakses oleh Admin dan Operator Aset. Pada role Operator KK (role === 'operator') disembunyikan.
  // 2. Fitur pencarian penduduk hanya dapat diakses oleh Admin dan Operator KK. Pada role Operator Aset (role === 'operator_aset') disembunyikan.
  // 3. Fitur "Filter Kependudukan & Bansos" hanya dapat diakses oleh Admin dan Operator KK. Pada role Operator Aset (role === 'operator_aset') disembunyikan.
  const canAccessAssetSearch = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'operator_aset') : true;
  const canAccessPendudukSearch = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'operator') : true;
  const canAccessKependudukanFilter = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'operator') : true;

  // Filters hidden by default as requested
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing timer
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Start auto-hide timer (e.g. after 6 seconds of idle/leave)
  const startAutoHide = useCallback((seconds: number = 6) => {
    clearTimers();
    setCountdown(seconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      setIsOpen(false);
      clearTimers();
    }, seconds * 1000);
  }, [clearTimers]);

  // Handle opening filter drawer
  const handleToggleOpen = () => {
    if (isOpen) {
      setIsOpen(false);
      clearTimers();
    } else {
      setIsOpen(true);
      // Start auto-hide timer when opened
      startAutoHide(8);
    }
  };

  // Reset/extend timer on user activity inside the filter
  const handleUserActivity = () => {
    if (isOpen) {
      // While active, reset timer to 8 seconds
      startAutoHide(8);
    }
  };

  // When mouse leaves the panel, shorten auto-hide to 3 seconds
  const handleMouseLeave = () => {
    if (isOpen) {
      startAutoHide(3);
    }
  };

  // Click outside listener to close immediately
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        clearTimers();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimers();
    };
  }, [isOpen, clearTimers]);

  // Fitur Pencarian Aset Desa
  const [showAssetSearchResults, setShowAssetSearchResults] = useState(false);
  const [assetSearchCategory, setAssetSearchCategory] = useState<'all' | 'pembangunan' | 'non_pembangunan'>('all');
  const assetSearchRef = useRef<HTMLDivElement>(null);

  const searchedAsets = useMemo(() => {
    if (!asetList) return [];
    let list = asetList;
    if (assetSearchCategory === 'pembangunan') {
      list = list.filter(a => a.kategori === 'pembangunan');
    } else if (assetSearchCategory === 'non_pembangunan') {
      list = list.filter(a => a.kategori === 'non_pembangunan');
    }

    if (!assetSearchQuery || !assetSearchQuery.trim()) {
      return list;
    }

    const q = assetSearchQuery.toLowerCase().trim();
    return list.filter(a => 
      a.namaAset.toLowerCase().includes(q) ||
      a.kodeRegister.toLowerCase().includes(q) ||
      a.subKategori.toLowerCase().includes(q) ||
      a.dusun.toLowerCase().includes(q) ||
      a.penanggungJawab.toLowerCase().includes(q) ||
      a.sumberDana.toLowerCase().includes(q)
    );
  }, [asetList, assetSearchQuery, assetSearchCategory]);

  const pembangunanAsetCount = useMemo(() => (asetList || []).filter(a => a.kategori === 'pembangunan').length, [asetList]);
  const nonPembangunanAsetCount = useMemo(() => (asetList || []).filter(a => a.kategori === 'non_pembangunan').length, [asetList]);

  // Click outside listener for asset search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assetSearchRef.current && !assetSearchRef.current.contains(e.target as Node)) {
        setShowAssetSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fitur Saran Pencarian Pin Penduduk
  const [showResidentSearchResults, setShowResidentSearchResults] = useState(false);
  const residentSearchRef = useRef<HTMLDivElement>(null);

  const searchedResidents = useMemo(() => {
    if (!keluargaList) return [];
    if (!filters.searchQuery || !filters.searchQuery.trim()) {
      return keluargaList.slice(0, 8);
    }
    const q = filters.searchQuery.toLowerCase().trim();
    return keluargaList.filter(k => {
      if (k.namaKepalaKeluarga.toLowerCase().includes(q)) return true;
      if (k.noKk.toLowerCase().includes(q)) return true;
      if (k.alamat.toLowerCase().includes(q)) return true;
      if (k.dusun.toLowerCase().includes(q)) return true;
      return k.anggotaKeluarga.some(p => 
        p.nama.toLowerCase().includes(q) || 
        p.nik.toLowerCase().includes(q)
      );
    });
  }, [keluargaList, filters.searchQuery]);

  // Click outside listener for resident search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (residentSearchRef.current && !residentSearchRef.current.contains(e.target as Node)) {
        setShowResidentSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResident = (kel: Keluarga) => {
    setFilters(prev => ({ ...prev, searchQuery: kel.namaKepalaKeluarga }));
    if (setFocusedKeluargaId) setFocusedKeluargaId(kel.id);
    if (onSelectSearchedKeluarga) onSelectSearchedKeluarga(kel);
    setShowResidentSearchResults(false);
  };

  const handleSelectAsset = (aset: AsetDesa) => {
    if (setAssetSearchQuery) setAssetSearchQuery(aset.namaAset);
    if (setFocusedAsetId) setFocusedAsetId(aset.id);
    if (onSelectSearchedAsset) onSelectSearchedAsset(aset);
    setShowAssetSearchResults(false);
  };

  const handleReset = () => {
    setFilters({
      searchQuery: '',
      dusun: 'semua',
      statusBansos: 'semua',
      jenisBansos: 'semua',
      statusKesejahteraan: 'semua',
      jenisKelamin: 'semua',
      statusKematian: 'semua',
      statusPerkawinan: 'semua',
      pendidikan: 'semua',
      minPenghasilan: 0,
      maxPenghasilan: 0
    });
    if (setAssetSearchQuery) setAssetSearchQuery('');
    if (setFocusedAsetId) setFocusedAsetId(null);
    if (setFocusedKeluargaId) setFocusedKeluargaId(null);
    setShowResidentSearchResults(false);
    setShowAssetSearchResults(false);
    handleUserActivity();
  };

  // Count active specific filters (excluding search)
  const activeFilterCount = [
    filters.dusun !== 'semua',
    filters.statusBansos !== 'semua',
    filters.jenisBansos !== 'semua',
    filters.statusKesejahteraan !== 'semua',
    filters.jenisKelamin !== 'semua',
    filters.statusKematian !== 'semua',
    filters.statusPerkawinan !== 'semua',
    filters.pendidikan !== 'semua',
    filters.minPenghasilan > 0 || filters.maxPenghasilan > 0
  ].filter(Boolean).length;

  const isFilterActive = Boolean(canAccessPendudukSearch && filters.searchQuery !== '') || 
                         Boolean(canAccessAssetSearch && assetSearchQuery && assetSearchQuery !== '') || 
                         Boolean(canAccessKependudukanFilter && activeFilterCount > 0);

  return (
    <div 
      ref={panelRef}
      id="filter-panel" 
      onMouseMove={handleUserActivity}
      onMouseEnter={handleUserActivity}
      onMouseLeave={handleMouseLeave}
      className={`bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl text-slate-200 transition-all duration-300 relative backdrop-blur-md ${
        (canAccessAssetSearch && showAssetSearchResults) || (canAccessPendudukSearch && showResidentSearchResults) ? 'z-40' : 'z-20'
      }`}
    >
      
      {/* Top Main Bar: Title, Search Boxes (Penduduk & Aset Desa), and Filter Toggle Button */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        
        {/* Left info & Title "Data GIS Desa Beliti Jaya" */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-semibold text-white">
                Data GIS Desa Beliti Jaya
              </h2>
              {canAccessKependudukanFilter && activeFilterCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  {activeFilterCount} Filter Aktif
                </span>
              )}
              {canAccessAssetSearch && assetSearchQuery && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  Filter Aset: {assetSearchQuery}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {canAccessPendudukSearch && (
                <>Menampilkan <span className="text-white font-medium">{filteredKeluargaCount}</span> dari {totalKeluarga} KK (<span className="text-white font-medium">{filteredPendudukCount}</span>/{totalPenduduk} Jiwa)</>
              )}
              {canAccessPendudukSearch && canAccessAssetSearch && <> &bull; </>}
              {canAccessAssetSearch && (
                <><span className="text-blue-300 font-medium">{asetList.length}</span> Aset Desa</>
              )}
            </p>
          </div>
        </div>

        {/* Right Area: Fitur Pencarian Penduduk & Fitur Pencarian Aset berdampingan, serta Tombol Filter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 justify-end">
          
          {/* Fitur Pencarian Penduduk: Hanya dapat diakses oleh Admin dan Operator KK. Pada role Operator Aset disembunyikan */}
          {canAccessPendudukSearch && (
            <div ref={residentSearchRef} className="relative flex-1 min-w-[140px] sm:min-w-[160px] max-w-xs z-50">
              <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-filter-search"
                type="text"
                placeholder="Cari Penduduk (Nama, NIK, KK)..."
                value={filters.searchQuery}
                onChange={e => {
                  setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
                  setShowResidentSearchResults(true);
                  handleUserActivity();
                }}
                onFocus={() => {
                  setShowResidentSearchResults(true);
                  handleUserActivity();
                }}
                onClick={() => {
                  setShowResidentSearchResults(true);
                  handleUserActivity();
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (searchedResidents.length > 0) {
                      handleSelectResident(searchedResidents[0]);
                    }
                  } else if (e.key === 'Escape') {
                    setShowResidentSearchResults(false);
                  }
                }}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all cursor-text"
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  id="btn-clear-filter-search"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, searchQuery: '' }));
                    if (setFocusedKeluargaId) setFocusedKeluargaId(null);
                    setShowResidentSearchResults(false);
                    handleUserActivity();
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  title="Hapus pencarian penduduk"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Modal / Popover Menu Hasil Pencarian Pin Penduduk */}
              {showResidentSearchResults && (
                <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-88 max-w-[calc(100vw-32px)] max-h-96 overflow-y-auto bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 z-[100] text-xs custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header dropdown dengan status & tombol tutup */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-white text-xs">Pencarian Pin Penduduk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {filters.searchQuery && filters.searchQuery.trim() ? (
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {searchedResidents.length} Cocok
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-slate-400">
                          {totalKeluarga} Total KK
                        </span>
                      )}
                      <button
                        type="button"
                        id="btn-close-resident-search-modal"
                        onClick={() => setShowResidentSearchResults(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Tutup Saran"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Panduan Klik & Arah Kamera */}
                  <div className="text-[10px] text-slate-400 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 mb-2 flex items-center gap-1.5">
                    <span className="text-emerald-400 font-semibold">📍 Sorotan:</span>
                    <span>Pilih item / tekan Enter untuk fokus kamera & pendar pin tanpa buka pop-up</span>
                  </div>

                  {/* List Item Saran Penduduk */}
                  <div className="space-y-1">
                    {searchedResidents.length === 0 ? (
                      <div className="text-center py-6 text-slate-400">
                        <Users className="w-6 h-6 mx-auto mb-1.5 text-slate-600" />
                        <p className="font-medium text-slate-300">Tidak ada penduduk yang cocok</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Coba gunakan nama anggota, NIK, atau Dusun</p>
                      </div>
                    ) : (
                      searchedResidents.map(kel => {
                        const isFocused = focusedKeluargaId === kel.id;
                        return (
                          <button
                            key={kel.id}
                            type="button"
                            id={`suggest-resident-${kel.id}`}
                            onClick={() => handleSelectResident(kel)}
                            className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer border ${
                              isFocused
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-xs'
                                : 'bg-slate-800/40 hover:bg-slate-800 border-transparent text-slate-200'
                            }`}
                          >
                            {/* Mini Foto Rumah */}
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-slate-700/80 shrink-0 mt-0.5">
                              <img
                                src={kel.fotoRumah}
                                alt={kel.namaKepalaKeluarga}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-white text-xs truncate">
                                  {kel.namaKepalaKeluarga}
                                </span>
                                {kel.penerimaBansos ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                                    Bansos
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                    Mampu
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                                <span className="font-mono text-slate-300">KK: {kel.noKk}</span>
                                <span>&bull;</span>
                                <span>{kel.dusun}</span>
                                <span>&bull;</span>
                                <span>{kel.anggotaKeluarga.length} Jiwa</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fitur Pencarian Aset Desa: Hanya dapat diakses oleh Admin dan Operator Aset. Pada role Operator KK disembunyikan */}
          {canAccessAssetSearch && (
            <div ref={assetSearchRef} className="relative flex-1 min-w-[140px] sm:min-w-[160px] max-w-xs z-50">
            <Building2 className="w-3.5 h-3.5 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-filter-asset-search"
              type="text"
              placeholder="Cari Aset (Gedung, Jalan, KIB)..."
              value={assetSearchQuery}
              onChange={e => {
                if (setAssetSearchQuery) setAssetSearchQuery(e.target.value);
                setShowAssetSearchResults(true);
                handleUserActivity();
              }}
              onFocus={() => {
                setShowAssetSearchResults(true);
                handleUserActivity();
              }}
              onClick={() => {
                setShowAssetSearchResults(true);
                handleUserActivity();
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (searchedAsets.length > 0) {
                    handleSelectAsset(searchedAsets[0]);
                  }
                } else if (e.key === 'Escape') {
                  setShowAssetSearchResults(false);
                }
              }}
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-text"
            />
            {assetSearchQuery && (
              <button
                type="button"
                id="btn-clear-filter-asset-search"
                onClick={() => {
                  if (setAssetSearchQuery) setAssetSearchQuery('');
                  if (setFocusedAsetId) setFocusedAsetId(null);
                  setShowAssetSearchResults(false);
                  handleUserActivity();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
                title="Hapus pencarian aset"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Modal / Popover Menu Hasil Pencarian Pin Aset Desa */}
            {showAssetSearchResults && (
              <div className="absolute top-full right-0 mt-2 w-72 sm:w-88 max-w-[calc(100vw-32px)] max-h-96 overflow-y-auto bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 z-[100] text-xs custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header dropdown dengan status & tombol tutup */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-white text-xs">Pencarian Pin Aset Desa</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {assetSearchQuery && assetSearchQuery.trim() ? (
                      <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        {searchedAsets.length} Cocok
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-slate-400">
                        {asetList.length} Total
                      </span>
                    )}
                    <button
                      type="button"
                      id="btn-close-asset-search-modal"
                      onClick={() => setShowAssetSearchResults(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Tutup Pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-filter Kategori Aset */}
                <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 mb-2">
                  <button
                    type="button"
                    onClick={() => setAssetSearchCategory('all')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer text-center ${
                      assetSearchCategory === 'all'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Semua ({asetList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetSearchCategory('pembangunan')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      assetSearchCategory === 'pembangunan'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-blue-300'
                    }`}
                  >
                    <span>Fisik ({pembangunanAsetCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetSearchCategory('non_pembangunan')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      assetSearchCategory === 'non_pembangunan'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    <span>Non-Fisik ({nonPembangunanAsetCount})</span>
                  </button>
                </div>

                {/* Panduan: Ketik untuk memfilter pin di peta, klik pin di peta untuk melihat form rincian aset */}
                <div className="px-2 py-1.5 bg-blue-950/40 rounded-xl border border-blue-800/30 text-[10px] text-blue-200 mb-2 leading-relaxed">
                  💡 Pin di peta otomatis difilter sesuai pencarian. Klik aset di bawah untuk menyorot pin di peta, lalu buka pin tersebut untuk melihat form rincian.
                </div>

                {/* Hasil List / Sugesti Aset */}
                {searchedAsets.length === 0 ? (
                  <div className="p-3 text-center text-slate-400">
                    <Building2 className="w-7 h-7 text-slate-600 mx-auto mb-1" />
                    <div className="text-xs text-white font-medium">Tidak ada aset ditemukan</div>
                    <div className="text-[10px] mt-0.5 text-slate-400">Tidak ada aset yang cocok dengan "{assetSearchQuery}"</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchedAsets.map(aset => (
                      <button
                        key={aset.id}
                        type="button"
                        onClick={() => handleSelectAsset(aset)}
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-800/90 transition-all flex items-start gap-2.5 cursor-pointer border border-transparent hover:border-blue-500/40 group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5 ${
                          aset.kategori === 'pembangunan' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {aset.kategori === 'pembangunan' ? '🏗️' : '🏛️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white truncate text-xs group-hover:text-blue-300 transition-colors">
                              {aset.namaAset}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono shrink-0 ${
                              aset.kondisi === 'Baik' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {aset.kondisi}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            <span className="font-mono text-slate-300">{aset.kodeRegister}</span> &bull; {aset.subKategori} &bull; {aset.dusun}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Toggle Filter Kependudukan & Bansos Button: Hanya untuk Admin & Operator KK. Pada Operator Aset disembunyikan */}
          {canAccessKependudukanFilter && (
            <button
              id="btn-toggle-filter-dropdown"
              type="button"
              onClick={handleToggleOpen}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border shrink-0 cursor-pointer ${
                isOpen 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-950/40'
                  : activeFilterCount > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Klik untuk membuka pilihan filter kependudukan & bansos (otomatis tersembunyi jika dibiarkan)"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter Kependudukan & Bansos</span>
              <span className="sm:hidden">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {activeFilterCount}
                </span>
              )}
              {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          )}

          {/* Reset button if active */}
          {isFilterActive && (
            <button
              id="btn-reset-filters"
              type="button"
              onClick={handleReset}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1 border border-slate-700 shrink-0 transition-all cursor-pointer"
              title="Reset Semua Filter & Pencarian"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-Hide Dropdown Area (Wilayah Dusun, Penerima Bantuan, Program Bansos, DTKS, Jenis Kelamin, Pendidikan, Kematian, Perkawinan, Gaji) */}
      {canAccessKependudukanFilter && isOpen && (
        <div 
          id="filter-drawer-content"
          className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3"
        >
          
          {/* Header Bar inside Open Filter with Auto-Hide Indicator */}
          <div className="flex items-center justify-between text-[11px] bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>
                Panel Filter Aktif &mdash;{' '}
                {countdown !== null ? (
                  <span className="text-emerald-400 font-medium">
                    Otomatis tertutup dalam {countdown} detik jika tidak ada aktivitas
                  </span>
                ) : (
                  <span className="text-slate-400">Otomatis tertutup jika tidak ada aktivitas</span>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  clearTimers();
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 hover:bg-slate-700/60 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
              >
                <span>Sembunyikan</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Grid of All 9 Filter Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            
            {/* 1. Wilayah Dusun */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="filter-dusun">
                Wilayah Dusun
              </label>
              <select
                id="filter-dusun"
                value={filters.dusun}
                onChange={e => {
                  setFilters(prev => ({ ...prev, dusun: e.target.value }));
                  handleUserActivity();
                }}
                className={`w-full bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${
                  filters.dusun !== 'semua' ? 'border-emerald-500 bg-slate-800/90' : 'border-slate-700'
                }`}
              >
                <option value="semua">Semua Dusun</option>
                <option value="Dusun I">Dusun I</option>
                <option value="Dusun II">Dusun II</option>
                <option value="Dusun III">Dusun III</option>
                <option value="Dusun IV">Dusun IV</option>
              </select>
            </div>

            {/* 2. Penerima Bantuan */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="filter-status-bansos">
                Penerima Bantuan
              </label>
              <select
                id="filter-status-bansos"
                value={filters.statusBansos}
                onChange={e => {
                  setFilters(prev => ({ ...prev, statusBansos: e.target.value as any }));
                  handleUserActivity();
                }}
                className={`w-full bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${
                  filters.statusBansos !== 'semua' ? 'border-emerald-500 bg-slate-800/90' : 'border-slate-700'
                }`}
              >
                <option value="semua">Semua (Penerima & Non)</option>
                <option value="penerima">Hanya Penerima Bansos</option>
                <option value="bukan_penerima">Bukan Penerima (Mampu)</option>
              </select>
            </div>

            {/* 3. Program Bansos */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="filter-jenis-bansos">
                Program Bansos
              </label>
              <select
                id="filter-jenis-bansos"
                value={filters.jenisBansos}
                onChange={e => {
                  setFilters(prev => ({ ...prev, jenisBansos: e.target.value }));
                  handleUserActivity();
                }}
                className={`w-full bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${
                  filters.jenisBansos !== 'semua' ? 'border-emerald-500 bg-slate-800/90' : 'border-slate-700'
                }`}
              >
                <option value="semua">Semua Program Bansos</option>
                <option value="PKH">PKH (Keluarga Harapan)</option>
                <option value="BPNT/Sembako">BPNT / Sembako</option>
                <option value="BLT-Dana Desa">BLT-Dana Desa</option>
                <option value="Bansos Beras (PBP)">Bansos Beras (PBP)</option>
                <option value="PIP (Pendidikan)">PIP (Pendidikan)</option>
                <option value="KIS/PBI-JK">KIS / PBI-JK</option>
              </select>
            </div>

            {/* 4. Kesejahteraan (DTKS) */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="filter-status-kesejahteraan">
                Kesejahteraan (DTKS)
              </label>
              <select
                id="filter-status-kesejahteraan"
                value={filters.statusKesejahteraan}
                onChange={e => {
                  setFilters(prev => ({ ...prev, statusKesejahteraan: e.target.value }));
                  handleUserActivity();
                }}
                className={`w-full bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${
                  filters.statusKesejahteraan !== 'semua' ? 'border-emerald-500 bg-slate-800/90' : 'border-slate-700'
                }`}
              >
                <option value="semua">Semua Status Desil</option>
                <option value="Desil 1 (Sangat Miskin)">Desil 1 (Sangat Miskin)</option>
                <option value="Desil 2 (Miskin)">Desil 2 (Miskin)</option>
                <option value="Desil 3 (Hampir Miskin)">Desil 3 (Hampir Miskin)</option>
                <option value="Non-DTKS (Mampu)">Non-DTKS (Mampu)</option>
              </select>
            </div>

            {/* 5. Jenis Kelamin */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="filter-jenis-kelamin">
                Jenis Kelamin
              </label>
              <select
                id="filter-jenis-kelamin"
                value={filters.jenisKelamin}
                onChange={e => {
                  setFilters(prev => ({ ...prev, jenisKelamin: e.target.value }));
                  handleUserActivity();
                }}
                className={`w-full bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${
                  filters.jenisKelamin !== 'semua' ? 'border-emerald-500 bg-slate-800/90' : 'border-slate-700'
                }`}
              >
                <option value="semua">Semua Gender</option>
                <option value="Laki-Laki">Laki-Laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* 6. Pendidikan Terakhir */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="filter-pendidikan">
                Pendidikan Terakhir
              </label>
              <select
                id="filter-pendidikan"
                value={filters.pendidikan}
                onChange={e => {
                  setFilters(prev => ({ ...prev, pendidikan: e.target.value }));
                  handleUserActivity();
                }}
                className={`w-full bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${
                  filters.pendidikan !== 'semua' ? 'border-emerald-500 bg-slate-800/90' : 'border-slate-700'
                }`}
              >
                <option value="semua">Semua Jenjang</option>
                <option value="SD">Tingkat SD</option>
                <option value="SMP">Tingkat SMP</option>
                <option value="SMA">Tingkat SMA</option>
                <option value="S1/Kuliah">Kuliah (D3/S1/S2)</option>
                <option value="Tidak/Belum Sekolah">Belum / Tidak Sekolah</option>
              </select>
            </div>

            {/* 7. Status Kematian */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="filter-status-kematian">
                Status Kematian
              </label>
              <select
                id="filter-status-kematian"
                value={filters.statusKematian}
                onChange={e => {
                  setFilters(prev => ({ ...prev, statusKematian: e.target.value }));
                  handleUserActivity();
                }}
                className={`w-full bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${
                  filters.statusKematian !== 'semua' ? 'border-emerald-500 bg-slate-800/90' : 'border-slate-700'
                }`}
              >
                <option value="semua">Semua Status</option>
                <option value="Hidup">Penduduk Hidup</option>
                <option value="Meninggal">Almarhum / Meninggal</option>
              </select>
            </div>

            {/* 8. Status Perkawinan */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="filter-status-perkawinan">
                Status Perkawinan
              </label>
              <select
                id="filter-status-perkawinan"
                value={filters.statusPerkawinan}
                onChange={e => {
                  setFilters(prev => ({ ...prev, statusPerkawinan: e.target.value }));
                  handleUserActivity();
                }}
                className={`w-full bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${
                  filters.statusPerkawinan !== 'semua' ? 'border-emerald-500 bg-slate-800/90' : 'border-slate-700'
                }`}
              >
                <option value="semua">Semua Status</option>
                <option value="Belum Kawin">Belum Kawin</option>
                <option value="Kawin">Kawin</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
                <option value="Cerai Mati">Cerai Mati</option>
              </select>
            </div>

            {/* 9. Rentang Gaji / Penghasilan */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-2">
              <label className="block text-[11px] font-medium text-slate-300 mb-1" htmlFor="filter-penghasilan-range">
                Rentang Gaji / Penghasilan Bulanan
              </label>
              <select
                id="filter-penghasilan-range"
                value={
                  filters.maxPenghasilan === 1000000 ? 'under_1jt' :
                  filters.minPenghasilan === 1000000 && filters.maxPenghasilan === 2500000 ? '1jt_2.5jt' :
                  filters.minPenghasilan === 2500000 && filters.maxPenghasilan === 5000000 ? '2.5jt_5jt' :
                  filters.minPenghasilan === 5000000 ? 'above_5jt' : 'semua'
                }
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'under_1jt') setFilters(p => ({ ...p, minPenghasilan: 0, maxPenghasilan: 1000000 }));
                  else if (val === '1jt_2.5jt') setFilters(p => ({ ...p, minPenghasilan: 1000000, maxPenghasilan: 2500000 }));
                  else if (val === '2.5jt_5jt') setFilters(p => ({ ...p, minPenghasilan: 2500000, maxPenghasilan: 5000000 }));
                  else if (val === 'above_5jt') setFilters(p => ({ ...p, minPenghasilan: 5000000, maxPenghasilan: 0 }));
                  else setFilters(p => ({ ...p, minPenghasilan: 0, maxPenghasilan: 0 }));
                  handleUserActivity();
                }}
                className={`w-full bg-slate-800 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer ${
                  filters.minPenghasilan > 0 || filters.maxPenghasilan > 0 ? 'border-emerald-500 bg-slate-800/90' : 'border-slate-700'
                }`}
              >
                <option value="semua">Semua Rentang Penghasilan</option>
                <option value="under_1jt">&lt; Rp 1.000.000 / bln (Rendah)</option>
                <option value="1jt_2.5jt">Rp 1.000.000 - Rp 2.500.000 / bln</option>
                <option value="2.5jt_5jt">Rp 2.500.000 - Rp 5.000.000 / bln</option>
                <option value="above_5jt">&gt; Rp 5.000.000 / bln (Tinggi)</option>
              </select>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};


import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { Keluarga, User, RolePermissions, JenisBantuanSosial, AsetDesa } from '../types';
import { MAP_CENTER } from '../data/mockData';
import { generateFamilyProfilePDF, generateAssetProfilePDF } from '../utils/pdfExport';
import { resolveImageUrl } from '../utils/imageUtils';
import { 
  DESA_BELITI_JAYA_INFO,
  DUSUN_BOUNDARIES
} from '../data/geoBoundaries';
import { 
  Layers, 
  MapPin, 
  Home, 
  Eye, 
  Crosshair, 
  Compass, 
  Info,
  HeartHandshake,
  CheckCircle,
  AlertTriangle,
  Building,
  Building2,
  HardHat,
  Landmark,
  Users,
  UserCheck,
  Shield,
  Layers2,
  X,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Printer,
  Navigation,
  Search,
  Filter,
  RotateCcw
} from 'lucide-react';

interface MapLeafletProps {
  keluargaList: Keluarga[];
  onSelectKeluarga: (keluarga: Keluarga) => void;
  selectedKeluargaId?: string;
  isPickingCoordinates?: boolean;
  onCoordinatePicked?: (coords: { lat: number; lng: number }) => void;
  currentUser: User;
  onOpenVillageProfile?: () => void;
  onOpenVillageInfo?: (tab?: 'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText') => void;
  onOpenOfficialsModal?: () => void;
  permissions?: RolePermissions;
  isKioskMode?: boolean;
  asetList?: AsetDesa[];
  onSelectAset?: (aset: AsetDesa | null) => void;
  onOpenAssetModal?: (kategori?: 'all' | 'pembangunan' | 'non_pembangunan', targetAsetId?: string) => void;
  selectedAsetId?: string | null;
  assetSearchQuery?: string;
  setAssetSearchQuery?: (q: string) => void;
  focusedAsetId?: string | null;
  setFocusedAsetId?: (id: string | null) => void;
  residentSearchQuery?: string;
  setResidentSearchQuery?: (q: string) => void;
  focusedKeluargaId?: string | null;
  setFocusedKeluargaId?: (id: string | null) => void;
}

export const MapLeaflet: React.FC<MapLeafletProps> = ({
  keluargaList,
  onSelectKeluarga,
  selectedKeluargaId,
  isPickingCoordinates = false,
  onCoordinatePicked,
  currentUser,
  onOpenVillageProfile,
  onOpenVillageInfo,
  onOpenOfficialsModal,
  permissions,
  isKioskMode = false,
  asetList = [],
  onSelectAset,
  onOpenAssetModal,
  selectedAsetId,
  assetSearchQuery: externalAssetSearchQuery,
  setAssetSearchQuery: externalSetAssetSearchQuery,
  focusedAsetId: externalFocusedAsetId,
  setFocusedAsetId: externalSetFocusedAsetId,
  residentSearchQuery: externalResidentSearchQuery,
  setResidentSearchQuery: externalSetResidentSearchQuery,
  focusedKeluargaId: externalFocusedKeluargaId,
  setFocusedKeluargaId: externalSetFocusedKeluargaId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);

  // Fallback state jika tidak dipassing dari parent
  const [internalAssetSearchQuery, setInternalAssetSearchQuery] = useState('');
  const [internalFocusedAsetId, setInternalFocusedAsetId] = useState<string | null>(null);
  const [internalResidentSearchQuery, setInternalResidentSearchQuery] = useState('');
  const [internalFocusedKeluargaId, setInternalFocusedKeluargaId] = useState<string | null>(null);

  const assetSearchQuery = externalAssetSearchQuery !== undefined ? externalAssetSearchQuery : internalAssetSearchQuery;
  const setAssetSearchQuery = externalSetAssetSearchQuery || setInternalAssetSearchQuery;
  const focusedAsetId = externalFocusedAsetId !== undefined ? externalFocusedAsetId : internalFocusedAsetId;
  const setFocusedAsetId = externalSetFocusedAsetId || setInternalFocusedAsetId;

  const residentSearchQuery = externalResidentSearchQuery !== undefined ? externalResidentSearchQuery : internalResidentSearchQuery;
  const setResidentSearchQuery = externalSetResidentSearchQuery || setInternalResidentSearchQuery;
  const focusedKeluargaId = externalFocusedKeluargaId !== undefined ? externalFocusedKeluargaId : internalFocusedKeluargaId;
  const setFocusedKeluargaId = externalSetFocusedKeluargaId || setInternalFocusedKeluargaId;

  const [activeLayer, setActiveLayer] = useState<'osm' | 'satellite' | 'google_roadmap'>('satellite');
  
  // Active pin preview for Apple-style sheet on map
  const [previewKeluarga, setPreviewKeluarga] = useState<Keluarga | null>(null);
  const [previewAset, setPreviewAset] = useState<AsetDesa | null>(null);

  const isOperator = currentUser?.role === 'operator';
  const isOperatorAset = currentUser?.role === 'operator_aset';

  // Keep previewAset synchronized with latest asetList data (e.g. after photos are edited in Buku Inventaris)
  const currentSelectedAset = useMemo(() => {
    if (!previewAset) return null;
    return (asetList || []).find(a => a.id === previewAset.id) || previewAset;
  }, [previewAset, asetList]);

  // Pan to selected asset when selectedAsetId is updated externally (e.g. from Buku Inventaris)
  useEffect(() => {
    if (!selectedAsetId || !mapInstanceRef.current) return;
    const target = (asetList || []).find(a => a.id === selectedAsetId);
    if (target && target.koordinat) {
      setPreviewKeluarga(null);
      mapInstanceRef.current.setView([target.koordinat.lat, target.koordinat.lng], 17, {
        animate: true
      });
    }
  }, [selectedAsetId, asetList]);

  // Fokus kamera ke titik aset ketika focusedAsetId dipilih dari pencarian (di samping pencarian penduduk)
  // Form rincian data aset desa baru akan keluar ketika user membuka/mengklik pin tersebut di peta
  useEffect(() => {
    if (!focusedAsetId || !mapInstanceRef.current) return;
    const target = (asetList || []).find(a => a.id === focusedAsetId);
    if (target && target.koordinat) {
      if (target.kategori === 'pembangunan') {
        setShowAsetPembangunan(true);
      } else {
        setShowAsetNonPembangunan(true);
      }
      setPreviewKeluarga(null);
      setPreviewAset(null); // PENTING: Jangan buka form rincian sebelum pin di peta diklik oleh user
      mapInstanceRef.current.flyTo([target.koordinat.lat, target.koordinat.lng], 18, {
        duration: 1.2
      });
    }
  }, [focusedAsetId, asetList]);

  // Fokus kamera ke titik rumah penduduk ketika focusedKeluargaId dipilih dari pencarian (di samping pencarian aset)
  // Form rincian data penduduk baru akan terbuka secara penuh ketika user membuka/mengklik pin tersebut langsung pada peta
  useEffect(() => {
    if (!focusedKeluargaId || !mapInstanceRef.current) return;
    const target = (keluargaList || []).find(k => k.id === focusedKeluargaId);
    if (target && target.koordinat) {
      setShowFamilyPins(true);
      setPreviewKeluarga(null);
      setPreviewAset(null); // PENTING: Jangan buka pop-up modal sebelum pin di peta diklik oleh user
      mapInstanceRef.current.flyTo([target.koordinat.lat, target.koordinat.lng], 18, {
        duration: 1.2
      });
    }
  }, [focusedKeluargaId, keluargaList]);

  // Layer Toggles - Otomatis uncentang Titik Rumah untuk Operator Aset, dan uncentang Aset untuk Operator KK
  const [showFamilyPins, setShowFamilyPins] = useState<boolean>(currentUser?.role !== 'operator_aset');
  const [showAsetPembangunan, setShowAsetPembangunan] = useState<boolean>(currentUser?.role !== 'operator');
  const [showAsetNonPembangunan, setShowAsetNonPembangunan] = useState<boolean>(currentUser?.role !== 'operator');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [showVillageMenu, setShowVillageMenu] = useState<boolean>(false);
  const [showVillageModal, setShowVillageModal] = useState<boolean>(false);
  // Independent open/close states for legends with small close button (Default menutup untuk semua role: Admin, Operator KK, Operator Aset)
  const [showLegendPenduduk, setShowLegendPenduduk] = useState<boolean>(false);
  const [showLegendKesejahteraan, setShowLegendKesejahteraan] = useState<boolean>(false);
  const [showLegendAset, setShowLegendAset] = useState<boolean>(false);

  // Pastikan otomatis uncentang lapisan sesuai role (Operator Aset: uncentang rumah warga; Operator KK: uncentang aset desa)
  useEffect(() => {
    if (currentUser?.role === 'operator_aset') {
      setShowFamilyPins(false);
    } else if (currentUser?.role === 'operator') {
      setShowAsetPembangunan(false);
      setShowAsetNonPembangunan(false);
    }
  }, [currentUser?.role]);

  // Statistik Kependudukan Khusus untuk Widget Legenda Penduduk
  const pendudukStats = useMemo(() => {
    let totalJiwa = 0;
    let totalLaki = 0;
    let totalPerempuan = 0;
    let totalAnak = 0; // < 18 th
    let totalProduktif = 0; // 18 - 59 th
    let totalLansia = 0; // >= 60 th
    let totalDisabilitas = 0;

    const currentYear = new Date().getFullYear();

    (keluargaList || []).forEach(k => {
      (k.anggotaKeluarga || []).forEach(p => {
        if (p.statusKematian === 'Meninggal') return;
        totalJiwa++;
        if (p.jenisKelamin === 'Laki-Laki') totalLaki++;
        else if (p.jenisKelamin === 'Perempuan') totalPerempuan++;

        if (p.disabilitas && p.disabilitas !== '-' && p.disabilitas !== 'Tidak Ada') {
          totalDisabilitas++;
        }

        if (p.tanggalLahir) {
          const birthYear = new Date(p.tanggalLahir).getFullYear();
          const age = isNaN(birthYear) ? 0 : currentYear - birthYear;
          if (age < 18) totalAnak++;
          else if (age >= 60) totalLansia++;
          else totalProduktif++;
        }
      });
    });

    const totalKK = (keluargaList || []).length;
    const avgPerKK = totalKK > 0 ? (totalJiwa / totalKK).toFixed(1) : '0';
    const percentLaki = totalJiwa > 0 ? Math.round((totalLaki / totalJiwa) * 100) : 0;
    const percentPerempuan = totalJiwa > 0 ? Math.round((totalPerempuan / totalJiwa) * 100) : 0;

    return {
      totalJiwa,
      totalLaki,
      totalPerempuan,
      totalAnak,
      totalProduktif,
      totalLansia,
      totalDisabilitas,
      totalKK,
      avgPerKK,
      percentLaki,
      percentPerempuan
    };
  }, [keluargaList]);

  // Asset Counts
  const pembangunanCount = useMemo(() => (asetList || []).filter(a => a.kategori === 'pembangunan').length, [asetList]);
  const nonPembangunanCount = useMemo(() => (asetList || []).filter(a => a.kategori === 'non_pembangunan').length, [asetList]);

  // Format currency
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Helper for age
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Dynamic Demographic summary per Dusun
  const dusunStats = useMemo(() => {
    const stats: Record<string, { totalKk: number; totalJiwa: number; bansosKk: number; nonBansosKk: number; totalNominal: number }> = {
      'Dusun I': { totalKk: 0, totalJiwa: 0, bansosKk: 0, nonBansosKk: 0, totalNominal: 0 },
      'Dusun II': { totalKk: 0, totalJiwa: 0, bansosKk: 0, nonBansosKk: 0, totalNominal: 0 },
      'Dusun III': { totalKk: 0, totalJiwa: 0, bansosKk: 0, nonBansosKk: 0, totalNominal: 0 },
      'Dusun IV': { totalKk: 0, totalJiwa: 0, bansosKk: 0, nonBansosKk: 0, totalNominal: 0 }
    };

    keluargaList.forEach(k => {
      const d = k.dusun;
      if (stats[d]) {
        stats[d].totalKk += 1;
        stats[d].totalJiwa += k.anggotaKeluarga.length;
        if (k.penerimaBansos) {
          stats[d].bansosKk += 1;
          stats[d].totalNominal += k.totalNominalBantuanBulanan || 0;
        } else {
          stats[d].nonBansosKk += 1;
        }
      }
    });

    return stats;
  }, [keluargaList]);

  // KIOSK Search & Bansos Filter State
  const [kioskSearchQuery, setKioskSearchQuery] = useState('');
  const [kioskBansosFilter, setKioskBansosFilter] = useState<string>('semua');
  const [showKioskBansosMenu, setShowKioskBansosMenu] = useState(false);
  const [showKioskSearchResults, setShowKioskSearchResults] = useState(false);
  const kioskSearchRef = useRef<HTMLDivElement>(null);
  const kioskBansosMenuRef = useRef<HTMLDivElement>(null);
  const layersMenuRef = useRef<HTMLDivElement>(null);
  const villageMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kioskSearchRef.current && !kioskSearchRef.current.contains(e.target as Node)) {
        setShowKioskSearchResults(false);
      }
      if (kioskBansosMenuRef.current && !kioskBansosMenuRef.current.contains(e.target as Node)) {
        setShowKioskBansosMenu(false);
      }
      if (layersMenuRef.current && !layersMenuRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
      }
      if (villageMenuRef.current && !villageMenuRef.current.contains(e.target as Node)) {
        setShowVillageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options for Bansos
  const bansosOptions = useMemo(() => {
    return [
      { id: 'semua', label: 'Semua Warga', count: keluargaList.length },
      { id: 'penerima', label: 'Penerima Bansos', count: keluargaList.filter(k => k.penerimaBansos).length },
      { id: 'non_penerima', label: 'Bukan Penerima (Non-Bansos)', count: keluargaList.filter(k => !k.penerimaBansos).length },
      { id: 'PKH', label: 'PKH', count: keluargaList.filter(k => k.daftarBansos?.includes('PKH')).length },
      { id: 'BPNT/Sembako', label: 'BPNT / Sembako', count: keluargaList.filter(k => k.daftarBansos?.includes('BPNT/Sembako')).length },
      { id: 'BLT-Dana Desa', label: 'BLT-Dana Desa', count: keluargaList.filter(k => k.daftarBansos?.includes('BLT-Dana Desa')).length },
      { id: 'Bansos Beras (PBP)', label: 'Bansos Beras (PBP)', count: keluargaList.filter(k => k.daftarBansos?.includes('Bansos Beras (PBP)')).length },
      { id: 'PIP (Pendidikan)', label: 'PIP (Pendidikan)', count: keluargaList.filter(k => k.daftarBansos?.includes('PIP (Pendidikan)')).length },
      { id: 'KIS/PBI-JK', label: 'KIS / PBI-JK', count: keluargaList.filter(k => k.daftarBansos?.includes('KIS/PBI-JK')).length },
    ];
  }, [keluargaList]);

  const activeBansosLabel = useMemo(() => {
    if (kioskBansosFilter === 'semua') return 'Bantuan & Bansos';
    const found = bansosOptions.find(b => b.id === kioskBansosFilter);
    return found ? found.label : 'Bantuan & Bansos';
  }, [kioskBansosFilter, bansosOptions]);

  // Search Results for dropdown
  const searchResults = useMemo(() => {
    if (!kioskSearchQuery.trim()) return [];
    const q = kioskSearchQuery.toLowerCase().trim();
    return keluargaList.filter(kel => {
      const matchNama = kel.namaKepalaKeluarga?.toLowerCase().includes(q);
      const matchNik = kel.nikKepala?.toLowerCase().includes(q);
      const matchNoKk = kel.noKk?.toLowerCase().includes(q);
      const matchDusun = kel.dusun?.toLowerCase().includes(q);
      const matchAlamat = kel.alamat?.toLowerCase().includes(q);
      const matchAnggota = kel.anggotaKeluarga?.some(a => 
        a.nama?.toLowerCase().includes(q) || a.nik?.toLowerCase().includes(q)
      );
      return matchNama || matchNik || matchNoKk || matchDusun || matchAlamat || matchAnggota;
    });
  }, [keluargaList, kioskSearchQuery]);

  // Filtered Keluarga List displayed on map
  const displayedKeluargaList = useMemo(() => {
    if (!isKioskMode) return keluargaList;

    return keluargaList.filter(kel => {
      // 1. Bansos filter
      if (kioskBansosFilter === 'penerima' && !kel.penerimaBansos) return false;
      if (kioskBansosFilter === 'non_penerima' && kel.penerimaBansos) return false;
      if (
        kioskBansosFilter !== 'semua' && 
        kioskBansosFilter !== 'penerima' && 
        kioskBansosFilter !== 'non_penerima'
      ) {
        if (!kel.daftarBansos || !kel.daftarBansos.includes(kioskBansosFilter as JenisBantuanSosial)) {
          return false;
        }
      }

      // 2. Search query filter
      if (kioskSearchQuery.trim()) {
        const q = kioskSearchQuery.toLowerCase().trim();
        const matchNama = kel.namaKepalaKeluarga?.toLowerCase().includes(q);
        const matchNik = kel.nikKepala?.toLowerCase().includes(q);
        const matchNoKk = kel.noKk?.toLowerCase().includes(q);
        const matchDusun = kel.dusun?.toLowerCase().includes(q);
        const matchAlamat = kel.alamat?.toLowerCase().includes(q);
        const matchAnggota = kel.anggotaKeluarga?.some(a => 
          a.nama?.toLowerCase().includes(q) || a.nik?.toLowerCase().includes(q)
        );
        if (!matchNama && !matchNik && !matchNoKk && !matchDusun && !matchAlamat && !matchAnggota) {
          return false;
        }
      }

      return true;
    });
  }, [isKioskMode, keluargaList, kioskBansosFilter, kioskSearchQuery]);

  // Statistik jumlah aset pembangunan dan non-pembangunan
  const pembangunanAsetCount = useMemo(() => {
    return (asetList || []).filter(a => a.kategori === 'pembangunan').length;
  }, [asetList]);

  const nonPembangunanAsetCount = useMemo(() => {
    return (asetList || []).filter(a => a.kategori === 'non_pembangunan').length;
  }, [asetList]);

  // Hasil Pencarian Aset Desa pada Peta Interaktif
  const searchedAsets = useMemo(() => {
    const q = assetSearchQuery.toLowerCase().trim();
    const list = asetList || [];

    if (!q) return list;

    return list.filter(item => {
      const matchName = item.namaAset?.toLowerCase().includes(q);
      const matchKode = item.kodeRegister?.toLowerCase().includes(q);
      const matchSub = item.subKategori?.toLowerCase().includes(q);
      const matchDusun = item.dusun?.toLowerCase().includes(q);
      const matchPj = item.penanggungJawab?.toLowerCase().includes(q);
      const matchKondisi = item.kondisi?.toLowerCase().includes(q);
      const matchDana = item.sumberDana?.toLowerCase().includes(q);
      const matchStatus = item.statusPemanfaatan?.toLowerCase().includes(q);
      const matchLuas = item.luasAtauVolume?.toLowerCase().includes(q);
      const matchKet = item.keterangan?.toLowerCase().includes(q);
      const matchTahun = item.tahunPengadaan ? String(item.tahunPengadaan).includes(q) : false;

      return matchName || matchKode || matchSub || matchDusun || matchPj || matchKondisi || matchDana || matchStatus || matchLuas || matchKet || matchTahun;
    });
  }, [asetList, assetSearchQuery]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [MAP_CENTER.lat, MAP_CENTER.lng],
        zoom: MAP_CENTER.zoom,
        zoomControl: false,
        attributionControl: true
      });

      // Add Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Create Layer Groups
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;
    }
  }, []);

  // Invalidate Leaflet map size on container resize and kiosk mode toggle
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [isKioskMode]);

  // Handle Base Tile Layer Switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = '';
    let attribution = '';
    let maxZoom = 20;

    if (activeLayer === 'satellite') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps &bull; Citra Satelit Desa Beliti Jaya';
    } else if (activeLayer === 'google_roadmap') {
      url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps &bull; Peta Wilayah';
    } else {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> kontributor';
    }

    const newTile = L.tileLayer(url, {
      maxZoom,
      attribution
    }).addTo(map);

    tileLayerRef.current = newTile;
  }, [activeLayer]);

  // Handle Coordinate Picking Click Event
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isPickingCoordinates && onCoordinatePicked) {
        const { lat, lng } = e.latlng;
        onCoordinatePicked({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });

        if (pickMarkerRef.current) {
          pickMarkerRef.current.setLatLng(e.latlng);
        } else {
          const pickIcon = L.divIcon({
            className: 'custom-pick-pin',
            html: `<div style="background-color: #ef4444; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">📍</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          pickMarkerRef.current = L.marker(e.latlng, { icon: pickIcon }).addTo(map);
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPickingCoordinates, onCoordinatePicked]);

  // Render Markers for Families
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Family Residence Markers
    if (showFamilyPins) {
      displayedKeluargaList.forEach(kel => {
        const isFocused = focusedKeluargaId === kel.id;
        const isSelected = kel.id === (previewKeluarga?.id || selectedKeluargaId) || isFocused;
        const isBansos = kel.penerimaBansos;
        
        let pinColor = '#10b981';
        if (kel.statusKesejahteraan.includes('Desil 1')) {
          pinColor = '#ef4444';
        } else if (kel.statusKesejahteraan.includes('Desil 2')) {
          pinColor = '#f97316';
        } else if (kel.statusKesejahteraan.includes('Desil 3')) {
          pinColor = '#f59e0b';
        }

        const customIcon = L.divIcon({
          className: 'custom-family-marker',
          html: `
            <div style="
              position: relative;
              cursor: pointer;
              transform: scale(${isFocused ? '1.45' : isSelected ? '1.3' : '1'});
              transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
              filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));
            ">
              <!-- Sorotan / Efek Pendar (Pulse Ring) saat Pin Penduduk Difokuskan dari Pencarian -->
              ${isFocused ? `
                <div style="
                  position: absolute;
                  top: -10px;
                  left: -10px;
                  right: -10px;
                  bottom: -10px;
                  border-radius: 50%;
                  border: 2.5px solid #10b981;
                  box-shadow: 0 0 16px #10b981;
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>
              ` : ''}

              <!-- Teardrop Pin Body -->
              <div style="
                width: 28px;
                height: 28px;
                background-color: ${pinColor};
                border: 2px solid ${isFocused ? '#10b981' : isSelected ? '#38bdf8' : '#ffffff'};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                box-shadow: ${isFocused ? '0 0 16px #10b981' : isSelected ? '0 0 12px #38bdf8' : 'none'};
              ">
                <!-- Mini House Photo Thumbnail (Counter-rotated to stay upright) -->
                <div style="
                  transform: rotate(45deg);
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  overflow: hidden;
                  background-color: #0f172a;
                  border: 1px solid rgba(255,255,255,0.85);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <img 
                    src="${kel.fotoRumah}" 
                    style="width: 100%; height: 100%; object-fit: cover; display: block;" 
                    alt="${kel.namaKepalaKeluarga}"
                    onerror="this.style.display='none'"
                  />
                </div>
              </div>

              <!-- Bansos Indicator Dot -->
              ${isBansos ? `
                <div style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  width: 9px;
                  height: 9px;
                  border-radius: 50%;
                  background: #ef4444;
                  border: 1.5px solid #ffffff;
                  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                " title="Penerima Bansos"></div>
              ` : ''}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 28]
        });

        const marker = L.marker([kel.koordinat.lat, kel.koordinat.lng], { icon: customIcon });

        // On marker click: Buka form "Rincian Data Penduduk" secara penuh saat pin diklik/dibuka langsung pada peta
        marker.on('click', () => {
          setPreviewKeluarga(null);
          onSelectKeluarga(kel);
          map.panTo([kel.koordinat.lat, kel.koordinat.lng], {
            animate: true,
            duration: 0.5
          });
        });

        markersLayer.addLayer(marker);
      });
    }

    // Village Asset Markers (Pembangunan Fisik & Non-Pembangunan)
    // Sesuai perbaikan: jika user mengetik di pencarian aset, pin pada peta HANYA menampilkan aset yang sesuai yang dicari saja
    const isSearchingAsset = assetSearchQuery.trim().length > 0;
    const targetAsetList = isSearchingAsset
      ? searchedAsets
      : (asetList || []).filter(aset => {
          const isPembangunan = aset.kategori === 'pembangunan';
          if (isPembangunan && !showAsetPembangunan) return false;
          if (!isPembangunan && !showAsetNonPembangunan) return false;
          return true;
        });

    targetAsetList.forEach(aset => {
      const isPembangunan = aset.kategori === 'pembangunan';
      const isFocused = focusedAsetId === aset.id;
      const isSelected = previewAset?.id === aset.id || selectedAsetId === aset.id || isFocused;
      const pinColor = isPembangunan ? '#0284c7' : '#059669';
      const borderColor = isPembangunan ? '#38bdf8' : '#34d399';
      const categoryIcon = isPembangunan ? '🏗️' : '🏛️';

      const customAssetIcon = L.divIcon({
        className: 'custom-asset-marker',
        html: `
          <div style="
            position: relative;
            cursor: pointer;
            transform: scale(${isFocused ? '1.45' : isSelected ? '1.35' : '1'});
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.7));
          ">
            ${isFocused ? `
              <div style="
                position: absolute;
                top: -8px;
                left: -8px;
                right: -8px;
                bottom: -8px;
                border-radius: 50%;
                border: 2.5px solid #38bdf8;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
            ` : ''}
            <!-- Pin Body -->
            <div style="
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, ${pinColor}, #0f172a);
              border: 2.5px solid ${isFocused ? '#38bdf8' : isSelected ? '#fbbf24' : borderColor};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: ${isFocused ? '0 0 20px #38bdf8' : isSelected ? '0 0 16px #fbbf24' : '0 2px 8px rgba(0,0,0,0.5)'};
            ">
              <!-- Content inside Pin (Category Icon) -->
              <div style="
                transform: rotate(45deg);
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background-color: rgba(2, 6, 23, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
              ">
                ${categoryIcon}
              </div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const assetMarker = L.marker([aset.koordinat.lat, aset.koordinat.lng], { icon: customAssetIcon });

      // Leaflet Tooltip dengan panduan klik membuka form rincian data aset desa
      assetMarker.bindTooltip(`
        <div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(56, 189, 248, 0.6); border-radius: 12px; padding: 6px 10px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.7); text-align: center; font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-weight: 700; color: #ffffff; font-size: 11px; white-space: nowrap;">${aset.namaAset}</div>
          <div style="color: #94a3b8; font-size: 9px; margin-top: 1px;">${aset.subKategori} &bull; ${aset.dusun}</div>
          <div style="color: #38bdf8; font-size: 10px; margin-top: 3px; font-weight: 600;">👆 Klik pin untuk membuka rincian aset</div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -32],
        opacity: 0.98
      });

      if (isFocused || (isSearchingAsset && targetAsetList.length === 1)) {
        assetMarker.openTooltip();
      }

      // Sesuai perbaikan: ketika user membuka/mengklik pin tersebut baru keluar form (rincian data aset desa)
      assetMarker.on('click', () => {
        setPreviewAset(aset);
        setPreviewKeluarga(null);
        setFocusedAsetId(aset.id);
        if (onSelectAset) onSelectAset(aset);
        map.panTo([aset.koordinat.lat, aset.koordinat.lng], {
          animate: true,
          duration: 0.5
        });
      });

      markersLayer.addLayer(assetMarker);
    });

  }, [displayedKeluargaList, selectedKeluargaId, previewKeluarga, showFamilyPins, asetList, showAsetPembangunan, showAsetNonPembangunan, previewAset, assetSearchQuery, searchedAsets, focusedAsetId, selectedAsetId, focusedKeluargaId]);

  // Center on selected keluarga when external prop updates
  useEffect(() => {
    if (!selectedKeluargaId || !mapInstanceRef.current) return;
    const target = keluargaList.find(k => k.id === selectedKeluargaId);
    if (target) {
      // Pastikan modal preview tertutup otomatis saat modal biodata lengkap aktif
      setPreviewKeluarga(null);
      mapInstanceRef.current.setView([target.koordinat.lat, target.koordinat.lng], 17, {
        animate: true
      });
    }
  }, [selectedKeluargaId, keluargaList]);

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([MAP_CENTER.lat, MAP_CENTER.lng], MAP_CENTER.zoom, {
        animate: true
      });
    }
  };

  return (
    <div 
      id="map-leaflet-wrapper" 
      className={
        isKioskMode 
          ? "relative w-full h-full rounded-none overflow-hidden bg-slate-950 select-none border-none z-0" 
          : "relative w-full h-[620px] sm:h-[680px] lg:h-[720px] rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl bg-slate-950 select-none z-0"
      }
    >
      
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Floating Controls (Layer Switcher & Overlay Filters) */}
      <div className={`absolute top-4 left-4 flex flex-col gap-2 ${showLayerMenu ? 'z-40' : 'z-20'}`}>
        <div ref={layersMenuRef} className="relative">
          {/* Tombol Tunggal Widget Lapisan & Marker Peta */}
          <button
            type="button"
            id="btn-layers-unified"
            onClick={() => setShowLayerMenu(prev => !prev)}
            className={`h-9 sm:h-10 px-3 rounded-2xl text-xs font-semibold border shadow-2xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 backdrop-blur-xl ${
              showLayerMenu
                ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white border-emerald-400/80 shadow-emerald-950/60'
                : 'bg-slate-900/90 hover:bg-emerald-950/70 text-emerald-300 hover:text-white border-emerald-500/30 hover:border-emerald-400/60'
            }`}
            title="Lapisan Peta (Google Satelit, OpenStreetMap, Roadmap) & Pengaturan Marker"
          >
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Lapisan & Marker</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/60 text-emerald-300 font-mono font-medium">
              {activeLayer === 'satellite' ? 'Satelit' : activeLayer === 'google_roadmap' ? 'Roadmap' : 'OSM'}
            </span>
          </button>

          {/* Menu Popover: Menampilkan semua tombol layers & pengaturan marker saat diklik */}
          {showLayerMenu && (
            <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 max-h-[calc(100vh-140px)] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 p-3 rounded-2xl shadow-2xl z-50 text-xs text-slate-200 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
              {/* Header Menu */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Lapisan & Marker Peta</div>
                    <div className="text-[10px] text-slate-400">Peta dasar & penanda warga</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowLayerMenu(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                  title="Tutup Menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bagian 1: Tombol-tombol Peta Dasar (Base Map) */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Peta Dasar (Base Map)
                </div>

                {/* Tombol 1: Google Satelit */}
                <button
                  type="button"
                  id="btn-layer-satellite"
                  onClick={() => {
                    setActiveLayer('satellite');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeLayer === 'satellite'
                      ? 'bg-emerald-600 text-white font-semibold border border-emerald-500/80 shadow-md'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${activeLayer === 'satellite' ? 'bg-black/20 text-white' : 'bg-slate-700/60 text-slate-400'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Google Satelit</div>
                      <div className={`text-[10px] ${activeLayer === 'satellite' ? 'text-emerald-100' : 'text-slate-400'}`}>
                        Citra satelit bumi resolusi tinggi
                      </div>
                    </div>
                  </div>
                  {activeLayer === 'satellite' && (
                    <CheckCircle className="w-4 h-4 text-white shrink-0" />
                  )}
                </button>

                {/* Tombol 2: OpenStreetMap */}
                <button
                  type="button"
                  id="btn-layer-osm"
                  onClick={() => {
                    setActiveLayer('osm');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeLayer === 'osm'
                      ? 'bg-emerald-600 text-white font-semibold border border-emerald-500/80 shadow-md'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${activeLayer === 'osm' ? 'bg-black/20 text-white' : 'bg-slate-700/60 text-slate-400'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">OpenStreetMap</div>
                      <div className={`text-[10px] ${activeLayer === 'osm' ? 'text-emerald-100' : 'text-slate-400'}`}>
                        Peta jalan & batas terperinci
                      </div>
                    </div>
                  </div>
                  {activeLayer === 'osm' && (
                    <CheckCircle className="w-4 h-4 text-white shrink-0" />
                  )}
                </button>

                {/* Tombol 3: Google Roadmap */}
                <button
                  type="button"
                  id="btn-layer-roadmap"
                  onClick={() => {
                    setActiveLayer('google_roadmap');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    activeLayer === 'google_roadmap'
                      ? 'bg-emerald-600 text-white font-semibold border border-emerald-500/80 shadow-md'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${activeLayer === 'google_roadmap' ? 'bg-black/20 text-white' : 'bg-slate-700/60 text-slate-400'}`}>
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Google Roadmap</div>
                      <div className={`text-[10px] ${activeLayer === 'google_roadmap' ? 'text-emerald-100' : 'text-slate-400'}`}>
                        Peta kontur jalan & tata wilayah
                      </div>
                    </div>
                  </div>
                  {activeLayer === 'google_roadmap' && (
                    <CheckCircle className="w-4 h-4 text-white shrink-0" />
                  )}
                </button>
              </div>

              <div className="h-px bg-slate-800 my-2.5" />

              {/* Bagian 2: Pengaturan Marker Peta */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Pengaturan Marker Peta
                </div>

                {/* Toggle 1: Rumah Warga & Bansos */}
                <label className="flex items-center justify-between cursor-pointer bg-slate-800/60 hover:bg-slate-800 p-2.5 rounded-xl transition-colors border border-transparent hover:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                      <Layers2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Titik Rumah & Bansos Warga</span>
                        {isOperatorAset && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                            Auto Nonaktif
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{keluargaList.length} kepala keluarga terdata</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-family-pins"
                    checked={showFamilyPins}
                    onChange={(e) => setShowFamilyPins(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                </label>

                {/* Toggle 2: Aset Pembangunan Desa (Fisik/Infrastruktur) */}
                <label className="flex items-center justify-between cursor-pointer bg-slate-800/60 hover:bg-slate-800 p-2.5 rounded-xl transition-colors border border-transparent hover:border-blue-500/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Aset Pembangunan (Fisik)</span>
                        {isOperator && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                            Auto Nonaktif
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 font-mono">
                          {pembangunanCount}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">Gedung, jalan, jembatan, sarana air & poskesdes</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-aset-pembangunan-pins"
                    checked={showAsetPembangunan}
                    onChange={(e) => setShowAsetPembangunan(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                </label>

                {/* Toggle 3: Aset Non-Pembangunan (Tanah, Alami, Mesin) */}
                <label className="flex items-center justify-between cursor-pointer bg-slate-800/60 hover:bg-slate-800 p-2.5 rounded-xl transition-colors border border-transparent hover:border-emerald-500/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Aset Non-Pembangunan</span>
                        {isOperator && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                            Auto Nonaktif
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono">
                          {nonPembangunanCount}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">Tanah kas/bengkok, embung, mobil siaga & traktor</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-aset-non-pembangunan-pins"
                    checked={showAsetNonPembangunan}
                    onChange={(e) => setShowAsetNonPembangunan(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                </label>
              </div>

              <div className="h-px bg-slate-800 my-2.5" />

              {/* Bagian 3: Tampilan Widget Legenda Peta (Dapat diakses oleh semua role: Admin, Operator KK, Operator Aset) */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Widget Legenda Peta
                </div>

                {/* Toggle Legenda Penduduk (Semua Role) */}
                <label className="flex items-center justify-between cursor-pointer bg-slate-800/60 hover:bg-slate-800 p-2 rounded-xl transition-colors border border-transparent hover:border-cyan-500/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Legenda Penduduk</div>
                      <div className="text-[10px] text-slate-400">Statistik demografi, gender & umur</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-legend-penduduk"
                    checked={showLegendPenduduk}
                    onChange={(e) => setShowLegendPenduduk(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                  />
                </label>

                {/* Toggle Legenda Kesejahteraan (Semua Role) */}
                <label className="flex items-center justify-between cursor-pointer bg-slate-800/60 hover:bg-slate-800 p-2 rounded-xl transition-colors border border-transparent hover:border-emerald-500/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Legenda Kesejahteraan</div>
                      <div className="text-[10px] text-slate-400">Klasifikasi desil & bansos</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-legend-kesejahteraan"
                    checked={showLegendKesejahteraan}
                    onChange={(e) => setShowLegendKesejahteraan(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                </label>

                {/* Toggle Legenda Aset Desa (Semua Role) */}
                <label className="flex items-center justify-between cursor-pointer bg-slate-800/60 hover:bg-slate-800 p-2 rounded-xl transition-colors border border-transparent hover:border-blue-500/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Legenda Aset Desa</div>
                      <div className="text-[10px] text-slate-400">Kondisi & inventaris desa</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-legend-aset"
                    checked={showLegendAset}
                    onChange={(e) => setShowLegendAset(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Tombol Tunggal Widget Data Wilayah & Aparatur Desa (Hanya untuk Admin, disembunyikan secara otomatis untuk Operator KK dan Operator Aset) */}
        {!isOperator && !isOperatorAset && (
          <div ref={villageMenuRef} className="relative">
            <button
              type="button"
              id="btn-village-unified"
              onClick={() => setShowVillageMenu(prev => !prev)}
              className={`h-9 sm:h-10 px-3 rounded-2xl text-xs font-semibold border shadow-2xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 backdrop-blur-xl ${
                showVillageMenu
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white border-emerald-400/80 shadow-emerald-950/60'
                  : 'bg-slate-900/90 hover:bg-emerald-950/70 text-emerald-300 hover:text-white border-emerald-500/30 hover:border-emerald-400/60'
              }`}
              title="Data Wilayah & Aparatur Desa (Klik untuk Data Wilayah, Batas Dusun, & Aparatur Desa)"
            >
              <Landmark className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Wilayah & Aparatur</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/60 text-emerald-300 font-medium">
                Desa
              </span>
            </button>

            {/* Menu Popover Wilayah & Aparatur Desa */}
            {showVillageMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 p-3 rounded-2xl shadow-2xl z-50 text-xs text-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header Menu */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Wilayah & Aparatur Desa</div>
                      <div className="text-[10px] text-slate-400">Desa Beliti Jaya, Kec. Muara Kelingi</div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowVillageMenu(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Tutup Menu"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    Pilihan Informasi
                  </div>

                  {/* Opsi 1: Data Wilayah */}
                  <button
                    type="button"
                    id="btn-info-wilayah-desa"
                    onClick={() => {
                      setShowVillageMenu(false);
                      if (onOpenVillageInfo) {
                        onOpenVillageInfo('profil');
                      } else if (onOpenVillageProfile) {
                        onOpenVillageProfile();
                      } else {
                        setShowVillageModal(true);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white border border-transparent hover:border-emerald-500/40 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold group-hover:text-emerald-300 transition-colors">Data Wilayah</div>
                        <div className="text-[10px] text-slate-400">
                          Batas dusun, luas wilayah, batas administrasi & profil
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </button>

                  {/* Opsi 2: Aparatur Desa */}
                  <button
                    type="button"
                    id="btn-widget-aparatur-desa"
                    onClick={() => {
                      setShowVillageMenu(false);
                      if (onOpenOfficialsModal) {
                        onOpenOfficialsModal();
                      } else if (onOpenVillageInfo) {
                        onOpenVillageInfo('pimpinan');
                      } else if (onOpenVillageProfile) {
                        onOpenVillageProfile();
                      } else {
                        setShowVillageModal(true);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white border border-transparent hover:border-emerald-500/40 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold group-hover:text-teal-300 transition-colors">Aparatur Desa</div>
                        <div className="text-[10px] text-slate-400">
                          Kepala Desa, BPD, Perangkat Desa & Staf
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors shrink-0" />
                  </button>

                  {/* Opsi 3: Aset & Pembangunan Desa */}
                  <button
                    type="button"
                    id="btn-widget-aset-desa"
                    onClick={() => {
                      setShowVillageMenu(false);
                      if (onOpenAssetModal) {
                        onOpenAssetModal('all');
                      }
                    }}
                    className="w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white border border-transparent hover:border-amber-500/40 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          <span>Aset & Pembangunan Desa</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 font-mono">
                            {asetList.length} Item
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Buku inventaris aset fisik pembangunan & non-pembangunan
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Coordinate Picking Mode Alert Badge */}
        {isPickingCoordinates && (
          <div className="bg-amber-500/95 backdrop-blur-md text-slate-950 px-3 py-2 rounded-2xl text-xs font-semibold shadow-lg border border-amber-300 flex items-center gap-2 animate-bounce">
            <Crosshair className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Mode Pilih Titik: Klik di peta untuk menentukan koordinat rumah</span>
          </div>
        )}
      </div>

      {/* Top Right Controls & Village Info */}
      <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center justify-end gap-2 max-w-[calc(100%-140px)] sm:max-w-none">
        {isKioskMode && (
          <>
            {/* Fitur Pencarian KIOSK */}
            <div ref={kioskSearchRef} className="relative">
              <div className="flex items-center bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 hover:border-emerald-500/60 focus-within:border-emerald-500 rounded-2xl px-3 py-1.5 shadow-2xl transition-all w-48 sm:w-56 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  id="kiosk-search-input"
                  value={kioskSearchQuery}
                  onChange={(e) => {
                    setKioskSearchQuery(e.target.value);
                    setShowKioskSearchResults(true);
                  }}
                  onFocus={() => setShowKioskSearchResults(true)}
                  placeholder="Cari KK, NIK, Dusun..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                {kioskSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setKioskSearchQuery('');
                      setShowKioskSearchResults(false);
                    }}
                    className="p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
                    title="Hapus pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Dropdown Hasil Pencarian */}
              {showKioskSearchResults && kioskSearchQuery.trim().length > 0 && (
                <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 w-72 sm:w-80 max-h-80 overflow-y-auto bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 text-xs custom-scrollbar">
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between border-b border-slate-800 mb-1">
                    <span>Hasil Pencarian</span>
                    <span className="font-mono text-emerald-400">{searchResults.length} Ditemukan</span>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">
                      Tidak ada keluarga yang cocok dengan "{kioskSearchQuery}"
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.slice(0, 15).map(kel => (
                        <button
                          key={kel.id}
                          type="button"
                          onClick={() => {
                            if (mapInstanceRef.current) {
                              mapInstanceRef.current.flyTo([kel.koordinat.lat, kel.koordinat.lng], 19, { duration: 1.2 });
                            }
                            setPreviewKeluarga(kel);
                            onSelectKeluarga(kel);
                            setShowKioskSearchResults(false);
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-slate-800/80 transition-all flex items-start gap-2.5 cursor-pointer border border-transparent hover:border-slate-700/60"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-700/80 mt-0.5">
                            <img src={kel.fotoRumah} alt={kel.namaKepalaKeluarga} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white truncate text-xs">{kel.namaKepalaKeluarga}</div>
                            <div className="text-[10px] text-slate-400 truncate">{kel.dusun} &bull; RT {kel.rt}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {kel.penerimaBansos ? (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold border border-emerald-500/30 truncate">
                                  {kel.daftarBansos && kel.daftarBansos.length > 0 ? kel.daftarBansos.join(', ') : 'Bansos'}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px]">
                                  Non-Bansos
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      {searchResults.length > 15 && (
                        <div className="p-1.5 text-center text-[10px] text-slate-400 italic">
                          + {searchResults.length - 15} data keluarga lainnya
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filter Bantuan & Bansos KIOSK */}
            <div ref={kioskBansosMenuRef} className="relative">
              <button
                type="button"
                id="btn-kiosk-filter-bansos"
                onClick={() => setShowKioskBansosMenu(prev => !prev)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border shadow-2xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 backdrop-blur-xl ${
                  kioskBansosFilter !== 'semua'
                    ? 'bg-gradient-to-r from-emerald-800/90 to-teal-800/90 text-white border-emerald-400/80 shadow-emerald-950/60'
                    : 'bg-slate-900/90 hover:bg-emerald-950/70 text-emerald-300 hover:text-white border-emerald-500/30 hover:border-emerald-400/60'
                }`}
                title="Filter Bantuan & Bansos"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{activeBansosLabel}</span>
                {kioskBansosFilter !== 'semua' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              {/* Dropdown Menu Filter Bansos */}
              {showKioskBansosMenu && (
                <div className="absolute top-full right-0 mt-1.5 w-64 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 text-xs custom-scrollbar">
                  <div className="px-2 py-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between border-b border-slate-800 mb-1">
                    <span>Filter Bantuan & Bansos</span>
                    {kioskBansosFilter !== 'semua' && (
                      <button
                        type="button"
                        onClick={() => {
                          setKioskBansosFilter('semua');
                          setShowKioskBansosMenu(false);
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="space-y-0.5 max-h-72 overflow-y-auto">
                    {bansosOptions.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setKioskBansosFilter(opt.id);
                          setShowKioskBansosMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                          kioskBansosFilter === opt.id
                            ? 'bg-emerald-600 text-white font-bold shadow-md'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <span className="truncate pr-2">{opt.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          kioskBansosFilter === opt.id ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {opt.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Recenter Button */}
        <button
          type="button"
          id="btn-recenter-beliti-jaya"
          onClick={handleResetCenter}
          className="bg-slate-900/90 backdrop-blur-xl hover:bg-slate-800 text-slate-200 hover:text-white px-3.5 py-2 rounded-2xl text-xs font-medium border border-white/10 shadow-2xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          title="Fokuskan Peta ke Pusat Desa Beliti Jaya, Muara Kelingi"
        >
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pusat Beliti Jaya</span>
        </button>
      </div>

      {/* Floating Indicator Pencarian Pin Penduduk di Peta (Hanya untuk Admin dan Operator KK) */}
      {!isKioskMode && !isOperatorAset && residentSearchQuery && residentSearchQuery.trim() && (
        <div className="absolute top-16 left-4 right-4 sm:left-auto sm:right-4 z-20 pointer-events-auto flex justify-end">
          <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/60 shadow-2xl px-3 sm:px-4 py-1.5 rounded-2xl text-xs text-slate-200 animate-in fade-in slide-in-from-top-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-[11px] truncate max-w-[220px] sm:max-w-md">
              {displayedKeluargaList.length > 0 ? (
                <>
                  Menampilkan <strong className="text-white font-mono">{displayedKeluargaList.length}</strong> pin penduduk: <strong className="text-emerald-300">"{residentSearchQuery}"</strong>. <span className="text-emerald-300 font-semibold">👆 Klik pin di peta untuk melihat rincian</span>
                </>
              ) : (
                <span className="text-amber-300 font-medium">
                  Tidak ada pin penduduk yang cocok untuk "{residentSearchQuery}"
                </span>
              )}
            </span>
            <button
              type="button"
              id="btn-clear-resident-search-banner"
              onClick={() => {
                if (setResidentSearchQuery) setResidentSearchQuery('');
                if (setFocusedKeluargaId) setFocusedKeluargaId(null);
              }}
              className="ml-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-100 cursor-pointer transition-colors text-[10px] font-semibold flex items-center gap-1.5 border border-emerald-700/60 shrink-0 shadow-xs"
              title="Kembalikan seluruh pin penduduk ke posisi normal"
            >
              <RotateCcw className="w-3 h-3 text-emerald-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Indicator Pencarian Pin Aset di Peta (Hanya untuk Admin dan Operator Aset) */}
      {!isKioskMode && !isOperator && assetSearchQuery.trim() && (
        <div className={`absolute ${!isOperatorAset && residentSearchQuery && residentSearchQuery.trim() ? 'top-28' : 'top-16'} left-4 right-4 sm:left-auto sm:right-4 z-20 pointer-events-auto flex justify-end`}>
          <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl border border-blue-500/60 shadow-2xl px-3 sm:px-4 py-1.5 rounded-2xl text-xs text-slate-200 animate-in fade-in slide-in-from-top-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
            <span className="text-[11px] truncate max-w-[220px] sm:max-w-md">
              {searchedAsets.length > 0 ? (
                <>
                  Menampilkan <strong className="text-white font-mono">{searchedAsets.length}</strong> pin aset: <strong className="text-blue-300">"{assetSearchQuery}"</strong>. <span className="text-emerald-300 font-semibold">👆 Klik pin di peta untuk melihat rincian</span>
                </>
              ) : (
                <span className="text-amber-300 font-medium">
                  Tidak ada pin aset yang cocok untuk "{assetSearchQuery}"
                </span>
              )}
            </span>
            <button
              type="button"
              id="btn-clear-asset-search-banner"
              onClick={() => {
                setAssetSearchQuery('');
                setFocusedAsetId(null);
              }}
              className="ml-1 px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900/90 text-blue-300 hover:text-blue-100 cursor-pointer transition-colors text-[10px] font-semibold flex items-center gap-1.5 border border-blue-700/60 shrink-0 shadow-xs"
              title="Kembalikan seluruh pin aset ke posisi normal"
            >
              <RotateCcw className="w-3 h-3 text-blue-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Left Map Legends (Side-by-side for Admin, Operator KK, & Operator Aset, default closed until clicked, with small close button on each) */}
      <div className={`absolute bottom-6 left-4 z-10 flex flex-row flex-wrap items-end gap-3 max-w-[calc(100vw-2rem)] pointer-events-none ${previewKeluarga || previewAset ? 'hidden lg:flex' : 'flex'}`}>
        {/* Legenda 1: Legenda Penduduk (Semua Role: Admin, Operator KK, Operator Aset) */}
        {showLegendPenduduk && (
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl w-68 sm:w-76 text-xs text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header Legenda Penduduk dengan tombol Close kecil (X) */}
            <div className="font-semibold text-white mb-2 flex items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate text-xs font-bold text-white">Legenda Penduduk</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                  Demografi
                </span>
                <button
                  type="button"
                  id="btn-close-legend-penduduk"
                  onClick={() => setShowLegendPenduduk(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800/80 cursor-pointer transition-colors"
                  title="Tutup Legenda Penduduk"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Konten Khusus Data Penduduk */}
            <div className="space-y-2 text-[10px] text-slate-300">
              {/* Ringkasan Total Jiwa & KK */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <div className="text-[9px] text-slate-400 flex items-center gap-1">
                    <Users className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Total Penduduk</span>
                  </div>
                  <div className="font-bold text-white text-xs mt-0.5 font-mono">
                    {pendudukStats.totalJiwa} <span className="text-[9px] font-normal text-slate-400">Jiwa</span>
                  </div>
                </div>

                <div className="p-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <div className="text-[9px] text-slate-400 flex items-center gap-1">
                    <Home className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Kepala Keluarga</span>
                  </div>
                  <div className="font-bold text-white text-xs mt-0.5 font-mono">
                    {pendudukStats.totalKK} <span className="text-[9px] font-normal text-slate-400">KK</span>
                  </div>
                </div>
              </div>

              {/* Komposisi Gender (Laki-laki & Perempuan) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span className="flex items-center gap-1 text-sky-300">
                    <span>👨 L:</span>
                    <strong className="text-white font-mono">{pendudukStats.totalLaki}</strong>
                    <span>({pendudukStats.percentLaki}%)</span>
                  </span>
                  <span className="flex items-center gap-1 text-fuchsia-300">
                    <span>👩 P:</span>
                    <strong className="text-white font-mono">{pendudukStats.totalPerempuan}</strong>
                    <span>({pendudukStats.percentPerempuan}%)</span>
                  </span>
                </div>
                {/* Visual Ratio Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                  <div 
                    className="h-full bg-sky-500 transition-all duration-300" 
                    style={{ width: `${pendudukStats.percentLaki}%` }} 
                    title={`Laki-Laki: ${pendudukStats.totalLaki}`}
                  />
                  <div 
                    className="h-full bg-fuchsia-500 transition-all duration-300" 
                    style={{ width: `${pendudukStats.percentPerempuan}%` }} 
                    title={`Perempuan: ${pendudukStats.totalPerempuan}`}
                  />
                </div>
              </div>

              {/* Kelompok Umur & Karakteristik Penduduk */}
              <div className="pt-1.5 border-t border-slate-800 grid grid-cols-3 gap-1 text-[9px]">
                <div className="p-1 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center">
                  <div className="text-slate-400 text-[8px] truncate">Anak (&lt;18)</div>
                  <div className="font-bold text-amber-300 font-mono text-[10px]">{pendudukStats.totalAnak}</div>
                </div>
                <div className="p-1 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center">
                  <div className="text-slate-400 text-[8px] truncate">Produktif (18-59)</div>
                  <div className="font-bold text-emerald-300 font-mono text-[10px]">{pendudukStats.totalProduktif}</div>
                </div>
                <div className="p-1 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center">
                  <div className="text-slate-400 text-[8px] truncate">Lansia (≥60)</div>
                  <div className="font-bold text-indigo-300 font-mono text-[10px]">{pendudukStats.totalLansia}</div>
                </div>
              </div>

              {/* Footer: Rata-rata Kepadatan per KK */}
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                <span>Rasio per Rumah:</span>
                <span className="font-semibold text-cyan-300 font-mono">{pendudukStats.avgPerKK} Jiwa / KK</span>
              </div>
            </div>
          </div>
        )}

        {/* Legenda 2: Legenda Kesejahteraan & Bansos (Semua Role: Admin, Operator KK, Operator Aset) */}
        {showLegendKesejahteraan && (
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl w-64 sm:w-72 text-xs text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header Legenda Kesejahteraan dengan tombol Close kecil */}
            <div className="font-semibold text-white mb-2 flex items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate text-xs font-bold text-white">Legenda Kesejahteraan</span>
              </div>
              <button
                type="button"
                id="btn-close-legend-kesejahteraan"
                onClick={() => setShowLegendKesejahteraan(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800/80 cursor-pointer transition-colors"
                title="Tutup Legenda Kesejahteraan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Konten Desil Kesejahteraan */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-1 ring-rose-300/40 shrink-0" />
                <span>Desil 1 (Sangat Miskin)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-1 ring-orange-300/40 shrink-0" />
                <span>Desil 2 (Miskin)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-amber-300/40 shrink-0" />
                <span>Desil 3 (Hampir Miskin)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-emerald-300/40 shrink-0" />
                <span>Non-DTKS (Mampu)</span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Titik Terpetakan:</span>
              <span className="font-bold text-emerald-400 font-mono">{keluargaList.length} Rumah</span>
            </div>
          </div>
        )}

        {/* Legenda 3: Legenda Aset Desa (Semua Role: Admin, Operator KK, Operator Aset) */}
        {showLegendAset && (
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl w-68 sm:w-76 text-xs text-slate-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header Legenda Aset Desa dengan tombol Close kecil */}
            <div className="font-semibold text-white mb-2 flex items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate text-xs font-bold text-white">Legenda Aset Desa</span>
              </div>
              <button
                type="button"
                id="btn-close-legend-aset"
                onClick={() => setShowLegendAset(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800/80 cursor-pointer transition-colors"
                title="Tutup Legenda Aset Desa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Kategori Marker Aset */}
            <div className="space-y-1.5 text-[10px] text-slate-300">
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-4 h-4 rounded-md bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-[10px] shrink-0">
                    🏗️
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate text-[10px]">Aset Pembangunan</div>
                    <div className="text-[9px] text-slate-400 truncate">Fisik, jalan, gedung, air</div>
                  </div>
                </div>
                <span className="font-mono text-blue-300 font-bold shrink-0 text-[10px] ml-1">{pembangunanCount} Item</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-4 h-4 rounded-md bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center text-[10px] shrink-0">
                    🏛️
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate text-[10px]">Non-Pembangunan</div>
                    <div className="text-[9px] text-slate-400 truncate">Tanah kas, kendaraan, alat</div>
                  </div>
                </div>
                <span className="font-mono text-emerald-300 font-bold shrink-0 text-[10px] ml-1">{nonPembangunanCount} Item</span>
              </div>

              {/* Kondisi Status Aset */}
              <div className="pt-1.5 border-t border-slate-800">
                <div className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
                  Kondisi & Status Aset
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-300/40 shrink-0" />
                    <span className="truncate">Baik ({(asetList || []).filter(a => a.kondisi === 'baik').length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 ring-1 ring-amber-300/40 shrink-0" />
                    <span className="truncate">Rusak Ringan ({(asetList || []).filter(a => a.kondisi === 'rusak_ringan').length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 ring-1 ring-rose-300/40 shrink-0" />
                    <span className="truncate">Rusak Berat ({(asetList || []).filter(a => a.kondisi === 'rusak_berat').length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 ring-1 ring-cyan-300/40 shrink-0" />
                    <span className="truncate">Dikerjakan ({(asetList || []).filter(a => a.kondisi === 'sedang_dikerjakan').length})</span>
                  </div>
                </div>
              </div>

              {/* Footer Total */}
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                <span>Total Aset Terdata:</span>
                <span className="font-bold text-blue-400 font-mono">{(asetList || []).length} Titik</span>
              </div>
            </div>
          </div>
        )}

        {/* Dock Tombol Buka Legenda (Tampil jika ada legenda yang menutup - Default semua menutup untuk semua role) */}
        {(!showLegendPenduduk || !showLegendKesejahteraan || !showLegendAset) && (
          <div className="pointer-events-auto flex items-center flex-wrap gap-1.5 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl animate-in fade-in duration-200">
            {!showLegendPenduduk && (
              <button
                type="button"
                id="btn-open-legend-penduduk"
                onClick={() => setShowLegendPenduduk(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm group"
                title="Buka Widget Legenda Penduduk"
              >
                <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span>Legenda Penduduk</span>
              </button>
            )}

            {!showLegendKesejahteraan && (
              <button
                type="button"
                id="btn-open-legend-kesejahteraan"
                onClick={() => setShowLegendKesejahteraan(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm group"
                title="Buka Widget Legenda Kesejahteraan"
              >
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <span>Legenda Kesejahteraan</span>
              </button>
            )}

            {!showLegendAset && (
              <button
                type="button"
                id="btn-open-legend-aset"
                onClick={() => setShowLegendAset(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-blue-500/20 text-slate-200 hover:text-blue-300 border border-slate-700/60 hover:border-blue-500/40 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm group"
                title="Buka Widget Legenda Aset Desa"
              >
                <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span>Legenda Aset Desa</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* APPLE-STYLE / iOS-STYLE ANIMATED PIN DETAIL MODAL (CENTERED) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {previewKeluarga && !selectedKeluargaId && (
          <div
            id="apple-pin-preview-overlay"
            className="absolute inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs transition-colors pointer-events-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewKeluarga(null);
            }}
          >
            <motion.div
              key={previewKeluarga.id}
              id="apple-style-pin-sheet"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-slate-100 flex flex-col gap-3.5"
            >
              {/* iOS Sheet Grab Bar Indicator */}
              <div className="w-12 h-1 bg-white/25 rounded-full mx-auto -mt-1 mb-1"></div>

              {/* Header: Photo + Quick Info */}
              <div className="flex items-start gap-3.5">
                {/* House Photo with iOS Squircle */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 ring-1 ring-white/20 shadow-lg bg-slate-950">
                  <img
                    src={previewKeluarga.fotoRumah}
                    alt={previewKeluarga.namaKepalaKeluarga}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
                </div>

                {/* Title & Metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase flex items-center gap-1 font-mono">
                      <Home className="w-3 h-3" /> No KK: {previewKeluarga.noKk}
                    </span>
                    
                    {/* Close button with haptic tap */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      type="button"
                      onClick={() => setPreviewKeluarga(null)}
                      className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Tutup Ringkasan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug truncate mt-0.5">
                    {previewKeluarga.namaKepalaKeluarga}
                  </h3>

                  <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{previewKeluarga.dusun} • RT {previewKeluarga.rt}</span>
                  </p>

                  {/* Status Badges */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      previewKeluarga.statusKesejahteraan.includes('Desil 1')
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : previewKeluarga.statusKesejahteraan.includes('Desil 2')
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                        : previewKeluarga.statusKesejahteraan.includes('Desil 3')
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {previewKeluarga.statusKesejahteraan.split('(')[0]}
                    </span>

                    {previewKeluarga.penerimaBansos ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-600/90 text-white shadow-xs">
                        Penerima Bansos
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        Non-Bansos
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: Family Members Avatar Stack & Quick Details */}
              <div className="bg-slate-950/50 rounded-2xl p-2.5 sm:p-3 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-300" />
                    Anggota Keluarga:
                  </span>
                  <span className="font-bold text-white">
                    {previewKeluarga.anggotaKeluarga.length} Jiwa
                  </span>
                </div>

                {/* Members Avatar Row */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none">
                  <div className="flex -space-x-2 shrink-0">
                    {previewKeluarga.anggotaKeluarga.slice(0, 5).map((m, idx) => (
                      <img
                        key={m.id || idx}
                        src={m.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                        alt={m.nama}
                        title={`${m.nama} (${m.statusKeluarga}, ${calculateAge(m.tanggalLahir)} th)`}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-900 border border-white/20"
                      />
                    ))}
                    {previewKeluarga.anggotaKeluarga.length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-slate-800 ring-2 ring-slate-900 border border-white/20 flex items-center justify-center text-[9px] font-bold text-slate-300">
                        +{previewKeluarga.anggotaKeluarga.length - 5}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-slate-300 font-mono">
                    {previewKeluarga.penerimaBansos ? (
                      <span className="text-emerald-400 font-semibold">
                        {formatRupiah(previewKeluarga.totalNominalBantuanBulanan)}<span className="text-[9px] text-slate-400 font-sans">/bln</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Keluarga Mandiri</span>
                    )}
                  </div>
                </div>

                {/* Bansos Pills */}
                {previewKeluarga.penerimaBansos && previewKeluarga.daftarBansos.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                    {previewKeluarga.daftarBansos.map((b, i) => (
                      <span key={i} className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Apple-style Primary Action Buttons */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.01 }}
                  type="button"
                  id={`btn-open-full-detail-${previewKeluarga.id}`}
                  onClick={() => {
                    const selected = previewKeluarga;
                    setPreviewKeluarga(null);
                    onSelectKeluarga(selected);
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-2xl shadow-lg shadow-emerald-950/60 border border-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                >
                  <span>Buka Biodata Lengkap</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=-2.971973,103.152321&destination=${previewKeluarga.koordinat.lat},${previewKeluarga.koordinat.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`btn-gmaps-pin-${previewKeluarga.id}`}
                  className="p-2.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded-2xl border border-blue-400/40 shadow-lg shadow-blue-950/40 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  title="Buka Rute Google Maps dari Kantor Desa Beliti Jaya (-2.971973, 103.152321)"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {!isKioskMode && currentUser?.role !== 'operator_aset' && (!permissions || currentUser.role === 'admin' || !permissions.operatorOnlyAddKK || permissions.allowOperatorExport) && (
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.02 }}
                    type="button"
                    id={`btn-print-pin-pdf-${previewKeluarga.id}`}
                    onClick={() => generateFamilyProfilePDF(previewKeluarga)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white rounded-2xl border border-white/10 shadow-lg flex items-center justify-center cursor-pointer transition-colors"
                    title="Cetak Profil Kartu Keluarga (PDF Resmi)"
                  >
                    <Printer className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* FLOATING BOTTOM PREVIEW CARD ASET DESA (SEPERTI CARD KELUARGA DI PETA)    */}
      {/* BUKAN MODAL, TAPI PREVIEW CEPAT DENGAN TOMBOL MENUJU HALAMAN WEB LENGKAP */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {currentSelectedAset && (
          <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto w-full max-w-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/80 space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                    <img
                      src={resolveImageUrl(currentSelectedAset.foto)}
                      alt={currentSelectedAset.namaAset}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0.4';
                      }}
                    />
                    <div className="absolute top-1 left-1">
                      <span className="text-[10px]">
                        {currentSelectedAset.kategori === 'pembangunan' ? '🏗️' : '🏛️'}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        currentSelectedAset.kategori === 'pembangunan'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      }`}>
                        {currentSelectedAset.kategori === 'pembangunan' ? 'Pembangunan Fisik' : 'Non-Pembangunan'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        {currentSelectedAset.kodeRegister}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {currentSelectedAset.dusun}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white truncate drop-shadow-sm" title={currentSelectedAset.namaAset}>
                      {currentSelectedAset.namaAset}
                    </h4>

                    <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap font-medium">
                      <span className="text-emerald-400 font-bold font-mono">
                        {formatRupiah(currentSelectedAset.nilaiPerolehan)}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">Kondisi: {currentSelectedAset.kondisi}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewAset(null);
                    if (onSelectAset) onSelectAset(null);
                  }}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.01 }}
                  type="button"
                  id={`btn-open-asset-page-${currentSelectedAset.id}`}
                  onClick={() => {
                    if (onSelectAset) onSelectAset(currentSelectedAset);
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-2xl shadow-lg shadow-emerald-950/60 border border-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                >
                  <span>Buka Rincian Data Aset (Halaman Web)</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=-2.971973,103.152321&destination=${currentSelectedAset.koordinat.lat},${currentSelectedAset.koordinat.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded-2xl border border-blue-400/40 shadow-lg shadow-blue-950/40 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  title="Buka Navigasi Rute Google Maps"
                >
                  <Navigation className="w-4 h-4" />
                </a>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ scale: 1.02 }}
                  type="button"
                  onClick={() => generateAssetProfilePDF(currentSelectedAset)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white rounded-2xl border border-white/10 shadow-lg flex items-center justify-center cursor-pointer transition-colors"
                  title="Cetak Dokumen KIB Aset (PDF Resmi)"
                >
                  <Printer className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Village Information Modal with iOS Animation */}
      <AnimatePresence>
        {showVillageModal && (
          <div id="modal-village-profile-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              id="modal-village-profile-card" 
              className="bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 text-slate-100"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl font-bold">
                    🏛️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Profil Spasial Desa Beliti Jaya</h3>
                    <p className="text-xs text-slate-400">Kecamatan Muara Kelingi, Kabupaten Musi Rawas</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowVillageModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 my-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Luas Wilayah</span>
                    <span className="text-emerald-400 font-bold text-sm">± 14.2 km² (1.420 Ha)</span>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Pembagian Wilayah</span>
                    <span className="text-white font-bold text-sm">4 Dusun • 8 RT</span>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Koordinat Geografis</span>
                    <span className="text-white font-bold text-[11px] font-mono">2°57'58" LS, 103°09'29" BT</span>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                    <span className="text-slate-400 text-[10px] block">Kode Pos Wilayah</span>
                    <span className="text-white font-bold text-sm">{DESA_BELITI_JAYA_INFO.kodePos}</span>
                  </div>
                </div>

                {/* Batas Batas Wilayah */}
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="font-semibold text-white text-xs mb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Batas-Batas Administrasi Wilayah
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[11px]">
                    <div className="flex justify-between py-0.5 border-b border-slate-900">
                      <span className="text-slate-400">Sebelah Utara:</span>
                      <span className="font-medium text-slate-200">{DESA_BELITI_JAYA_INFO.batasWilayah.utara}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-900">
                      <span className="text-slate-400">Sebelah Selatan:</span>
                      <span className="font-medium text-slate-200">{DESA_BELITI_JAYA_INFO.batasWilayah.selatan}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-900">
                      <span className="text-slate-400">Sebelah Timur:</span>
                      <span className="font-medium text-slate-200">{DESA_BELITI_JAYA_INFO.batasWilayah.timur}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-400">Sebelah Barat:</span>
                      <span className="font-medium text-slate-200">{DESA_BELITI_JAYA_INFO.batasWilayah.barat}</span>
                    </div>
                  </div>
                </div>

                {/* Dusun Overview List */}
                <div>
                  <div className="font-semibold text-white text-xs mb-1.5">Daftar Dusun & Kepala Dusun</div>
                  <div className="grid grid-cols-2 gap-2">
                    {DUSUN_BOUNDARIES.map(d => (
                      <div key={d.id} className="bg-slate-800/40 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.borderColor }} />
                        <div>
                          <div className="font-semibold text-white text-[11px]">{d.name}</div>
                          <div className="text-[10px] text-slate-400">{d.kepalaDusun}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVillageModal(false)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-2xl text-xs font-semibold shadow transition-all cursor-pointer"
                >
                  Tutup Informasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};



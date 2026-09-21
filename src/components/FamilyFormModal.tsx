import React, { useState, useEffect } from 'react';
import { Keluarga, Penduduk, User, DusunWilayah, StatusKesejahteraan, JenisBantuanSosial, StatusPenduduk } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  MapPin, 
  Home, 
  Users, 
  HeartHandshake, 
  Upload, 
  Crosshair, 
  Sparkles,
  RotateCcw,
  Camera,
  User as UserIcon,
  Link as LinkIcon
} from 'lucide-react';

interface FamilyFormModalProps {
  initialData?: Keluarga | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (keluargaData: Omit<Keluarga, 'id' | 'createdAt' | 'updatedAt' | 'statusVerifikasi'>) => void;
  currentUser: User;
  onPickCoordinateOnMap: () => void;
  pickedCoords?: { lat: number; lng: number } | null;
}

/**
 * Client-side image compression to lightweight JPEG Base64
 * Prevents localStorage quota overflows while maintaining crisp photo quality
 */
const compressImage = (file: File, maxWidth = 500, maxHeight = 500, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
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
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const FamilyFormModal: React.FC<FamilyFormModalProps> = ({
  initialData,
  isOpen,
  onClose,
  onSave,
  currentUser,
  onPickCoordinateOnMap,
  pickedCoords
}) => {
  const isEditing = !!initialData;

  // Helper to generate a clean empty family member record
  const createEmptyMember = (
    role: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain' = 'Kepala Keluarga', 
    idx = 0,
    defaultStatus: StatusPenduduk = 'Tetap'
  ): Penduduk => ({
    id: `pen_${Date.now()}_${idx + 1}`,
    nik: '',
    noKk: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: role === 'Istri' ? 'Perempuan' : 'Laki-Laki',
    agama: 'Islam',
    statusPerkawinan: role === 'Kepala Keluarga' || role === 'Istri' ? 'Kawin' : 'Belum Kawin',
    statusKeluarga: role,
    pendidikan: 'SMA',
    pekerjaan: '',
    penghasilanBulanan: 0,
    statusKematian: 'Hidup',
    statusPenduduk: defaultStatus,
    foto: '',
    bantuanPribadi: []
  });

  // Form States - All clean by default
  const [noKk, setNoKk] = useState<string>('');
  const [namaKepalaKeluarga, setNamaKepalaKeluarga] = useState<string>('');
  const [nikKepala, setNikKepala] = useState<string>('');
  const [alamat, setAlamat] = useState<string>('');
  const [dusun, setDusun] = useState<DusunWilayah>('Dusun I');
  const [rt, setRt] = useState<string>('');
  const [rw, setRw] = useState<string>('');
  const [statusPenduduk, setStatusPenduduk] = useState<StatusPenduduk>('Tetap');
  
  // Coordinates
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');

  // Kesejahteraan & Bansos
  const [statusKesejahteraan, setStatusKesejahteraan] = useState<StatusKesejahteraan>('Desil 1 (Sangat Miskin)');
  const [penerimaBansos, setPenerimaBansos] = useState<boolean>(false);
  const [daftarBansos, setDaftarBansos] = useState<JenisBantuanSosial[]>(['Tidak Menerima']);
  const [totalNominal, setTotalNominal] = useState<number | ''>('');

  // Kondisi Rumah
  const [fotoRumah, setFotoRumah] = useState<string>('');
  const [tipeBangunan, setTipeBangunan] = useState<'Permanen' | 'Semi Permanen' | 'Panggung Kayu' | 'Bambu/Papan'>('Permanen');
  const [luasBangunanM2, setLuasBangunanM2] = useState<number | ''>('');
  const [sumberAirMinum, setSumberAirMinum] = useState<'Sumur Bor' | 'Sumur Gali' | 'Sungai Beliti' | 'PDAM/Depot'>('Sumur Bor');
  const [dayaListrik, setDayaListrik] = useState<'450 VA (Subsidi)' | '900 VA (Subsidi)' | '900 VA (Non Subsidi)' | '1300 VA+' | 'Tanpa Listrik'>('450 VA (Subsidi)');
  const [statusKepemilikan, setStatusKepemilikan] = useState<'Milik Sendiri' | 'Sewa/Kontrak' | 'Menumpang' | 'Rumah Dinas'>('Milik Sendiri');
  const [kondisiLantai, setKondisiLantai] = useState<'Keramik' | 'Semen' | 'Papan/Kayu' | 'Tanah'>('Semen');
  const [kondisiDinding, setKondisiDinding] = useState<'Tembok/Batu Bata' | 'Papan/Kayu' | 'Bambu' | 'Seng'>('Tembok/Batu Bata');
  const [fasilitasJamban, setFasilitasJamban] = useState<'Milik Sendiri (Leher Angsa)' | 'Jamban Cemplung' | 'MCK Umum' | 'Tidak Ada/Sungai'>('Milik Sendiri (Leher Angsa)');

  // Anggota Keluarga List
  const [anggotaList, setAnggotaList] = useState<Penduduk[]>([createEmptyMember('Kepala Keluarga', 0)]);

  // UI state for photo upload inputs
  const [showKepalaUrlInput, setShowKepalaUrlInput] = useState<boolean>(false);
  const [openMemberUrlIdx, setOpenMemberUrlIdx] = useState<number | null>(null);

  // Photo of Kepala Keluarga is synced with anggotaList[0]?.foto
  const fotoKepala = anggotaList[0]?.foto || '';

  // Process uploaded image file
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
      const compressed = await compressImage(file, 600, 600, 0.85);
      onDone(compressed);
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      alert('Terjadi kesalahan saat memproses gambar.');
    }
  };

  // Update Kepala Keluarga photo
  const handleUpdateKepalaFoto = (fotoUrl: string) => {
    setAnggotaList(prev => {
      if (prev.length === 0) return [createEmptyMember('Kepala Keluarga', 0)];
      const updated = [...prev];
      updated[0] = { ...updated[0], foto: fotoUrl };
      return updated;
    });
  };

  // Reset form to pristine clean state
  const resetToEmptyForm = () => {
    setNoKk('');
    setNamaKepalaKeluarga('');
    setNikKepala('');
    setAlamat('');
    setDusun('Dusun I');
    setRt('');
    setRw('');
    setStatusPenduduk('Tetap');
    setLat(pickedCoords ? pickedCoords.lat : '');
    setLng(pickedCoords ? pickedCoords.lng : '');
    setStatusKesejahteraan('Desil 1 (Sangat Miskin)');
    setPenerimaBansos(false);
    setDaftarBansos(['Tidak Menerima']);
    setTotalNominal('');
    setFotoRumah('');
    setTipeBangunan('Permanen');
    setLuasBangunanM2('');
    setSumberAirMinum('Sumur Bor');
    setDayaListrik('450 VA (Subsidi)');
    setStatusKepemilikan('Milik Sendiri');
    setKondisiLantai('Semen');
    setKondisiDinding('Tembok/Batu Bata');
    setFasilitasJamban('Milik Sendiri (Leher Angsa)');
    setAnggotaList([createEmptyMember('Kepala Keluarga', 0)]);
    setShowKepalaUrlInput(false);
    setOpenMemberUrlIdx(null);
  };

  // Sync state when initialData or modal visibility changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNoKk(initialData.noKk || '');
        setNamaKepalaKeluarga(initialData.namaKepalaKeluarga || '');
        setNikKepala(initialData.nikKepala || '');
        setAlamat(initialData.alamat || '');
        setDusun(initialData.dusun || 'Dusun I');
        setRt(initialData.rt || '');
        setRw(initialData.rw || '');
        setStatusPenduduk(initialData.statusPenduduk || 'Tetap');
        setLat(initialData.koordinat?.lat ?? '');
        setLng(initialData.koordinat?.lng ?? '');
        setStatusKesejahteraan(initialData.statusKesejahteraan || 'Desil 1 (Sangat Miskin)');
        setPenerimaBansos(initialData.penerimaBansos ?? false);
        setDaftarBansos(initialData.daftarBansos?.length ? initialData.daftarBansos : ['Tidak Menerima']);
        setTotalNominal(initialData.totalNominalBantuanBulanan || '');
        setFotoRumah(initialData.fotoRumah || '');
        setTipeBangunan(initialData.kondisiRumah?.tipeBangunan || 'Permanen');
        setLuasBangunanM2(initialData.kondisiRumah?.luasBangunanM2 || '');
        setSumberAirMinum(initialData.kondisiRumah?.sumberAirMinum || 'Sumur Bor');
        setDayaListrik(initialData.kondisiRumah?.dayaListrik || '450 VA (Subsidi)');
        setStatusKepemilikan(initialData.kondisiRumah?.statusKepemilikan || 'Milik Sendiri');
        setKondisiLantai(initialData.kondisiRumah?.kondisiLantai || 'Semen');
        setKondisiDinding(initialData.kondisiRumah?.kondisiDinding || 'Tembok/Batu Bata');
        setFasilitasJamban(initialData.kondisiRumah?.fasilitasJamban || 'Milik Sendiri (Leher Angsa)');
        setAnggotaList(initialData.anggotaKeluarga?.length ? initialData.anggotaKeluarga : [createEmptyMember('Kepala Keluarga', 0)]);
      } else if (!pickedCoords) {
        // Pristine new form: clean all fields so there is no residual dummy data
        resetToEmptyForm();
      }
    }
  }, [isOpen, initialData]);

  // Sync picked coords if changed from map
  useEffect(() => {
    if (pickedCoords) {
      setLat(pickedCoords.lat);
      setLng(pickedCoords.lng);
    }
  }, [pickedCoords]);

  // Sync Kepala Keluarga fields from Section 1 into member list
  const handleNoKkChange = (val: string) => {
    setNoKk(val);
    setAnggotaList(prev => prev.map((m, i) => i === 0 || !m.noKk ? { ...m, noKk: val } : m));
  };

  const handleNamaKepalaChange = (val: string) => {
    setNamaKepalaKeluarga(val);
    setAnggotaList(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[0] = { ...copy[0], nama: val };
      return copy;
    });
  };

  const handleNikKepalaChange = (val: string) => {
    setNikKepala(val);
    setAnggotaList(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[0] = { ...copy[0], nik: val };
      return copy;
    });
  };

  // Toggle Bansos program
  const handleToggleBansos = (prog: JenisBantuanSosial) => {
    if (prog === 'Tidak Menerima') {
      setDaftarBansos(['Tidak Menerima']);
      setPenerimaBansos(false);
      setTotalNominal('');
      return;
    }

    const filtered = daftarBansos.filter(b => b !== 'Tidak Menerima');
    if (filtered.includes(prog)) {
      const next = filtered.filter(b => b !== prog);
      if (next.length === 0) {
        setDaftarBansos(['Tidak Menerima']);
        setPenerimaBansos(false);
        setTotalNominal('');
      } else {
        setDaftarBansos(next);
        setPenerimaBansos(true);
      }
    } else {
      const next = [...filtered, prog];
      setDaftarBansos(next);
      setPenerimaBansos(true);
    }
  };

  // Change status penduduk at family level (syncing all members)
  const handleStatusPendudukChange = (val: StatusPenduduk) => {
    setStatusPenduduk(val);
    setAnggotaList(prev => prev.map(m => ({
      ...m,
      statusPenduduk: val
    })));
  };

  // Add new family member
  const handleAddMember = () => {
    const nextRole = anggotaList.length === 1 ? 'Istri' : 'Anak';
    const newMember = createEmptyMember(nextRole, anggotaList.length, statusPenduduk);
    newMember.noKk = noKk;
    setAnggotaList([...anggotaList, newMember]);
  };

  // Update member field
  const handleUpdateMember = (index: number, field: keyof Penduduk, value: any) => {
    const updated = [...anggotaList];
    updated[index] = { ...updated[index], [field]: value };
    
    // If updating kepala keluarga's name or NIK directly in member list, sync with Section 1
    if (index === 0 && field === 'nama') {
      setNamaKepalaKeluarga(value);
    }
    if (index === 0 && field === 'nik') {
      setNikKepala(value);
    }
    setAnggotaList(updated);
  };

  // Remove member
  const handleRemoveMember = (index: number) => {
    if (anggotaList.length <= 1) {
      alert('Keluarga harus memiliki minimal 1 anggota (Kepala Keluarga)');
      return;
    }
    setAnggotaList(anggotaList.filter((_, i) => i !== index));
  };

  // Quick village center coordinates
  const handleSetVillageCenterCoords = () => {
    setLat(-2.9661);
    setLng(103.1581);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!noKk.trim()) {
      alert('Harap isi Nomor Kartu Keluarga (KK).');
      return;
    }
    if (!namaKepalaKeluarga.trim()) {
      alert('Harap isi Nama Kepala Keluarga.');
      return;
    }
    if (!nikKepala.trim()) {
      alert('Harap isi NIK Kepala Keluarga.');
      return;
    }
    if (lat === '' || lng === '' || isNaN(Number(lat)) || isNaN(Number(lng))) {
      alert('Harap tentukan titik koordinat GIS (Latitude & Longitude) dengan memilih titik di peta atau memasukkan koordinat.');
      return;
    }

    // Ensure member 0 is synced with head
    const finalMembers = [...anggotaList];
    if (finalMembers.length > 0) {
      finalMembers[0].nama = namaKepalaKeluarga.trim();
      finalMembers[0].nik = nikKepala.trim();
      finalMembers[0].noKk = noKk.trim();
      finalMembers[0].statusKeluarga = 'Kepala Keluarga';
    }
    finalMembers.forEach(m => {
      if (!m.statusPenduduk) {
        m.statusPenduduk = statusPenduduk;
      }
    });

    const payload: Omit<Keluarga, 'id' | 'createdAt' | 'updatedAt' | 'statusVerifikasi'> = {
      noKk: noKk.trim(),
      namaKepalaKeluarga: namaKepalaKeluarga.trim(),
      nikKepala: nikKepala.trim(),
      alamat: alamat.trim(),
      dusun,
      rt: rt.trim() || '00',
      rw: rw.trim() || '00',
      koordinat: { lat: Number(lat), lng: Number(lng) },
      statusKesejahteraan,
      statusPenduduk,
      penerimaBansos: daftarBansos.length > 0 && !daftarBansos.includes('Tidak Menerima'),
      daftarBansos,
      totalNominalBantuanBulanan: Number(totalNominal) || 0,
      fotoRumah: fotoRumah.trim(),
      kondisiRumah: {
        tipeBangunan,
        luasBangunanM2: Number(luasBangunanM2) || 0,
        sumberAirMinum,
        dayaListrik,
        statusKepemilikan,
        kondisiLantai,
        kondisiDinding,
        fasilitasJamban
      },
      anggotaKeluarga: finalMembers,
      lastModifiedBy: currentUser.name
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div id="family-form-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div id="family-form-card" className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isEditing ? 'Edit Data Keluarga & Kependudukan' : 'Tambah Kartu Keluarga & Titik GIS Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                Desa Beliti Jaya, Kec. Muara Kelingi, Kab. Musi Rawas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={resetToEmptyForm}
                className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 flex items-center gap-1 transition-all"
                title="Kosongkan seluruh kolom formulir"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bersihkan Form</span>
              </button>
            )}
            <button
              type="button"
              id="btn-close-form"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Section 1: Data Pokok KK & Alamat */}
          <div className="space-y-3">
            <h3 className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> 1. Data Pokok Kartu Keluarga & Lokasi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nomor Kartu Keluarga (KK) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={noKk}
                  onChange={e => handleNoKkChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Contoh: 163105xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nama Kepala Keluarga <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaKepalaKeluarga}
                  onChange={e => handleNamaKepalaChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Nama Lengkap Kepala Keluarga"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  NIK Kepala Keluarga <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nikKepala}
                  onChange={e => handleNikKepalaChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="16 Digit NIK Kepala Keluarga"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  Alamat Jalan / Lorong / Gang <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={alamat}
                  onChange={e => setAlamat(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Contoh: Jl. Poros Dusun I, RT 01"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Wilayah Dusun</label>
                <select
                  value={dusun}
                  onChange={e => setDusun(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Dusun I">Dusun I</option>
                  <option value="Dusun II">Dusun II</option>
                  <option value="Dusun III">Dusun III</option>
                  <option value="Dusun IV">Dusun IV</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">RT</label>
                  <input
                    type="text"
                    value={rt}
                    onChange={e => setRt(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="Contoh: 01"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">RW</label>
                  <input
                    type="text"
                    value={rw}
                    onChange={e => setRw(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="Contoh: 01"
                  />
                </div>
              </div>
            </div>

            {/* Status Penduduk (Keluarga) */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-slate-200 font-semibold mb-0.5 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Status Penduduk (Keluarga) <span className="text-rose-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Pilih status kependudukan: <strong className="text-slate-300">Tetap</strong> (Warga Asli Desa) atau <strong className="text-slate-300">Sementara</strong> (Pendatang / Musiman / Kontrak).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-status-tetap"
                  onClick={() => handleStatusPendudukChange('Tetap')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusPenduduk === 'Tetap'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>✓</span>
                  <span>Tetap (Warga Asli)</span>
                </button>
                <button
                  type="button"
                  id="btn-status-sementara"
                  onClick={() => handleStatusPendudukChange('Sementara')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusPenduduk === 'Sementara'
                      ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-950/40 ring-1 ring-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>⏳</span>
                  <span>Sementara (Pendatang)</span>
                </button>
              </div>
            </div>

            {/* Pas Foto / Foto Identitas Kepala Keluarga */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    {fotoKepala ? (
                      <div className="relative group">
                        <img
                          src={fotoKepala}
                          alt="Foto Kepala Keluarga"
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/70 shadow-md shadow-emerald-950/40"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateKepalaFoto('')}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-lg transition-all"
                          title="Hapus Foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                        <UserIcon className="w-6 h-6 text-slate-400" />
                        <span className="text-[8px] mt-0.5 font-medium">Pas Foto</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-200">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Pas Foto / Foto KTP Kepala Keluarga</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {fotoKepala ? 'Foto Tersedia' : 'Opsional'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Unggah foto resmi Kepala Keluarga dari galeri atau kamera ponsel (format JPG/PNG).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950/40 transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{fotoKepala ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleProcessImageFile(e.target.files[0], (dataUrl) => {
                            handleUpdateKepalaFoto(dataUrl);
                          });
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowKepalaUrlInput(!showKepalaUrlInput)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    title="Input link URL foto"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>URL</span>
                  </button>

                  {fotoKepala && (
                    <button
                      type="button"
                      onClick={() => handleUpdateKepalaFoto('')}
                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible URL Input for Kepala Keluarga */}
              {showKepalaUrlInput && (
                <div className="mt-3 pt-3 border-t border-slate-700/60 flex gap-2">
                  <input
                    type="text"
                    value={fotoKepala}
                    onChange={(e) => handleUpdateKepalaFoto(e.target.value)}
                    placeholder="https://... (Tempelkan link URL foto Kepala Keluarga)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKepalaUrlInput(false)}
                    className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              )}
            </div>

            {/* Geographic Coordinates Picker */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Titik Koordinat Lokasi GIS (Latitude & Longitude) <span className="text-rose-400">*</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSetVillageCenterCoords}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-all border border-slate-700 cursor-pointer"
                    title="Isi otomatis dengan titik tengah Desa Beliti Jaya"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pusat Beliti Jaya</span>
                  </button>
                  <button
                    type="button"
                    id="btn-pick-coord-map"
                    onClick={onPickCoordinateOnMap}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-emerald-900/40"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Pilih Titik di Peta Interaktif</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lat}
                    placeholder="Contoh: -2.966100"
                    onChange={e => setLat(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lng}
                    placeholder="Contoh: 103.158100"
                    onChange={e => setLng(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Kesejahteraan & Program Bansos */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5" /> 2. Klasifikasi Kesejahteraan & Bantuan Sosial
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Status Kesejahteraan (DTKS)</label>
                <select
                  value={statusKesejahteraan}
                  onChange={e => setStatusKesejahteraan(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Desil 1 (Sangat Miskin)">Desil 1 (Sangat Miskin)</option>
                  <option value="Desil 2 (Miskin)">Desil 2 (Miskin)</option>
                  <option value="Desil 3 (Hampir Miskin)">Desil 3 (Hampir Miskin)</option>
                  <option value="Desil 4 (Rentan Miskin)">Desil 4 (Rentan Miskin)</option>
                  <option value="Non-DTKS (Mampu)">Non-DTKS (Mampu)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nominal Total Bantuan / Bulan (Rp)</label>
                <input
                  type="number"
                  value={totalNominal}
                  onChange={e => setTotalNominal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Program Bantuan Sosial Diterima</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Tidak Menerima',
                  'PKH',
                  'BPNT/Sembako',
                  'BLT-Dana Desa',
                  'Bansos Beras (PBP)',
                  'PIP (Pendidikan)',
                  'KIS/PBI-JK'
                ].map((prog, idx) => {
                  const isChecked = daftarBansos.includes(prog as any);
                  return (
                    <label
                      key={idx}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-600/20 border-emerald-500 text-white font-medium'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleBansos(prog as any)}
                        className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs">{prog}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Foto & Kondisi Fisik Rumah */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> 3. Foto Rumah & Kondisi Fisik Bangunan
            </h3>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Foto Rumah & Bangunan (Unggah dari Perangkat atau URL)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={fotoRumah}
                  onChange={e => setFotoRumah(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs font-mono"
                  placeholder="https://... (Masukkan URL Foto atau klik Unggah dari File)"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah dari File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleProcessImageFile(e.target.files[0], (dataUrl) => {
                            setFotoRumah(dataUrl);
                          });
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  {fotoRumah && (
                    <button
                      type="button"
                      onClick={() => setFotoRumah('')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {fotoRumah && (
                <div className="mt-2.5 flex items-center gap-3 p-2 bg-slate-800/80 rounded-xl border border-slate-700 w-fit">
                  <img src={fotoRumah} alt="Preview Rumah" className="w-16 h-12 object-cover rounded-lg border border-slate-600 shadow" />
                  <div>
                    <span className="text-xs text-emerald-400 font-medium block">Foto Rumah Terpilih</span>
                    <span className="text-[10px] text-slate-400">Tersimpan secara lokal dengan kompresi optimal</span>
                  </div>
                </div>
              )}

              <div className="mt-2">
                <span className="text-[11px] text-slate-400 block mb-1">Preset Foto Referensi (Klik untuk mengisi):</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80'
                  ].map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFotoRumah(url)}
                      className={`w-16 h-12 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                        fotoRumah === url ? 'border-emerald-500 ring-2 ring-emerald-500/50' : 'border-slate-700 hover:border-slate-500'
                      }`}
                      title={`Gunakan contoh foto #${i + 1}`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-slate-400 mb-1">Tipe Bangunan</label>
                <select
                  value={tipeBangunan}
                  onChange={e => setTipeBangunan(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Permanen">Permanen</option>
                  <option value="Semi Permanen">Semi Permanen</option>
                  <option value="Panggung Kayu">Panggung Kayu</option>
                  <option value="Bambu/Papan">Bambu/Papan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Luas Bangunan (m²)</label>
                <input
                  type="number"
                  value={luasBangunanM2}
                  onChange={e => setLuasBangunanM2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  placeholder="Contoh: 36"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sumber Air Minum</label>
                <select
                  value={sumberAirMinum}
                  onChange={e => setSumberAirMinum(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Sumur Bor">Sumur Bor</option>
                  <option value="Sumur Gali">Sumur Gali</option>
                  <option value="Sungai Beliti">Sungai Beliti</option>
                  <option value="PDAM/Depot">PDAM/Depot</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Daya Listrik</label>
                <select
                  value={dayaListrik}
                  onChange={e => setDayaListrik(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="450 VA (Subsidi)">450 VA (Subsidi)</option>
                  <option value="900 VA (Subsidi)">900 VA (Subsidi)</option>
                  <option value="900 VA (Non Subsidi)">900 VA (Non Subsidi)</option>
                  <option value="1300 VA+">1300 VA+</option>
                  <option value="Tanpa Listrik">Tanpa Listrik</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-slate-400 mb-1">Status Kepemilikan</label>
                <select
                  value={statusKepemilikan}
                  onChange={e => setStatusKepemilikan(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Milik Sendiri">Milik Sendiri</option>
                  <option value="Sewa/Kontrak">Sewa/Kontrak</option>
                  <option value="Menumpang">Menumpang</option>
                  <option value="Rumah Dinas">Rumah Dinas</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kondisi Lantai</label>
                <select
                  value={kondisiLantai}
                  onChange={e => setKondisiLantai(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Keramik">Keramik</option>
                  <option value="Semen">Semen</option>
                  <option value="Papan/Kayu">Papan/Kayu</option>
                  <option value="Tanah">Tanah</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kondisi Dinding</label>
                <select
                  value={kondisiDinding}
                  onChange={e => setKondisiDinding(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Tembok/Batu Bata">Tembok/Batu Bata</option>
                  <option value="Papan/Kayu">Papan/Kayu</option>
                  <option value="Bambu">Bambu</option>
                  <option value="Seng">Seng</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Fasilitas Jamban</label>
                <select
                  value={fasilitasJamban}
                  onChange={e => setFasilitasJamban(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Milik Sendiri (Leher Angsa)">Milik Sendiri (Leher Angsa)</option>
                  <option value="Jamban Cemplung">Jamban Cemplung</option>
                  <option value="MCK Umum">MCK Umum</option>
                  <option value="Tidak Ada/Sungai">Tidak Ada/Sungai</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Anggota Keluarga & Biodata Lengkap */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> 4. Biodata Anggota Keluarga ({anggotaList.length} Jiwa)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Lengkapi data setiap anggota keluarga beserta pas foto masing-masing.
                </p>
              </div>
              <button
                type="button"
                id="btn-add-member"
                onClick={handleAddMember}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-emerald-900/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Anggota</span>
              </button>
            </div>

            <div className="space-y-3">
              {anggotaList.map((member, idx) => (
                <div key={idx} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-3">
                  {/* Member Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                    <span className="font-bold text-white text-xs flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-[10px]">#{idx + 1}</span>
                      <span>{idx === 0 ? 'Kepala Keluarga' : member.statusKeluarga}</span>
                      {member.nama && <span className="text-emerald-400 font-medium">- {member.nama}</span>}
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
                        title="Hapus Anggota Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Member Photo Upload Block */}
                  <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {member.foto ? (
                          <div className="relative group">
                            <img
                              src={member.foto}
                              alt={member.nama || 'Anggota'}
                              className="w-12 h-12 rounded-xl object-cover border border-emerald-500/60 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateMember(idx, 'foto', '')}
                              className="absolute -top-1 -right-1 p-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow transition-all cursor-pointer"
                              title="Hapus foto"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                            <UserIcon className="w-5 h-5 text-slate-400" />
                            <span className="text-[7px] mt-0.5 font-medium">Pas Foto</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-200 font-medium text-xs flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pas Foto {idx === 0 ? 'Kepala Keluarga' : member.statusKeluarga}</span>
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {member.foto ? 'Foto siap disimpan' : 'Unggah foto identitas anggota (opsional)'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95">
                        <Upload className="w-3 h-3" />
                        <span>{member.foto ? 'Ganti Foto' : 'Unggah Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleProcessImageFile(e.target.files[0], (dataUrl) => {
                                handleUpdateMember(idx, 'foto', dataUrl);
                              });
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setOpenMemberUrlIdx(openMemberUrlIdx === idx ? null : idx)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                        title="Input link URL foto"
                      >
                        <LinkIcon className="w-3 h-3 text-slate-400" />
                        <span>URL</span>
                      </button>

                      {member.foto && (
                        <button
                          type="button"
                          onClick={() => handleUpdateMember(idx, 'foto', '')}
                          className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Collapsible URL Input for this member */}
                  {openMemberUrlIdx === idx && (
                    <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-700/80 flex gap-2">
                      <input
                        type="text"
                        value={member.foto}
                        onChange={(e) => handleUpdateMember(idx, 'foto', e.target.value)}
                        placeholder="https://... (Tempelkan link URL foto anggota keluarga)"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setOpenMemberUrlIdx(null)}
                        className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">
                        Nama Lengkap <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={member.nama}
                        onChange={e => handleUpdateMember(idx, 'nama', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder="Nama Sesuai KTP/Akta"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">
                        NIK (16 Digit) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={member.nik}
                        onChange={e => handleUpdateMember(idx, 'nik', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder="16 Digit NIK"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Hubungan Keluarga</label>
                      {idx === 0 ? (
                        <input
                          type="text"
                          disabled
                          value="Kepala Keluarga"
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-400"
                        />
                      ) : (
                        <select
                          value={member.statusKeluarga}
                          onChange={e => handleUpdateMember(idx, 'statusKeluarga', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        >
                          <option value="Istri">Istri</option>
                          <option value="Anak">Anak</option>
                          <option value="Orang Tua">Orang Tua</option>
                          <option value="Famili Lain">Famili Lain</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Jenis Kelamin</label>
                      <select
                        value={member.jenisKelamin}
                        onChange={e => handleUpdateMember(idx, 'jenisKelamin', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      >
                        <option value="Laki-Laki">Laki-Laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={member.tanggalLahir}
                        onChange={e => handleUpdateMember(idx, 'tanggalLahir', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Pendidikan</label>
                      <select
                        value={member.pendidikan}
                        onChange={e => handleUpdateMember(idx, 'pendidikan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      >
                        <option value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                        <option value="Diploma (D1-D3)">Diploma (D1-D3)</option>
                        <option value="S1/Kuliah">S1/Kuliah</option>
                        <option value="S2/S3">S2/S3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Status Kawin</label>
                      <select
                        value={member.statusPerkawinan}
                        onChange={e => handleUpdateMember(idx, 'statusPerkawinan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      >
                        <option value="Belum Kawin">Belum Kawin</option>
                        <option value="Kawin">Kawin</option>
                        <option value="Cerai Hidup">Cerai Hidup</option>
                        <option value="Cerai Mati">Cerai Mati</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Tempat Lahir</label>
                      <input
                        type="text"
                        value={member.tempatLahir}
                        onChange={e => handleUpdateMember(idx, 'tempatLahir', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder="Contoh: Beliti Jaya"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Pekerjaan</label>
                      <input
                        type="text"
                        value={member.pekerjaan}
                        onChange={e => handleUpdateMember(idx, 'pekerjaan', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder="Contoh: Petani, Buruh..."
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Penghasilan / Bulan (Rp)</label>
                      <input
                        type="number"
                        value={member.penghasilanBulanan === 0 ? '' : member.penghasilanBulanan}
                        onChange={e => handleUpdateMember(idx, 'penghasilanBulanan', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Status Kematian</label>
                      <select
                        value={member.statusKematian}
                        onChange={e => handleUpdateMember(idx, 'statusKematian', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      >
                        <option value="Hidup">Hidup</option>
                        <option value="Meninggal">Meninggal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-0.5">Status Penduduk</label>
                      <select
                        value={member.statusPenduduk || statusPenduduk || 'Tetap'}
                        onChange={e => handleUpdateMember(idx, 'statusPenduduk', e.target.value as StatusPenduduk)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                          (member.statusPenduduk || statusPenduduk) === 'Sementara'
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                            : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      >
                        <option value="Tetap">Tetap</option>
                        <option value="Sementara">Sementara</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-family-submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan Data' : 'Simpan Data Kartu Keluarga'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

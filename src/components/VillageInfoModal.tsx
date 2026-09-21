import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DesaProfile } from '../types';
import { DUSUN_BOUNDARIES } from '../data/geoBoundaries';
import { 
  Building, 
  UserCheck, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Compass, 
  X, 
  Shield, 
  Layers, 
  Briefcase,
  CheckCircle2,
  Info,
  User as UserIcon,
  Megaphone,
  Tv
} from 'lucide-react';

interface VillageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  desaProfile: DesaProfile;
  initialTab?: 'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText';
}

export const VillageInfoModal: React.FC<VillageInfoModalProps> = ({
  isOpen,
  onClose,
  desaProfile,
  initialTab = 'profil'
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'pimpinan' | 'perangkat' | 'struktur' | 'runningText'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const filteredPerangkat = selectedCategory === 'semua'
    ? desaProfile.perangkatLainnya
    : desaProfile.perangkatLainnya.filter(p => p.kategori === selectedCategory);

  const kaurList = desaProfile.perangkatLainnya.filter(p => p.kategori === 'Kaur');
  const kasiList = desaProfile.perangkatLainnya.filter(p => p.kategori === 'Kasi');
  const kadusList = desaProfile.perangkatLainnya.filter(p => p.kategori === 'Kepala Dusun');
  const bpdMember = desaProfile.perangkatLainnya.find(p => p.kategori === 'BPD');

  return (
    <div 
      id="village-info-modal-overlay" 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        id="village-info-modal-container"
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto"
      >
        {/* Header (Read-Only: Tanpa Tombol Edit / Tambah) */}
        <div className="p-5 sm:px-6 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-inner overflow-hidden p-1">
              {desaProfile.logoDesa ? (
                <img 
                  src={desaProfile.logoDesa} 
                  alt={`Logo Desa ${desaProfile.namaDesa}`} 
                  className="w-9 h-9 object-contain drop-shadow" 
                />
              ) : (
                <Building className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Informasi Data Desa {desaProfile.namaDesa}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {desaProfile.kecamatan} • {desaProfile.kabupaten}
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Mode Tampilan Informasi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Data Wilayah & Kontak, Kepala Desa & Sekdes, Perangkat Desa, dan Bagan Struktur Organisasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Close Button */}
            <button
              type="button"
              id="btn-close-village-info-modal"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700/60"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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
            <span>Perangkat Desa ({desaProfile.perangkatLainnya.length})</span>
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
            onClick={() => setActiveTab('runningText')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'runningText'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Running Text (Kiosk)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: DATA WILAYAH & KONTAK */}
          {activeTab === 'profil' && (
            <div className="space-y-6">
              {/* SECTION: LOGO & IDENTITAS VISUAL DESA (VIEW ONLY) */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Identitas & Lambang Resmi Desa
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Sistem Informasi Geografis Kependudukan & Pemantauan Bansos
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  {/* Logo Display */}
                  <div className="relative shrink-0 mx-auto md:mx-0">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-950/80 border-2 border-emerald-500/30 flex items-center justify-center p-2.5 shadow-inner overflow-hidden">
                      {desaProfile.logoDesa ? (
                        <img
                          src={desaProfile.logoDesa}
                          alt={`Logo Desa ${desaProfile.namaDesa}`}
                          className="max-w-full max-h-full object-contain drop-shadow-md"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500 text-center p-2">
                          <Shield className="w-9 h-9 text-slate-600 mb-1" />
                          <span className="text-[10px] text-slate-400">Lambang Desa</span>
                        </div>
                      )}
                    </div>
                    {desaProfile.logoDesa && (
                      <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-md flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Terdaftar
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-white">
                          Pemerintah Desa {desaProfile.namaDesa}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Kec. {desaProfile.kecamatan}, Kab. {desaProfile.kabupaten}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Desa Beliti Jaya merupakan salah satu desa di wilayah Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Provinsi Sumatera Selatan, yang terbagi dalam 4 Dusun dan 8 Rukun Tetangga (RT).
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Kode Wilayah</span>
                        <span className="font-mono text-white font-bold">{desaProfile.kodeDesa || '16.05.01.2014'}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Kode Pos</span>
                        <span className="font-mono text-emerald-400 font-bold">{desaProfile.kodePos || '31662'}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Luas Wilayah</span>
                        <span className="font-medium text-white">± {desaProfile.luasWilayahKm2 || '14.2'} km²</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Pembagian</span>
                        <span className="font-medium text-emerald-400">4 Dusun • 8 RT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid: Kontak & Kantor Desa */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Alamat Kantor & Kontak Pelayanan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block mb-1">Alamat Balai / Kantor Desa:</span>
                    <p className="text-slate-200 font-medium leading-relaxed">
                      {desaProfile.alamatKantor || 'Jalan Poros Desa Beliti Jaya, Kec. Muara Kelingi, Kab. Musi Rawas'}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block mb-1">Email Resmi Desa:</span>
                    <div className="text-blue-400 font-mono flex items-center gap-1.5 font-medium">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{desaProfile.emailDesa || 'pemdes.belitijaya@musirawaskab.go.id'}</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block mb-1">Telepon / Hotline Layanan:</span>
                    <div className="text-emerald-400 font-mono flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{desaProfile.teleponDesa || '0812-7890-4433'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid: Batas Administrasi Wilayah */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Batas-Batas Administrasi Wilayah
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">Sebelah Utara:</span>
                    <span className="text-slate-200 font-semibold">{desaProfile.batasWilayah.utara}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">Sebelah Selatan:</span>
                    <span className="text-slate-200 font-semibold">{desaProfile.batasWilayah.selatan}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">Sebelah Timur:</span>
                    <span className="text-slate-200 font-semibold">{desaProfile.batasWilayah.timur}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium block mb-1">Sebelah Barat:</span>
                    <span className="text-slate-200 font-semibold">{desaProfile.batasWilayah.barat}</span>
                  </div>
                </div>
              </div>

              {/* Grid: Visi & Misi Desa */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Visi & Misi Pembangunan Desa
                </h3>

                <div>
                  <span className="block text-slate-400 text-[11px] mb-1 font-medium">Visi Desa:</span>
                  <div className="text-emerald-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-medium italic">
                    "{desaProfile.visi || 'Terwujudnya Desa Beliti Jaya yang Mandiri, Sejahtera, Transparan, dan Berdaya Saing Berbasis Agrobisnis dan Pelayanan Digital.'}"
                  </div>
                </div>

                <div>
                  <span className="block text-slate-400 text-[11px] font-medium mb-2">Misi Pembangunan Desa:</span>
                  <div className="space-y-2">
                    {(desaProfile.misi || []).map((m, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200 leading-relaxed">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid: Pembagian Dusun & Kepala Dusun */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Wilayah Dusun & Kepala Dusun
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {DUSUN_BOUNDARIES.map(d => (
                    <div key={d.id} className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.borderColor }} />
                          <span className="font-bold text-white text-xs">{d.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">Kepala Dusun: <strong className="text-white">{d.kepalaDusun}</strong></p>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-2 font-mono">{d.rtList?.length || 2} RT Terpetakan</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEPALA DESA & SEKRETARIS DESA */}
          {activeTab === 'pimpinan' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* KEPALA DESA CARD */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-5 rounded-3xl border border-emerald-500/30 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500/20 border-b border-l border-emerald-500/30 rounded-bl-2xl text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Pimpinan Utama
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={desaProfile.kepalaDesa.foto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80'}
                        alt={desaProfile.kepalaDesa.nama}
                        className="w-20 h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                      />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                        Kepala Desa
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">
                        {desaProfile.kepalaDesa.nama}
                      </h3>
                      <p className="text-slate-400 text-[11px] font-mono">
                        NIP: {desaProfile.kepalaDesa.nip || '-'}
                      </p>
                      <p className="text-emerald-400 text-[11px] font-medium">
                        Periode: {desaProfile.kepalaDesa.periode || '2021 - 2027'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">NIK</span>
                        <span className="font-mono text-slate-200">{desaProfile.kepalaDesa.nik || '-'}</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Kontak WhatsApp</span>
                        <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {desaProfile.kepalaDesa.noHp || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] font-semibold mb-1">Tugas & Wewenang Pokok:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Memimpin penyelenggaraan pemerintahan desa, membina ketentraman dan ketertiban masyarakat desa, serta membina dan meningkatkan perekonomian dan kesejahteraan masyarakat Desa Beliti Jaya.
                      </p>
                    </div>

                    {desaProfile.kepalaDesa.sambutan && (
                      <div className="bg-emerald-950/20 p-3 rounded-2xl border border-emerald-500/20 text-emerald-200 text-[11px] italic">
                        "{desaProfile.kepalaDesa.sambutan}"
                      </div>
                    )}
                  </div>
                </div>

                {/* SEKRETARIS DESA CARD */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-5 rounded-3xl border border-teal-500/30 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-teal-500/20 border-b border-l border-teal-500/30 rounded-bl-2xl text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                    Koordinator Administrasi
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={desaProfile.sekretarisDesa.foto || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'}
                        alt={desaProfile.sekretarisDesa.nama}
                        className="w-20 h-24 rounded-2xl object-cover border-2 border-teal-500/50 shadow-md"
                      />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                        Sekretaris Desa
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">
                        {desaProfile.sekretarisDesa.nama}
                      </h3>
                      <p className="text-slate-400 text-[11px] font-mono">
                        NIP: {desaProfile.sekretarisDesa.nip || '-'}
                      </p>
                      <p className="text-teal-400 text-[11px] font-medium">
                        Periode: {desaProfile.sekretarisDesa.periode || '2021 - 2027'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">NIK</span>
                        <span className="font-mono text-slate-200">{desaProfile.sekretarisDesa.nik || '-'}</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Kontak WhatsApp</span>
                        <span className="text-teal-400 font-mono font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {desaProfile.sekretarisDesa.noHp || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] font-semibold mb-1">Tugas & Fungsi Utama:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Memimpin kesekretariatan desa, menyusun kebijakan administrasi, perencanaan APBDes, serta koordinasi seluruh Kepala Urusan (Kaur) dan Kepala Seksi (Kasi).
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: PERANGKAT DESA LAINNYA (READ-ONLY) */}
          {activeTab === 'perangkat' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Daftar Aparatur & Perangkat Desa
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kepala Seksi (Kasi), Kepala Urusan (Kaur), Kepala Dusun (Kadus I - IV), dan Badan Permusyawaratan Desa (BPD)
                  </p>
                </div>

                {/* Filter Kategori Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['semua', 'Kasi', 'Kaur', 'Kepala Dusun', 'BPD'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {cat === 'semua' ? 'Semua' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Apparatus Cards (Read-only, NO edit/delete/add) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredPerangkat.map((prk) => {
                  let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  if (prk.kategori === 'Kasi') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  if (prk.kategori === 'Kaur') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  if (prk.kategori === 'Kepala Dusun') badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                  if (prk.kategori === 'BPD') badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';

                  return (
                    <div 
                      key={prk.id}
                      className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={prk.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={prk.nama}
                            className="w-12 h-14 rounded-xl object-cover border border-slate-700 shrink-0 shadow-sm"
                          />
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
                        <span className="text-slate-400">Periode: {prk.periode || '2021 - 2027'}</span>
                        <span className="text-slate-500 font-mono text-[9px]">{prk.kategori}</span>
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
                <h3 className="text-sm font-bold text-white">Struktur Organisasi Pemerintahan Desa {desaProfile.namaDesa}</h3>
                <p className="text-[11px] text-slate-400">Hierarki kepemimpinan, sekretariat desa, seksi teknis, dan kewilayahan dusun</p>
              </div>

              {/* Hierarchy Tree */}
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Level 1: Kepala Desa & BPD */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {/* Kepala Desa */}
                  <div className="bg-emerald-950/40 border-2 border-emerald-500/50 p-4 rounded-2xl text-center w-64 shadow-xl">
                    <img
                      src={desaProfile.kepalaDesa.foto || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80'}
                      alt={desaProfile.kepalaDesa.nama}
                      className="w-14 h-16 rounded-xl object-cover mx-auto mb-2 border border-emerald-400/40 shadow"
                    />
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Kepala Desa</div>
                    <div className="font-bold text-white text-xs mt-0.5">{desaProfile.kepalaDesa.nama}</div>
                    <div className="text-[10px] text-slate-400 font-mono">NIP: {desaProfile.kepalaDesa.nip || '-'}</div>
                  </div>

                  {/* BPD (Mitra Kerja Sejajar) */}
                  {bpdMember && (
                    <div className="bg-rose-950/30 border-2 border-dashed border-rose-500/40 p-4 rounded-2xl text-center w-64 shadow-xl">
                      <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Badan Permusyawaratan Desa (BPD)</div>
                      <div className="font-bold text-white text-xs mt-1">
                        {bpdMember.nama}
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
                      src={desaProfile.sekretarisDesa.foto || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'}
                      alt={desaProfile.sekretarisDesa.nama}
                      className="w-14 h-16 rounded-xl object-cover mx-auto mb-2 border border-teal-400/40 shadow"
                    />
                    <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Sekretaris Desa</div>
                    <div className="font-bold text-white text-xs mt-0.5">{desaProfile.sekretarisDesa.nama}</div>
                    <div className="text-[10px] text-slate-400 font-mono">NIP: {desaProfile.sekretarisDesa.nip || '-'}</div>
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
                      {kaurList.map(p => (
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
                      {kasiList.map(p => (
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
                    {kadusList.map(p => (
                      <div key={p.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="font-semibold text-white text-[11px]">{p.jabatan}</div>
                        <div className="text-[10px] text-purple-300 font-medium">{p.nama}</div>
                        {p.noHp && <div className="text-[9px] text-slate-400 font-mono mt-0.5">{p.noHp}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RUNNING TEXT (KIOSK TICKER VIEW) */}
          {activeTab === 'runningText' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    Running Text Monitor Kiosk Balai Desa
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tampilan pengumuman berjalan aktif yang disiarkan di anjungan KIOSK layar lebar Balai Desa.
                  </p>
                </div>
              </div>

              {/* Ticker Live Simulator */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-300 font-mono tracking-wider uppercase">
                      Live Ticker Kiosk Balai Desa
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Kecepatan: {desaProfile.runningTextSpeed === 'slow' ? 'Lambat (55s)' : desaProfile.runningTextSpeed === 'fast' ? 'Cepat (22s)' : 'Sedang (35s)'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-900/90 flex items-center gap-3 overflow-hidden">
                  <div className="shrink-0 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-bold text-emerald-400">
                    AKTIF
                  </div>
                  <div className="flex-1 overflow-hidden whitespace-nowrap px-2">
                    <div
                      className="inline-block animate-marquee text-xs text-slate-100 font-medium"
                      style={{
                        animationDuration:
                          desaProfile.runningTextSpeed === 'slow' ? '55s' :
                          desaProfile.runningTextSpeed === 'fast' ? '22s' : '35s'
                      }}
                    >
                      {desaProfile.runningTextKiosk || 'Belum ada pesan running text yang diatur.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Text Display */}
              <div className="bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-200">Isi Pesan Running Text Lengkap:</div>
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-slate-200 text-xs leading-relaxed font-sans">
                  {desaProfile.runningTextKiosk || 'Belum ada pesan running text yang diatur.'}
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  * Untuk mengubah atau mengganti teks pengumuman ini, silakan masuk ke akun Administrator Desa dan klik tombol <strong>"Ubah Profil"</strong>.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer (Read-Only) */}
        <div className="p-4 sm:px-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistem Informasi Geografis Desa Beliti Jaya, Kec. Muara Kelingi</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-700"
          >
            Tutup Informasi
          </button>
        </div>

      </motion.div>
    </div>
  );
};

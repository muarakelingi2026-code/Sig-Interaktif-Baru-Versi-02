import React, { useState } from 'react';
import { Keluarga, Penduduk, User, RolePermissions } from '../types';
import { generateFamilyProfilePDF, generateResidentProfilePDF } from '../utils/pdfExport';
import { 
  Users, 
  Home, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  HeartHandshake, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Filter, 
  Layers,
  Phone,
  GraduationCap,
  Printer,
  FileText,
  X,
  Lock,
  Copy,
  Check,
  Calendar,
  IdCard
} from 'lucide-react';

interface DataManagementTableProps {
  keluargaList: Keluarga[];
  pendudukList: Penduduk[];
  onSelectKeluarga: (keluarga: Keluarga) => void;
  onAddNewKeluarga: () => void;
  onEditKeluarga: (keluarga: Keluarga) => void;
  onDeleteKeluarga: (keluarga: Keluarga) => void;
  currentUser: User;
  onOpenVillageProfile?: () => void;
  permissions?: RolePermissions;
}

export const DataManagementTable: React.FC<DataManagementTableProps> = ({
  keluargaList,
  pendudukList,
  onSelectKeluarga,
  onAddNewKeluarga,
  onEditKeluarga,
  onDeleteKeluarga,
  currentUser,
  onOpenVillageProfile,
  permissions
}) => {
  const isOperator = currentUser.role === 'operator';
  const isRestricted = isOperator && (permissions?.operatorOnlyAddKK ?? true);
  const allowEdit = !isRestricted || (permissions?.allowOperatorEditKK ?? false);
  const allowDelete = !isRestricted || (permissions?.allowOperatorDeleteKK ?? false);
  const allowExport = !isRestricted || (permissions?.allowOperatorExport ?? false);
  const allowVillageProfile = !isRestricted || (permissions?.allowOperatorVillageProfile ?? false);
  const [subTab, setSubTab] = useState<'keluarga' | 'penduduk'>('keluarga');
  const [search, setSearch] = useState('');
  const [dusunFilter, setDusunFilter] = useState('semua');
  const [bansosFilter, setBansosFilter] = useState('semua');
  const [selectedResident, setSelectedResident] = useState<Penduduk | null>(null);
  const [copiedNik, setCopiedNik] = useState(false);

  if (currentUser.role === 'operator_aset') {
    return (
      <div id="operator-aset-crud-restricted" className="p-12 bg-slate-900/90 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white">Akses Dibatasi: Menu Data Kependudukan</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Akun Operator Aset tidak diperbolehkan mengakses menu Data Kependudukan. Akun Anda difokuskan khusus pada pengelolaan Aset & Buku Inventaris Desa.
          </p>
        </div>
      </div>
    );
  }

  // Filtered families
  const filteredKeluarga = keluargaList.filter(k => {
    if (dusunFilter !== 'semua' && k.dusun !== dusunFilter) return false;
    if (bansosFilter === 'penerima' && !k.penerimaBansos) return false;
    if (bansosFilter === 'bukan' && k.penerimaBansos) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchKk = k.noKk.toLowerCase().includes(q);
      const matchKepala = k.namaKepalaKeluarga.toLowerCase().includes(q);
      const matchAlamat = k.alamat.toLowerCase().includes(q);
      const matchAnggota = k.anggotaKeluarga.some(a => a.nama.toLowerCase().includes(q) || a.nik.toLowerCase().includes(q));
      if (!matchKk && !matchKepala && !matchAlamat && !matchAnggota) return false;
    }
    return true;
  });

  // Filtered residents
  const filteredPenduduk = pendudukList.filter(p => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNik = p.nik.toLowerCase().includes(q);
      const matchNama = p.nama.toLowerCase().includes(q);
      const matchPekerjaan = p.pekerjaan.toLowerCase().includes(q);
      if (!matchNik && !matchNama && !matchPekerjaan) return false;
    }
    return true;
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div id="data-management-view" className="space-y-4">
      
      {/* Top Controls Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Sub-tab Switchers */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            id="subtab-btn-keluarga"
            onClick={() => setSubTab('keluarga')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subTab === 'keluarga'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Data Kartu Keluarga ({keluargaList.length} KK)</span>
          </button>

          <button
            type="button"
            id="subtab-btn-penduduk"
            onClick={() => setSubTab('penduduk')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subTab === 'penduduk'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Penduduk Perorangan ({pendudukList.length} Jiwa)</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenVillageProfile && allowVillageProfile && (
            <button
              type="button"
              id="btn-table-open-village-profile"
              onClick={onOpenVillageProfile}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <span>🏛️</span>
              <span>Profil & Perangkat Desa</span>
            </button>
          )}

          <button
            type="button"
            id="btn-add-new-family"
            onClick={onAddNewKeluarga}
            className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              isRestricted
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-950/60 ring-2 ring-emerald-400/60 scale-105'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data KK & Titik Baru</span>
            {isRestricted && (
              <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-slate-900/80 text-emerald-300 border border-emerald-400/40">
                Akses Utama
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Filter & Search Bar for Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={subTab === 'keluarga' ? 'Cari Nomor KK, Nama Kepala, Alamat...' : 'Cari NIK, Nama Penduduk, Pekerjaan...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {subTab === 'keluarga' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={dusunFilter}
              onChange={e => setDusunFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
            >
              <option value="semua">Semua Dusun</option>
              <option value="Dusun I">Dusun I</option>
              <option value="Dusun II">Dusun II</option>
              <option value="Dusun III">Dusun III</option>
              <option value="Dusun IV">Dusun IV</option>
            </select>

            <select
              value={bansosFilter}
              onChange={e => setBansosFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
            >
              <option value="semua">Semua Kategori</option>
              <option value="penerima">Penerima Bansos</option>
              <option value="bukan">Bukan Penerima</option>
            </select>
          </div>
        )}
      </div>

      {/* SUBTAB 1: TABEL DATA KARTU KELUARGA (KK) */}
      {subTab === 'keluarga' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Rumah & No KK</th>
                  <th className="py-3.5 px-4">Kepala Keluarga</th>
                  <th className="py-3.5 px-4">Alamat & Dusun</th>
                  <th className="py-3.5 px-4">Jumlah Anggota</th>
                  <th className="py-3.5 px-4">Status DTKS</th>
                  <th className="py-3.5 px-4">Bantuan Sosial</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredKeluarga.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      Tidak ada data keluarga yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredKeluarga.map(kel => (
                    <tr key={kel.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={kel.fotoRumah}
                            alt="Rumah"
                            className="w-12 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-mono font-bold text-white">{kel.noKk}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              GPS: {kel.koordinat.lat.toFixed(4)}, {kel.koordinat.lng.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{kel.namaKepalaKeluarga}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIK: {kel.nikKepala}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200">{kel.dusun} - RT {kel.rt}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{kel.alamat}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-emerald-300 border border-slate-700">
                            {kel.anggotaKeluarga.length} Jiwa
                          </span>
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            (kel.statusPenduduk || 'Tetap') === 'Sementara'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300/80 border-emerald-500/20'
                          }`}>
                            {kel.statusPenduduk || 'Tetap'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          kel.statusKesejahteraan.includes('Desil 1') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          kel.statusKesejahteraan.includes('Desil 2') ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                          kel.statusKesejahteraan.includes('Desil 3') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {kel.statusKesejahteraan.split(' ')[0]} {kel.statusKesejahteraan.split(' ')[1] || ''}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {kel.penerimaBansos ? (
                          <div>
                            <div className="text-emerald-400 font-bold font-mono text-[11px]">
                              {formatRupiah(kel.totalNominalBantuanBulanan)}/bln
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {kel.daftarBansos.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Non-Bansos</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {allowExport && (
                            <button
                              type="button"
                              onClick={() => generateFamilyProfilePDF(kel)}
                              className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg transition-all border border-emerald-500/30"
                              title="Cetak Profil Lengkap Kartu Keluarga (PDF)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectKeluarga(kel)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
                            title="Lihat Detail Lengkap & Peta"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          {allowEdit ? (
                            <button
                              type="button"
                              onClick={() => onEditKeluarga(kel)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
                              title="Edit Data Keluarga"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                          ) : (
                            <span 
                              className="p-1.5 bg-slate-900/40 text-slate-600 rounded-lg cursor-not-allowed opacity-40 inline-flex"
                              title="Akses Edit dibatasi untuk Administrator. Operator hanya dapat menambah data baru."
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {allowDelete ? (
                            <button
                              type="button"
                              onClick={() => onDeleteKeluarga(kel)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-all"
                              title={currentUser.role === 'admin' ? 'Hapus Data KK' : 'Ajukan Hapus ke Admin'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span 
                              className="p-1.5 bg-slate-900/40 text-slate-600 rounded-lg cursor-not-allowed opacity-40 inline-flex"
                              title="Akses Hapus dibatasi untuk Administrator"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TABEL DATA PENDUDUK PERORANGAN */}
      {subTab === 'penduduk' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Foto & NIK</th>
                  <th className="py-3.5 px-4">Nama Penduduk</th>
                  <th className="py-3.5 px-4">Gender & Usia</th>
                  <th className="py-3.5 px-4">Status Hubungan</th>
                  <th className="py-3.5 px-4">Pendidikan</th>
                  <th className="py-3.5 px-4">Pekerjaan & Gaji</th>
                  <th className="py-3.5 px-4">Status Vital</th>
                  <th className="py-3.5 px-4 text-right">Aksi & Profil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPenduduk.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      Tidak ada data penduduk yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPenduduk.map(p => {
                    const matchingKeluarga = keluargaList.find(k => k.noKk === p.noKk);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                              alt={p.nama}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                            <div className="font-mono text-slate-200 font-medium text-[11px]">{p.nik}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{p.nama}</div>
                          <div className="text-[10px] text-slate-400">Tempat Lahir: {p.tempatLahir}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{p.jenisKelamin}</div>
                          <div className="text-[10px] text-slate-400">{calculateAge(p.tanggalLahir)} Tahun</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-medium text-[10px]">
                            {p.statusKeluarga}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-200">{p.pendidikan}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200">{p.pekerjaan}</div>
                          <div className="text-emerald-400 font-mono font-semibold text-[10px]">
                            {p.penghasilanBulanan > 0 ? formatRupiah(p.penghasilanBulanan) : 'Tidak Berpenghasilan'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {p.statusKematian === 'Hidup' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold text-center">
                                Hidup
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold text-center">
                                Wafat
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-center border ${
                              (p.statusPenduduk || 'Tetap') === 'Sementara'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {p.statusPenduduk || 'Tetap'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => generateResidentProfilePDF(p, matchingKeluarga)}
                              className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 shadow-md shadow-emerald-950/30 border border-emerald-400/30 transition-all cursor-pointer"
                              title={`Cetak Surat Biodata PDF untuk ${p.nama}`}
                            >
                              <Printer className="w-3 h-3" />
                              <span className="hidden sm:inline">Cetak PDF</span>
                            </button>
                            <button
                              type="button"
                              id={`btn-view-data-penduduk-${p.nik}`}
                              onClick={() => setSelectedResident(p)}
                              className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              title={`Lihat Rincian Lengkap Biodata ${p.nama}`}
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>View Data</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => generateResidentProfilePDF(p, matchingKeluarga)}
                              className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 shadow-md shadow-emerald-950/30 border border-emerald-400/30 transition-all cursor-pointer"
                              title={`Cetak Surat Biodata PDF untuk ${p.nama}`}
                            >
                              <Printer className="w-3 h-3" />
                              <span className="hidden sm:inline">Cetak PDF</span>
                            </button>
                            {matchingKeluarga && (
                              <button
                                type="button"
                                onClick={() => onSelectKeluarga(matchingKeluarga)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg transition-all"
                                title="Buka Detail KK & Peta"
                              >
                                <Home className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INDIVIDUAL RESIDENT DETAIL PREVIEW MODAL (PROFESIONAL, TIDAK KAKU, NYAMAN DIBACA) */}
      {selectedResident && (
        <div 
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
          onClick={() => setSelectedResident(null)}
        >
          <div 
            className="relative max-w-2xl sm:max-w-3xl w-full bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal View Data */}
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
                    Detail Data: {selectedResident.nama}
                  </h3>
                </div>
              </div>

              {/* Tombol Close (X) */}
              <button
                type="button"
                id="btn-close-resident-view-data"
                onClick={() => setSelectedResident(null)}
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs active:scale-95"
                title="Tutup (Esc)"
                aria-label="Tutup Form View Data Penduduk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body View Data */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
              {/* Profil Atas */}
              <div className="bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-md flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <img
                  src={selectedResident.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                  alt={selectedResident.nama}
                  className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl object-cover border-2 border-slate-700 shadow-lg shrink-0 bg-slate-950"
                />
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs ${
                      selectedResident.statusKeluarga === 'Kepala Keluarga'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}>
                      {selectedResident.statusKeluarga}
                    </span>

                    {selectedResident.statusKematian === 'Meninggal' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Meninggal Dunia ({selectedResident.tanggalMeninggal || '-'})</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Status: Hidup</span>
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
                      {selectedResident.jenisKelamin}
                    </span>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      (selectedResident.statusPenduduk || 'Tetap') === 'Sementara'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {(selectedResident.statusPenduduk || 'Tetap') === 'Sementara' ? '⏳ Penduduk Sementara' : '✓ Penduduk Tetap'}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {selectedResident.nama}
                  </h2>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedResident.nik);
                        setCopiedNik(true);
                        setTimeout(() => setCopiedNik(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-emerald-300 transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Klik untuk menyalin NIK"
                    >
                      <span className="text-slate-400">NIK:</span>
                      <span className="font-bold">{selectedResident.nik}</span>
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
                      <span className="font-semibold text-slate-200">{selectedResident.noKk}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 4 Cardlet Rincian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Identitas Pribadi & Kelahiran</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Tempat & Tanggal Lahir:</span>
                      <span className="font-medium text-slate-200">{selectedResident.tempatLahir}, {selectedResident.tanggalLahir}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/50">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Jenis Kelamin:</span>
                        <span className="font-medium text-slate-200">{selectedResident.jenisKelamin}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Agama:</span>
                        <span className="font-medium text-slate-200">{selectedResident.agama || 'Islam'}</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-slate-800/50">
                      <span className="text-slate-400 text-[11px] block">Status Perkawinan:</span>
                      <span className="font-medium text-slate-200">{selectedResident.statusPerkawinan}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                    <GraduationCap className="w-4 h-4 text-teal-400" />
                    <span>Pendidikan & Pekerjaan</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Pendidikan Terakhir:</span>
                      <span className="font-semibold text-emerald-300">{selectedResident.pendidikan}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-800/50">
                      <span className="text-slate-400 text-[11px] block">Pekerjaan:</span>
                      <span className="font-medium text-slate-200">{selectedResident.pekerjaan}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-800/50">
                      <span className="text-slate-400 text-[11px] block">Penghasilan Bulanan:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {selectedResident.penghasilanBulanan > 0 ? formatRupiah(selectedResident.penghasilanBulanan) : 'Tidak Berpenghasilan'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                    <HeartHandshake className="w-4 h-4 text-rose-400" />
                    <span>Jaminan Sosial & Catatan Khusus</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 text-[11px] block mb-1">Bantuan Sosial Pribadi:</span>
                      {selectedResident.bantuanPribadi && selectedResident.bantuanPribadi.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedResident.bantuanPribadi.map((b, bi) => (
                            <span key={bi} className="px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-medium">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Tidak memiliki bantuan pribadi.</span>
                      )}
                    </div>
                    {selectedResident.disabilitas && (
                      <div className="pt-1 border-t border-slate-800/50">
                        <span className="text-slate-400 text-[11px] block">Disabilitas:</span>
                        <span className="text-amber-300 font-medium">{selectedResident.disabilitas}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>Kontak & Komunikasi</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Nomor Telepon / WhatsApp:</span>
                      {selectedResident.nomorTelepon ? (
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="font-semibold text-emerald-300 font-mono">
                            {selectedResident.nomorTelepon}
                          </span>
                          <a
                            href={`https://wa.me/${selectedResident.nomorTelepon.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-md text-[10px] font-semibold border border-emerald-500/30 inline-flex items-center gap-1 transition-all"
                          >
                            Hubungi WA
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Tidak tercatat</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sistem Informasi Geografis Kependudukan Desa</span>
              </div>
              <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const matchK = keluargaList.find(k => k.noKk === selectedResident.noKk);
                    generateResidentProfilePDF(selectedResident, matchK);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer border border-emerald-400/30"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Profil PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedResident(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer border border-slate-700 flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

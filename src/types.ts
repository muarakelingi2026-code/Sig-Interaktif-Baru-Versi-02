export type UserRole = 'admin' | 'operator' | 'operator_aset';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  jabatan: string;
  avatar: string;
}

export type JenisKelamin = 'Laki-Laki' | 'Perempuan';
export type StatusPerkawinan = 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';
export type StatusHubunganKeluarga = 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain';
export type JenjangPendidikan = 'Tidak/Belum Sekolah' | 'SD' | 'SMP' | 'SMA' | 'Diploma (D1-D3)' | 'S1/Kuliah' | 'S2/S3';
export type StatusKematian = 'Hidup' | 'Meninggal';
export type StatusPenduduk = 'Tetap' | 'Sementara';
export type JenisBantuanSosial = 'PKH' | 'BPNT/Sembako' | 'BLT-Dana Desa' | 'Bansos Beras (PBP)' | 'PIP (Pendidikan)' | 'KIS/PBI-JK' | 'Tidak Menerima';
export type StatusKesejahteraan = 'Desil 1 (Sangat Miskin)' | 'Desil 2 (Miskin)' | 'Desil 3 (Hampir Miskin)' | 'Desil 4 (Rentan Miskin)' | 'Non-DTKS (Mampu)';
export type DusunWilayah = 'Dusun I' | 'Dusun II' | 'Dusun III' | 'Dusun IV';

export interface PerangkatDesa {
  id: string;
  nama: string;
  jabatan: string;
  nip?: string;
  nik?: string;
  noHp?: string;
  email?: string;
  foto?: string;
  kategori: 'Kepala Desa' | 'Sekretaris Desa' | 'Kasi' | 'Kaur' | 'Kepala Dusun' | 'BPD' | 'Lainnya';
  periode?: string;
  tugasPokok?: string;
}

export interface AparaturDesaItem extends PerangkatDesa {
  sambutan?: string;
  tingkatJabatan?: 'Pimpinan Utama' | 'Sekretariat' | 'Pelaksana Teknis' | 'Pelaksana Kewilayahan' | 'Badan Permusyawaratan';
}

export interface DesaProfile {
  namaDesa: string;
  kodeDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  alamatKantor: string;
  emailDesa: string;
  teleponDesa: string;
  logoDesa?: string;
  luasWilayahHa: number;
  luasWilayahKm2: number;
  kepalaDesa: {
    nama: string;
    nip?: string;
    nik?: string;
    noHp?: string;
    periode?: string;
    foto?: string;
    sambutan?: string;
  };
  sekretarisDesa: {
    nama: string;
    nip?: string;
    nik?: string;
    noHp?: string;
    periode?: string;
    foto?: string;
  };
  perangkatLainnya: PerangkatDesa[];
  batasWilayah: {
    utara: string;
    selatan: string;
    timur: string;
    barat: string;
  };
  visi?: string;
  misi?: string[];
  runningTextKiosk?: string;
  runningTextSpeed?: 'slow' | 'normal' | 'fast';
  updatedAt?: string;
  lastModifiedBy?: string;
}

export interface Penduduk {
  id: string;
  nik: string;
  noKk: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: JenisKelamin;
  agama: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';
  statusPerkawinan: StatusPerkawinan;
  statusKeluarga: StatusHubunganKeluarga;
  pendidikan: JenjangPendidikan;
  pekerjaan: string;
  penghasilanBulanan: number;
  statusKematian: StatusKematian;
  statusPenduduk?: StatusPenduduk;
  tanggalMeninggal?: string;
  nomorTelepon?: string;
  foto: string;
  bantuanPribadi?: string[];
  disabilitas?: string;
}

export interface KondisiRumah {
  tipeBangunan: 'Permanen' | 'Semi Permanen' | 'Panggung Kayu' | 'Bambu/Papan';
  luasBangunanM2: number;
  sumberAirMinum: 'Sumur Bor' | 'Sumur Gali' | 'Mata Air' | 'Sungai Beliti' | 'PDAM/Depot';
  dayaListrik: '450 VA (Subsidi)' | '900 VA (Subsidi)' | '900 VA (Non Subsidi)' | '1300 VA+' | 'Tanpa Listrik';
  statusKepemilikan: 'Milik Sendiri' | 'Menumpang / Waris' | 'Sewa / Kontrak';
  kondisiLantai: 'Keramik' | 'Semen' | 'Papan Kayu' | 'Tanah';
  kondisiDinding: 'Tembok Bata' | 'Papan/Kayu' | 'Anyaman Bambu';
  fasilitasJamban: 'Milik Sendiri (Leher Angsa)' | 'Jamban Cemplung' | 'MCK Umum' | 'Tidak Ada';
}

export interface Keluarga {
  id: string;
  noKk: string;
  namaKepalaKeluarga: string;
  nikKepala: string;
  alamat: string;
  dusun: DusunWilayah;
  rt: string;
  rw: string;
  koordinat: {
    lat: number;
    lng: number;
  };
  statusKesejahteraan: StatusKesejahteraan;
  statusPenduduk?: StatusPenduduk;
  penerimaBansos: boolean;
  daftarBansos: JenisBantuanSosial[];
  totalNominalBantuanBulanan: number;
  fotoRumah: string;
  kondisiRumah: KondisiRumah;
  anggotaKeluarga: Penduduk[];
  catatanKhusus?: string;
  createdAt: string;
  updatedAt: string;
  lastModifiedBy: string;
  statusVerifikasi: 'verified' | 'pending_approval' | 'rejected';
}

export interface VerificationNotification {
  id: string;
  type: 'create' | 'update' | 'delete';
  targetType: 'keluarga' | 'penduduk';
  targetId: string;
  targetNoKk?: string;
  targetName: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  timestamp: string;
  summary: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  previousData?: Partial<Keluarga>;
  proposedData?: Partial<Keluarga>;
}

export interface FilterOptions {
  searchQuery: string;
  dusun: string;
  statusBansos: 'semua' | 'penerima' | 'bukan_penerima';
  jenisBansos: string;
  statusKesejahteraan: string;
  jenisKelamin: string;
  statusKematian: string;
  statusPerkawinan: string;
  pendidikan: string;
  minPenghasilan: number;
  maxPenghasilan: number;
}

export interface RolePermissions {
  operatorOnlyAddKK: boolean; // Jika aktif, Operator HANYA dapat mengakses Tombol Tambah data KK & Titik Baru
  allowOperatorAnalytics: boolean;
  allowOperatorExport: boolean;
  allowOperatorEditKK: boolean;
  allowOperatorDeleteKK: boolean;
  allowOperatorVillageProfile: boolean;
  allowOnlyAdminAndOperatorAsetAdd?: boolean; // Fitur Tambah Aset hanya bisa diakses admin dan operator aset
  requirePasswordForBukuInventaris?: boolean; // Meminta password operator aset atau admin saat membuka buku inventaris
}

export type AuthActionType = 'LOGIN' | 'LOGOUT';

export interface AuthLogEntry {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userRole: UserRole;
  userJabatan: string;
  userAvatar?: string;
  action: AuthActionType;
  timestamp: string; // ISO string e.g. "2026-09-10T08:30:00.000Z"
  ipAddress?: string;
  device?: string;
  notes?: string;
}

// ── MANAJEMEN ASET DESA (Permendagri No. 1/2016) ──
export type KategoriAset = 'pembangunan' | 'non_pembangunan';
export type KondisiAset = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
export type StatusPemanfaatanAset = 'Digunakan Aktif' | 'Disewakan / Kerjasama' | 'Dalam Pemeliharaan' | 'Cadangan';
export type SumberDanaAset = 
  | 'Dana Desa (APBN)' 
  | 'Alokasi Dana Desa (ADD)' 
  | 'Bantuan Keuangan Provinsi' 
  | 'Pendapatan Asli Desa (PADes)' 
  | 'Hibah / Swadaya Masyarakat' 
  | 'Asal Usul Desa'
  | 'Penyertaan Modal BUMDes';

export interface AsetDesa {
  id: string;
  namaAset: string;
  kodeRegister: string; // Contoh: KIB-C/001/BLT/2022
  kategori: KategoriAset; // 'pembangunan' (fisik/konstruksi) vs 'non_pembangunan' (tanah kas, alami, kendaraan, mesin)
  subKategori: string; // misal: 'Gedung Publik', 'Jalan & Jembatan', 'Tanah Kas Desa', 'Kendaraan Siaga', 'Peralatan/Mesin', 'Embung Alami'
  tahunPengadaan: number;
  sumberDana: SumberDanaAset;
  nilaiPerolehan: number; // Nilai rupiah
  kondisi: KondisiAset;
  dusun: DusunWilayah;
  koordinat: {
    lat: number;
    lng: number;
  };
  luasAtauVolume?: string; // misal: '450 m²', '1.200 meter', '1 Unit Mobil', '2,4 Hektar'
  penanggungJawab: string;
  statusPemanfaatan: StatusPemanfaatanAset;
  keterangan?: string;
  foto: string; // Foto utama (tampak depan/sampul)
  fotoList?: string[]; // Minimal 4 link foto dokumentasi aset
  createdAt?: string;
  updatedAt?: string;
}


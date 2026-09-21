import React, { useState, useMemo } from 'react';
import { Keluarga, Penduduk, User, DesaProfile } from '../types';
import { StorageService } from '../services/storageService';
import { drawOfficialKopSurat } from '../utils/pdfExport';
import { compressImage } from '../utils/imageUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import CryptoJS from 'crypto-js';
import { 
  FileText, 
  FileSpreadsheet, 
  Lock, 
  Download, 
  CheckCircle, 
  ShieldCheck, 
  Calendar, 
  Filter, 
  Building2, 
  AlertCircle,
  Key,
  Printer,
  UserCheck,
  Upload,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Users,
  GraduationCap,
  Heart,
  UserX,
  Eye
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  keluargaList: Keluarga[];
  pendudukList: Penduduk[];
  currentUser: User;
  desaProfile?: DesaProfile;
  onUpdateLogo?: (newLogo: string) => void;
  onOpenVillageProfile?: () => void;
  onBackToMap?: () => void;
}

// Standard list of bansos programs in Beliti Jaya
const STANDARD_BANSOS_PROGRAMS = [
  { id: 'PKH', label: 'Program Keluarga Harapan (PKH)', shortLabel: 'PKH' },
  { id: 'BPNT/Sembako', label: 'BPNT / Program Sembako', shortLabel: 'BPNT' },
  { id: 'BLT-Dana Desa', label: 'BLT-Dana Desa (BLT-DD)', shortLabel: 'BLT-DD' },
  { id: 'Bansos Beras (PBP)', label: 'Bansos Beras (PBP / Pangan)', shortLabel: 'Beras PBP' },
  { id: 'PIP (Pendidikan)', label: 'PIP (Program Indonesia Pintar)', shortLabel: 'PIP' },
  { id: 'KIS/PBI-JK', label: 'KIS / PBI-JK (Jaminan Kesehatan)', shortLabel: 'KIS / PBI' },
];

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  keluargaList,
  pendudukList,
  currentUser,
  desaProfile: propDesaProfile,
  onUpdateLogo,
  onOpenVillageProfile,
  onBackToMap
}) => {
  const [reportType, setReportType] = useState<'pdf' | 'excel' | 'encrypted'>('pdf');
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [filterDusun, setFilterDusun] = useState('semua');
  const [filterBansos, setFilterBansos] = useState('semua');
  const [encryptionPassword, setEncryptionPassword] = useState('BelitiJaya2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoUploadMsg, setLogoUploadMsg] = useState<string | null>(null);

  const handleProcessLogoChange = async (file: File) => {
    try {
      setLogoUploadMsg('Memproses logo desa...');
      const compressed = await compressImage(file, 400, 400, 0.9);
      if (onUpdateLogo) {
        onUpdateLogo(compressed);
      } else {
        const currentProf = StorageService.getDesaProfile();
        StorageService.saveDesaProfile({ ...currentProf, logoDesa: compressed });
      }
      setLogoUploadMsg('Logo resmi desa berhasil ditautkan ke kop surat!');
      setTimeout(() => setLogoUploadMsg(null), 3500);
    } catch (e) {
      alert('Gagal mengunggah logo: ' + e);
      setLogoUploadMsg(null);
    }
  };

  // Dynamic aggregation of all known programs from data (Hook called unconditionally)
  const allKnownPrograms = useMemo(() => {
    const map = new Map<string, { id: string; label: string; shortLabel: string; count: number }>();
    
    STANDARD_BANSOS_PROGRAMS.forEach(p => {
      map.set(p.id, { ...p, count: 0 });
    });

    keluargaList.forEach(k => {
      if (k.penerimaBansos && Array.isArray(k.daftarBansos)) {
        k.daftarBansos.forEach(b => {
          if (!b || b === 'Tidak Menerima') return;
          const found = Array.from(map.values()).find(item => 
            item.id.toLowerCase() === b.toLowerCase() || 
            item.shortLabel.toLowerCase() === b.toLowerCase()
          );
          if (found) {
            found.count += 1;
          } else {
            map.set(b, { id: b, label: b, shortLabel: b, count: 1 });
          }
        });
      }
    });

    return Array.from(map.values());
  }, [keluargaList]);

  if (isOpen === false) return null;

  if (currentUser.role === 'operator_aset') {
    return (
      <div id="operator-aset-export-restricted" className="p-12 bg-slate-900/90 border border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white">Akses Dibatasi: Menu Cetak & Enkripsi</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Akun Operator Aset tidak diperbolehkan mengakses menu Cetak & Enkripsi Laporan Kependudukan. Akun Anda dikhususkan untuk pengelolaan Aset & Buku Inventaris Desa.
          </p>
        </div>
      </div>
    );
  }

  // Active village profile from props or storage
  const profile: DesaProfile = propDesaProfile || StorageService.getDesaProfile();
  const kepalaDesa = profile.kepalaDesa;

  // Find Kaur Pelayanan recorded in the village apparatus
  const kaurPelayanan = profile.perangkatLainnya.find(p => 
    p.jabatan.toLowerCase().includes('kaur pelayanan') || 
    p.jabatan.toLowerCase().includes('pelayanan')
  ) || profile.perangkatLainnya.find(p => p.kategori === 'Kaur') || {
    id: 'prk_default',
    nama: 'Dedi Kurniawan, S.AP',
    jabatan: 'Kaur Pelayanan',
    nip: '19910825 201701 1 002',
    nik: '1631052508910001',
    noHp: '0821-8901-2345',
    kategori: 'Kaur',
    periode: '2021 - 2027',
    tugasPokok: 'Layanan administrasi kependudukan & Operator GIS Desa'
  };

  // Base list of all residents flattened with family details for comprehensive reporting
  const basePendudukWithFamily = useMemo(() => {
    const list: (Penduduk & { 
      noKk: string; 
      dusun: string; 
      rt: string; 
      rw: string; 
      alamat: string;
      namaKepalaKeluarga: string; 
      penerimaBansos: boolean; 
      daftarBansos: string[];
      statusKesejahteraan: string;
    })[] = [];
    
    keluargaList.forEach(k => {
      k.anggotaKeluarga.forEach(p => {
        list.push({
          ...p,
          noKk: k.noKk,
          dusun: k.dusun,
          rt: k.rt,
          rw: k.rw,
          alamat: k.alamat,
          namaKepalaKeluarga: k.namaKepalaKeluarga,
          penerimaBansos: k.penerimaBansos,
          daftarBansos: k.daftarBansos || [],
          statusKesejahteraan: k.statusKesejahteraan
        });
      });
    });
    return list;
  }, [keluargaList]);

  // Age calculation helper
  const calculateAge = (tglLahir?: string): string => {
    if (!tglLahir) return '-';
    const birth = new Date(tglLahir);
    if (isNaN(birth.getTime())) return '-';
    const diffMs = Date.now() - birth.getTime();
    const age = Math.floor(diffMs / (365.25 * 24 * 3600 * 1000));
    return `${age} thn`;
  };

  // Helper matcher for resident-level categories
  const matchResidentCategory = (p: Penduduk, filter: string): boolean => {
    if (filter === 'semua') return true;
    if (filter === 'penduduk_hidup') return p.statusKematian === 'Hidup';
    if (filter === 'penduduk_meninggal') return p.statusKematian === 'Meninggal';
    if (filter === 'penduduk_kawin') return p.statusPerkawinan === 'Kawin';
    if (filter === 'penduduk_cerai') return p.statusPerkawinan === 'Cerai Hidup' || p.statusPerkawinan === 'Cerai Mati';

    // Kelompok Pendidikan
    if (filter === 'pendidikan_tinggi') {
      const edu = (p.pendidikan || '').toLowerCase();
      return edu.includes('diploma') || edu.includes('s1') || edu.includes('s2') || edu.includes('s3') || edu.includes('kuliah') || edu.includes('d1') || edu.includes('d2') || edu.includes('d3');
    }
    if (filter === 'pendidikan_sma') {
      const edu = (p.pendidikan || '').toLowerCase();
      return edu === 'sma' || edu.includes('sma') || edu.includes('smk') || edu.includes('aliyah') || edu.includes('sederajat');
    }
    if (filter === 'pendidikan_smp') {
      const edu = (p.pendidikan || '').toLowerCase();
      return edu === 'smp' || edu.includes('smp') || edu.includes('mts');
    }
    if (filter === 'pendidikan_sd') {
      const edu = (p.pendidikan || '').toLowerCase();
      return edu === 'sd' || edu.includes('sd') || edu.includes('mi');
    }
    if (filter === 'pendidikan_tidak_sekolah') {
      const edu = (p.pendidikan || '').toLowerCase();
      return edu.includes('tidak') || edu.includes('belum') || edu.includes('putus');
    }

    return true;
  };

  const isResidentFilter = useMemo(() => {
    return [
      'penduduk_hidup',
      'penduduk_meninggal',
      'penduduk_kawin',
      'penduduk_cerai',
      'pendidikan_tinggi',
      'pendidikan_sma',
      'pendidikan_smp',
      'pendidikan_sd',
      'pendidikan_tidak_sekolah'
    ].includes(filterBansos);
  }, [filterBansos]);

  // Real-time counter for category badges
  const categoryCounts = useMemo(() => {
    const pool = basePendudukWithFamily.filter(p => filterDusun === 'semua' || p.dusun === filterDusun);
    const poolKK = keluargaList.filter(k => filterDusun === 'semua' || k.dusun === filterDusun);

    return {
      semua: pool.length,
      penduduk_hidup: pool.filter(p => p.statusKematian === 'Hidup').length,
      penduduk_meninggal: pool.filter(p => p.statusKematian === 'Meninggal').length,
      penduduk_kawin: pool.filter(p => p.statusPerkawinan === 'Kawin').length,
      penduduk_cerai: pool.filter(p => p.statusPerkawinan === 'Cerai Hidup' || p.statusPerkawinan === 'Cerai Mati').length,
      pendidikan_tinggi: pool.filter(p => matchResidentCategory(p, 'pendidikan_tinggi')).length,
      pendidikan_sma: pool.filter(p => matchResidentCategory(p, 'pendidikan_sma')).length,
      pendidikan_smp: pool.filter(p => matchResidentCategory(p, 'pendidikan_smp')).length,
      pendidikan_sd: pool.filter(p => matchResidentCategory(p, 'pendidikan_sd')).length,
      pendidikan_tidak_sekolah: pool.filter(p => matchResidentCategory(p, 'pendidikan_tidak_sekolah')).length,
      penerima: poolKK.filter(k => k.penerimaBansos).length,
      non_penerima: poolKK.filter(k => !k.penerimaBansos).length
    };
  }, [basePendudukWithFamily, keluargaList, filterDusun]);

  // Filtered residents list matching selected criteria
  const exportPenduduk = useMemo(() => {
    return basePendudukWithFamily.filter(p => {
      if (filterDusun !== 'semua' && p.dusun !== filterDusun) return false;

      if (isResidentFilter) {
        return matchResidentCategory(p, filterBansos);
      } else if (filterBansos === 'penerima') {
        return p.penerimaBansos;
      } else if (filterBansos === 'non_penerima') {
        return !p.penerimaBansos;
      } else if (filterBansos !== 'semua') {
        // Specific bansos program
        return p.penerimaBansos && p.daftarBansos.some(b => 
          b.toLowerCase().trim() === filterBansos.toLowerCase().trim() ||
          b.toLowerCase().includes(filterBansos.toLowerCase()) ||
          filterBansos.toLowerCase().includes(b.toLowerCase())
        );
      }
      return true;
    });
  }, [basePendudukWithFamily, filterDusun, filterBansos, isResidentFilter]);

  // Filtered families list matching selected criteria
  const exportKeluarga = useMemo(() => {
    return keluargaList.filter(k => {
      if (filterDusun !== 'semua' && k.dusun !== filterDusun) return false;

      if (isResidentFilter) {
        // Family included if at least one member matches the resident filter
        return k.anggotaKeluarga.some(p => matchResidentCategory(p, filterBansos));
      } else if (filterBansos === 'penerima') {
        return k.penerimaBansos;
      } else if (filterBansos === 'non_penerima') {
        return !k.penerimaBansos;
      } else if (filterBansos !== 'semua') {
        if (!k.penerimaBansos || !Array.isArray(k.daftarBansos)) return false;
        return k.daftarBansos.some(b => 
          b.toLowerCase().trim() === filterBansos.toLowerCase().trim() ||
          b.toLowerCase().includes(filterBansos.toLowerCase()) ||
          filterBansos.toLowerCase().includes(b.toLowerCase())
        );
      }
      return true;
    });
  }, [keluargaList, filterDusun, filterBansos, isResidentFilter]);

  const getBansosFilterLabel = () => {
    if (filterBansos === 'semua') return 'Semua Penduduk (Seluruh Data Warga)';
    if (filterBansos === 'penduduk_hidup') return 'Kelompok Penduduk Hidup';
    if (filterBansos === 'penduduk_meninggal') return 'Kelompok Penduduk Meninggal Dunia';
    if (filterBansos === 'penduduk_kawin') return 'Kelompok Penduduk Status Kawin';
    if (filterBansos === 'penduduk_cerai') return 'Kelompok Penduduk Status Cerai (Hidup/Mati)';
    if (filterBansos === 'pendidikan_tinggi') return 'Pendidikan: Diploma / S1 / S2 / S3';
    if (filterBansos === 'pendidikan_sma') return 'Pendidikan: SMA / SMK / Sederajat';
    if (filterBansos === 'pendidikan_smp') return 'Pendidikan: SMP / MTs / Sederajat';
    if (filterBansos === 'pendidikan_sd') return 'Pendidikan: SD / MI / Sederajat';
    if (filterBansos === 'pendidikan_tidak_sekolah') return 'Pendidikan: Belum / Tidak Sekolah';
    if (filterBansos === 'penerima') return 'Semua Penerima Bantuan Sosial (Gabungan)';
    if (filterBansos === 'non_penerima') return 'Bukan Penerima Bansos (Keluarga Mampu)';
    const prog = allKnownPrograms.find(p => p.id === filterBansos);
    return prog ? `Khusus Penerima ${prog.label}` : `Khusus ${filterBansos}`;
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Generate PDF with Official Government Kop Surat & Rasterized Village Logo
  const generatePDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Official Government Kop Surat Header with Village Logo
    await drawOfficialKopSurat(doc, 'landscape', profile);

    // Title of the Report adjusted dynamically based on filter
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);

    let reportTitle = `LAPORAN REKAPITULASI DATA KEPENDUDUKAN DESA ${profile.namaDesa.toUpperCase()}`;
    if (filterBansos === 'penduduk_hidup') {
      reportTitle = `DAFTAR PENDUDUK STATUS HIDUP DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'penduduk_meninggal') {
      reportTitle = `DAFTAR PENDUDUK MENINGGAL DUNIA DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'penduduk_kawin') {
      reportTitle = `DAFTAR PENDUDUK STATUS KAWIN DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'penduduk_cerai') {
      reportTitle = `DAFTAR PENDUDUK STATUS CERAI (PERCERAIAN) DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'pendidikan_tinggi') {
      reportTitle = `DAFTAR PENDUDUK PENDIDIKAN DIPLOMA / S1 / S2 / S3 DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'pendidikan_sma') {
      reportTitle = `DAFTAR PENDUDUK PENDIDIKAN SMA / SEDERAJAT DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'pendidikan_smp') {
      reportTitle = `DAFTAR PENDUDUK PENDIDIKAN SMP / SEDERAJAT DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'pendidikan_sd') {
      reportTitle = `DAFTAR PENDUDUK PENDIDIKAN SD / SEDERAJAT DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'pendidikan_tidak_sekolah') {
      reportTitle = `DAFTAR PENDUDUK BELUM / TIDAK SEKOLAH DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'penerima') {
      reportTitle = `DAFTAR KELUARGA PENERIMA BANTUAN SOSIAL DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos === 'non_penerima') {
      reportTitle = `DAFTAR KELUARGA NON-PENERIMA BANTUAN SOSIAL (MAMPU) DESA ${profile.namaDesa.toUpperCase()}`;
    } else if (filterBansos !== 'semua') {
      reportTitle = `DAFTAR PENERIMA BANTUAN SOSIAL ${filterBansos.toUpperCase()} DESA ${profile.namaDesa.toUpperCase()}`;
    }

    doc.text(reportTitle, 148, 43, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);

    const totalSummaryText = isResidentFilter 
      ? `Total: ${exportPenduduk.length} Jiwa (${exportKeluarga.length} KK Terkait)`
      : `Total: ${exportKeluarga.length} KK (${exportPenduduk.length} Jiwa)`;

    const subtitleFilter = `Periode: ${selectedMonth} | Dusun: ${filterDusun === 'semua' ? 'Seluruh Dusun' : filterDusun} | Kategori: ${getBansosFilterLabel()} | ${totalSummaryText}`;
    doc.text(subtitleFilter, 148, 48, { align: 'center' });

    // Dynamic table columns based on filter type
    let headRow: string[] = [];
    let tableData: any[][] = [];

    if (filterBansos === 'penduduk_meninggal') {
      headRow = ['No', 'NIK', 'Nama Lengkap', 'L/P', 'Usia', 'Alamat / Dusun', 'No KK', 'Tgl Meninggal', 'Status Kawin', 'Pekerjaan Terakhir'];
      tableData = exportPenduduk.map((p, idx) => [
        idx + 1,
        p.nik,
        p.nama,
        p.jenisKelamin === 'Laki-Laki' ? 'L' : 'P',
        calculateAge(p.tanggalLahir),
        `${p.dusun} RT ${p.rt}`,
        p.noKk,
        p.tanggalMeninggal || 'Tercatat Meninggal',
        p.statusPerkawinan,
        p.pekerjaan
      ]);
    } else if (filterBansos.startsWith('pendidikan_')) {
      headRow = ['No', 'NIK', 'Nama Lengkap', 'L/P', 'Usia', 'Pendidikan Terakhir', 'Pekerjaan', 'Alamat / Dusun', 'No KK', 'Status'];
      tableData = exportPenduduk.map((p, idx) => [
        idx + 1,
        p.nik,
        p.nama,
        p.jenisKelamin === 'Laki-Laki' ? 'L' : 'P',
        calculateAge(p.tanggalLahir),
        p.pendidikan,
        p.pekerjaan,
        `${p.dusun} RT ${p.rt}`,
        p.noKk,
        p.statusKematian
      ]);
    } else if (filterBansos === 'penduduk_cerai' || filterBansos === 'penduduk_kawin') {
      headRow = ['No', 'NIK', 'Nama Lengkap', 'L/P', 'Usia', 'Status Perkawinan', 'Pendidikan', 'Pekerjaan', 'Alamat / Dusun', 'No KK'];
      tableData = exportPenduduk.map((p, idx) => [
        idx + 1,
        p.nik,
        p.nama,
        p.jenisKelamin === 'Laki-Laki' ? 'L' : 'P',
        calculateAge(p.tanggalLahir),
        p.statusPerkawinan,
        p.pendidikan,
        p.pekerjaan,
        `${p.dusun} RT ${p.rt}`,
        p.noKk
      ]);
    } else if (filterBansos === 'penduduk_hidup') {
      headRow = ['No', 'NIK', 'Nama Lengkap', 'L/P', 'Usia', 'Status Kawin', 'Pendidikan', 'Pekerjaan', 'Alamat / Dusun', 'No KK'];
      tableData = exportPenduduk.map((p, idx) => [
        idx + 1,
        p.nik,
        p.nama,
        p.jenisKelamin === 'Laki-Laki' ? 'L' : 'P',
        calculateAge(p.tanggalLahir),
        p.statusPerkawinan,
        p.pendidikan,
        p.pekerjaan,
        `${p.dusun} RT ${p.rt}`,
        p.noKk
      ]);
    } else {
      // General population & bansos report format (Family / KK based)
      headRow = ['No', 'No KK', 'Nama Kepala Keluarga', 'NIK Kepala', 'Alamat / Dusun', 'Anggota', 'Status DTKS', 'Program Bansos', 'Nominal/Bln'];
      tableData = exportKeluarga.map((k, idx) => [
        idx + 1,
        k.noKk,
        k.namaKepalaKeluarga,
        k.nikKepala,
        `${k.dusun} RT ${k.rt}`,
        `${k.anggotaKeluarga.length} Jiwa`,
        k.statusKesejahteraan.split(' ')[0] + ' ' + (k.statusKesejahteraan.split(' ')[1] || ''),
        k.penerimaBansos ? k.daftarBansos.join(', ') : 'Non-Bansos',
        k.totalNominalBantuanBulanan > 0 ? formatRupiah(k.totalNominalBantuanBulanan) : '-'
      ]);
    }

    autoTable(doc, {
      startY: 53,
      head: [headRow],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // Signatures footer if space allows, or on new page
    let signY = finalY + 15;
    if (signY > 165) {
      doc.addPage();
      signY = 30;
    }

    const todayFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Left Column: Kepala Desa (Mengetahui)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Mengetahui,', 40, signY);
    doc.text(`Kepala Desa ${profile.namaDesa}`, 40, signY + 5);

    // Right Column: Kaur Pelayanan (Administrator / Operator GIS Desa)
    doc.text(`${profile.namaDesa}, ${todayFormatted}`, 200, signY);
    doc.text('Administrator / Operator GIS Desa', 200, signY + 5);
    doc.text(`(${kaurPelayanan.jabatan})`, 200, signY + 9);

    // Signatures names
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(kepalaDesa.nama.toUpperCase(), 40, signY + 28);
    doc.text(kaurPelayanan.nama.toUpperCase(), 200, signY + 28);

    // Identification details (NIP/NIK)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(kepalaDesa.nip ? `NIP. ${kepalaDesa.nip}` : `NIK. ${kepalaDesa.nik || '-'}`, 40, signY + 32);
    doc.text(kaurPelayanan.nip ? `NIP. ${kaurPelayanan.nip}` : `NIK. ${kaurPelayanan.nik || '-'}`, 200, signY + 32);

    const cleanFilterName = filterBansos !== 'semua' ? `_${filterBansos.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    doc.save(`Laporan_Kependudukan_${profile.namaDesa.replace(/\s+/g, '_')}${cleanFilterName}_${selectedMonth.replace(' ', '_')}.pdf`);
  };

  // Generate Excel
  const generateExcel = () => {
    const wb = XLSX.utils.book_new();

    if (isResidentFilter) {
      // Sheet 1: Data Penduduk Terfilter
      const residentRows = exportPenduduk.map((p, idx) => ({
        'No': idx + 1,
        'NIK': p.nik,
        'Nama Lengkap': p.nama,
        'Jenis Kelamin': p.jenisKelamin,
        'Tempat Lahir': p.tempatLahir,
        'Tanggal Lahir': p.tanggalLahir,
        'Usia': calculateAge(p.tanggalLahir),
        'Agama': p.agama,
        'Status Hubungan': p.statusKeluarga,
        'Status Perkawinan': p.statusPerkawinan,
        'Pendidikan Terakhir': p.pendidikan,
        'Pekerjaan': p.pekerjaan,
        'Penghasilan (Rp/Bulan)': p.penghasilanBulanan,
        'Status Kematian': p.statusKematian,
        'Tanggal Meninggal': p.tanggalMeninggal || '-',
        'No KK': p.noKk,
        'Nama Kepala Keluarga': p.namaKepalaKeluarga,
        'Dusun': p.dusun,
        'RT': p.rt,
        'RW': p.rw,
        'Status Bansos Keluarga': p.penerimaBansos ? 'Penerima (' + p.daftarBansos.join(', ') + ')' : 'Non-Bansos'
      }));
      const ws1 = XLSX.utils.json_to_sheet(residentRows);
      XLSX.utils.book_append_sheet(wb, ws1, 'Data Penduduk');

      // Sheet 2: Data Keluarga Terkait
      const keluargaSheetData = exportKeluarga.map((k, idx) => ({
        'No': idx + 1,
        'No KK': k.noKk,
        'Nama Kepala Keluarga': k.namaKepalaKeluarga,
        'NIK Kepala Keluarga': k.nikKepala,
        'Alamat': k.alamat,
        'Dusun': k.dusun,
        'RT': k.rt,
        'RW': k.rw,
        'Jumlah Jiwa': k.anggotaKeluarga.length,
        'Kesejahteraan DTKS': k.statusKesejahteraan,
        'Penerima Bansos': k.penerimaBansos ? 'Ya' : 'Tidak',
        'Program Bansos': k.daftarBansos.join(', ')
      }));
      const ws2 = XLSX.utils.json_to_sheet(keluargaSheetData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Keluarga Terkait');
    } else {
      // Sheet 1: Data Keluarga
      const keluargaSheetData = exportKeluarga.map((k, idx) => ({
        'No': idx + 1,
        'No Kartu Keluarga': k.noKk,
        'Nama Kepala Keluarga': k.namaKepalaKeluarga,
        'NIK Kepala Keluarga': k.nikKepala,
        'Alamat': k.alamat,
        'Dusun': k.dusun,
        'RT': k.rt,
        'RW': k.rw,
        'Latitude': k.koordinat.lat,
        'Longitude': k.koordinat.lng,
        'Jumlah Jiwa': k.anggotaKeluarga.length,
        'Kesejahteraan DTKS': k.statusKesejahteraan,
        'Status Penerima Bansos': k.penerimaBansos ? 'Ya' : 'Tidak',
        'Daftar Program Bansos': k.daftarBansos.join(', '),
        'Nominal Bantuan (Rp/Bulan)': k.totalNominalBantuanBulanan,
        'Tipe Rumah': k.kondisiRumah.tipeBangunan,
        'Sumber Air': k.kondisiRumah.sumberAirMinum,
        'Daya Listrik': k.kondisiRumah.dayaListrik
      }));

      const sheetName = filterBansos !== 'semua' 
        ? `Data ${filterBansos.replace(/[^a-zA-Z0-9]/g, ' ').substring(0, 25)}`
        : `Data Keluarga ${profile.namaDesa.substring(0, 15)}`;

      const ws1 = XLSX.utils.json_to_sheet(keluargaSheetData);
      XLSX.utils.book_append_sheet(wb, ws1, sheetName);

      // Sheet 2: Data Penduduk Perorangan
      const allResidents: any[] = exportPenduduk.map((p, idx) => ({
        'No': idx + 1,
        'No KK': p.noKk,
        'NIK': p.nik,
        'Nama Lengkap': p.nama,
        'Tempat Lahir': p.tempatLahir,
        'Tanggal Lahir': p.tanggalLahir,
        'Usia': calculateAge(p.tanggalLahir),
        'Jenis Kelamin': p.jenisKelamin,
        'Agama': p.agama,
        'Status Hubungan': p.statusKeluarga,
        'Status Perkawinan': p.statusPerkawinan,
        'Pendidikan Terakhir': p.pendidikan,
        'Pekerjaan': p.pekerjaan,
        'Penghasilan (Rp/Bulan)': p.penghasilanBulanan,
        'Status Kematian': p.statusKematian,
        'Dusun': p.dusun
      }));

      const ws2 = XLSX.utils.json_to_sheet(allResidents);
      XLSX.utils.book_append_sheet(wb, ws2, 'Data Penduduk Perorangan');
    }

    const cleanFilterName = filterBansos !== 'semua' ? `_${filterBansos.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    XLSX.writeFile(wb, `Rekap_Kependudukan_${profile.namaDesa.replace(/\s+/g, '_')}${cleanFilterName}_${selectedMonth.replace(' ', '_')}.xlsx`);
  };

  // Generate Encrypted Data File (AES Encrypted Export with secure verification wrapper)
  const generateEncryptedExport = () => {
    if (!encryptionPassword) {
      alert('Masukkan kata sandi enkripsi terlebih dahulu.');
      return;
    }

    const payload = {
      village: `Desa ${profile.namaDesa}, Kec. ${profile.kecamatan}, Kab. ${profile.kabupaten}, Prov. ${profile.provinsi}`,
      kepalaDesa: {
        nama: kepalaDesa.nama,
        nip: kepalaDesa.nip,
        nik: kepalaDesa.nik,
        periode: kepalaDesa.periode
      },
      kaurPelayanan: {
        nama: kaurPelayanan.nama,
        jabatan: kaurPelayanan.jabatan,
        nip: kaurPelayanan.nip,
        nik: kaurPelayanan.nik
      },
      exportedBy: `${kaurPelayanan.nama} (${kaurPelayanan.jabatan} / Operator GIS Desa)`,
      exportRole: currentUser.role,
      exportDate: new Date().toISOString(),
      period: selectedMonth,
      filterDusun: filterDusun,
      filterBansos: filterBansos,
      kategoriFilter: getBansosFilterLabel(),
      isResidentFilter: isResidentFilter,
      totalPenduduk: exportPenduduk.length,
      totalKeluarga: exportKeluarga.length,
      dataPenduduk: exportPenduduk,
      dataKeluarga: exportKeluarga
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const encrypted = CryptoJS.AES.encrypt(jsonString, encryptionPassword).toString();

    const encryptedContainer = {
      header: `SIG_${profile.namaDesa.toUpperCase().replace(/\s+/g, '_')}_ENCRYPTED_VAULT_V1`,
      checksum: CryptoJS.SHA256(jsonString).toString(),
      timestamp: new Date().toISOString(),
      encryptedPayload: encrypted,
      instructions: `File ini dilindungi oleh enkripsi AES-256 standar Pemerintah Desa ${profile.namaDesa} untuk kerahasiaan NIK dan DTKS.`
    };

    const blob = new Blob([JSON.stringify(encryptedContainer, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanFilterName = filterBansos !== 'semua' ? `_${filterBansos.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    a.download = `${profile.namaDesa.replace(/\s+/g, '_')}_ENCRYPTED_GIS_DATA${cleanFilterName}_${selectedMonth.replace(' ', '_')}.enc.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteExport = () => {
    setIsGenerating(true);
    setSuccessMessage(null);

    setTimeout(async () => {
      try {
        if (reportType === 'pdf') {
          await generatePDF();
        } else if (reportType === 'excel') {
          generateExcel();
        } else {
          generateEncryptedExport();
        }
        setSuccessMessage(`Dokumen ${reportType.toUpperCase()} berhasil dibuat dan diunduh!`);
      } catch (err) {
        alert('Gagal membuat laporan: ' + err);
      } finally {
        setIsGenerating(false);
      }
    }, 400);
  };

  return (
    <div id="export-report-view" className="space-y-6 pb-20">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Cetak & Ekspor Laporan Bulanan Terenkripsi
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemerintah Desa {profile.namaDesa}, Kec. {profile.kecamatan}, Kab. {profile.kabupaten}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 text-xs text-slate-100">
          
          {successMessage && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {logoUploadMsg && (
            <div className="p-3 bg-teal-500/20 border border-teal-500/40 rounded-xl flex items-center gap-2.5 text-teal-300 font-medium animate-fadeIn">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0 animate-spin" />
              <span>{logoUploadMsg}</span>
            </div>
          )}

          {/* Official Village Kop Surat & Logo Preview Card */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 p-4 rounded-2xl border border-emerald-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Kop Surat Kedinasan & Logo Desa Tertaut
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tercetak Otomatis pada PDF
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              {/* Logo Thumbnail with Emblem Frame */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-xl bg-slate-900 border-2 border-emerald-500/40 p-1.5 flex items-center justify-center shadow-inner overflow-hidden">
                  {profile.logoDesa ? (
                    <img
                      src={profile.logoDesa}
                      alt={`Logo Resmi Desa ${profile.namaDesa}`}
                      className="max-w-full max-h-full object-contain drop-shadow"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border border-slate-900">
                  <CheckCircle className="w-3 h-3" />
                </span>
              </div>

              {/* Kop Text Alignment Preview */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  PEMERINTAH KABUPATEN {profile.kabupaten.toUpperCase()} • KECAMATAN {profile.kecamatan.toUpperCase()}
                </div>
                <div className="text-sm font-bold text-emerald-400 tracking-tight mt-0.5">
                  DESA {profile.namaDesa.toUpperCase()}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {profile.alamatKantor} • Kode Pos: {profile.kodePos}
                </div>
                {/* Visual double line representation */}
                <div className="mt-2 space-y-0.5">
                  <div className="h-0.5 bg-slate-600 w-full rounded" />
                  <div className="h-px bg-slate-700 w-full rounded" />
                </div>
              </div>

              {/* Logo Management Actions */}
              <div className="flex sm:flex-col gap-2 shrink-0">
                <label
                  htmlFor="input-quick-logo-change"
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  title="Ganti atau unggah logo baru untuk kop surat"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ganti Logo</span>
                  <input
                    id="input-quick-logo-change"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleProcessLogoChange(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                {onOpenVillageProfile && (
                  <button
                    type="button"
                    onClick={onOpenVillageProfile}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-all border border-slate-700"
                    title="Buka form data lengkap wilayah & profil desa"
                  >
                    <span>Profil Desa</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Signatures preview card */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-700/60 pb-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <UserCheck className="w-4 h-4" />
                <span>Pengesahan & Penandatangan Resmi Dokumen:</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Tersinkron Data Aplikasi</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Mengetahui (Kepala Desa)</div>
                <div className="text-xs font-bold text-white mt-0.5">{kepalaDesa.nama}</div>
                <div className="text-[11px] text-slate-400 font-mono">NIP: {kepalaDesa.nip || '-'}</div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Operator GIS Desa ({kaurPelayanan.jabatan})</div>
                <div className="text-xs font-bold text-emerald-300 mt-0.5">{kaurPelayanan.nama}</div>
                <div className="text-[11px] text-slate-400 font-mono">NIP: {kaurPelayanan.nip || '-'}</div>
              </div>
            </div>
          </div>

          {/* Format Selector Cards */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Pilih Format Dokumen Ekspor:
            </label>
            <div className="grid grid-cols-3 gap-3">
              
              <button
                type="button"
                onClick={() => setReportType('pdf')}
                className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
                  reportType === 'pdf'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold ring-1 ring-emerald-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <FileText className="w-6 h-6 text-rose-400" />
                <div>
                  <div className="text-xs font-bold text-white">PDF Resmi</div>
                  <div className="text-[10px] text-slate-400">Kop Desa & Tanda Tangan</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportType('excel')}
                className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
                  reportType === 'excel'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold ring-1 ring-emerald-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">Excel (.xlsx)</div>
                  <div className="text-[10px] text-slate-400">Multi-Sheet Workbook</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportType('encrypted')}
                className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${
                  reportType === 'encrypted'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold ring-1 ring-emerald-500 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Lock className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Terenkripsi (AES)</div>
                  <div className="text-[10px] text-slate-400">Keamanan Sandi NIK</div>
                </div>
              </button>

            </div>
          </div>

          {/* Period & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Periode Laporan</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white cursor-pointer"
              >
                <option value="September 2026">September 2026 (Bulan Ini)</option>
                <option value="Agustus 2026">Agustus 2026</option>
                <option value="Juli 2026">Juli 2026</option>
                <option value="Semester I 2026">Semester I (Jan - Jun 2026)</option>
                <option value="Tahunan 2026">Rekap Tahunan 2026</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Cakupan Wilayah</label>
              <select
                value={filterDusun}
                onChange={e => setFilterDusun(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white cursor-pointer"
              >
                <option value="semua">Seluruh Dusun (I, II, III, IV)</option>
                <option value="Dusun I">Dusun I Saja</option>
                <option value="Dusun II">Dusun II Saja</option>
                <option value="Dusun III">Dusun III Saja</option>
                <option value="Dusun IV">Dusun IV Saja</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Kategori / Jenis Bantuan</label>
                {filterBansos !== 'semua' && (
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Aktif
                  </span>
                )}
              </div>
              <select
                id="select-filter-bansos"
                value={filterBansos}
                onChange={e => setFilterBansos(e.target.value)}
                className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                  filterBansos !== 'semua' ? 'border-emerald-500' : 'border-slate-700'
                }`}
              >
                <optgroup label="── KELOMPOK STATUS PENDUDUK ──" className="bg-slate-900 text-cyan-400 font-bold">
                  <option value="semua" className="text-white">Semua Penduduk ({categoryCounts.semua} Jiwa)</option>
                  <option value="penduduk_hidup" className="text-white">Penduduk Hidup ({categoryCounts.penduduk_hidup} Jiwa)</option>
                  <option value="penduduk_meninggal" className="text-white">Penduduk Meninggal ({categoryCounts.penduduk_meninggal} Jiwa)</option>
                  <option value="penduduk_kawin" className="text-white">Penduduk Kawin ({categoryCounts.penduduk_kawin} Jiwa)</option>
                  <option value="penduduk_cerai" className="text-white">Cerai (Cerai Hidup & Mati) ({categoryCounts.penduduk_cerai} Jiwa)</option>
                </optgroup>

                <optgroup label="── KELOMPOK PENDIDIKAN ──" className="bg-slate-900 text-amber-400 font-bold">
                  <option value="pendidikan_tinggi" className="text-white">Diploma / S1 / S2 / S3 ({categoryCounts.pendidikan_tinggi} Jiwa)</option>
                  <option value="pendidikan_sma" className="text-white">SMA / SMK / Sederajat ({categoryCounts.pendidikan_sma} Jiwa)</option>
                  <option value="pendidikan_smp" className="text-white">SMP / MTs / Sederajat ({categoryCounts.pendidikan_smp} Jiwa)</option>
                  <option value="pendidikan_sd" className="text-white">SD / MI / Sederajat ({categoryCounts.pendidikan_sd} Jiwa)</option>
                  <option value="pendidikan_tidak_sekolah" className="text-white">Belum / Tidak Sekolah ({categoryCounts.pendidikan_tidak_sekolah} Jiwa)</option>
                </optgroup>

                <optgroup label="── STATUS BANTUAN SOSIAL ──" className="bg-slate-900 text-emerald-400 font-bold">
                  <option value="penerima" className="text-white">Semua Penerima Bansos ({categoryCounts.penerima} KK)</option>
                  <option value="non_penerima" className="text-white">Bukan Penerima (Non-Bansos / Mampu - {categoryCounts.non_penerima} KK)</option>
                  {allKnownPrograms.map(prog => (
                    <option key={prog.id} value={prog.id} className="text-white">
                      Khusus: {prog.label} ({prog.count} KK)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Quick-Selection Chips for Status Penduduk, Pendidikan & Jenis Bantuan */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pilih Cepat Kategori / Kelompok:</span>
              </span>
              {filterBansos !== 'semua' && (
                <button
                  type="button"
                  onClick={() => setFilterBansos('semua')}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  Reset ke Semua Penduduk
                </button>
              )}
            </div>

            {/* Row 1: Status Penduduk */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Kelompok Status Penduduk:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'semua', label: 'Semua Penduduk', count: `${categoryCounts.semua} Jiwa` },
                  { id: 'penduduk_hidup', label: 'Penduduk Hidup', count: `${categoryCounts.penduduk_hidup} Jiwa` },
                  { id: 'penduduk_meninggal', label: 'Penduduk Meninggal', count: `${categoryCounts.penduduk_meninggal} Jiwa` },
                  { id: 'penduduk_kawin', label: 'Penduduk Kawin', count: `${categoryCounts.penduduk_kawin} Jiwa` },
                  { id: 'penduduk_cerai', label: 'Cerai', count: `${categoryCounts.penduduk_cerai} Jiwa` }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterBansos(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border flex items-center gap-1.5 ${
                      filterBansos === item.id
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm ring-1 ring-cyan-400'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-cyan-500/50 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                      filterBansos === item.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-cyan-300 border border-cyan-500/20'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Kelompok Pendidikan */}
            <div className="space-y-1 pt-1 border-t border-slate-700/50">
              <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                <span>Kelompok Tingkat Pendidikan:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'pendidikan_tinggi', label: 'Diploma / S1 / S2 / S3', count: `${categoryCounts.pendidikan_tinggi} Jiwa` },
                  { id: 'pendidikan_sma', label: 'SMA / SMK', count: `${categoryCounts.pendidikan_sma} Jiwa` },
                  { id: 'pendidikan_smp', label: 'SMP', count: `${categoryCounts.pendidikan_smp} Jiwa` },
                  { id: 'pendidikan_sd', label: 'SD', count: `${categoryCounts.pendidikan_sd} Jiwa` },
                  { id: 'pendidikan_tidak_sekolah', label: 'Belum/Tidak Sekolah', count: `${categoryCounts.pendidikan_tidak_sekolah} Jiwa` }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterBansos(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border flex items-center gap-1.5 ${
                      filterBansos === item.id
                        ? 'bg-amber-600 text-white border-amber-400 shadow-sm ring-1 ring-amber-400'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                      filterBansos === item.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-amber-300 border border-amber-500/20'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Bantuan Sosial */}
            <div className="space-y-1 pt-1 border-t border-slate-700/50">
              <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>Kelompok Bantuan Sosial & Keluarga:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterBansos('penerima')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border flex items-center gap-1.5 ${
                    filterBansos === 'penerima'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-emerald-500/50 hover:text-white'
                  }`}
                >
                  <span>Penerima Bansos</span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                    filterBansos === 'penerima' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    {categoryCounts.penerima} KK
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterBansos('non_penerima')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border flex items-center gap-1.5 ${
                    filterBansos === 'non_penerima'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-emerald-500/50 hover:text-white'
                  }`}
                >
                  <span>Non-Bansos (Mampu)</span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                    filterBansos === 'non_penerima' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    {categoryCounts.non_penerima} KK
                  </span>
                </button>

                {allKnownPrograms.map(prog => (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => setFilterBansos(prog.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border flex items-center gap-1.5 ${
                      filterBansos === prog.id
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-400'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                    }`}
                    title={`Cetak khusus penerima ${prog.label}`}
                  >
                    <span>{prog.shortLabel}</span>
                    <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                      filterBansos === prog.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {prog.count} KK
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Encryption Password Input when Encrypted Mode selected */}
          {reportType === 'encrypted' && (
            <div className="bg-slate-800/80 p-4 rounded-xl border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Key className="w-4 h-4" />
                <span>Kata Sandi Enkripsi Dokumen (AES-256)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                File data kependudukan dan NIK akan dienkripsi dengan standar enkripsi militer. Dokumen hanya dapat dibuka dengan password ini.
              </p>
              <input
                type="text"
                value={encryptionPassword}
                onChange={e => setEncryptionPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                placeholder="Masukkan kata sandi enkripsi..."
              />
            </div>
          )}

          {/* Export Summary Box */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <div>
                <div className="font-medium">Total Data yang akan diekspor / dicetak:</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Cakupan: <span className="text-white font-medium">{filterDusun === 'semua' ? 'Seluruh Dusun' : filterDusun}</span>
                  <span className="mx-1.5">•</span>
                  Kategori: <span className="text-emerald-400 font-medium">{getBansosFilterLabel()}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {isResidentFilter ? (
                  <>
                    <div className="text-base font-bold text-cyan-400 font-mono">
                      {exportPenduduk.length} Jiwa
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ({exportKeluarga.length} Kartu Keluarga Terkait)
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {exportKeluarga.length} Kartu Keluarga
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ({exportPenduduk.length} Jiwa)
                    </div>
                  </>
                )}
              </div>
            </div>

            {((isResidentFilter && exportPenduduk.length === 0) || (!isResidentFilter && exportKeluarga.length === 0)) && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Tidak ada data kependudukan yang sesuai dengan kombinasi wilayah dan kategori yang dipilih.</span>
              </div>
            )}
          </div>

        {/* Bottom Info Inside Card */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dokumen diproses langsung di browser secara aman tanpa mengirim data NIK keluar.</span>
          </div>

          {onClose && (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* BAR AKSI MELAYANG BAWAH (BOTTOM STICKY BAR)                              */}
      {/* Memberikan kenyamanan saat meninjau yang panjang ke bawah:               */}
      {/* Sisi Kiri: Kembali ke Peta.                                              */}
      {/* Sisi Kanan: Profil desa, Unduh Dokumen (PDF).                            */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-3 sm:px-6 rounded-3xl shadow-2xl sticky bottom-4 z-40">
        
        {/* Sisi Kiri: Kembali ke Peta */}
        <div>
          {onBackToMap && (
            <button
              type="button"
              id="btn-sticky-back-to-map"
              onClick={onBackToMap}
              className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Kembali ke Peta Spasial GIS Desa"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Kembali ke Peta</span>
            </button>
          )}
        </div>

        {/* Sisi Kanan: Profil desa & Unduh Dokumen (PDF) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenVillageProfile && (
            <button
              type="button"
              id="btn-sticky-village-profile"
              onClick={onOpenVillageProfile}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Buka form data lengkap wilayah & profil desa"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Profil Desa</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            id="btn-sticky-download"
            disabled={isGenerating || exportKeluarga.length === 0}
            onClick={handleExecuteExport}
            className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            title="Unduh dokumen laporan sesuai konfigurasi yang dipilih"
          >
            {isGenerating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses Dokumen...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen ({reportType === 'pdf' ? 'PDF' : reportType.toUpperCase()})</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export const ExportReportView = ExportReportModal;


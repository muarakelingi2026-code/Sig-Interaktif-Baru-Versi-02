import React, { useState, useMemo } from 'react';
import { Keluarga, Penduduk, AsetDesa, DusunWilayah } from '../types';
import { 
  Users, 
  HeartHandshake, 
  Coins, 
  Home, 
  GraduationCap, 
  PieChart as PieChartIcon, 
  Building2, 
  Activity,
  ShieldCheck,
  MapPin,
  HeartCrack,
  UserX,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Calendar,
  Filter,
  DollarSign,
  Landmark,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface AnalyticsDashboardProps {
  keluargaList: Keluarga[];
  pendudukList: Penduduk[];
  asetList?: AsetDesa[];
  onOpenAssetModal?: (category?: 'all' | 'pembangunan' | 'non_pembangunan', targetAsetId?: string) => void;
  onSelectAset?: (aset: AsetDesa) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  keluargaList,
  pendudukList,
  asetList = [],
  onOpenAssetModal,
  onSelectAset
}) => {
  // Navigation Sub-tab Filter
  const [activeSection, setActiveSection] = useState<'all' | 'demografi' | 'pekerjaan_perkawinan' | 'aset' | 'bansos'>('all');
  
  // Wilayah Dusun Filter
  const [selectedDusunFilter, setSelectedDusunFilter] = useState<'semua' | DusunWilayah>('semua');

  // Format Mata Uang Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(val || 0);
  };

  // Helper Format Singkat (Juta / Miliar)
  const formatRupiahSingkat = (val: number) => {
    if (val >= 1000000000) {
      return `Rp ${(val / 1000000000).toFixed(2)} M`;
    }
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1)} Jt`;
    }
    return formatRupiah(val);
  };

  // Mapping Relasi Dusun untuk Penduduk
  const pendudukWithDusun = useMemo(() => {
    const dusunMap = new Map<string, DusunWilayah>();
    keluargaList.forEach(k => {
      k.anggotaKeluarga.forEach(p => {
        dusunMap.set(p.id, k.dusun);
        if (p.nik) dusunMap.set(p.nik, k.dusun);
      });
    });

    return pendudukList.map(p => ({
      ...p,
      dusun: dusunMap.get(p.id) || dusunMap.get(p.nik) || ('Dusun I' as DusunWilayah)
    }));
  }, [keluargaList, pendudukList]);

  // Filter Data berdasarkan Wilayah Dusun Aktif
  const activeKeluarga = useMemo(() => {
    if (selectedDusunFilter === 'semua') return keluargaList;
    return keluargaList.filter(k => k.dusun === selectedDusunFilter);
  }, [keluargaList, selectedDusunFilter]);

  const activePenduduk = useMemo(() => {
    if (selectedDusunFilter === 'semua') return pendudukWithDusun;
    return pendudukWithDusun.filter(p => p.dusun === selectedDusunFilter);
  }, [pendudukWithDusun, selectedDusunFilter]);

  const activeAset = useMemo(() => {
    if (selectedDusunFilter === 'semua') return asetList;
    return asetList.filter(a => a.dusun === selectedDusunFilter);
  }, [asetList, selectedDusunFilter]);

  // ────────────────────────────────────────────────────────────
  // 1. KEY METRICS UMUM
  // ────────────────────────────────────────────────────────────
  const totalKeluarga = activeKeluarga.length;
  const totalPendudukAll = activePenduduk.length;
  const totalPendudukHidup = activePenduduk.filter(p => p.statusKematian === 'Hidup').length;
  const totalLakiHidup = activePenduduk.filter(p => p.jenisKelamin === 'Laki-Laki' && p.statusKematian === 'Hidup').length;
  const totalPerempuanHidup = activePenduduk.filter(p => p.jenisKelamin === 'Perempuan' && p.statusKematian === 'Hidup').length;
  const totalMeninggal = activePenduduk.filter(p => p.statusKematian === 'Meninggal').length;
  const penerimaBansosKk = activeKeluarga.filter(k => k.penerimaBansos).length;
  const persentaseBansos = totalKeluarga > 0 ? Math.round((penerimaBansosKk / totalKeluarga) * 100) : 0;
  const totalAnggaranBansosBulanan = activeKeluarga.reduce((acc, curr) => acc + (curr.totalNominalBantuanBulanan || 0), 0);

  // Sex Ratio (Rasio Jenis Kelamin = Laki-laki per 100 Perempuan)
  const sexRatio = totalPerempuanHidup > 0 ? Math.round((totalLakiHidup / totalPerempuanHidup) * 100) : 100;
  const rataRataJiwaPerKK = totalKeluarga > 0 ? (totalPendudukHidup / totalKeluarga).toFixed(1) : '0';

  // ────────────────────────────────────────────────────────────
  // 2. KEPADATAN PENDUDUK DI SETIAP DUSUN (LAKI-LAKI & PEREMPUAN)
  // ────────────────────────────────────────────────────────────
  const dusunNames: DusunWilayah[] = ['Dusun I', 'Dusun II', 'Dusun III', 'Dusun IV'];
  
  const dusunKepadatanData = useMemo(() => {
    return dusunNames.map(dusunName => {
      const kkInDusun = keluargaList.filter(k => k.dusun === dusunName).length;
      const residentsInDusun = pendudukWithDusun.filter(p => p.dusun === dusunName);
      const lakiHidup = residentsInDusun.filter(p => p.jenisKelamin === 'Laki-Laki' && p.statusKematian === 'Hidup').length;
      const perempuanHidup = residentsInDusun.filter(p => p.jenisKelamin === 'Perempuan' && p.statusKematian === 'Hidup').length;
      const wafat = residentsInDusun.filter(p => p.statusKematian === 'Meninggal').length;
      const totalJiwaHidup = lakiHidup + perempuanHidup;
      const totalPendudukDesa = pendudukWithDusun.filter(p => p.statusKematian === 'Hidup').length;
      const persen = totalPendudukDesa > 0 ? Math.round((totalJiwaHidup / totalPendudukDesa) * 100) : 0;

      return {
        dusun: dusunName,
        totalKK: kkInDusun,
        lakiLaki: lakiHidup,
        perempuan: perempuanHidup,
        totalJiwa: totalJiwaHidup,
        meninggal: wafat,
        persentase: persen,
        sexRatio: perempuanHidup > 0 ? Math.round((lakiHidup / perempuanHidup) * 100) : 100
      };
    });
  }, [keluargaList, pendudukWithDusun]);

  // Dusun Terpadat
  const dusunTerpadat = useMemo(() => {
    return [...dusunKepadatanData].sort((a, b) => b.totalJiwa - a.totalJiwa)[0] || null;
  }, [dusunKepadatanData]);

  // ────────────────────────────────────────────────────────────
  // 3. PENDUDUK MENINGGAL (MORTALITAS & REKAP KEMATIAN)
  // ────────────────────────────────────────────────────────────
  const mortalitasByDusun = useMemo(() => {
    return dusunNames.map(dusunName => {
      const wafatLaki = pendudukWithDusun.filter(p => p.dusun === dusunName && p.statusKematian === 'Meninggal' && p.jenisKelamin === 'Laki-Laki').length;
      const wafatPerempuan = pendudukWithDusun.filter(p => p.dusun === dusunName && p.statusKematian === 'Meninggal' && p.jenisKelamin === 'Perempuan').length;
      return {
        dusun: dusunName,
        wafatLaki,
        wafatPerempuan,
        totalWafat: wafatLaki + wafatPerempuan
      };
    });
  }, [pendudukWithDusun]);

  const daftarMeninggal = useMemo(() => {
    return activePenduduk
      .filter(p => p.statusKematian === 'Meninggal')
      .map(p => ({
        id: p.id,
        nama: p.nama,
        nik: p.nik,
        dusun: p.dusun,
        jenisKelamin: p.jenisKelamin,
        tanggalMeninggal: p.tanggalMeninggal || 'Tercatat dalam administrasi'
      }));
  }, [activePenduduk]);

  const mortalitasPieData = [
    { name: 'Penduduk Hidup', value: totalPendudukHidup, color: '#10b981' },
    { name: 'Penduduk Meninggal', value: totalMeninggal, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  // Angka Kematian Kasar (Crude Death Rate per 1.000 penduduk)
  const cdrPer1000 = totalPendudukAll > 0 
    ? ((totalMeninggal / totalPendudukAll) * 1000).toFixed(1) 
    : '0.0';

  // ────────────────────────────────────────────────────────────
  // 4. DISTRIBUSI KELOMPOK UMUR (PIRAMIDA & KELOMPOK USIA)
  // ────────────────────────────────────────────────────────────
  const calculateAge = (birthDateStr: string): number => {
    if (!birthDateStr) return 0;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  const umurGroupData = useMemo(() => {
    const groups = [
      { label: '0 - 4 Thn (Balita)', min: 0, max: 4, laki: 0, perempuan: 0, kategori: 'Balita' },
      { label: '5 - 11 Thn (Anak)', min: 5, max: 11, laki: 0, perempuan: 0, kategori: 'Anak-anak' },
      { label: '12 - 17 Thn (Remaja)', min: 12, max: 17, laki: 0, perempuan: 0, kategori: 'Remaja' },
      { label: '18 - 35 Thn (Muda)', min: 18, max: 35, laki: 0, perempuan: 0, kategori: 'Produktif Muda' },
      { label: '36 - 59 Thn (Dewasa)', min: 36, max: 59, laki: 0, perempuan: 0, kategori: 'Produktif Dewasa' },
      { label: '60+ Thn (Lansia)', min: 60, max: 150, laki: 0, perempuan: 0, kategori: 'Lanjut Usia' }
    ];

    let totalUsia = 0;
    let countedResidents = 0;

    activePenduduk.forEach(p => {
      if (p.statusKematian === 'Hidup' && p.tanggalLahir) {
        const age = calculateAge(p.tanggalLahir);
        totalUsia += age;
        countedResidents++;

        const targetGroup = groups.find(g => age >= g.min && age <= g.max);
        if (targetGroup) {
          if (p.jenisKelamin === 'Laki-Laki') {
            targetGroup.laki++;
          } else {
            targetGroup.perempuan++;
          }
        }
      }
    });

    const rataRataUsia = countedResidents > 0 ? Math.round(totalUsia / countedResidents) : 0;
    
    // Usia produktif (15 - 59 thn)
    const usiaProduktifCount = activePenduduk.filter(p => {
      if (p.statusKematian !== 'Hidup' || !p.tanggalLahir) return false;
      const age = calculateAge(p.tanggalLahir);
      return age >= 15 && age <= 59;
    }).length;

    const usiaNonProduktifCount = totalPendudukHidup - usiaProduktifCount;
    const dependencyRatio = usiaProduktifCount > 0 
      ? Math.round((usiaNonProduktifCount / usiaProduktifCount) * 100) 
      : 0;

    const chartData = groups.map(g => ({
      kelompok: g.label,
      lakiLaki: g.laki,
      perempuan: g.perempuan,
      total: g.laki + g.perempuan,
      kategori: g.kategori
    }));

    return {
      chartData,
      rataRataUsia,
      usiaProduktifCount,
      persenProduktif: totalPendudukHidup > 0 ? Math.round((usiaProduktifCount / totalPendudukHidup) * 100) : 0,
      dependencyRatio,
      totalLansia: groups[5].laki + groups[5].perempuan
    };
  }, [activePenduduk, totalPendudukHidup]);

  // ────────────────────────────────────────────────────────────
  // 5. DISTRIBUSI PEKERJAAN PENDUDUK
  // ────────────────────────────────────────────────────────────
  const pekerjaanData = useMemo(() => {
    const rawCounts: { [key: string]: number } = {};

    activePenduduk.forEach(p => {
      if (p.statusKematian === 'Hidup') {
        const raw = (p.pekerjaan || '').trim();
        let normalized = 'Lainnya / Jasa';

        if (!raw || raw.toLowerCase().includes('tidak') || raw.toLowerCase().includes('belum')) {
          normalized = 'Belum / Tidak Bekerja';
        } else if (raw.toLowerCase().includes('sawit') || raw.toLowerCase().includes('karet') || raw.toLowerCase().includes('kebun') || raw.toLowerCase().includes('petani') || raw.toLowerCase().includes('tani')) {
          normalized = 'Petani / Pekebun';
        } else if (raw.toLowerCase().includes('pedagang') || raw.toLowerCase().includes('wiraswasta') || raw.toLowerCase().includes('toko') || raw.toLowerCase().includes('warung')) {
          normalized = 'Wiraswasta / Pedagang';
        } else if (raw.toLowerCase().includes('buruh') || raw.toLowerCase().includes('sopir') || raw.toLowerCase().includes('bengkel')) {
          normalized = 'Buruh / Tenaga Terampil';
        } else if (raw.toLowerCase().includes('guru') || raw.toLowerCase().includes('pns') || raw.toLowerCase().includes('perangkat') || raw.toLowerCase().includes('aparatur') || raw.toLowerCase().includes('kasi') || raw.toLowerCase().includes('kaur')) {
          normalized = 'PNS / Aparatur / Guru';
        } else if (raw.toLowerCase().includes('ibu rumah tangga')) {
          normalized = 'Ibu Rumah Tangga';
        } else if (raw.toLowerCase().includes('pelajar') || raw.toLowerCase().includes('mahasiswa')) {
          normalized = 'Pelajar / Mahasiswa';
        } else if (raw.toLowerCase().includes('karyawan') || raw.toLowerCase().includes('swasta') || raw.toLowerCase().includes('farmasi')) {
          normalized = 'Karyawan Swasta / Medis';
        }

        rawCounts[normalized] = (rawCounts[normalized] || 0) + 1;
      }
    });

    const sortedList = Object.keys(rawCounts)
      .map(k => ({
        profesi: k,
        jumlah: rawCounts[k],
        persen: totalPendudukHidup > 0 ? Math.round((rawCounts[k] / totalPendudukHidup) * 100) : 0
      }))
      .sort((a, b) => b.jumlah - a.jumlah);

    const angkatanKerjaAktif = sortedList
      .filter(item => item.profesi !== 'Pelajar / Mahasiswa' && item.profesi !== 'Belum / Tidak Bekerja' && item.profesi !== 'Ibu Rumah Tangga')
      .reduce((acc, curr) => acc + curr.jumlah, 0);

    const tpakPersen = totalPendudukHidup > 0 ? Math.round((angkatanKerjaAktif / totalPendudukHidup) * 100) : 0;

    return {
      list: sortedList,
      angkatanKerjaAktif,
      tpakPersen
    };
  }, [activePenduduk, totalPendudukHidup]);

  // ────────────────────────────────────────────────────────────
  // 6. STATUS PERKAWINAN MENCAKUP "PERCERAIAN"
  // ────────────────────────────────────────────────────────────
  const perkawinanData = useMemo(() => {
    const stats: { [key: string]: { total: number; laki: number; perempuan: number } } = {
      'Belum Kawin': { total: 0, laki: 0, perempuan: 0 },
      'Kawin': { total: 0, laki: 0, perempuan: 0 },
      'Cerai Hidup': { total: 0, laki: 0, perempuan: 0 },
      'Cerai Mati': { total: 0, laki: 0, perempuan: 0 }
    };

    activePenduduk.forEach(p => {
      if (p.statusKematian === 'Hidup') {
        const st = p.statusPerkawinan || 'Belum Kawin';
        if (stats[st]) {
          stats[st].total++;
          if (p.jenisKelamin === 'Laki-Laki') stats[st].laki++;
          else stats[st].perempuan++;
        }
      }
    });

    const pieData = [
      { name: 'Belum Kawin', value: stats['Belum Kawin'].total, color: '#3b82f6' },
      { name: 'Kawin', value: stats['Kawin'].total, color: '#10b981' },
      { name: 'Cerai Hidup (Perceraian)', value: stats['Cerai Hidup'].total, color: '#f59e0b' },
      { name: 'Cerai Mati (Duda/Janda)', value: stats['Cerai Mati'].total, color: '#8b5cf6' }
    ].filter(d => d.value > 0);

    const barComparisonData = [
      { status: 'Belum Kawin', laki: stats['Belum Kawin'].laki, perempuan: stats['Belum Kawin'].perempuan },
      { status: 'Kawin', laki: stats['Kawin'].laki, perempuan: stats['Kawin'].perempuan },
      { status: 'Cerai Hidup', laki: stats['Cerai Hidup'].laki, perempuan: stats['Cerai Hidup'].perempuan },
      { status: 'Cerai Mati', laki: stats['Cerai Mati'].laki, perempuan: stats['Cerai Mati'].perempuan }
    ];

    const totalCeraiHidup = stats['Cerai Hidup'].total;
    const totalCeraiMati = stats['Cerai Mati'].total;
    const totalPernikahanPernahAda = stats['Kawin'].total + totalCeraiHidup + totalCeraiMati;
    
    // Rasio Perceraian Hidup terhadap Total Ikatan Pernikahan Pernah Ada
    const rasioPerceraianHidup = totalPernikahanPernahAda > 0 
      ? ((totalCeraiHidup / totalPernikahanPernahAda) * 100).toFixed(1) 
      : '0.0';

    return {
      stats,
      pieData,
      barComparisonData,
      totalCeraiHidup,
      totalCeraiMati,
      rasioPerceraianHidup
    };
  }, [activePenduduk]);

  // ────────────────────────────────────────────────────────────
  // 7. INFORMASI & CHART ASET DESA (Permendagri No. 1/2016)
  // ────────────────────────────────────────────────────────────
  const asetAnalytics = useMemo(() => {
    const totalAsetCount = activeAset.length;
    const totalNilaiPerolehan = activeAset.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);

    // Kategori: Pembangunan vs Non-Pembangunan
    const asetPembangunan = activeAset.filter(a => a.kategori === 'pembangunan');
    const asetNonPembangunan = activeAset.filter(a => a.kategori === 'non_pembangunan');
    const nilaiPembangunan = asetPembangunan.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);
    const nilaiNonPembangunan = asetNonPembangunan.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);

    // Kondisi Fisik Aset
    const kondisiCounts = {
      'Baik': activeAset.filter(a => a.kondisi === 'Baik').length,
      'Rusak Ringan': activeAset.filter(a => a.kondisi === 'Rusak Ringan').length,
      'Rusak Berat': activeAset.filter(a => a.kondisi === 'Rusak Berat').length
    };

    const kondisiPieData = [
      { name: 'Kondisi Baik', value: kondisiCounts['Baik'], color: '#10b981' },
      { name: 'Rusak Ringan', value: kondisiCounts['Rusak Ringan'], color: '#f59e0b' },
      { name: 'Rusak Berat', value: kondisiCounts['Rusak Berat'], color: '#ef4444' }
    ].filter(d => d.value > 0);

    const persentaseKondisiBaik = totalAsetCount > 0 
      ? Math.round((kondisiCounts['Baik'] / totalAsetCount) * 100) 
      : 0;

    // Nilai Aset per Sub-Kategori
    const subKatMap: { [key: string]: { count: number; nilai: number } } = {};
    activeAset.forEach(a => {
      const sk = a.subKategori || 'Aset Umum';
      if (!subKatMap[sk]) {
        subKatMap[sk] = { count: 0, nilai: 0 };
      }
      subKatMap[sk].count++;
      subKatMap[sk].nilai += a.nilaiPerolehan || 0;
    });

    const subKategoriBarData = Object.keys(subKatMap)
      .map(key => ({
        subKategori: key,
        nilai: subKatMap[key].nilai,
        nilaiJuta: Math.round(subKatMap[key].nilai / 1000000),
        unit: subKatMap[key].count
      }))
      .sort((a, b) => b.nilai - a.nilai);

    // Sebaran Nilai Aset per Dusun
    const asetPerDusunData = dusunNames.map(dusunName => {
      const asetDusun = asetList.filter(a => a.dusun === dusunName);
      const totalNilai = asetDusun.reduce((acc, curr) => acc + (curr.nilaiPerolehan || 0), 0);
      return {
        dusun: dusunName,
        totalNilai,
        nilaiJuta: Math.round(totalNilai / 1000000),
        totalUnit: asetDusun.length
      };
    });

    // Sumber Dana Pengadaan Aset
    const sumberDanaMap: { [key: string]: number } = {};
    activeAset.forEach(a => {
      const sd = a.sumberDana || 'Lainnya';
      sumberDanaMap[sd] = (sumberDanaMap[sd] || 0) + (a.nilaiPerolehan || 0);
    });

    const sumberDanaColors: { [key: string]: string } = {
      'Dana Desa (APBN)': '#10b981',
      'Alokasi Dana Desa (ADD)': '#06b6d4',
      'Bantuan Keuangan Provinsi': '#3b82f6',
      'Pendapatan Asli Desa (PADes)': '#8b5cf6',
      'Asal Usul Desa': '#f59e0b',
      'Penyertaan Modal BUMDes': '#ec4899',
      'Hibah / Swadaya Masyarakat': '#14b8a6'
    };

    const sumberDanaPieData = Object.keys(sumberDanaMap).map(key => ({
      name: key,
      value: sumberDanaMap[key],
      valueJuta: Math.round(sumberDanaMap[key] / 1000000),
      color: sumberDanaColors[key] || '#94a3b8'
    })).sort((a, b) => b.value - a.value);

    // Status Pemanfaatan Aset
    const statusPemanfaatanMap: { [key: string]: number } = {
      'Digunakan Aktif': 0,
      'Disewakan / Kerjasama': 0,
      'Dalam Pemeliharaan': 0,
      'Cadangan': 0
    };
    activeAset.forEach(a => {
      if (statusPemanfaatanMap[a.statusPemanfaatan] !== undefined) {
        statusPemanfaatanMap[a.statusPemanfaatan]++;
      }
    });

    const pemanfaatanBarData = Object.keys(statusPemanfaatanMap).map(k => ({
      status: k,
      jumlah: statusPemanfaatanMap[k]
    }));

    // Kebutuhan Lainnya: Aset Rusak / Butuh Pemeliharaan (Maintenance Watchlist)
    const asetButuhPerhatian = activeAset.filter(
      a => a.kondisi === 'Rusak Ringan' || a.kondisi === 'Rusak Berat' || a.statusPemanfaatan === 'Dalam Pemeliharaan'
    );

    // Top 4 Aset Bernilai Tertinggi
    const topNilaiAset = [...activeAset].sort((a, b) => (b.nilaiPerolehan || 0) - (a.nilaiPerolehan || 0)).slice(0, 4);

    return {
      totalAsetCount,
      totalNilaiPerolehan,
      asetPembangunanCount: asetPembangunan.length,
      asetNonPembangunanCount: asetNonPembangunan.length,
      nilaiPembangunan,
      nilaiNonPembangunan,
      persentaseKondisiBaik,
      kondisiPieData,
      subKategoriBarData,
      asetPerDusunData,
      sumberDanaPieData,
      pemanfaatanBarData,
      asetButuhPerhatian,
      topNilaiAset
    };
  }, [activeAset, asetList]);

  // ────────────────────────────────────────────────────────────
  // 8. DATA PROGRAM BANSOS & DESIL KESEJAHTERAAN (EXISTING ENHANCED)
  // ────────────────────────────────────────────────────────────
  const bansosCounts: { [key: string]: number } = {
    'PKH': 0,
    'BPNT/Sembako': 0,
    'BLT-Dana Desa': 0,
    'Bansos Beras (PBP)': 0,
    'PIP (Pendidikan)': 0,
    'KIS/PBI-JK': 0
  };

  activeKeluarga.forEach(k => {
    k.daftarBansos.forEach(b => {
      if (bansosCounts[b] !== undefined) {
        bansosCounts[b]++;
      }
    });
  });

  const bansosChartData = Object.keys(bansosCounts).map(key => ({
    program: key,
    penerima: bansosCounts[key]
  }));

  const totalDesil1 = activeKeluarga.filter(k => k.statusKesejahteraan.includes('Desil 1')).length;
  const totalDesil2 = activeKeluarga.filter(k => k.statusKesejahteraan.includes('Desil 2')).length;
  const totalDesil3 = activeKeluarga.filter(k => k.statusKesejahteraan.includes('Desil 3')).length;
  const totalMampu = activeKeluarga.filter(k => k.statusKesejahteraan.includes('Non-DTKS')).length;

  const desilPieData = [
    { name: 'Desil 1 (Sangat Miskin)', value: totalDesil1, color: '#ef4444' },
    { name: 'Desil 2 (Miskin)', value: totalDesil2, color: '#f97316' },
    { name: 'Desil 3 (Rentan Miskin)', value: totalDesil3, color: '#f59e0b' },
    { name: 'Non-DTKS (Mampu)', value: totalMampu, color: '#10b981' }
  ].filter(d => d.value > 0);

  // Income Groups
  const incomeGroups = [
    { range: '< 1 Juta', count: 0 },
    { range: '1 - 2.5 Juta', count: 0 },
    { range: '2.5 - 5 Juta', count: 0 },
    { range: '> 5 Juta', count: 0 }
  ];

  activePenduduk.forEach(p => {
    if (p.statusKematian === 'Hidup' && p.penghasilanBulanan > 0) {
      if (p.penghasilanBulanan < 1000000) incomeGroups[0].count++;
      else if (p.penghasilanBulanan <= 2500000) incomeGroups[1].count++;
      else if (p.penghasilanBulanan <= 5000000) incomeGroups[2].count++;
      else incomeGroups[3].count++;
    }
  });

  return (
    <div id="analytics-dashboard-view" className="space-y-6">
      
      {/* ── TOP HEADER & DUSUN SELECTOR ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Pusat Analitik & Informasi Spasial Terpadu
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
              Desa Beliti Jaya
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Dashboard Analitik Kependudukan, Demografi & Aset Desa
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Sumatera Selatan
          </p>
        </div>

        {/* Filter Dusun Dropdown & Quick Summary */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700 px-3 py-2 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-medium">Filter Wilayah:</span>
            <select
              id="select-dusun-analytics"
              value={selectedDusunFilter}
              onChange={(e) => setSelectedDusunFilter(e.target.value as any)}
              aria-label="Filter Wilayah Dusun"
              className="bg-transparent text-white font-bold outline-none cursor-pointer hover:text-emerald-400"
            >
              <option value="semua" className="bg-slate-900 text-white">Semua Wilayah Desa</option>
              <option value="Dusun I" className="bg-slate-900 text-white">Dusun I</option>
              <option value="Dusun II" className="bg-slate-900 text-white">Dusun II</option>
              <option value="Dusun III" className="bg-slate-900 text-white">Dusun III</option>
              <option value="Dusun IV" className="bg-slate-900 text-white">Dusun IV</option>
            </select>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 px-3.5 rounded-xl border border-slate-800">
            <Landmark className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Total Nilai Buku Aset:</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {formatRupiahSingkat(asetAnalytics.totalNilaiPerolehan)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUB-NAVIGATOR PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          type="button"
          id="tab-analytics-all"
          onClick={() => setActiveSection('all')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSection === 'all'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua Ringkasan</span>
        </button>

        <button
          type="button"
          id="tab-analytics-demografi"
          onClick={() => setActiveSection('demografi')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSection === 'demografi'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Kepadatan Dusun, Umur & Kematian</span>
        </button>

        <button
          type="button"
          id="tab-analytics-pekerjaan"
          onClick={() => setActiveSection('pekerjaan_perkawinan')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSection === 'pekerjaan_perkawinan'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Pekerjaan, Perkawinan & Perceraian</span>
        </button>

        <button
          type="button"
          id="tab-analytics-aset"
          onClick={() => setActiveSection('aset')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSection === 'aset'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Aset & Inventaris Desa ({asetAnalytics.totalAsetCount})</span>
        </button>

        <button
          type="button"
          id="tab-analytics-bansos"
          onClick={() => setActiveSection('bansos')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSection === 'bansos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Bantuan Sosial & Kesejahteraan</span>
        </button>
      </div>

      {/* ── TOP KPI CARDS GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total KK & Jiwa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Kepala Keluarga (KK)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalKeluarga} KK</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Rata-rata: <strong className="text-blue-300">{rataRataJiwaPerKK}</strong> Jiwa/KK</span>
            <span className="text-[10px] text-slate-500">{selectedDusunFilter}</span>
          </div>
        </div>

        {/* Card 2: Total Penduduk Hidup & Rasio Gender */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Penduduk Hidup</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{totalPendudukHidup} Jiwa</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>L: <strong className="text-sky-300">{totalLakiHidup}</strong></span>
            <span>P: <strong className="text-pink-300">{totalPerempuanHidup}</strong></span>
            <span>Rasio: <strong className="text-emerald-300">{sexRatio}</strong></span>
          </div>
        </div>

        {/* Card 3: Total Nilai Aset Desa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Nilai Aset Desa</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono tracking-tight">
            {formatRupiahSingkat(asetAnalytics.totalNilaiPerolehan)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{asetAnalytics.totalAsetCount} Titik / Unit</span>
            <span className="text-emerald-400 font-semibold">{asetAnalytics.persentaseKondisiBaik}% Baik</span>
          </div>
        </div>

        {/* Card 4: Status Kematian & Mortalitas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Penduduk Meninggal</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {totalMeninggal} Jiwa
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Mortalitas: <strong className="text-rose-300">{cdrPer1000}‰</strong></span>
            <span>Tertib Arsip Catatan Sipil</span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SEKSI 1: KEPADATAN PENDUDUK DI SETIAP DUSUN (LAKI & PEREMPUAN) */}
      {/* ──────────────────────────────────────────────────────────── */}
      {(activeSection === 'all' || activeSection === 'demografi') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Kepadatan Penduduk di Setiap Wilayah Dusun
              </h3>
              <p className="text-xs text-slate-400">
                Disagregasi jumlah jiwa berdasarkan jenis kelamin (Laki-laki & Perempuan) serta perbandingan KK di Dusun I s/d IV
              </p>
            </div>
            {dusunTerpadat && (
              <span className="hidden sm:inline-flex text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full">
                Dusun Terpadat: <strong>{dusunTerpadat.dusun} ({dusunTerpadat.totalJiwa} Jiwa)</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Kepadatan Dusun (Grouped Bar Chart) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Grafik Komposisi Laki-Laki & Perempuan per Dusun
                  </h4>
                  <span className="text-[11px] text-slate-400">Data warga berstatus hidup</span>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dusunKepadatanData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="dusun" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any, name: string) => {
                        const labelMap: { [key: string]: string } = {
                          lakiLaki: 'Laki-Laki',
                          perempuan: 'Perempuan',
                          totalKK: 'Total Kepala Keluarga'
                        };
                        return [`${val} Orang`, labelMap[name] || name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="lakiLaki" name="Laki-Laki" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="perempuan" name="Perempuan" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalKK" name="Kepala Keluarga (KK)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rekapitulasi Rincian Kepadatan per Dusun */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Proporsi Distribusi Jiwa per Dusun
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Persentase sebaran warga terhadap total populasi desa
                </p>

                <div className="space-y-3.5">
                  {dusunKepadatanData.map((d, i) => (
                    <div key={i} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-white">{d.dusun}</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {d.totalJiwa} Jiwa ({d.persentase}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-sky-400 h-full transition-all"
                          style={{ width: `${d.totalJiwa > 0 ? (d.lakiLaki / d.totalJiwa) * 100 : 0}%` }}
                          title={`Laki-Laki: ${d.lakiLaki}`}
                        />
                        <div
                          className="bg-pink-400 h-full transition-all"
                          style={{ width: `${d.totalJiwa > 0 ? (d.perempuan / d.totalJiwa) * 100 : 0}%` }}
                          title={`Perempuan: ${d.perempuan}`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                        <span>L: <strong className="text-sky-300">{d.lakiLaki}</strong> • P: <strong className="text-pink-300">{d.perempuan}</strong></span>
                        <span>KK: <strong className="text-slate-200">{d.totalKK}</strong> • Rasio: {d.sexRatio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Laki-Laki
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block" /> Perempuan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> KK
                </span>
              </div>
            </div>
          </div>

          {/* ── ROW: PENDUDUK MENINGGAL & DISTRIBUSI UMUR ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart: Penduduk Meninggal (Mortalitas per Dusun & Gender) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserX className="w-4 h-4 text-rose-400" />
                    Statistik Mortalitas & Penduduk Meninggal
                  </h4>
                  <p className="text-xs text-slate-400">
                    Jumlah warga wafat tercatat per dusun berdasarkan jenis kelamin
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl">
                  Total Wafat: {totalMeninggal}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="sm:col-span-1 flex flex-col items-center justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="h-28 w-28 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mortalitasPieData}
                          innerRadius={30}
                          outerRadius={45}
                          dataKey="value"
                          paddingAngle={4}
                        >
                          {mortalitasPieData.map((entry, idx) => (
                            <Cell key={`cell-mort-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[11px] text-slate-400 text-center mt-1">
                    Meninggal: <strong className="text-rose-400">{totalMeninggal}</strong> / Hidup: <strong className="text-emerald-400">{totalPendudukHidup}</strong>
                  </div>
                </div>

                <div className="sm:col-span-2 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mortalitasByDusun} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="dusun" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <Bar dataKey="wafatLaki" name="Wafat Laki-Laki" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="wafatPerempuan" name="Wafat Perempuan" fill="#ec4899" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabel Daftar Warga Meninggal Tercatat */}
              {daftarMeninggal.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Daftar Penduduk Tercatat Wafat (Tertib Arsip):</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {daftarMeninggal.map((m, idx) => (
                      <div key={idx} className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-2 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-200">{m.nama}</div>
                          <div className="text-[10px] text-slate-400">
                            {m.dusun} • {m.jenisKelamin} • NIK: {m.nik}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                          Wafat: {m.tanggalMeninggal}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chart: Distribusi Umur (Piramida / Kelompok Usia) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Distribusi Kelompok Umur & Demografi Usia
                    </h4>
                    <p className="text-xs text-slate-400">
                      Disagregasi usia balita, anak, produktif, dan lansia berdasarkan jenis kelamin
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
                    Rata-rata: {umurGroupData.rataRataUsia} Thn
                  </span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={umurGroupData.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="kelompok" stroke="#94a3b8" fontSize={9.5} interval={0} angle={-10} textAnchor="end" />
                      <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <Bar dataKey="lakiLaki" name="Laki-Laki" fill="#0284c7" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="perempuan" name="Perempuan" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Indikator Usia Produktif & Dependency Ratio */}
              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-800">
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">Usia Produktif (15-59)</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    {umurGroupData.persenProduktif}% <span className="text-[10px] text-slate-400">({umurGroupData.usiaProduktifCount} Jiwa)</span>
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">Rasio Ketergantungan</div>
                  <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">
                    {umurGroupData.dependencyRatio}%
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">Lansia (60+ Thn)</div>
                  <div className="text-sm font-bold text-purple-400 font-mono mt-0.5">
                    {umurGroupData.totalLansia} Jiwa
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SEKSI 2: PEKERJAAN, PERKAWINAN & PERCERAIAN */}
      {/* ──────────────────────────────────────────────────────────── */}
      {(activeSection === 'all' || activeSection === 'pekerjaan_perkawinan') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                Sebaran Pekerjaan, Status Perkawinan & Kasus Perceraian
              </h3>
              <p className="text-xs text-slate-400">
                Struktur ketenagakerjaan dan status ikatan perkawinan warga Desa Beliti Jaya
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-amber-950/60 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full">
                Kasus Perceraian Hidup: <strong>{perkawinanData.totalCeraiHidup} Jiwa</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart: Distribusi Pekerjaan Penduduk */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      Mata Pencaharian & Profesi Utama Penduduk
                    </h4>
                    <p className="text-xs text-slate-400">
                      Klasifikasi lapangan usaha penduduk usia kerja di Beliti Jaya
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg">
                    TPAK: {pekerjaanData.tpakPersen}%
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pekerjaanData.list}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                      <YAxis type="category" dataKey="profesi" stroke="#94a3b8" fontSize={10} width={120} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                        formatter={(val: any) => [`${val} Penduduk`, 'Jumlah']}
                      />
                      <Bar dataKey="jumlah" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rangkuman Top Profesi */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-800">
                {pekerjaanData.list.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="bg-slate-800/60 p-2 rounded-xl">
                    <div className="text-[10px] text-slate-400 truncate">{item.profesi}</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {item.jumlah} <span className="text-[10px] text-slate-400">({item.persen}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart: Status Perkawinan & Perceraian */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <HeartCrack className="w-4 h-4 text-amber-400" />
                      Status Perkawinan & Statistik Perceraian
                    </h4>
                    <p className="text-xs text-slate-400">
                      Rasio pernikahan, belum kawin, cerai hidup, dan cerai mati
                    </p>
                  </div>
                </div>

                {/* Highlight Khusus Perceraian */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className="bg-blue-950/30 border border-blue-800/40 p-2.5 rounded-xl text-center">
                    <div className="text-[10px] text-blue-300">Belum Kawin</div>
                    <div className="text-lg font-bold text-blue-400 font-mono">
                      {perkawinanData.stats['Belum Kawin'].total}
                    </div>
                    <div className="text-[9px] text-slate-400">L: {perkawinanData.stats['Belum Kawin'].laki} • P: {perkawinanData.stats['Belum Kawin'].perempuan}</div>
                  </div>

                  <div className="bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl text-center">
                    <div className="text-[10px] text-emerald-300">Kawin</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      {perkawinanData.stats['Kawin'].total}
                    </div>
                    <div className="text-[9px] text-slate-400">L: {perkawinanData.stats['Kawin'].laki} • P: {perkawinanData.stats['Kawin'].perempuan}</div>
                  </div>

                  {/* Highlight Utama Perceraian Hidup */}
                  <div className="bg-amber-950/40 border border-amber-500/50 p-2.5 rounded-xl text-center shadow-md shadow-amber-950/30">
                    <div className="text-[10px] text-amber-300 font-bold flex items-center justify-center gap-1">
                      <HeartCrack className="w-3 h-3" /> Cerai Hidup
                    </div>
                    <div className="text-lg font-bold text-amber-400 font-mono">
                      {perkawinanData.totalCeraiHidup} Jiwa
                    </div>
                    <div className="text-[9px] text-amber-200/80">L: {perkawinanData.stats['Cerai Hidup'].laki} • P: {perkawinanData.stats['Cerai Hidup'].perempuan}</div>
                  </div>

                  <div className="bg-purple-950/30 border border-purple-800/40 p-2.5 rounded-xl text-center">
                    <div className="text-[10px] text-purple-300">Cerai Mati (Duda/Janda)</div>
                    <div className="text-lg font-bold text-purple-400 font-mono">
                      {perkawinanData.totalCeraiMati} Jiwa
                    </div>
                    <div className="text-[9px] text-slate-400">L: {perkawinanData.stats['Cerai Mati'].laki} • P: {perkawinanData.stats['Cerai Mati'].perempuan}</div>
                  </div>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perkawinanData.barComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="status" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <Bar dataKey="laki" name="Laki-Laki" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="perempuan" name="Perempuan" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Rasio Perceraian Hidup: <strong className="text-amber-300">{perkawinanData.rasioPerceraianHidup}%</strong> dari ikatan pernikahan</span>
                <span>Fasilitasi Konseling Keluarga Sakinah Desa</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SEKSI 3: INFORMASI, CHART & KEBUTUHAN ASET DESA */}
      {/* ──────────────────────────────────────────────────────────── */}
      {(activeSection === 'all' || activeSection === 'aset') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-purple-400" />
                Analisis Portofolio Aset & Buku Inventaris Desa
              </h3>
              <p className="text-xs text-slate-400">
                Akuntabilitas pengelolaan barang milik desa berdasarkan Permendagri No. 1 Tahun 2016
              </p>
            </div>
            
            {onOpenAssetModal && (
              <button
                type="button"
                id="btn-analytics-open-buku-inventaris"
                onClick={() => onOpenAssetModal('all')}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto border border-purple-400/40"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Buka Buku Inventaris Lengkap</span>
              </button>
            )}
          </div>

          {/* Asset Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="text-xs text-slate-400 mb-1">Aset Pembangunan (Fisik)</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {formatRupiahSingkat(asetAnalytics.nilaiPembangunan)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {asetAnalytics.asetPembangunanCount} Unit Gedung & Jalan
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="text-xs text-slate-400 mb-1">Aset Non-Pembangunan</div>
              <div className="text-xl font-bold text-sky-400 font-mono">
                {formatRupiahSingkat(asetAnalytics.nilaiNonPembangunan)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {asetAnalytics.asetNonPembangunanCount} Unit (Tanah, Alami, Kendaraan/Mesin)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="text-xs text-slate-400 mb-1">Indeks Kelaikan Fisik</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {asetAnalytics.persentaseKondisiBaik}% Baik
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {asetAnalytics.asetButuhPerhatian.length} Aset Butuh Pemeliharaan
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="text-xs text-slate-400 mb-1">Pemanfaatan Aktif</div>
              <div className="text-xl font-bold text-purple-400 font-mono">
                {asetAnalytics.totalAsetCount > 0 
                  ? Math.round((asetAnalytics.pemanfaatanBarData.find(p => p.status === 'Digunakan Aktif')?.jumlah || 0) / asetAnalytics.totalAsetCount * 100) 
                  : 0}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Berdampak Langsung Layanan Warga
              </div>
            </div>
          </div>

          {/* Row 1 Charts Aset: Nilai per Sub-Kategori & Kondisi Fisik */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart: Nilai Perolehan Aset per Sub-Kategori */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    Nilai Buku Aset per Sub-Kategori (Rupiah)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Akumulasi nilai perolehan per jenis sarana, gedung, tanah, dan peralatan
                  </p>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={asetAnalytics.subKategoriBarData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="subKategori" stroke="#94a3b8" fontSize={9.5} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${v}Jt`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any, name: string, item: any) => {
                        return [formatRupiah(item.payload.nilai), `${item.payload.unit} Unit/Titik`];
                      }}
                    />
                    <Bar dataKey="nilaiJuta" name="Nilai Perolehan (Juta Rp)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Kondisi Fisik Aset & Kelaikan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-400" />
                  Kondisi Fisik Barang Milik Desa
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Kelayakan teknis aset untuk usulan pemeliharaan
                </p>

                <div className="h-48 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={asetAnalytics.kondisiPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {asetAnalytics.kondisiPieData.map((entry, index) => (
                          <Cell key={`cell-kondisi-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  {asetAnalytics.kondisiPieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-300">{d.name}</span>
                      </div>
                      <span className="font-bold text-white font-mono">
                        {d.value} Aset ({asetAnalytics.totalAsetCount > 0 ? Math.round((d.value / asetAnalytics.totalAsetCount) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Row 2 Charts Aset: Sebaran Dusun & Sumber Dana */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sebaran Nilai Aset per Dusun */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    Distribusi Nilai & Titik Aset per Dusun
                  </h4>
                  <p className="text-xs text-slate-400">
                    Penyebaran infrastruktur fisik dan aset desa antar dusun
                  </p>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={asetAnalytics.asetPerDusunData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="dusun" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${v}Jt`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any, name: string, item: any) => {
                        return [formatRupiah(item.payload.totalNilai), `${item.payload.totalUnit} Unit/Titik Aset`];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Bar dataKey="nilaiJuta" name="Nilai Aset (Juta Rp)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalUnit" name="Jumlah Titik/Unit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Komposisi Sumber Dana Pengadaan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-purple-400" />
                  Sumber Pembiayaan Pengadaan Aset Desa
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Proporsi Dana Desa (APBN), ADD, Bantuan Keuangan, dan BUMDes
                </p>

                <div className="space-y-2.5">
                  {asetAnalytics.sumberDanaPieData.map((sd, idx) => (
                    <div key={idx} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-white truncate">{sd.name}</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {formatRupiahSingkat(sd.value)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${asetAnalytics.totalNilaiPerolehan > 0 ? (sd.value / asetAnalytics.totalNilaiPerolehan) * 100 : 0}%`,
                            backgroundColor: sd.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* KEBUTUHAN LAINNYA: PANEL ASET BUTUH PEMELIHARAAN & TOP ASET STRATEGIS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Aset Butuh Pemeliharaan (Maintenance Alert) */}
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Peringatan Pemeliharaan & Perbaikan Aset
                  </h4>
                  <p className="text-xs text-slate-400">
                    Aset berkondisi Rusak Ringan / Rusak Berat / Dalam Pemeliharaan
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg">
                  {asetAnalytics.asetButuhPerhatian.length} Aset
                </span>
              </div>

              {asetAnalytics.asetButuhPerhatian.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Seluruh aset dalam kondisi prima dan layak pakai.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {asetAnalytics.asetButuhPerhatian.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectAset && onSelectAset(item)}
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate">{item.namaAset}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.kondisi === 'Rusak Berat'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {item.kondisi}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {item.dusun} • PJ: {item.penanggungJawab} • Nilai: {formatRupiah(item.nilaiPerolehan)}
                        </div>
                        {item.keterangan && (
                          <div className="text-[10px] text-amber-300/90 italic mt-0.5 truncate">
                            Catatan: {item.keterangan}
                          </div>
                        )}
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Aset Strategis Bernilai Tertinggi */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Aset Desa Bernilai Strategis Tertinggi
                  </h4>
                  <p className="text-xs text-slate-400">
                    Aset dengan nilai kapitalisasi terbesar bagi Desa Beliti Jaya
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {asetAnalytics.topNilaiAset.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectAset && onSelectAset(item)}
                    className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.foto}
                        alt={item.namaAset}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                        onError={(e) => {
                          (e.target as any).src = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{item.namaAset}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.subKategori} • {item.dusun} ({item.tahunPengadaan})
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {formatRupiahSingkat(item.nilaiPerolehan)}
                      </div>
                      <span className="text-[10px] text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                        {item.kodeRegister}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SEKSI 4: BANTUAN SOSIAL & KESEJAHTERAAN */}
      {/* ──────────────────────────────────────────────────────────── */}
      {(activeSection === 'all' || activeSection === 'bansos') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                Distribusi Bantuan Sosial & Kesejahteraan DTKS
              </h3>
              <p className="text-xs text-slate-400">
                Penyaluran PKH, BPNT, BLT Dana Desa, Beras PBP, dan profil desil kemiskinan
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400">
              Anggaran: {formatRupiah(totalAnggaranBansosBulanan)} / bln
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bansos Bar Chart */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Penerima Manfaat Berdasarkan Program Bantuan
                  </h4>
                  <p className="text-xs text-slate-400">
                    Jumlah keluarga terdata penerima manfaat PKH, BPNT, BLT, PIP, KIS
                  </p>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bansosChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="program" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="penerima" name="Jumlah Keluarga (KK)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Desil / Kesejahteraan Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <PieChartIcon className="w-4 h-4 text-emerald-400" />
                  Klasifikasi Kesejahteraan DTKS
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Komposisi Desil 1 s/d Non-DTKS
                </p>

                <div className="h-52 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={desilPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {desilPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  {desilPieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-400 truncate">{d.name.split(' ')[0]}: <strong className="text-white">{d.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Rentang Penghasilan Pekerja */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Distribusi Rentang Penghasilan Tenaga Kerja Penduduk
                </h4>
                <p className="text-xs text-slate-400">
                  Sebaran penghasilan bulanan warga Desa Beliti Jaya yang berstatus bekerja
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {incomeGroups.map((grp, idx) => (
                <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center">
                  <div className="text-xs font-semibold text-slate-300">{grp.range}</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                    {grp.count} <span className="text-xs font-normal text-slate-400">Orang</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {activePenduduk.filter(p => p.penghasilanBulanan > 0).length > 0
                      ? `${Math.round((grp.count / activePenduduk.filter(p => p.penghasilanBulanan > 0).length) * 100)}% dari pekerja`
                      : '0%'}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

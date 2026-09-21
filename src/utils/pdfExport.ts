import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Keluarga, Penduduk, DesaProfile, AsetDesa } from '../types';
import { StorageService } from '../services/storageService';
import { getRasterizedLogo } from './imageUtils';

/**
 * Helper to format currency
 */
export const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Helper to format date into Indonesian standard
 */
export const formatIndonesianDate = (dateStr?: string | Date): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Helper to calculate age
 */
export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const diff = Date.now() - new Date(birthDate).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

/**
 * Draw Official Government Kop Surat Header with Village Logo
 * Returns the bottom Y position of the double-line divider
 */
export const drawOfficialKopSurat = async (
  doc: jsPDF,
  orientation: 'portrait' | 'landscape' = 'portrait',
  customProfile?: DesaProfile
): Promise<number> => {
  const profile = customProfile || StorageService.getDesaProfile();
  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const centerX = pageWidth / 2;
  const leftMargin = 14;
  const rightMargin = pageWidth - 14;

  // Render Official Village Logo on the left of Kop Surat
  if (profile.logoDesa) {
    try {
      const rasterLogo = await getRasterizedLogo(profile.logoDesa);
      if (rasterLogo) {
        if (orientation === 'landscape') {
          doc.addImage(rasterLogo, 'PNG', 16, 8.5, 22, 25);
        } else {
          doc.addImage(rasterLogo, 'PNG', 14, 9, 20, 24);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat logo desa pada kop surat:', err);
    }
  }

  if (orientation === 'landscape') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`PEMERINTAH KABUPATEN ${profile.kabupaten.toUpperCase()}`, centerX, 13, { align: 'center' });

    doc.setFontSize(11.5);
    doc.text(`KECAMATAN ${profile.kecamatan.toUpperCase()}`, centerX, 18.5, { align: 'center' });

    doc.setFontSize(15);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`DESA ${profile.namaDesa.toUpperCase()}`, centerX, 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Alamat: ${profile.alamatKantor}`, centerX, 30, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Layanan SIG Kependudukan & Bantuan Sosial (DTKS) • Kode Pos: ${profile.kodePos} • Telp: ${profile.teleponDesa || '-'}`, centerX, 34, { align: 'center' });

    // Official Kop Double Line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(leftMargin, 36.5, rightMargin, 36.5);
    doc.setLineWidth(0.25);
    doc.line(leftMargin, 37.5, rightMargin, 37.5);

    return 37.5;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`PEMERINTAH KABUPATEN ${profile.kabupaten.toUpperCase()}`, centerX, 13.5, { align: 'center' });

    doc.setFontSize(10.5);
    doc.text(`KECAMATAN ${profile.kecamatan.toUpperCase()}`, centerX, 18.5, { align: 'center' });

    doc.setFontSize(13.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`PEMERINTAH DESA ${profile.namaDesa.toUpperCase()}`, centerX, 24.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Alamat: ${profile.alamatKantor}`, centerX, 29.5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Layanan SIG Kependudukan & DTKS Online • Kode Pos: ${profile.kodePos} • Telp/Email: ${profile.teleponDesa || profile.emailDesa}`, centerX, 33.5, { align: 'center' });

    // Official Kop Double Line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(leftMargin, 36.5, rightMargin, 36.5);
    doc.setLineWidth(0.25);
    doc.line(leftMargin, 37.5, rightMargin, 37.5);

    return 37.5;
  }
};

/**
 * 1. Export Complete Family (Kartu Keluarga) Profile to PDF
 */
export const generateFamilyProfilePDF = async (keluarga: Keluarga, customProfile?: DesaProfile): Promise<void> => {
  const profile = customProfile || StorageService.getDesaProfile();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  await drawOfficialKopSurat(doc, 'portrait', profile);

  // Title Document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PROFIL BIODATA KELUARGA & STATUS KESEJAHTERAAN SOSIAL', 105, 46, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Registrasi GIS: REG-KK/${keluarga.noKk}/2026`, 105, 50.5, { align: 'center' });

  // Box for Main KK Info
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(14, 54, 182, 38, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('IDENTITAS KARTU KELUARGA (KK)', 18, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  // Column 1
  doc.text(`Nomor Kartu Keluarga`, 18, 66);
  doc.text(`:  ${keluarga.noKk}`, 58, 66);
  
  doc.text(`Nama Kepala Keluarga`, 18, 71);
  doc.setFont('helvetica', 'bold');
  doc.text(`:  ${keluarga.namaKepalaKeluarga}`, 58, 71);
  doc.setFont('helvetica', 'normal');

  doc.text(`NIK Kepala Keluarga`, 18, 76);
  doc.text(`:  ${keluarga.nikKepala}`, 58, 76);

  doc.text(`Alamat Domisili`, 18, 81);
  doc.text(`:  ${keluarga.alamat}, ${keluarga.dusun} (RT ${keluarga.rt})`, 58, 81);

  doc.text(`Koordinat Spasial GIS`, 18, 86);
  doc.text(`:  Lat: ${keluarga.koordinat.lat.toFixed(5)}, Lng: ${keluarga.koordinat.lng.toFixed(5)}`, 58, 86);

  // Column 2
  const col2X = 118;
  doc.text(`Jumlah Anggota`, col2X, 66);
  doc.text(`:  ${keluarga.anggotaKeluarga.length} Jiwa`, col2X + 32, 66);

  doc.text(`Status Kesejahteraan`, col2X, 71);
  doc.setFont('helvetica', 'bold');
  doc.text(`:  ${keluarga.statusKesejahteraan}`, col2X + 32, 71);
  doc.setFont('helvetica', 'normal');

  doc.text(`Penerima Bansos`, col2X, 76);
  doc.text(`:  ${keluarga.penerimaBansos ? 'YA (Penerima Aktif)' : 'TIDAK (Non-Bansos)'}`, col2X + 32, 76);

  doc.text(`Program Bantuan`, col2X, 81);
  doc.text(`:  ${keluarga.daftarBansos.length > 0 ? keluarga.daftarBansos.join(', ') : '-'}`, col2X + 32, 81);

  doc.text(`Nominal Bantuan/Bln`, col2X, 86);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`:  ${keluarga.totalNominalBantuanBulanan > 0 ? formatRupiah(keluarga.totalNominalBantuanBulanan) : 'Rp 0'}`, col2X + 32, 86);

  // Table of Family Members
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR ANGGOTA KELUARGA TERCATAT', 14, 98);

  const memberRows = keluarga.anggotaKeluarga.map((m, idx) => [
    idx + 1,
    m.nama,
    m.nik,
    m.statusKeluarga,
    m.jenisKelamin === 'Laki-Laki' ? 'L' : 'P',
    `${calculateAge(m.tanggalLahir)} Th`,
    m.pendidikan,
    m.pekerjaan,
    m.penghasilanBulanan > 0 ? formatRupiah(m.penghasilanBulanan) : '-',
    m.bantuanPribadi && m.bantuanPribadi.length > 0 ? m.bantuanPribadi.join(', ') : (m.disabilitas || '-'),
    m.statusKematian
  ]);

  autoTable(doc, {
    startY: 101,
    head: [[
      'No',
      'Nama Anggota',
      'NIK',
      'SHDK',
      'JK',
      'Usia',
      'Pendidikan',
      'Pekerjaan',
      'Penghasilan',
      'Bantuan/Khusus',
      'Status'
    ]],
    body: memberRows,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105], // Emerald-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { fontStyle: 'bold', cellWidth: 32 },
      2: { fontStyle: 'normal', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 7 },
      5: { halign: 'center', cellWidth: 11 },
      6: { cellWidth: 18 },
      7: { cellWidth: 20 },
      8: { halign: 'right', cellWidth: 19 },
      9: { cellWidth: 16 },
      10: { halign: 'center', cellWidth: 10 }
    },
    margin: { left: 14, right: 14 }
  });

  // Building & Sanitation Section
  // @ts-ignore
  let currentY = (doc as any).lastAutoTable?.finalY + 6 || 170;

  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('SPESIFIKASI FISIK RUMAH & SANITASI LINGKUNGAN', 14, currentY);

  const houseData = [
    [
      'Tipe Bangunan', `: ${keluarga.kondisiRumah.tipeBangunan}`,
      'Sumber Air Minum', `: ${keluarga.kondisiRumah.sumberAirMinum}`
    ],
    [
      'Luas Bangunan', `: ${keluarga.kondisiRumah.luasBangunanM2} m²`,
      'Daya Listrik', `: ${keluarga.kondisiRumah.dayaListrik}`
    ],
    [
      'Status Kepemilikan', `: ${keluarga.kondisiRumah.statusKepemilikan}`,
      'Fasilitas Jamban', `: ${keluarga.kondisiRumah.fasilitasJamban}`
    ],
    [
      'Material Lantai', `: ${keluarga.kondisiRumah.kondisiLantai}`,
      'Material Dinding', `: ${keluarga.kondisiRumah.kondisiDinding}`
    ]
  ];

  autoTable(doc, {
    startY: currentY + 2,
    body: houseData,
    theme: 'plain',
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 1.5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // Signature Section
  // @ts-ignore
  let signatureY = (doc as any).lastAutoTable?.finalY + 10 || 225;

  if (signatureY > 240) {
    doc.addPage();
    signatureY = 25;
  }

  const currentDate = formatIndonesianDate();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Left Sign: Kepala Keluarga
  doc.text('Menyatakan Sebenarnya,', 25, signatureY);
  doc.text('Kepala Keluarga', 25, signatureY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${keluarga.namaKepalaKeluarga} )`, 25, signatureY + 24);

  // Right Sign: Kepala Desa
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.namaDesa}, ${currentDate}`, 135, signatureY);
  doc.text(`Kepala Desa ${profile.namaDesa}`, 135, signatureY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${profile.kepalaDesa.nama} )`, 135, signatureY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(profile.kepalaDesa.nip ? `NIP. ${profile.kepalaDesa.nip}` : 'NIP. -', 135, signatureY + 28);

  // Footer Note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen resmi ini dicetak dari Sistem Informasi GIS & DTKS Desa ${profile.namaDesa} pada ${new Date().toLocaleString('id-ID')}`, 14, 288);

  // Download PDF
  doc.save(`Profil_KK_${keluarga.noKk}_${keluarga.namaKepalaKeluarga.replace(/\s+/g, '_')}.pdf`);
};

/**
 * 2. Export Individual Resident (Biodata Penduduk Perorangan) to PDF
 */
export const generateResidentProfilePDF = async (penduduk: Penduduk, keluarga?: Keluarga, customProfile?: DesaProfile): Promise<void> => {
  const profile = customProfile || StorageService.getDesaProfile();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  await drawOfficialKopSurat(doc, 'portrait', profile);

  // Title Document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('SURAT BIODATA KEPENDUDUKAN PERORANGAN', 105, 46, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Registrasi: REG-PEND/${penduduk.nik}/2026`, 105, 50.5, { align: 'center' });

  // Photo Box Frame (Placeholder Pas Foto 3x4 cm)
  const photoX = 158;
  const photoY = 56;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.rect(photoX, photoY, 32, 42, 'FD');
  
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PAS FOTO', photoX + 16, photoY + 19, { align: 'center' });
  doc.text('3 x 4 cm', photoX + 16, photoY + 24, { align: 'center' });

  // Biodata Table Grid
  const age = calculateAge(penduduk.tanggalLahir);
  const dusunInfo = keluarga ? `${keluarga.alamat}, ${keluarga.dusun} (RT ${keluarga.rt})` : 'Desa Beliti Jaya, Kec. Muara Kelingi';

  const residentTable = [
    ['1.', 'Nomor Induk Kependudukan (NIK)', `:  ${penduduk.nik}`],
    ['2.', 'Nomor Kartu Keluarga (No KK)', `:  ${penduduk.noKk}`],
    ['3.', 'Nama Lengkap', `:  ${penduduk.nama.toUpperCase()}`],
    ['4.', 'Tempat, Tanggal Lahir', `:  ${penduduk.tempatLahir}, ${formatIndonesianDate(penduduk.tanggalLahir)} (${age} Tahun)`],
    ['5.', 'Jenis Kelamin', `:  ${penduduk.jenisKelamin}`],
    ['6.', 'Agama', `:  ${penduduk.agama || 'Islam'}`],
    ['7.', 'Status Hubungan Keluarga (SHDK)', `:  ${penduduk.statusKeluarga}`],
    ['8.', 'Status Perkawinan', `:  ${penduduk.statusPerkawinan || (age > 20 ? 'Kawin' : 'Belum Kawin')}`],
    ['9.', 'Pendidikan Terakhir', `:  ${penduduk.pendidikan}`],
    ['10.', 'Pekerjaan Utama', `:  ${penduduk.pekerjaan}`],
    ['11.', 'Penghasilan Bulanan', `:  ${penduduk.penghasilanBulanan > 0 ? formatRupiah(penduduk.penghasilanBulanan) : 'Tidak Berpenghasilan / Nol'}`],
    ['12.', 'Alamat Lengkap Domisili', `:  ${dusunInfo}`],
    ['13.', 'Desa / Kelurahan', `:  Beliti Jaya`],
    ['14.', 'Kecamatan', `:  Muara Kelingi`],
    ['15.', 'Kabupaten / Provinsi', `:  Musi Rawas / Sumatera Selatan`],
    ['16.', 'Bantuan Pribadi / Sosial', `:  ${penduduk.bantuanPribadi && penduduk.bantuanPribadi.length > 0 ? penduduk.bantuanPribadi.join(', ') : 'Tidak Ada'}`],
    ['17.', 'Penyandang Disabilitas / Khusus', `:  ${penduduk.disabilitas || 'Tidak Ada (Normal)'}`],
    ['18.', 'Status Keberadaan / Vital', `:  ${penduduk.statusKematian}`]
  ];

  autoTable(doc, {
    startY: 55,
    body: residentTable,
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 1.8
    },
    columnStyles: {
      0: { cellWidth: 7, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 58, fontStyle: 'bold' },
      2: { cellWidth: 80 }
    },
    margin: { left: 14, right: 50 }
  });

  // Summary box / Welfare note
  // @ts-ignore
  const nextY = (doc as any).lastAutoTable?.finalY + 6 || 185;

  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(14, nextY, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text('CATATAN VERIFIKASI & LEGALITAS SISTEM DESA:', 18, nextY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Data kependudukan di atas telah diverifikasi secara spasial melalui basis data SAKEP & DTKS Desa Beliti Jaya,',
    18, nextY + 11
  );
  doc.text(
    'dan dapat dipergunakan sebagai rujukan resmi pengurusan administrasi kependudukan, program bansos, dan layanan publik.',
    18, nextY + 16
  );

  // Signatures
  const signatureY = nextY + 29;
  const currentDate = formatIndonesianDate();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Resident Signature
  doc.text('Pemilik Biodata,', 25, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${penduduk.nama.toUpperCase()} )`, 25, signatureY + 22);

  // Kepala Desa Signature
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.namaDesa}, ${currentDate}`, 135, signatureY);
  doc.text(`Kepala Desa ${profile.namaDesa}`, 135, signatureY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${profile.kepalaDesa.nama} )`, 135, signatureY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(profile.kepalaDesa.nip ? `NIP. ${profile.kepalaDesa.nip}` : 'NIP. -', 135, signatureY + 26);

  // Security authenticity stamp line
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen Biodata Resmi terenkripsi • Dicetak oleh Sistem GIS Desa ${profile.namaDesa} pada ${new Date().toLocaleString('id-ID')}`, 14, 288);

  // Save PDF
  doc.save(`Biodata_Penduduk_${penduduk.nik}_${penduduk.nama.replace(/\s+/g, '_')}.pdf`);
};

/**
 * 4. Export Official Village Asset Inventory Sheet (Lembar KIB Aset Desa) to PDF
 */
export const generateAssetProfilePDF = async (aset: AsetDesa, customProfile?: DesaProfile): Promise<void> => {
  const profile = customProfile || StorageService.getDesaProfile();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const kopY = await drawOfficialKopSurat(doc, 'portrait', profile);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LEMBAR DOKUMEN INVENTARIS BARANG (KIB) & SPASIAL ASET DESA', 105, kopY + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kode Registrasi KIB: ${aset.kodeRegister} • Format Sesuai Permendagri No. 1 Tahun 2016`, 105, kopY + 12.5, { align: 'center' });

  // Specification Table
  autoTable(doc, {
    startY: kopY + 17,
    head: [
      [{ content: 'PARAMETER INVENTARIS ASET', styles: { halign: 'left', fillColor: [15, 23, 42] } },
       { content: 'RINCIAN DATA & SPESIFIKASI TEKNIS', styles: { halign: 'left', fillColor: [15, 23, 42] } }]
    ],
    body: [
      ['Nama Aset Desa', aset.namaAset],
      ['Kode Register (KIB)', aset.kodeRegister],
      ['Kategori Sifat Aset', aset.kategori === 'pembangunan' ? 'Aset Pembangunan Fisik (Infrastruktur / Sarpras)' : 'Aset Non-Pembangunan'],
      ['Sub-Kategori / Klasifikasi', aset.subKategori || '-'],
      ['Nilai Perolehan Aset', formatRupiah(aset.nilaiPerolehan)],
      ['Tahun Pengadaan', `${aset.tahunPengadaan}`],
      ['Sumber Pembiayaan / Dana', aset.sumberDana || 'APBDes'],
      ['Kondisi Fisik Terkini', aset.kondisi || 'Baik'],
      ['Dimensi Fisik / Volume', aset.luasAtauVolume || '-'],
      ['Status Pemanfaatan', aset.statusPemanfaatan || 'Digunakan untuk Pelayanan'],
      ['Penanggung Jawab / Pengelola', aset.penanggungJawab || 'Pemerintah Desa'],
      ['Wilayah Lokasi Dusun', `${aset.dusun}, Desa Beliti Jaya`],
      ['Titik Koordinat Geospasial (GPS)', `Lat: ${aset.koordinat.lat.toFixed(6)}, Lng: ${aset.koordinat.lng.toFixed(6)}`],
      ['Deskripsi & Catatan Lapangan', aset.keterangan || 'Tercatat sah dalam Buku Inventaris Desa Beliti Jaya']
    ],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65, textColor: [30, 41, 59] },
      1: { cellWidth: 117, textColor: [51, 65, 85] }
    }
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || 160;

  // Validation Note
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('LEGALITAS & VALIDASI SISTEM INFORMASI GEOGRAFIS DESA:', 14, finalTableY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Aset ini terverifikasi secara spasial dan terdaftar dalam Buku Inventaris Desa Beliti Jaya berpedoman pada',
    14, finalTableY + 12
  );
  doc.text(
    'Permendagri Republik Indonesia Nomor 1 Tahun 2016 tentang Pengelolaan Aset Desa.',
    14, finalTableY + 15.5
  );

  // Signature Section
  const signY = finalTableY + 26;
  const currentDate = formatIndonesianDate();

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // Left Signature: Petugas Pengelola Aset
  doc.text('Petugas Pengelola Aset / Kaur,', 25, signY);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${aset.penanggungJawab || 'Pengelola Aset Desa'} )`, 25, signY + 20);

  // Right Signature: Kepala Desa
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.namaDesa}, ${currentDate}`, 135, signY);
  doc.text(`Kepala Desa ${profile.namaDesa}`, 135, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${profile.kepalaDesa.nama} )`, 135, signY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(profile.kepalaDesa.nip ? `NIP. ${profile.kepalaDesa.nip}` : 'NIP. -', 135, signY + 24);

  // Footer stamp
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dicetak melalui SIG Desa Beliti Jaya pada ${new Date().toLocaleString('id-ID')} • Lembar KIB Resmi`, 14, 288);

  doc.save(`Lembar_KIB_${aset.kodeRegister.replace(/[^a-zA-Z0-9]/g, '_')}_${aset.namaAset.replace(/\s+/g, '_')}.pdf`);
};

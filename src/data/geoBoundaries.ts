// Data Batas Wilayah Administratif Desa Beliti Jaya & Dusun I-IV
// Kecamatan Muara Kelingi, Kabupaten Musi Rawas, Sumatera Selatan

export interface DusunBoundary {
  id: string;
  name: string;
  code: string;
  color: string;
  borderColor: string;
  rtList: string[];
  kepalaDusun: string;
  luasHa: number;
  coordinates: [number, number][];
  center: [number, number];
  deskripsi: string;
}

export const DESA_BELITI_JAYA_INFO = {
  namaDesa: 'Beliti Jaya',
  kecamatan: 'Muara Kelingi',
  kabupaten: 'Musi Rawas',
  provinsi: 'Sumatera Selatan',
  kodePos: '31663',
  luasWilayahHa: 1420,
  luasWilayahKm2: 14.2,
  koordinatPusat: {
    lat: -2.9661,
    lng: 103.1581,
    dms: `2°57'58" LS, 103°09'29" BT`
  },
  batasWilayah: {
    utara: 'Desa Mandi Aur / Sungai Musi',
    selatan: 'Desa Temuan Jaya / Perkebunan Sawit',
    timur: 'Desa Mambang / Wilayah Hutan Lindung',
    barat: 'Desa Lubuk Rengas / Aliran Sungai Beliti'
  }
};

// Poligon Utama Batas Desa Beliti Jaya (Kecamatan Muara Kelingi, Kabupaten Musi Rawas)
export const VILLAGE_BOUNDARY_COORDINATES: [number, number][] = [
  [-2.9560, 103.1480],
  [-2.9550, 103.1590],
  [-2.9580, 103.1670],
  [-2.9630, 103.1710],
  [-2.9710, 103.1690],
  [-2.9770, 103.1620],
  [-2.9760, 103.1510],
  [-2.9700, 103.1460],
  [-2.9620, 103.1450],
  [-2.9560, 103.1480]
];

// Poligon Sub-Wilayah Dusun I s/d Dusun IV (Rapi, Contiguous & Terbagi Jelas)
export const DUSUN_BOUNDARIES: DusunBoundary[] = [
  {
    id: 'dusun-1',
    name: 'Dusun I',
    code: 'DS-01',
    color: '#10b981', // Emerald
    borderColor: '#34d399',
    rtList: ['RT 01', 'RT 02'],
    kepalaDusun: 'Bpk. Herman Sawiran',
    luasHa: 340,
    center: [-2.9615, 103.1540],
    deskripsi: 'Kawasan Kantor Kepala Desa, Pemukiman Utama & Akses Jalan Utama Beliti',
    coordinates: [
      [-2.9560, 103.1480],
      [-2.9550, 103.1590],
      [-2.9661, 103.1581], // Titik temu tengah (Kantor Desa)
      [-2.9660, 103.1490],
      [-2.9620, 103.1450],
      [-2.9560, 103.1480]
    ]
  },
  {
    id: 'dusun-2',
    name: 'Dusun II',
    code: 'DS-02',
    color: '#06b6d4', // Cyan
    borderColor: '#22d3ee',
    rtList: ['RT 03', 'RT 04'],
    kepalaDusun: 'Bpk. Ahmad Fauzi',
    luasHa: 380,
    center: [-2.9710, 103.1530],
    deskripsi: 'Kawasan Pertanian Padi Sawah, Perkebunan Karet Rakyat & Balai Posyandu',
    coordinates: [
      [-2.9660, 103.1490],
      [-2.9661, 103.1581], // Titik temu tengah
      [-2.9730, 103.1575],
      [-2.9760, 103.1510],
      [-2.9700, 103.1460],
      [-2.9660, 103.1490]
    ]
  },
  {
    id: 'dusun-3',
    name: 'Dusun III',
    code: 'DS-03',
    color: '#f59e0b', // Amber
    borderColor: '#fbbf24',
    rtList: ['RT 05', 'RT 06'],
    kepalaDusun: 'Bpk. Sulaiman Effendi',
    luasHa: 320,
    center: [-2.9610, 103.1640],
    deskripsi: 'Kawasan Sentra Pendidikan (SD Negeri Beliti Jaya), Masjid Jami Al-Ikhlas & Pertokoan',
    coordinates: [
      [-2.9550, 103.1590],
      [-2.9580, 103.1670],
      [-2.9630, 103.1710],
      [-2.9665, 103.1650],
      [-2.9661, 103.1581], // Titik temu tengah
      [-2.9550, 103.1590]
    ]
  },
  {
    id: 'dusun-4',
    name: 'Dusun IV',
    code: 'DS-04',
    color: '#8b5cf6', // Violet/Purple
    borderColor: '#a78bfa',
    rtList: ['RT 07', 'RT 08'],
    kepalaDusun: 'Bpk. Zulkarnain',
    luasHa: 380,
    center: [-2.9710, 103.1640],
    deskripsi: 'Kawasan Perkebunan Sawit, Poskesdes Beliti Jaya & Pemukiman Sektor Selatan',
    coordinates: [
      [-2.9661, 103.1581], // Titik temu tengah
      [-2.9665, 103.1650],
      [-2.9710, 103.1690],
      [-2.9770, 103.1620],
      [-2.9730, 103.1575],
      [-2.9661, 103.1581]
    ]
  }
];

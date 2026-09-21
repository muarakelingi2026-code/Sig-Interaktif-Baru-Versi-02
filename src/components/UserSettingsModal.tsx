import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole, RolePermissions } from '../types';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  UserCheck, 
  Key, 
  CheckCircle2, 
  X, 
  Lock, 
  Unlock, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  UserCog, 
  FileText, 
  BarChart3, 
  Database, 
  MapPin, 
  Building2,
  RefreshCw,
  Info,
  Upload,
  Camera,
  Image as ImageIcon,
  Check,
  RotateCcw
} from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onSaveUsers: (newUsers: User[]) => void;
  permissions: RolePermissions;
  onSavePermissions: (newPermissions: RolePermissions) => void;
  onSwitchUser: (user: User) => void;
  onAddNewKeluarga?: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSaveUsers,
  permissions,
  onSavePermissions,
  onSwitchUser,
  onAddNewKeluarga
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<'permissions' | 'accounts'>('permissions');
  
  // Local state for permissions editing
  const [localPermissions, setLocalPermissions] = useState<RolePermissions>(permissions);
  const [isSaved, setIsSaved] = useState(false);

  // Local state for user management & editing form
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('operator');
  const [formJabatan, setFormJabatan] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formCardRef = useRef<HTMLDivElement | null>(null);

  // Sync state if props change
  React.useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  if (!isOpen) return null;

  // Proteksi Akses: Menu Setting User & RBAC hanya dapat diakses oleh Administrator
  if (!isAdmin) {
    return (
      <div 
        id="user-settings-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
      >
        <div 
          id="user-settings-unauthorized-card"
          className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100 text-center space-y-4"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Akses Dibatasi (Khusus Administrator)</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Menu <strong>Setting User & RBAC</strong> hanya dapat diakses oleh akun dengan peran <strong>Administrator</strong>. 
              Operator KK dan Operator Aset tidak memiliki izin untuk mengelola akun maupun wewenang sistem.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              id="btn-close-unauthorized-user-settings"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700 active:scale-98"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleMasterOperatorRestriction = (onlyAddKK: boolean) => {
    if (!isAdmin) return;
    const updated: RolePermissions = {
      ...localPermissions,
      operatorOnlyAddKK: onlyAddKK,
      // If restricted, turn off non-essential permissions for operator
      ...(onlyAddKK ? {
        allowOperatorAnalytics: false,
        allowOperatorExport: false,
        allowOperatorEditKK: false,
        allowOperatorDeleteKK: false,
        allowOperatorVillageProfile: false,
      } : {})
    };
    setLocalPermissions(updated);
  };

  const handleSavePermissionsClick = () => {
    if (!isAdmin) return;
    onSavePermissions(localPermissions);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormRole('operator');
    setFormJabatan('');
    setFormAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
    setPhotoError(null);
    setIsUserFormOpen(true);
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormRole(user.role);
    setFormJabatan(user.jabatan);
    setFormAvatar(user.avatar || (user.role === 'admin'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    ));
    setPhotoError(null);
    setIsUserFormOpen(true);
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleCloseUserForm = () => {
    setIsUserFormOpen(false);
    setEditingUserId(null);
    setPhotoError(null);
  };

  const handleProcessPhotoFile = async (file: File) => {
    setPhotoError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoError('Format file harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Ukuran file foto melebihi 5 MB. Harap pilih foto yang lebih kecil.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImage(file, 400, 400, 0.85);
      setFormAvatar(compressed);
    } catch (err) {
      console.error('Failed to compress user avatar:', err);
      setPhotoError('Gagal memproses gambar foto. Silakan coba kembali.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessPhotoFile(file);
    }
    e.target.value = '';
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessPhotoFile(file);
    }
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      setPhotoError('Nama lengkap dan username wajib diisi.');
      return;
    }

    const cleanUsername = formUsername.toLowerCase().trim().replace(/^@+/, '');

    // Check duplicate username (kecuali user yang sedang diedit)
    const duplicate = users.find(
      u => u.username.toLowerCase() === cleanUsername && u.id !== editingUserId
    );
    if (duplicate) {
      setPhotoError(`Username @${cleanUsername} sudah digunakan oleh ${duplicate.name}. Silakan gunakan username lain.`);
      return;
    }

    const fallbackAvatar = formRole === 'admin'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

    if (editingUserId) {
      // Edit data user existing
      const updatedUsers = users.map(u => {
        if (u.id === editingUserId) {
          return {
            ...u,
            name: formName.trim(),
            username: cleanUsername,
            role: formRole,
            jabatan: formJabatan.trim() || (formRole === 'admin' ? 'Staf Administrator' : 'Operator Data Kependudukan'),
            avatar: formAvatar || fallbackAvatar
          };
        }
        return u;
      });
      onSaveUsers(updatedUsers);
    } else {
      // Tambah user baru
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: formName.trim(),
        username: cleanUsername,
        role: formRole,
        jabatan: formJabatan.trim() || (formRole === 'admin' ? 'Staf Administrator' : 'Operator Data Kependudukan'),
        avatar: formAvatar || fallbackAvatar
      };
      onSaveUsers([...users, newUser]);
    }

    handleCloseUserForm();
  };

  const handleDeleteUser = (userId: string) => {
    if (!isAdmin) return;
    if (userId === currentUser.id) {
      alert('Tidak dapat menghapus akun yang sedang aktif digunakan!');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus akun pengguna ini?')) {
      onSaveUsers(users.filter(u => u.id !== userId));
      if (editingUserId === userId) {
        handleCloseUserForm();
      }
    }
  };

  return (
    <div 
      id="user-settings-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
    >
      <div 
        id="user-settings-modal-card" 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col my-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Pengaturan Pengguna & Hak Akses
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isAdmin 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isAdmin ? 'Mode Administrator' : 'Mode Operator'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Otorisasi akses: Admin dapat mengakses seluruh modul, Operator dibatasi untuk input data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-amber-400 text-amber-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Konfigurasi Hak Akses (RBAC)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'accounts'
                ? 'border-amber-400 text-amber-300 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Akun Pengguna ({users.length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Saved feedback */}
          {isSaved && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Konfigurasi hak akses pengguna berhasil disimpan dan diterapkan ke seluruh modul!</span>
            </div>
          )}

          {!isAdmin && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong>Informasi Otorisasi:</strong> Anda sedang masuk sebagai akun <strong>Operator ({currentUser.name})</strong>. Pengaturan hak akses hanya dapat diubah oleh <strong>Administrator</strong>. Anda dapat beralih ke akun Admin melalui tab "Daftar Akun Pengguna" untuk menguji perubahan hak akses.
              </div>
            </div>
          )}

          {/* TAB 1: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-5">
              
              {/* Core Feature Request Box: Admin All Access, Operator Only Add KK Button */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4.5 rounded-2xl border-2 border-amber-500/40 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        Aturan Hak Akses Utama Sistem
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      <strong>Admin</strong> dapat mengakses semuanya. <strong>Operator</strong> hanya dapat mengakses Tombol <strong>(Tambah data KK & Titik Baru)</strong>.
                    </p>
                  </div>

                  {/* Switch Toggle for Operator Strict Restriction */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={localPermissions.operatorOnlyAddKK}
                      disabled={!isAdmin}
                      onChange={(e) => handleToggleMasterOperatorRestriction(e.target.checked)}
                    />
                    <div className={`w-12 h-6.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      localPermissions.operatorOnlyAddKK ? 'bg-amber-600' : 'bg-slate-700'
                    } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Card Admin: Full Access */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5" />
                        Administrator GIS
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        Akses Penuh
                      </span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      <li className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Akses Penuh Seluruh Modul & GIS</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Verifikasi Antrean & Persetujuan</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Kelola Pengguna & Hak Akses (RBAC)</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Buku Inventaris & Tambah Aset Desa</span>
                      </li>
                    </ul>
                  </div>

                  {/* Card Operator KK: Restricted Access */}
                  <div className={`p-3 rounded-xl bg-slate-900/80 border space-y-2 ${
                    localPermissions.operatorOnlyAddKK 
                      ? 'border-amber-500/50 bg-amber-950/10' 
                      : 'border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Operator KK
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        {localPermissions.operatorOnlyAddKK ? 'Hanya Tambah KK' : 'Terkustomisasi'}
                      </span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      <li className="flex items-center gap-1.5 text-emerald-300 font-bold bg-emerald-500/10 p-1 rounded-md border border-emerald-500/30">
                        <Plus className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span>Tombol (+ Tambah KK): AKTIF</span>
                      </li>
                      <li className={`flex items-center gap-1.5 ${localPermissions.operatorOnlyAddKK ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        <Lock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span>Cetak Laporan: {localPermissions.operatorOnlyAddKK ? 'Dikunci' : 'Diizinkan'}</span>
                      </li>
                      <li className={`flex items-center gap-1.5 ${localPermissions.operatorOnlyAddKK ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        <Lock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span>Dashboard Analitik: {localPermissions.operatorOnlyAddKK ? 'Dikunci' : 'Diizinkan'}</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-slate-500 line-through">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span>Fitur Tambah Aset Desa: Dibatasi</span>
                      </li>
                    </ul>
                  </div>

                  {/* Card Operator Aset: Specific Asset Role */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/40 bg-purple-950/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-400" />
                        Operator Aset
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Khusus Aset Desa
                      </span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      <li className="flex items-center gap-1.5 text-purple-300 font-bold bg-purple-500/10 p-1 rounded-md border border-purple-500/30">
                        <Plus className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                        <span>Tombol (+ Tambah Aset): AKTIF</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-purple-200">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                        <span>Akses Buku Inventaris Desa (KIB A-F)</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-purple-200">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                        <span>Otorisasi Buka Inventaris via Password</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-slate-500 line-through">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span>Edit/Hapus Data Penduduk & KK: Dibatasi</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Rincian Kontrol Izin Spesifik */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Rincian Otorisasi Tombol & Modul Aplikasi:</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Pembaruan Realtime</span>
                </div>

                <div className="space-y-2.5">
                  {/* Fitur Tambah Aset Desa */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-purple-500/30">
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-purple-400" />
                        <span>Fitur Tombol "+ Tambah Aset" (Buku Inventaris Desa)</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Penambahan aset fisik pembangunan & non-pembangunan baru ke Buku Inventaris dan peta sebaran aset desa
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0 ml-2">
                      Khusus Admin & Operator Aset
                    </span>
                  </div>

                  {/* Fitur Proteksi Password Buku Inventaris */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-amber-500/30">
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span>Proteksi Password Akses Buku Inventaris Desa</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Meminta verifikasi kata sandi akun Admin atau Operator Aset setiap kali pengguna membuka Buku Inventaris & Peta Sebaran Aset
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 ml-2">
                      Wajib Password Admin / Operator Aset
                    </span>
                  </div>

                  {/* 1. Tambah Data KK */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-emerald-500/30">
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>Tombol "Tambah Data KK & Titik Baru"</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Akses pengisian formulir KK, data anggota keluarga, dan penetapan titik koordinat rumah
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 ml-2">
                      Wajib Aktif (Admin & Operator KK)
                    </span>
                  </div>

                  {/* 2. Cetak & Ekspor Laporan */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-700">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-rose-400" />
                        <span>Menu "Cetak & Ekspor Laporan Bulanan Terenkripsi"</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Izin mengunduh rekapitulasi data PDF resmi, Excel, dan backup enkripsi AES-256
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {localPermissions.operatorOnlyAddKK ? 'Khusus Admin' : 'Bebas'}
                      </span>
                      <input
                        type="checkbox"
                        disabled={!isAdmin || localPermissions.operatorOnlyAddKK}
                        checked={!localPermissions.operatorOnlyAddKK && localPermissions.allowOperatorExport}
                        onChange={(e) => setLocalPermissions({ ...localPermissions, allowOperatorExport: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* 3. Dashboard Analitik */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-700">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        <span>Menu "Dashboard Analitik"</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Grafik distribusi desil, statistik bansos desa, dan analisis demografi
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {localPermissions.operatorOnlyAddKK ? 'Khusus Admin' : 'Bebas'}
                      </span>
                      <input
                        type="checkbox"
                        disabled={!isAdmin || localPermissions.operatorOnlyAddKK}
                        checked={!localPermissions.operatorOnlyAddKK && localPermissions.allowOperatorAnalytics}
                        onChange={(e) => setLocalPermissions({ ...localPermissions, allowOperatorAnalytics: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* 4. Edit & Hapus Data */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-700">
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4 text-amber-400" />
                        <span>Aksi Edit & Hapus Data KK Langsung</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Menghapus dan mengubah data KK yang sudah terdaftar di database desa
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {localPermissions.operatorOnlyAddKK ? 'Khusus Admin' : 'Bebas'}
                      </span>
                      <input
                        type="checkbox"
                        disabled={!isAdmin || localPermissions.operatorOnlyAddKK}
                        checked={!localPermissions.operatorOnlyAddKK && localPermissions.allowOperatorDeleteKK}
                        onChange={(e) => setLocalPermissions({ ...localPermissions, allowOperatorDeleteKK: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isAdmin && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setLocalPermissions({
                      operatorOnlyAddKK: true,
                      allowOperatorAnalytics: false,
                      allowOperatorExport: false,
                      allowOperatorEditKK: false,
                      allowOperatorDeleteKK: false,
                      allowOperatorVillageProfile: false
                    })}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    Reset ke Standar Resmi
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePermissionsClick}
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-amber-400/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Perubahan Hak Akses</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-800/80">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Akun Pengguna Sistem Terdaftar</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {users.length} Akun
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kelola data pengguna, perbarui jabatan, unggah foto profil, atau beralih akun langsung.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isUserFormOpen) {
                        handleCloseUserForm();
                      } else {
                        handleOpenAddUser();
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                      isUserFormOpen
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/50'
                    }`}
                  >
                    {isUserFormOpen ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Tutup Formulir</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Akun Baru</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Form Tambah / Edit Data Akun Pengguna & Upload Foto */}
              {isUserFormOpen && (
                <div 
                  ref={formCardRef}
                  className={`p-4 sm:p-5 rounded-2xl border shadow-2xl space-y-4 transition-all animate-fadeIn ${
                    editingUserId 
                      ? 'bg-slate-950/90 border-amber-500/50 ring-1 ring-amber-500/30' 
                      : 'bg-slate-950/90 border-emerald-500/50 ring-1 ring-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${
                        editingUserId 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {editingUserId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-xs sm:text-sm">
                          {editingUserId ? 'Formulir Edit Data Pengguna' : 'Formulir Tambah Akun Pengguna Baru'}
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          {editingUserId 
                            ? 'Perbarui informasi identitas, jabatan kedinasan, peran akses, dan unggah foto profil baru.'
                            : 'Tambahkan akun staf atau operator desa baru dengan kredensial login dan foto profil.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseUserForm}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                      title="Tutup Formulir"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {photoError && (
                    <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{photoError}</span>
                    </div>
                  )}

                  <form onSubmit={handleUserFormSubmit} className="space-y-4">
                    {/* Upload & Foto Profil Section */}
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>Foto Profil / Avatar Pengguna</span>
                        </label>
                        {formAvatar && (
                          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Foto Siap Digunakan
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Avatar Preview */}
                        <div className="relative shrink-0">
                          <img
                            src={formAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                            alt="Pratinjau Foto Profil"
                            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-700 shadow-md bg-slate-950"
                          />
                          {isUploadingPhoto && (
                            <div className="absolute inset-0 bg-slate-950/70 rounded-2xl flex items-center justify-center">
                              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                            </div>
                          )}
                          <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-bold border uppercase ${
                            formRole === 'admin'
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-amber-600 text-white border-amber-400'
                          }`}>
                            {formRole}
                          </span>
                        </div>

                        {/* Upload Controls & Dropzone */}
                        <div className="flex-1 w-full space-y-2">
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingPhoto(true);
                            }}
                            onDragLeave={() => setIsDraggingPhoto(false)}
                            onDrop={handlePhotoDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
                              isDraggingPhoto
                                ? 'border-amber-400 bg-amber-500/10'
                                : 'border-slate-700 hover:border-amber-500/60 bg-slate-950/40 hover:bg-slate-950/70'
                            }`}
                          >
                            <Upload className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                            <div className="text-xs font-semibold text-slate-200">
                              {isUploadingPhoto ? 'Mengompresi & Memproses Foto...' : 'Klik untuk Unggah Foto atau Tarik File ke Sini'}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Format didukung: JPG, JPEG, PNG, WebP (Maks. 5MB, otomatis disesuaikan)
                            </p>
                          </div>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            className="hidden"
                            onChange={handlePhotoFileChange}
                          />

                          {/* Quick Preset / Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer border border-slate-700"
                            >
                              <Upload className="w-3 h-3 text-emerald-400" />
                              <span>Pilih File...</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80')}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] transition-all cursor-pointer border border-slate-700"
                            >
                              Preset 1 (Pria)
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] transition-all cursor-pointer border border-slate-700"
                            >
                              Preset 2 (Wanita)
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormAvatar('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80')}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] transition-all cursor-pointer border border-slate-700"
                            >
                              Preset 3
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Nama Lengkap & Gelar <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="cth. Hendra Gunawan, S.Kom"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Username Login <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">@</span>
                          <input
                            type="text"
                            required
                            value={formUsername}
                            onChange={(e) => setFormUsername(e.target.value)}
                            placeholder="cth. operator2"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-7 pr-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Jabatan Kedinasan
                        </label>
                        <input
                          type="text"
                          value={formJabatan}
                          onChange={(e) => setFormJabatan(e.target.value)}
                          placeholder="cth. Kaur Pelayanan & Operator GIS"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Role / Tingkat Akses
                        </label>
                        <select
                          value={formRole}
                          disabled={!isAdmin}
                          onChange={(e) => setFormRole(e.target.value as UserRole)}
                          className={`w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${
                            !isAdmin ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="operator">Operator KK (Hanya Tambah data KK & Titik Baru)</option>
                          <option value="operator_aset">Operator Aset (Kelola Buku Inventaris & Tambah Aset)</option>
                          <option value="admin">Administrator (Akses Penuh Semua Modul)</option>
                        </select>
                      </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleCloseUserForm}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all cursor-pointer text-xs"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isUploadingPhoto}
                        className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          editingUserId
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/40 border border-amber-400/30'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40 border border-emerald-400/30'
                        } ${isUploadingPhoto ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingUserId ? 'Simpan Perubahan Pengguna' : 'Simpan Akun Pengguna Baru'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* User List Cards */}
              <div className="grid grid-cols-1 gap-3">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isUserAdmin = u.role === 'admin';
                  const isUserOperatorAset = u.role === 'operator_aset';
                  const isBeingEdited = u.id === editingUserId;

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isBeingEdited
                          ? 'bg-slate-900/90 border-amber-400 shadow-lg ring-2 ring-amber-400/40'
                          : isCurrent
                          ? 'bg-slate-950/80 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700 shadow-sm"
                          />
                          {isCurrent && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Akun Aktif" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">
                              {u.name}
                            </span>
                            <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${
                              isUserAdmin
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isUserOperatorAset
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {isUserAdmin ? 'ADMINISTRATOR' : isUserOperatorAset ? 'OPERATOR ASET' : 'OPERATOR KK'}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-medium border border-cyan-500/30">
                                Akun Anda Saat Ini
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            Username: <span className="font-mono text-slate-300">@{u.username}</span> • {u.jabatan}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isUserAdmin 
                              ? 'Hak Akses: Seluruh modul, verifikasi & pengaturan sistem' 
                              : isUserOperatorAset
                              ? 'Hak Akses: Khusus Kelola Buku Inventaris & Tambah Aset Desa'
                              : 'Hak Akses: Hanya Tombol Tambah Data KK & Titik Baru'}
                          </div>
                        </div>
                      </div>

                      {/* Right Actions: Edit, Switch, Delete */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Tombol Edit Data & Foto */}
                        {(isAdmin || isCurrent) && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
                            title={`Edit data & foto akun ${u.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Edit Data & Foto</span>
                          </button>
                        )}

                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSwitchUser(u);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                            title={`Beralih ke akun ${u.name} (${u.role})`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Beralih ke Akun Ini</span>
                          </button>
                        ) : (
                          <div className="px-3 py-1.5 bg-slate-800/80 text-slate-400 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Sedang Digunakan</span>
                          </div>
                        )}

                        {isAdmin && !isCurrent && users.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                            title="Hapus akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Hak Akses Terenkripsi Lokal & Tersinkronisasi Otomatis</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

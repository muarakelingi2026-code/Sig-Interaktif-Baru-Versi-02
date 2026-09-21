import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, DesaProfile, RolePermissions } from '../types';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Shield, 
  LogOut, 
  X, 
  MapPin, 
  Briefcase, 
  AtSign, 
  CheckCircle2, 
  Key, 
  Settings, 
  AlertTriangle,
  Sparkles,
  Lock,
  Layers,
  FileText,
  History
} from 'lucide-react';

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  desaProfile?: DesaProfile;
  permissions?: RolePermissions;
  onLogout: () => void;
  onOpenUserSettings?: () => void;
  onOpenAuthLogs?: () => void;
}

export const UserInfoModal: React.FC<UserInfoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  desaProfile,
  permissions,
  onLogout,
  onOpenUserSettings,
  onOpenAuthLogs
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isAdmin = currentUser.role === 'admin';

  if (!isOpen) return null;

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onClose();
    onLogout();
  };

  return (
    <AnimatePresence>
      <div 
        id="modal-user-info-backdrop" 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowLogoutConfirm(false);
            onClose();
          }
        }}
      >
        <motion.div
          id="modal-user-info"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/70 overflow-hidden text-slate-100 relative my-8"
        >
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 pt-6 pb-4 border-b border-slate-800">
            {/* Ambient glow */}
            <div className={`absolute top-0 right-1/4 w-40 h-24 blur-3xl opacity-20 pointer-events-none ${
              isAdmin ? 'bg-emerald-500' : 'bg-cyan-500'
            }`} />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Sistem Informasi Geografis Desa</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Informasi Profil Pengguna
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detail akun, status hak akses, dan wewenang pengguna aktif
                </p>
              </div>

              <button
                id="btn-close-user-info"
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onClose();
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
            
            {/* User Profile Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 shadow-inner">
              <div className="relative shrink-0">
                <img
                  id="user-info-avatar-large"
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className={`w-20 h-20 rounded-2xl object-cover ring-2 shadow-lg ${
                    isAdmin ? 'ring-emerald-500/60' : 'ring-cyan-500/60'
                  }`}
                />
                <div className={`absolute -bottom-1.5 -right-1.5 p-1 rounded-lg text-white shadow-md ${
                  isAdmin ? 'bg-emerald-600' : 'bg-cyan-600'
                }`}>
                  {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {currentUser.name}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border flex items-center gap-1 ${
                    isAdmin 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                    {isAdmin ? 'Administrator' : 'Operator'}
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-medium mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.jabatan}</span>
                </div>

                <div className="text-xs text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                  <AtSign className="w-3.5 h-3.5 text-slate-500" />
                  <span>@{currentUser.username}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Sesi Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  ID Pengguna
                </span>
                <span className="text-xs font-mono font-semibold text-slate-200 mt-0.5 block">
                  {currentUser.id}
                </span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Tingkat Akses (Role)
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5 block capitalize">
                  {currentUser.role === 'admin' 
                    ? 'Super Admin / GIS Admin' 
                    : currentUser.role === 'operator_aset'
                    ? 'Operator Aset Desa (Buku Inventaris & KIB)'
                    : 'Operator Data Kependudukan'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 sm:col-span-2">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Wilayah Kerja / Penugasan
                </span>
                <span className="text-xs font-medium text-slate-200 mt-0.5 block">
                  Desa {desaProfile?.namaDesa || 'Beliti Jaya'}, Kec. {desaProfile?.kecamatan || 'Muara Kelingi'}, Kab. {desaProfile?.kabupaten || 'Musi Rawas'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Provinsi {desaProfile?.provinsi || 'Sumatera Selatan'} ({desaProfile?.kodePos || '31663'})
                </span>
              </div>
            </div>

            {/* Hak Akses / Permissions Summary */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Wewenang & Hak Akses
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isAdmin ? 'Akses Penuh (Full Control)' : 'Akses Terbatas Terverifikasi'}
                </span>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-300">
                {isAdmin ? (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Kelola seluruh data KK, NIK penduduk, koordinat rumah & bantuan sosial</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Verifikasi, persetujuan (approval), dan penolakan perubahan data operator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Akses penuh konfigurasi pengguna (Setting User), hak akses RBAC, profil desa & cetak dokumen enkripsi AES-256</span>
                    </li>
                  </>
                ) : (
                  <>
                    {currentUser.role === 'operator_aset' ? (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <span>Kelola Buku Inventaris & input/edit/hapus aset pembangunan maupun non-pembangunan desa</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Akses peta interaktif, sebaran titik aset desa, Fitur Pencarian Cepat Aset di Peta & Legenda Khusus Aset</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>Lapisan marker "Titik Rumah & Bansos Warga" otomatis dinonaktifkan (uncentang) untuk fokus aset</span>
                        </li>
                        <li className="flex items-start gap-2 text-rose-300/90">
                          <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Dibatasi: Tidak diperbolehkan mengakses menu Data Kependudukan</span>
                        </li>
                        <li className="flex items-start gap-2 text-rose-300/90">
                          <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Dibatasi: Tidak diperbolehkan mengakses Cetak & Enkripsi</span>
                        </li>
                        <li className="flex items-start gap-2 text-rose-300/90">
                          <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Dibatasi: Tidak diperbolehkan mengakses Data Desa (Profil & Aparatur)</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Input dan pendaftaran data KK baru serta penentuan titik koordinat rumah di peta</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>Lapisan marker "Aset Pembangunan" & "Non-Pembangunan" otomatis dinonaktifkan (uncentang) untuk fokus kependudukan</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>Dilengkapi Widget Peta "Legenda Penduduk" (Statistik demografi, rasio gender, umur & tombol tutup X)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>Pengajuan perubahan dan penghapusan data masuk antrean verifikasi Admin</span>
                        </li>
                        <li className="flex items-start gap-2 text-rose-300/90">
                          <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Dibatasi: Tidak diperbolehkan mengakses Mode KIOSK</span>
                        </li>
                        <li className="flex items-start gap-2 text-rose-300/90">
                          <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Dibatasi: Widget Wilayah & Aparatur Desa dibatasi khusus Administrator</span>
                        </li>
                        <li className="flex items-start gap-2 text-rose-300/90">
                          <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>Dibatasi: Klik Logo & Header Profil Desa di navbar dinonaktifkan</span>
                        </li>
                      </>
                    )}
                    <li className="flex items-start gap-2 text-rose-300/90">
                      <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>Menu Setting User & Hak Akses (RBAC) dibatasi khusus untuk Administrator</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Log Aktivitas Akses Shortcut */}
            {onOpenAuthLogs && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Log Riwayat Akses Sistem</div>
                    <div className="text-[11px] text-slate-400">Riwayat waktu login & logout pengguna</div>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-user-info-to-logs"
                  onClick={() => {
                    onClose();
                    onOpenAuthLogs();
                  }}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Buka Log</span>
                </button>
              </div>
            )}

            {/* Admin Quick Shortcut to User Settings if Admin */}
            {isAdmin && onOpenUserSettings && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Manajemen Pengguna & RBAC</div>
                    <div className="text-[11px] text-slate-400">Atur akun staf desa & izin operasional</div>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-user-info-to-settings"
                  onClick={() => {
                    onClose();
                    onOpenUserSettings();
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Kelola Akun
                </button>
              </div>
            )}

            {/* LOGOUT CONFIRMATION / LOGOUT SECTION */}
            <div className="pt-2 border-t border-slate-800">
              {showLogoutConfirm ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Konfirmasi Keluar dari Sistem</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Apakah Anda yakin ingin mengakhiri sesi akun <strong>{currentUser.name}</strong>?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      id="btn-cancel-logout"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      id="btn-confirm-logout"
                      onClick={handleConfirmLogout}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-lg shadow-rose-950/40 flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Ya, Keluar</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  id="btn-logout-modal"
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/50 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Keluar dari Sistem (Logout)</span>
                </button>
              )}
            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>SIG Desa Beliti Jaya © 2026</span>
            </span>
            <button
              type="button"
              id="btn-close-user-info-footer"
              onClick={() => {
                setShowLogoutConfirm(false);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

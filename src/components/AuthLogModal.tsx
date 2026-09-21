import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  LogIn, 
  LogOut, 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  ShieldCheck, 
  Laptop, 
  Trash2, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpDown,
  FileText
} from 'lucide-react';
import { AuthLogEntry, AuthActionType, User } from '../types';

interface AuthLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuthLogEntry[];
  onClearLogs?: () => void;
  onDeleteLog?: (id: string) => void;
  currentUser: User;
}

export const AuthLogModal: React.FC<AuthLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onDeleteLog,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<'all' | AuthActionType>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'operator'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Format date helper to Indonesian locale
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const dateStr = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';

      return { dateStr, timeStr };
    } catch {
      return { dateStr: isoString, timeStr: '' };
    }
  };

  // Relative time helper
  const getRelativeTime = (isoString: string) => {
    try {
      const now = new Date().getTime();
      const past = new Date(isoString).getTime();
      const diffMs = now - past;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Baru saja';
      if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari yang lalu`;
      return `${diffDays} hari lalu`;
    } catch {
      return '';
    }
  };

  // Filtered & sorted logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Filter by action (LOGIN / LOGOUT)
        if (filterAction !== 'all' && log.action !== filterAction) {
          return false;
        }
        // Filter by role
        if (filterRole !== 'all' && log.userRole !== filterRole) {
          return false;
        }
        // Filter by search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = log.userName.toLowerCase().includes(q);
          const matchUsername = log.userUsername.toLowerCase().includes(q);
          const matchJabatan = log.userJabatan?.toLowerCase().includes(q);
          const matchNotes = log.notes?.toLowerCase().includes(q);
          const matchDevice = log.device?.toLowerCase().includes(q);
          const matchIp = log.ipAddress?.toLowerCase().includes(q);
          return matchName || matchUsername || matchJabatan || matchNotes || matchDevice || matchIp;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [logs, filterAction, filterRole, searchQuery, sortOrder]);

  // Summary counts
  const stats = useMemo(() => {
    const total = logs.length;
    const loginCount = logs.filter(l => l.action === 'LOGIN').length;
    const logoutCount = logs.filter(l => l.action === 'LOGOUT').length;
    const latestLog = logs[0];

    return { total, loginCount, logoutCount, latestLog };
  }, [logs]);

  // Export logs to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `log_akses_sig_belitijaya_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export logs to CSV / Text
  const handleExportCSV = () => {
    const headers = ['ID', 'Waktu', 'Aksi', 'Nama', 'Username', 'Role', 'Jabatan', 'Perangkat', 'IP', 'Catatan'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      l.action,
      `"${l.userName.replace(/"/g, '""')}"`,
      `"${l.userUsername}"`,
      l.userRole,
      `"${(l.userJabatan || '').replace(/"/g, '""')}"`,
      `"${(l.device || '').replace(/"/g, '""')}"`,
      `"${(l.ipAddress || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `log_akses_sig_belitijaya_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';

  return (
    <AnimatePresence>
      <div 
        id="auth-log-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-emerald-950/40 text-slate-100 max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Log Riwayat Akses Sistem
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Login & Logout
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catatan aktivitas autentikasi pengguna, tanggal, jam masuk, dan pengakhiran sesi secara real-time
                </p>
              </div>
            </div>

            <button
              id="btn-close-auth-log"
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Summary Bar */}
          <div className="px-4 sm:px-5 py-3 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 shrink-0">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Total Aktivitas</span>
              </div>
              <div className="text-lg font-bold text-white mt-0.5">{stats.total} Catatan</div>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
                <LogIn className="w-3 h-3 text-emerald-400" />
                <span>Sesi Login</span>
              </div>
              <div className="text-lg font-bold text-emerald-300 mt-0.5">{stats.loginCount} Kali</div>
            </div>

            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1">
                <LogOut className="w-3 h-3 text-rose-400" />
                <span>Sesi Logout</span>
              </div>
              <div className="text-lg font-bold text-rose-300 mt-0.5">{stats.logoutCount} Kali</div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Aktivitas Terakhir</span>
              </div>
              <div className="text-xs font-semibold text-amber-200 mt-1 truncate">
                {stats.latestLog ? `${stats.latestLog.userName.split(',')[0]} (${stats.latestLog.action})` : '-'}
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pengguna, @username, catatan, IP, atau perangkat..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Filter (All, Login, Logout) */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterAction('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterAction === 'all'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAction('LOGIN')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    filterAction === 'LOGIN'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <LogIn className="w-3 h-3" />
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAction('LOGOUT')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    filterAction === 'LOGOUT'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">Semua Peran (Role)</option>
                <option value="admin">Administrator GIS</option>
                <option value="operator">Operator Desa</option>
              </select>

              {/* Sort Order Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                title={`Urutan: ${sortOrder === 'desc' ? 'Terbaru Dahulu' : 'Terlama Dahulu'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
              </button>
            </div>
          </div>

          {/* Logs List Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <History className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Tidak Ada Data Log Ditemukan</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || filterAction !== 'all' || filterRole !== 'all'
                    ? 'Tidak ada riwayat aktivitas yang sesuai dengan kriteria filter pencarian Anda.'
                    : 'Belum ada rekaman log riwayat login atau logout yang tercatat.'}
                </p>
                {(searchQuery || filterAction !== 'all' || filterRole !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterAction('all');
                      setFilterRole('all');
                    }}
                    className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const { dateStr, timeStr } = formatDateTime(log.timestamp);
                const relative = getRelativeTime(log.timestamp);
                const isLogin = log.action === 'LOGIN';
                const isLogAdmin = log.userRole === 'admin';

                return (
                  <div
                    key={log.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      isLogin
                        ? 'bg-slate-950/70 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-slate-950/70 border-rose-500/30 hover:border-rose-500/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: User info and action badge */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative shrink-0 mt-0.5 sm:mt-0">
                          <img
                            src={log.userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                            alt={log.userName}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-800 shadow-sm"
                          />
                          <span 
                            className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ring-2 ring-slate-950 ${
                              isLogin ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}
                            title={isLogin ? 'Login Masuk' : 'Logout Keluar'}
                          >
                            {isLogin ? <LogIn className="w-2.5 h-2.5" /> : <LogOut className="w-2.5 h-2.5" />}
                          </span>
                        </div>

                        {/* User Details */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-white text-xs truncate">
                              {log.userName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              @{log.userUsername}
                            </span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border uppercase ${
                              isLogAdmin
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                            }`}>
                              {isLogAdmin ? 'Admin GIS' : 'Operator'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {log.userJabatan || (isLogAdmin ? 'Administrator GIS' : 'Operator Data Desa')}
                          </div>

                          {log.notes && (
                            <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLogin ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              <span>{log.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Action Badge & Timestamp */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                        {/* Action Badge */}
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border shadow-xs ${
                          isLogin
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                        }`}>
                          {isLogin ? <LogIn className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                          <span>{isLogin ? 'BERHASIL LOGIN' : 'LOGOUT / KELUAR'}</span>
                        </span>

                        {/* Date and Time */}
                        <div className="text-right">
                          <div className="text-xs font-semibold text-white flex items-center sm:justify-end gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{timeStr}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center sm:justify-end gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{dateStr}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-amber-400/90 font-medium">{relative}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Footer: Device, IP, and Delete Action */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] text-slate-400">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        {log.device && (
                          <div className="flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-slate-500" />
                            <span>Perangkat: {log.device}</span>
                          </div>
                        )}
                        {log.ipAddress && (
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            <span>Jaringan / IP: {log.ipAddress}</span>
                          </div>
                        )}
                        <span className="text-slate-600 font-mono">ID: {log.id}</span>
                      </div>

                      {onDeleteLog && (
                        <button
                          type="button"
                          onClick={() => onDeleteLog(log.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 hover:bg-rose-500/10 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          title="Hapus rekaman log ini secara permanen"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Confirm Clear Logs Dialog */}
          {showConfirmClear && (
            <div className="p-4 bg-rose-950/80 border-t border-rose-500/40 shrink-0 animate-fadeIn flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-rose-200 text-xs">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>
                  Apakah Anda yakin ingin menghapus seluruh riwayat log akses ini? Tindakan ini tidak dapat dibatalkan.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearLogs) onClearLogs();
                    setShowConfirmClear(false);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Ya, Bersihkan Log
                </button>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Left: Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                title="Unduh data log dalam format CSV / Spreadsheet"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ekspor CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                title="Unduh data log dalam format file JSON"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ekspor JSON</span>
              </button>

              {isAdmin && onClearLogs && (
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(true)}
                  className="px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer"
                  title="Bersihkan riwayat log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Log</span>
                </button>
              )}
            </div>

            {/* Right: Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer ml-auto"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

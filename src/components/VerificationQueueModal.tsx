import React, { useState } from 'react';
import { VerificationNotification, User } from '../types';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  X,
  FileDiff,
  MessageSquare
} from 'lucide-react';

interface VerificationQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: VerificationNotification[];
  onApprove: (notificationId: string, notes?: string) => void;
  onReject: (notificationId: string, notes?: string) => void;
  currentUser: User;
}

export const VerificationQueueModal: React.FC<VerificationQueueModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onApprove,
  onReject,
  currentUser
}) => {
  const [selectedNotif, setSelectedNotif] = useState<VerificationNotification | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [filterTab, setFilterTab] = useState<'pending' | 'all'>('pending');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (filterTab === 'pending') return n.status === 'pending';
    return true;
  });

  const pendingCount = notifications.filter(n => n.status === 'pending').length;

  const handleApproveClick = (id: string) => {
    onApprove(id, adminNoteInput);
    setAdminNoteInput('');
    setSelectedNotif(null);
  };

  const handleRejectClick = (id: string) => {
    onReject(id, adminNoteInput);
    setAdminNoteInput('');
    setSelectedNotif(null);
  };

  return (
    <div id="verification-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div id="verification-modal-card" className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Notifikasi & Antrean Verifikasi Operator
                </h2>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Persetujuan Perubahan Data Kependudukan & Bantuan Sosial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filter */}
        <div className="bg-slate-800/60 px-6 py-2 border-b border-slate-700 flex items-center gap-2 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Menunggu Verifikasi ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Riwayat ({notifications.length})
          </button>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
              <p className="font-semibold text-white">Semua Data Telah Diverifikasi</p>
              <p className="text-[11px] text-slate-500">Tidak ada pengajuan perubahan data yang menunggu persetujuan saat ini.</p>
            </div>
          ) : (
            filtered.map(notif => (
              <div
                key={notif.id}
                className={`bg-slate-800/80 border rounded-xl p-4 transition-all ${
                  notif.status === 'pending'
                    ? 'border-amber-500/40 shadow-md shadow-amber-950/20'
                    : notif.status === 'approved'
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        notif.type === 'create' ? 'bg-emerald-500/20 text-emerald-300' :
                        notif.type === 'update' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {notif.type === 'create' ? 'Tambah Data KK' : notif.type === 'update' ? 'Update Data' : 'Pengajuan Hapus'}
                      </span>

                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.timestamp).toLocaleString('id-ID')}
                      </span>

                      <span className="text-slate-400 text-[11px]">
                        Petugas: <strong className="text-white">{notif.operatorName}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white pt-1">
                      {notif.targetName}
                    </h4>

                    <p className="text-slate-300 text-xs">
                      {notif.summary}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {notif.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Menunggu Review
                      </span>
                    )}
                    {notif.status === 'approved' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Disetujui ({notif.approvedBy})
                      </span>
                    )}
                    {notif.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Ditolak
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin Action Controls (if role is admin and status is pending) */}
                {notif.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {currentUser.role === 'admin' ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleApproveClick(notif.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Setujui (Approve)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectClick(notif.id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-1 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-400/90 italic">
                        * Data ini menunggu verifikasi dari Administrator GIS Desa.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Sistem Notifikasi Otomatis Desa Beliti Jaya</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-all"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

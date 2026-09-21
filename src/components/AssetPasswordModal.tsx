import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { StorageService } from '../services/storageService';
import { 
  Lock, 
  Unlock, 
  AlertCircle, 
  Eye, 
  EyeOff 
} from 'lucide-react';

interface AssetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User | null;
  users?: User[];
}

export const AssetPasswordModal: React.FC<AssetPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  users: propUsers
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const users = propUsers || StorageService.getUsers();

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setShowPassword(false);
      setIsVerifying(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;

    const trimmed = password.trim();
    if (!trimmed) {
      setError('Silakan masukkan kata sandi otorisasi.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // Check credentials:
    const isAdminPassword = 
      trimmed === 'admin123' || 
      trimmed === 'admin' ||
      trimmed === 'administrator';

    const isOperatorAsetPassword = 
      trimmed === 'aset123' || 
      trimmed === 'operator_aset123' || 
      trimmed === 'op_aset' ||
      trimmed === 'operator_aset' ||
      trimmed === 'aset';

    const matchesAdminUser = users.some(u => 
      u.role === 'admin' && (trimmed === u.username || trimmed === `${u.username}123` || trimmed === 'admin123')
    );
    const matchesOpAsetUser = users.some(u => 
      u.role === 'operator_aset' && (trimmed === u.username || trimmed === `${u.username}123` || trimmed === 'aset123')
    );

    const isCurrentAuthorized = 
      (currentUser?.role === 'admin' && (trimmed === 'admin123' || trimmed === currentUser.username)) ||
      (currentUser?.role === 'operator_aset' && (trimmed === 'aset123' || trimmed === currentUser.username));

    setTimeout(() => {
      if (isAdminPassword || isOperatorAsetPassword || matchesAdminUser || matchesOpAsetUser || isCurrentAuthorized) {
        setIsVerifying(false);
        onSuccess();
      } else {
        setIsVerifying(false);
        setError('Kata sandi salah! Masukkan kata sandi Administrator (admin123) atau Operator Aset (aset123).');
        inputRef.current?.select();
      }
    }, 250);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="asset-password-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-hidden select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Card Melayang Terpusat (Floating Pro Card) */}
          <motion.div 
            id="asset-password-card"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="relative w-full max-w-[350px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/70 rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.08)] overflow-hidden text-slate-100 p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Top Glow Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

            {/* Modal Header Terpusat */}
            <div className="flex flex-col items-center text-center mb-5">
              <motion.div 
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-b from-amber-500/20 via-orange-500/15 to-amber-500/5 text-amber-400 border border-amber-500/35 flex items-center justify-center shadow-lg shadow-amber-950/50 mb-3"
              >
                <Lock className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]" />
              </motion.div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Otorisasi Buku Inventaris Desa
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                Masukkan kata sandi Administrator atau Operator Aset untuk melanjutkan
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-center justify-center gap-2 text-rose-300 text-[11px] text-center"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="asset-auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/90 focus:border-amber-400 rounded-2xl pl-4 pr-10 py-2.5 text-center text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/25 transition-all font-mono tracking-wider shadow-inner"
                  />
                  <button
                    type="button"
                    id="btn-toggle-show-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1 transition-colors"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons Terpusat */}
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  id="btn-cancel-asset-auth"
                  onClick={onClose}
                  className="w-1/2 py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-semibold transition-all cursor-pointer text-xs border border-slate-700/60 active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-asset-auth"
                  disabled={isVerifying}
                  className="w-1/2 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-950/50 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                      <span>Verifikasi...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-slate-950" />
                      <span>Buka Aset</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

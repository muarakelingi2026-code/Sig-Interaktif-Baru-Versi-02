import { Keluarga, Penduduk, User, VerificationNotification, FilterOptions, DesaProfile, RolePermissions, AuthLogEntry, AsetDesa } from '../types';
import { INITIAL_KELUARGA_DATA, INITIAL_NOTIFICATIONS, INITIAL_USERS, INITIAL_DESA_PROFILE, INITIAL_AUTH_LOGS, INITIAL_ASET_DESA } from '../data/mockData';

const STORAGE_KEYS = {
  KELUARGA: 'sig_belitijaya_keluarga_v3',
  CURRENT_USER: 'sig_belitijaya_current_user_v1',
  USERS: 'sig_belitijaya_users_v2',
  ROLE_PERMISSIONS: 'sig_belitijaya_role_permissions_v1',
  NOTIFICATIONS: 'sig_belitijaya_notifications_v1',
  AUDIT_LOGS: 'sig_belitijaya_audit_logs_v1',
  AUTH_LOGS: 'sig_belitijaya_auth_logs_v1',
  DESA_PROFILE: 'sig_belitijaya_desa_profile_v2',
  ASET_DESA: 'sig_belitijaya_aset_desa_v1'
};

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  operatorOnlyAddKK: true, // Berdasarkan instruksi: Kalau Operator Hanya dapat mengakses Tombol (Tambah data KK & Titik Baru)
  allowOperatorAnalytics: false,
  allowOperatorExport: false,
  allowOperatorEditKK: false,
  allowOperatorDeleteKK: false,
  allowOperatorVillageProfile: false,
  allowOnlyAdminAndOperatorAsetAdd: true,
  requirePasswordForBukuInventaris: true
};

export const StorageService = {
  getDesaProfile(): DesaProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DESA_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.namaDesa) {
          if (!parsed.logoDesa) {
            parsed.logoDesa = INITIAL_DESA_PROFILE.logoDesa;
          }
          if (!parsed.runningTextKiosk) {
            parsed.runningTextKiosk = INITIAL_DESA_PROFILE.runningTextKiosk;
          }
          if (!parsed.runningTextSpeed) {
            parsed.runningTextSpeed = 'normal';
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    this.saveDesaProfile(INITIAL_DESA_PROFILE);
    return INITIAL_DESA_PROFILE;
  },

  saveDesaProfile(data: DesaProfile): void {
    localStorage.setItem(STORAGE_KEYS.DESA_PROFILE, JSON.stringify(data));
  },

  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure operator_aset exists in user list
          const hasOpAset = parsed.some((u: User) => u.role === 'operator_aset');
          if (!hasOpAset) {
            const opAsetDef = INITIAL_USERS.find(u => u.role === 'operator_aset');
            if (opAsetDef) {
              parsed.push(opAsetDef);
              this.saveUsers(parsed);
            }
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getRolePermissions(): RolePermissions {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.operatorOnlyAddKK === 'boolean') {
          return {
            ...DEFAULT_ROLE_PERMISSIONS,
            ...parsed
          };
        }
      }
    } catch {
      // ignore
    }
    this.saveRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    return DEFAULT_ROLE_PERMISSIONS;
  },

  saveRolePermissions(permissions: RolePermissions): void {
    localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(permissions));
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getKeluargaList(): Keluarga[] {
    try {
      // Check v2 key first
      const stored = localStorage.getItem(STORAGE_KEYS.KELUARGA);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if any legacy coordinates exist and adjust if necessary
          const needsMigration = parsed.some(k => k.koordinat && k.koordinat.lat < -3.0);
          if (needsMigration) {
            const migrated = parsed.map(k => {
              if (k.koordinat && k.koordinat.lat < -3.0) {
                return {
                  ...k,
                  koordinat: {
                    lat: -2.9661 + (Math.random() - 0.5) * 0.005,
                    lng: 103.1581 + (Math.random() - 0.5) * 0.005
                  }
                };
              }
              return k;
            });
            this.saveKeluargaList(migrated);
            return migrated;
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Default fallback to updated INITIAL_KELUARGA_DATA
    this.saveKeluargaList(INITIAL_KELUARGA_DATA);
    return INITIAL_KELUARGA_DATA;
  },

  saveKeluargaList(data: Keluarga[]): void {
    localStorage.setItem(STORAGE_KEYS.KELUARGA, JSON.stringify(data));
  },

  getAllPenduduk(): Penduduk[] {
    const keluargaList = this.getKeluargaList();
    const result: Penduduk[] = [];
    keluargaList.forEach(k => {
      k.anggotaKeluarga.forEach(p => {
        result.push(p);
      });
    });
    return result;
  },

  getNotifications(): VerificationNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    return INITIAL_NOTIFICATIONS;
  },

  saveNotifications(notifs: VerificationNotification[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  addNotification(notif: Omit<VerificationNotification, 'id' | 'timestamp' | 'status'>): VerificationNotification {
    const current = this.getNotifications();
    const newNotif: VerificationNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    const updated = [newNotif, ...current];
    this.saveNotifications(updated);
    return newNotif;
  },

  resolveNotification(id: string, status: 'approved' | 'rejected', adminName: string, adminNotes?: string): void {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => {
      if (n.id === id) {
        return {
          ...n,
          status,
          approvedBy: adminName,
          approvedAt: new Date().toISOString(),
          adminNotes: adminNotes || ''
        };
      }
      return n;
    });
    this.saveNotifications(updated);
  },

  // Save / Add new Keluarga
  addKeluarga(keluarga: Omit<Keluarga, 'id' | 'createdAt' | 'updatedAt' | 'statusVerifikasi'>, user: User): { keluarga: Keluarga; notification?: VerificationNotification } {
    const current = this.getKeluargaList();
    const isOperator = user.role === 'operator';

    const newKeluarga: Keluarga = {
      ...keluarga,
      id: `kel_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModifiedBy: user.name,
      statusVerifikasi: isOperator ? 'pending_approval' : 'verified'
    };

    const updated = [newKeluarga, ...current];
    this.saveKeluargaList(updated);

    let notif: VerificationNotification | undefined;
    if (isOperator) {
      notif = this.addNotification({
        type: 'create',
        targetType: 'keluarga',
        targetId: newKeluarga.id,
        targetNoKk: newKeluarga.noKk,
        targetName: `${newKeluarga.namaKepalaKeluarga} (${newKeluarga.dusun} RT ${newKeluarga.rt})`,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        summary: `Operator menambahkan data KK Baru No. ${newKeluarga.noKk} atas nama ${newKeluarga.namaKepalaKeluarga}.`,
        proposedData: newKeluarga
      });
    }

    return { keluarga: newKeluarga, notification: notif };
  },

  // Update Keluarga
  updateKeluarga(id: string, updatedData: Partial<Keluarga>, user: User): { updated: Keluarga; notification?: VerificationNotification } {
    const list = this.getKeluargaList();
    const existingIndex = list.findIndex(k => k.id === id);
    if (existingIndex === -1) {
      throw new Error('Data keluarga tidak ditemukan');
    }

    const previous = list[existingIndex];
    const isOperator = user.role === 'operator';

    const merged: Keluarga = {
      ...previous,
      ...updatedData,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: user.name,
      statusVerifikasi: isOperator ? 'pending_approval' : previous.statusVerifikasi
    };

    list[existingIndex] = merged;
    this.saveKeluargaList(list);

    let notif: VerificationNotification | undefined;
    if (isOperator) {
      notif = this.addNotification({
        type: 'update',
        targetType: 'keluarga',
        targetId: merged.id,
        targetNoKk: merged.noKk,
        targetName: `${merged.namaKepalaKeluarga} (${merged.dusun} RT ${merged.rt})`,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        summary: `Operator memperbarui data keluarga / bansos ${merged.namaKepalaKeluarga}.`,
        previousData: previous,
        proposedData: merged
      });
    }

    return { updated: merged, notification: notif };
  },

  // Delete Keluarga
  deleteKeluarga(id: string, user: User): { success: boolean; notification?: VerificationNotification } {
    const list = this.getKeluargaList();
    const target = list.find(k => k.id === id);
    if (!target) return { success: false };

    if (user.role === 'operator') {
      // Operator deletion requires admin notification & mark as pending
      const notif = this.addNotification({
        type: 'delete',
        targetType: 'keluarga',
        targetId: target.id,
        targetNoKk: target.noKk,
        targetName: `${target.namaKepalaKeluarga} (${target.dusun} RT ${target.rt})`,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        summary: `Operator mengajukan penghapusan data KK ${target.noKk} - ${target.namaKepalaKeluarga}.`,
        previousData: target
      });
      return { success: true, notification: notif };
    }

    const filtered = list.filter(k => k.id !== id);
    this.saveKeluargaList(filtered);
    return { success: true };
  },

  // Filter Helper Function
  filterKeluarga(list: Keluarga[], filters: FilterOptions): { keluarga: Keluarga[]; matchedPenduduk: Penduduk[] } {
    const matchedPenduduk: Penduduk[] = [];

    const filteredKeluarga = list.filter(k => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchKk = k.noKk.toLowerCase().includes(query);
        const matchKepala = k.namaKepalaKeluarga.toLowerCase().includes(query);
        const matchAlamat = k.alamat.toLowerCase().includes(query);
        const matchAnggota = k.anggotaKeluarga.some(a =>
          a.nama.toLowerCase().includes(query) || a.nik.toLowerCase().includes(query) || a.pekerjaan.toLowerCase().includes(query)
        );
        if (!matchKk && !matchKepala && !matchAlamat && !matchAnggota) {
          return false;
        }
      }

      // 2. Dusun
      if (filters.dusun && filters.dusun !== 'semua' && k.dusun !== filters.dusun) {
        return false;
      }

      // 3. Status Bansos
      if (filters.statusBansos === 'penerima' && !k.penerimaBansos) return false;
      if (filters.statusBansos === 'bukan_penerima' && k.penerimaBansos) return false;

      // 4. Jenis Bansos
      if (filters.jenisBansos && filters.jenisBansos !== 'semua') {
        if (!k.daftarBansos.includes(filters.jenisBansos as any)) {
          return false;
        }
      }

      // 5. Status Kesejahteraan
      if (filters.statusKesejahteraan && filters.statusKesejahteraan !== 'semua') {
        if (k.statusKesejahteraan !== filters.statusKesejahteraan) {
          return false;
        }
      }

      // 6. Anggota level filters (Jenis Kelamin, Kematian, Perkawinan, Pendidikan, Penghasilan)
      const validMembers = k.anggotaKeluarga.filter(m => {
        if (filters.jenisKelamin && filters.jenisKelamin !== 'semua' && m.jenisKelamin !== filters.jenisKelamin) {
          return false;
        }
        if (filters.statusKematian && filters.statusKematian !== 'semua' && m.statusKematian !== filters.statusKematian) {
          return false;
        }
        if (filters.statusPerkawinan && filters.statusPerkawinan !== 'semua' && m.statusPerkawinan !== filters.statusPerkawinan) {
          return false;
        }
        if (filters.pendidikan && filters.pendidikan !== 'semua' && m.pendidikan !== filters.pendidikan) {
          return false;
        }
        if (filters.minPenghasilan > 0 && m.penghasilanBulanan < filters.minPenghasilan) {
          return false;
        }
        if (filters.maxPenghasilan > 0 && m.penghasilanBulanan > filters.maxPenghasilan) {
          return false;
        }
        return true;
      });

      // If specific individual filters are applied, family must have matching members
      const hasMemberSpecificFilter =
        (filters.jenisKelamin && filters.jenisKelamin !== 'semua') ||
        (filters.statusKematian && filters.statusKematian !== 'semua') ||
        (filters.statusPerkawinan && filters.statusPerkawinan !== 'semua') ||
        (filters.pendidikan && filters.pendidikan !== 'semua') ||
        filters.minPenghasilan > 0 ||
        filters.maxPenghasilan > 0;

      if (hasMemberSpecificFilter && validMembers.length === 0) {
        return false;
      }

      validMembers.forEach(m => matchedPenduduk.push(m));
      return true;
    });

    return { keluarga: filteredKeluarga, matchedPenduduk };
  },

  // Auth Logs Management (Catat Login & Logout Pengguna)
  getAuthLogs(): AuthLogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_LOGS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed; // Kembalikan data yang tersimpan apa adanya, walau kosong [] (data yang sudah dihapus tidak boleh dikembalikan)
        }
      }
    } catch {
      // ignore
    }
    this.saveAuthLogs(INITIAL_AUTH_LOGS);
    return INITIAL_AUTH_LOGS;
  },

  saveAuthLogs(logs: AuthLogEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_LOGS, JSON.stringify(logs));
  },

  addAuthLog(entry: Omit<AuthLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): AuthLogEntry {
    const currentLogs = this.getAuthLogs();
    const entryTime = entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now();

    // Pencegahan Rekam Ganda (Deduplication Guard):
    // Jika aksi yang sama untuk user yang sama dipanggil dalam rentang < 5 detik, jangan duplikasi
    if (currentLogs.length > 0) {
      const latest = currentLogs[0];
      const latestTime = new Date(latest.timestamp).getTime();
      const diffSeconds = Math.abs(entryTime - latestTime) / 1000;

      if (
        latest.userId === entry.userId &&
        latest.action === entry.action &&
        diffSeconds < 5
      ) {
        // Mengembalikan log terbaru tanpa menambahkan record ganda
        return latest;
      }
    }

    const newLog: AuthLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry
    };

    // Simpan hingga 250 rekaman terbaru
    const updated = [newLog, ...currentLogs].slice(0, 250);
    this.saveAuthLogs(updated);
    return newLog;
  },

  deleteAuthLog(id: string): AuthLogEntry[] {
    const currentLogs = this.getAuthLogs();
    const filtered = currentLogs.filter(log => log.id !== id);
    this.saveAuthLogs(filtered);
    return filtered;
  },

  clearAuthLogs(): void {
    this.saveAuthLogs([]);
  },

  // ── MANAJEMEN ASET DESA ──
  getAsetDesa(): AsetDesa[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ASET_DESA);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all items have consistent foto and fotoList without overwriting user-updated photos
          const migrated = parsed.map((item: AsetDesa) => {
            const list = Array.isArray(item.fotoList) && item.fotoList.length > 0
              ? [...item.fotoList.filter(p => typeof p === 'string' && p.trim().length > 0)]
              : [];

            if (item.foto && typeof item.foto === 'string' && item.foto.trim().length > 0) {
              const primary = item.foto.trim();
              if (!list.includes(primary)) {
                list.unshift(primary);
              }
            }

            // Only fallback to initial mock data if both foto and fotoList are completely empty
            if (list.length === 0) {
              const initialMatch = INITIAL_ASET_DESA.find(a => a.id === item.id);
              if (initialMatch?.fotoList && initialMatch.fotoList.length > 0) {
                return {
                  ...item,
                  foto: initialMatch.foto || initialMatch.fotoList[0],
                  fotoList: [...initialMatch.fotoList]
                };
              }
              const defaultFallback = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80';
              list.push(defaultFallback);
            }

            return {
              ...item,
              foto: item.foto || list[0],
              fotoList: list
            };
          });
          return migrated;
        }
      }
    } catch {
      // fallback
    }
    this.saveAsetDesa(INITIAL_ASET_DESA);
    return INITIAL_ASET_DESA;
  },

  saveAsetDesa(list: AsetDesa[]): void {
    localStorage.setItem(STORAGE_KEYS.ASET_DESA, JSON.stringify(list));
  },

  addAsetDesa(asetData: Omit<AsetDesa, 'id' | 'createdAt' | 'updatedAt'>): AsetDesa {
    const current = this.getAsetDesa();
    const newAset: AsetDesa = {
      ...asetData,
      id: `aset_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newAset, ...current];
    this.saveAsetDesa(updated);
    return newAset;
  },

  updateAsetDesa(id: string, updates: Partial<AsetDesa>): AsetDesa | null {
    const current = this.getAsetDesa();
    const index = current.findIndex(a => a.id === id);
    if (index === -1) return null;

    const updatedItem: AsetDesa = {
      ...current[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    current[index] = updatedItem;
    this.saveAsetDesa(current);
    return updatedItem;
  },

  deleteAsetDesa(id: string): boolean {
    const current = this.getAsetDesa();
    const filtered = current.filter(a => a.id !== id);
    if (filtered.length !== current.length) {
      this.saveAsetDesa(filtered);
      return true;
    }
    return false;
  },

  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.KELUARGA);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUTH_LOGS);
    localStorage.removeItem(STORAGE_KEYS.ASET_DESA);
    this.saveKeluargaList(INITIAL_KELUARGA_DATA);
    this.saveNotifications(INITIAL_NOTIFICATIONS);
    this.saveAuthLogs(INITIAL_AUTH_LOGS);
    this.saveAsetDesa(INITIAL_ASET_DESA);
  }
};

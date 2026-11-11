import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Building,
  Phone,
  Mail,
  AlertTriangle,
  RotateCcw,
  X,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AtSign
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { saveUserToFirestore, deleteUserFromFirestore } from '../lib/firebase';
import { formatDateIndonesian } from '../utils/fifoUtils';

interface MasterDataUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUser: UserAccount | null;
  onUpdateCurrentUser: (user: UserAccount) => void;
}

export const MasterDataUsersModal: React.FC<MasterDataUsersModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onUpdateCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'roles'>('credentials');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  // Copied indicator state for clipboard
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Sub-modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserAccount | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('operator');
  const [formDepartment, setFormDepartment] = useState('Gudang Finished Goods');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  if (!isOpen) return null;

  // Filtered users for Master Data
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      u.fullName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.department && u.department.toLowerCase().includes(query));

    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchDomain =
      domainFilter === 'all' ||
      (domainFilter === 'japfa' && u.email.includes('japfa')) ||
      (domainFilter === 'google' && (u.email.includes('gmail') || u.email.includes('google')));

    return matchSearch && matchRole && matchStatus && matchDomain;
  });

  // KPI Metrics
  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const operatorCount = users.filter((u) => u.role === 'operator').length;
  const supervisorCount = users.filter((u) => u.role === 'supervisor').length;
  const activeCount = users.filter((u) => u.status === 'active').length;

  // Copy to clipboard helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => {
      setCopiedItem(null);
    }, 1500);
  };

  // Open Form to Add User
  const handleOpenAddForm = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormFullName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('operator');
    setFormDepartment('Gudang Finished Goods');
    setFormPhone('');
    setFormStatus('active');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Form to Edit User
  const handleOpenEditForm = (user: UserAccount) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormFullName(user.fullName);
    setFormEmail(user.email);
    setFormPassword(user.password || '');
    setFormRole(user.role);
    setFormDepartment(user.department || 'Gudang Finished Goods');
    setFormPhone(user.phone || '');
    setFormStatus(user.status);
    setFormError(null);
    setIsFormOpen(true);
  };

  // Save Add/Edit User
  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = formUsername.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
    const cleanFullName = formFullName.trim();
    const cleanEmail = formEmail.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      setFormError('Username minimal 3 karakter (hanya huruf, angka, titik, atau underscore).');
      return;
    }

    if (!cleanFullName) {
      setFormError('Nama lengkap karyawan wajib diisi.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('Format alamat email tidak valid.');
      return;
    }

    // Check duplicate username if new or changed
    const duplicateUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername &&
        (!editingUser || u.id !== editingUser.id)
    );
    if (duplicateUser) {
      setFormError(`Username "${cleanUsername}" sudah digunakan oleh akun lain di Master Data.`);
      return;
    }

    // Check duplicate email if new or changed
    const duplicateEmail = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail &&
        (!editingUser || u.id !== editingUser.id)
    );
    if (duplicateEmail) {
      setFormError(`Email "${cleanEmail}" sudah terdaftar pada akun @${duplicateEmail.username}.`);
      return;
    }

    if (!editingUser && (!formPassword || formPassword.length < 4)) {
      setFormError('Password minimal 4 karakter untuk kredensial baru.');
      return;
    }

    const targetId = editingUser ? editingUser.id : `usr-${Date.now()}`;
    const userToSave: UserAccount = {
      id: targetId,
      username: cleanUsername,
      fullName: cleanFullName,
      email: cleanEmail,
      role: formRole,
      status: formStatus,
      password: formPassword || editingUser?.password || 'japfa123',
      department: formDepartment.trim() || 'Gudang Finished Goods',
      phone: formPhone.trim(),
      createdAt: editingUser?.createdAt || new Date().toISOString(),
      lastLoginAt: editingUser?.lastLoginAt,
    };

    await saveUserToFirestore(userToSave);

    // If current logged-in user updated their own profile
    if (currentUser && currentUser.id === userToSave.id) {
      onUpdateCurrentUser(userToSave);
    }

    setIsFormOpen(false);
  };

  // Toggle user status active/inactive
  const handleToggleStatus = async (user: UserAccount) => {
    if (currentUser && currentUser.id === user.id && user.status === 'active') {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri saat sedang login.');
      return;
    }
    const updatedStatus: 'active' | 'inactive' = user.status === 'active' ? 'inactive' : 'active';
    const updatedUser: UserAccount = {
      ...user,
      status: updatedStatus,
    };
    await saveUserToFirestore(updatedUser);
  };

  // Open Change Password Modal
  const handleOpenPasswordModal = (user: UserAccount) => {
    setPasswordModalUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setFormError(null);
  };

  // Save Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (!newPassword || newPassword.length < 4) {
      setFormError('Password baru minimal 4 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Konfirmasi password tidak cocok.');
      return;
    }

    const updatedUser: UserAccount = {
      ...passwordModalUser,
      password: newPassword,
    };

    await saveUserToFirestore(updatedUser);
    if (currentUser && currentUser.id === updatedUser.id) {
      onUpdateCurrentUser(updatedUser);
    }
    setPasswordModalUser(null);
  };

  // Handle Delete User
  const handleConfirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    if (currentUser && currentUser.id === deleteConfirmUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif digunakan.');
      setDeleteConfirmUser(null);
      return;
    }

    if (deleteConfirmUser.role === 'admin' && adminCount <= 1) {
      alert('Sistem harus memiliki minimal satu akun Kepala Gudang (Admin). Akun ini tidak dapat dihapus.');
      setDeleteConfirmUser(null);
      return;
    }

    await deleteUserFromFirestore(deleteConfirmUser.id);
    setDeleteConfirmUser(null);
  };

  // Export Master Data Username & Email to CSV
  const handleExportMasterData = () => {
    let csvContent = '\uFEFF';
    csvContent += `MASTER DATA USERNAME & EMAIL KREDENSIAL LOGIN\n`;
    csvContent += `PT JAPFA COMFEED INDONESIA Tbk - UNIT GUDANG FINISHED GOODS\n`;
    csvContent += `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    csvContent += `No;Username;Email;Nama Karyawan;Role;Bagian/Departemen;Status;Login Terakhir\n`;

    users.forEach((u, idx) => {
      csvContent += `${idx + 1};"${u.username}";"${u.email}";"${u.fullName}";"${u.role}";"${u.department || '-'}";"${u.status === 'active' ? 'Aktif' : 'Nonaktif'}";"${u.lastLoginAt ? u.lastLoginAt.split('T')[0] : 'Belum pernah'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Master_Data_Username_Email_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-red-600" />
            Kepala Gudang (Admin)
          </span>
        );
      case 'operator':
        return (
          <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-blue-600" />
            Operator Gudang
          </span>
        );
      case 'supervisor':
        return (
          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-amber-600" />
            Supervisor (Checker)
          </span>
        );
      case 'viewer':
        return (
          <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
            Tamu / Viewer
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm print:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-slate-800 dark:border-slate-700 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 px-6 border-b-2 border-red-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-md">
              <AtSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg sm:text-xl tracking-tight text-white">
                  Master Data Username & Email
                </h2>
                <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Kredensial Login Terpusat
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Kelola master username unik, alamat email resmi, kredensial password, hak akses role, dan status aktif login.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMasterData}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Export Master Data Username & Email ke CSV/Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export Master</span>
            </button>

            <button
              onClick={handleOpenAddForm}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Username/Email</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & Subheader KPI */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-slate-500'
              }`}
            >
              Master Data Username & Email ({totalCount})
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-slate-500'
              }`}
            >
              Matriks Hak Akses & Izin
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-lg font-bold">
              {activeCount} Akun Aktif
            </span>
            <span className="bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800 px-2.5 py-1 rounded-lg font-bold">
              {adminCount} Admin
            </span>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 px-2.5 py-1 rounded-lg font-bold">
              {operatorCount} Operator
            </span>
          </div>

        </div>

        {/* Tab 1: Credentials Table View */}
        {activeTab === 'credentials' && (
          <>
            {/* Filter and Search Bar */}
            <div className="p-4 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex-1 min-w-[240px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Username, Email, Nama Karyawan, atau Bagian..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter:</span>
                </div>

                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">Semua Domain</option>
                  <option value="japfa">Domain JAPFA (@japfa)</option>
                  <option value="google">Domain Google (@gmail)</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">Semua Role</option>
                  <option value="admin">Kepala Gudang (Admin)</option>
                  <option value="operator">Operator Gudang</option>
                  <option value="supervisor">Supervisor QC</option>
                  <option value="viewer">Tamu / Viewer</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>

            {/* Users / Credentials Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-3 text-center w-12">No.</th>
                      <th className="py-3 px-4">Master Username</th>
                      <th className="py-3 px-4">Email Login Terdaftar</th>
                      <th className="py-3 px-4">Nama & Bagian</th>
                      <th className="py-3 px-4">Hak Akses</th>
                      <th className="py-3 px-4 text-center">Status Login</th>
                      <th className="py-3 px-4">Login Terakhir</th>
                      <th className="py-3 px-4 text-right">Aksi Kredensial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Tidak ada master data username/email yang cocok dengan kriteria pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => {
                        const isSelf = currentUser?.id === user.id;
                        const isActive = user.status === 'active';

                        return (
                          <tr
                            key={user.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              isSelf ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                            }`}
                          >
                            {/* Number */}
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400 text-xs">
                              {idx + 1}
                            </td>

                            {/* Username with Copy */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-amber-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                                  @{user.username}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(user.username, `user-${user.id}`)}
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                                  title="Salin Username"
                                >
                                  {copiedItem === `user-${user.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                {isSelf && (
                                  <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded font-sans">
                                    ANDA
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Email with Copy */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {user.email}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(user.email, `email-${user.id}`)}
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                                  title="Salin Email"
                                >
                                  {copiedItem === `email-${user.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Name & Department */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {user.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {user.department || 'Gudang Finished Goods'}
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3.5 px-4">
                              {getRoleBadge(user.role)}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200'
                                }`}
                                title="Klik untuk ubah status aktif/nonaktif login"
                              >
                                {isActive ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Aktif</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    <span>Nonaktif</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Last Login */}
                            <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                              {user.lastLoginAt ? (
                                <div>
                                  <div className="font-medium text-slate-700 dark:text-slate-300">
                                    {formatDateIndonesian(user.lastLoginAt.split('T')[0], 'short')}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {new Date(user.lastLoginAt).toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })} WIB
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Belum pernah</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPasswordModal(user)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                                  title="Ganti Password"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditForm(user)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Username & Email"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmUser(user)}
                                  disabled={isSelf || (user.role === 'admin' && adminCount <= 1)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isSelf || (user.role === 'admin' && adminCount <= 1)
                                      ? 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed opacity-50'
                                      : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 cursor-pointer'
                                  }`}
                                  title={
                                    isSelf
                                      ? 'Tidak dapat menghapus akun sendiri'
                                      : user.role === 'admin' && adminCount <= 1
                                      ? 'Tidak dapat menghapus admin terakhir'
                                      : 'Hapus Username/Email'
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Roles & Permissions Matrix */}
        {activeTab === 'roles' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <span>Matriks Otorisasi & Hak Akses Pengguna Sistem Gudang</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Setiap Username atau Email yang terdaftar di Master Data dikaitkan dengan satu tingkat hak akses operasional.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Admin */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-900/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-red-600">1. KEPALA GUDANG (ADMIN)</span>
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">Akses Penuh</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Mengelola Master Data Username & Email (tambah, edit, ubah password, hapus).</li>
                    <li>Menambah & menghapus item pakan ternak.</li>
                    <li>Melakukan mutasi penerimaan, pengeluaran FIFO, dan edit kavling lot.</li>
                    <li>Menghapus laporan tanggal tertentu dan mereset data laporan.</li>
                    <li>Mencetak dan mengekspor seluruh buku besar pakan ke Excel.</li>
                  </ul>
                </div>

                {/* Operator */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-blue-600">2. OPERATOR GUDANG</span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">Operasional Harian</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Input penerimaan pakan (Produksi, Kiriman/Retur).</li>
                    <li>Alokasi pengeluaran FIFO (Dimuat, Bocor/Repro).</li>
                    <li>Manajemen kavling lot, tanggal produksi, dan umur simpan.</li>
                    <li>Fitur Salin Stok Kemarin untuk pembukaan hari kerja baru.</li>
                    <li>Mencetak laporan PDF & ekspor CSV.</li>
                    <li><em>Tidak dapat mereset database atau mengelola master akun.</em></li>
                  </ul>
                </div>

                {/* Supervisor */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-amber-600">3. SUPERVISOR / QC (CHECKER)</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">Verifikasi & Signee</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Memeriksa keakuratan rekonsiliasi stok mutasi vs stok fisik kavling.</li>
                    <li>Menandatangani laporan pada kolom "Diperiksa Oleh" / "Diketahui Oleh".</li>
                    <li>Melihat grafik analisis umur pakan dan pergerakan persediaan.</li>
                    <li>Cetak dan ekspor dokumen laporan resmi.</li>
                  </ul>
                </div>

                {/* Viewer */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-700 dark:text-slate-300">4. AUDIT & TAMU (VIEWER)</span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">Hanya Baca</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Melihat laporan stok dan simulasi FIFO kavling secara transparan.</li>
                    <li>Mencetak salinan fisik dokumen laporan.</li>
                    <li><em>Dibatasi dari seluruh pengeditan angka mutasi atau kavling.</em></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Master Data Username & Email tersimpan aman dan terenkripsi pada database cloud Firestore.
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl cursor-pointer"
          >
            Tutup Master Data
          </button>
        </div>

        {/* --- Submodal: Form Tambah/Edit Master Username & Email --- */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-700 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <AtSign className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {editingUser ? 'Edit Master Username & Email' : 'Tambah Master Username & Email Baru'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveUserForm} className="mt-4 space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Username Login *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">@</span>
                      <input
                        type="text"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="contoh: wahyu, operator1"
                        required
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap Karyawan *
                    </label>
                    <input
                      type="text"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="e.g. Wahyu Andriansyah"
                      required
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alamat Email Resmi *
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. user@japfa.local atau nama@gmail.com"
                      required
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      No. Telepon / WA
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. 0812-3456-7890"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hak Akses (Role) *
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as UserRole)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="admin">Kepala Gudang (Admin Penuh)</option>
                      <option value="operator">Operator Gudang (Mutasi & Kavling)</option>
                      <option value="supervisor">Supervisor QC (Checker & Signee)</option>
                      <option value="viewer">Tamu / Viewer (Lihat & Cetak)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bagian / Departemen
                    </label>
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g. Gudang Finished Goods, QC"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {(!editingUser || formPassword) && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {editingUser ? 'Password Baru (Kosongkan bila tidak ingin diubah)' : 'Password Kredensial *'}
                    </label>
                    <input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingUser ? 'Biarkan kosong untuk mempertahankan password lama' : 'Minimal 4 karakter'}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Keaktifan Akun
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={formStatus === 'active'}
                        onChange={() => setFormStatus('active')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Aktif (Dapat Login ke Sistem)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={formStatus === 'inactive'}
                        onChange={() => setFormStatus('inactive')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                        Nonaktif (Dilarang Login)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                  >
                    {editingUser ? 'Simpan Perubahan Master' : 'Daftarkan ke Master Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- Submodal: Ganti Password Kredensial --- */}
        {passwordModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-700 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Ubah Password Kredensial
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                Memperbarui password login untuk Username <strong className="text-slate-800 dark:text-slate-200 font-mono">@{passwordModalUser.username}</strong> ({passwordModalUser.fullName}).
              </div>

              {formError && (
                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSavePassword} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      required
                      className="w-full p-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Konfirmasi Password Baru *
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalUser(null)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer"
                  >
                    Simpan Password Baru
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- Submodal: Konfirmasi Hapus Master Kredensial --- */}
        {deleteConfirmUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-300 dark:border-rose-900 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Master Username/Email?
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus kredensial <strong className="text-slate-900 dark:text-white font-mono">@{deleteConfirmUser.username}</strong> ({deleteConfirmUser.email}) dari Master Data? Pengguna ini tidak akan dapat login lagi ke sistem gudang pakan.
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteUser}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  Ya, Hapus Kredensial Ini
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

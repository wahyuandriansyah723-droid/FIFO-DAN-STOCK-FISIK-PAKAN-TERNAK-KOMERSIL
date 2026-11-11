import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Mail,
  Building2
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { signInWithGoogle, saveUserToFirestore } from '../lib/firebase';

interface LoginViewProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  currentUser?: UserAccount | null;
  onCancel?: () => void;
  isModal?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLoginSuccess,
  currentUser,
  onCancel,
  isModal = false,
}) => {
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      setErrorMsg('Silakan masukkan Username atau Email yang terdaftar di Master Data.');
      return;
    }

    if (!cleanPassword) {
      setErrorMsg('Silakan masukkan Password akun Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user from Master Data Username & Email
      const matchedUser = users.find(
        (u) =>
          u.username.toLowerCase() === cleanIdentifier ||
          u.email.toLowerCase() === cleanIdentifier
      );

      if (!matchedUser) {
        setErrorMsg('Username atau Email tidak terdaftar dalam Master Data Pengguna. Hubungi Kepala Gudang.');
        setIsLoading(false);
        return;
      }

      if (matchedUser.status === 'inactive') {
        setErrorMsg('Akun ini telah dinonaktifkan di Master Data. Hubungi Administrator / Kepala Gudang.');
        setIsLoading(false);
        return;
      }

      // Check password credential
      if (matchedUser.password && matchedUser.password !== cleanPassword) {
        setErrorMsg('Password yang Anda masukkan salah. Periksa kembali huruf besar/kecil Anda.');
        setIsLoading(false);
        return;
      }

      // Success: update last login timestamp in Firestore
      const updatedUser: UserAccount = {
        ...matchedUser,
        lastLoginAt: new Date().toISOString(),
      };

      saveUserToFirestore(updatedUser);
      setIsLoading(false);
      onLoginSuccess(updatedUser);
    }, 350);
  };

  // Google Login Handler
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      if (!fbUser || !fbUser.email) {
        setGoogleLoading(false);
        return;
      }

      const email = fbUser.email.toLowerCase();
      // Match with existing master data user
      let matchedUser = users.find((u) => u.email.toLowerCase() === email);

      if (matchedUser) {
        if (matchedUser.status === 'inactive') {
          setErrorMsg('Email Google ini terdaftar di Master Data namun dalam status Nonaktif.');
          setGoogleLoading(false);
          return;
        }

        const updated: UserAccount = {
          ...matchedUser,
          fullName: matchedUser.fullName || fbUser.displayName || 'Pengguna Google',
          avatarUrl: fbUser.photoURL || matchedUser.avatarUrl,
          lastLoginAt: new Date().toISOString(),
        };
        await saveUserToFirestore(updated);
        onLoginSuccess(updated);
      } else {
        // Auto-provision user account: if matches wahyu / admin give admin, else operator
        const isWahyu = email.includes('wahyu') || email.includes('admin');
        const role: UserRole = isWahyu || users.length === 0 ? 'admin' : 'operator';

        const newUser: UserAccount = {
          id: `usr-g-${Date.now()}`,
          username: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_'),
          fullName: fbUser.displayName || email.split('@')[0],
          email: fbUser.email,
          role,
          status: 'active',
          avatarUrl: fbUser.photoURL || undefined,
          department: isWahyu ? 'Kepala Gudang Finished Goods' : 'Staff Operasional Gudang',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        await saveUserToFirestore(newUser);
        onLoginSuccess(newUser);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Gagal login dengan akun Google. Silakan masukkan Username & Password.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const containerClasses = isModal
    ? 'bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-8 overflow-y-auto max-h-[92vh]'
    : 'min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6';

  return (
    <div className={isModal ? 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm' : containerClasses}>
      <div className={isModal ? containerClasses : 'w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden'}>
        
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-7 relative border-b-2 border-red-600">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white font-black px-3 py-1.5 rounded-lg text-lg tracking-wider shadow-md">
                JAPFA
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Portal Login Gudang Pakan</span>
                  <span className="text-[10px] font-mono bg-red-600/30 text-red-200 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
                    SECURE
                  </span>
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  PT Japfa Comfeed Indonesia Tbk • Unit Gudang Finished Goods
                </p>
              </div>
            </div>

            {isModal && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup"
              >
                ✕
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Autentikasi Master Data Kredensial Pengguna</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-5">

          {/* Error Message Notice */}
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <div className="flex-1 font-semibold">{errorMsg}</div>
            </div>
          )}

          {/* Form Login Credentials */}
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Username atau Email Terdaftar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan Username atau Email Karyawan"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-slate-900 dark:text-white"
                  autoFocus
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Gunakan kredensial yang telah didaftarkan pada Master Data Login.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password Akun
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Password Anda"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-slate-900 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Laporan Gudang</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Atau Masuk Dengan
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-300 dark:border-slate-700 shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                <span>Menghubungkan Akun Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk dengan Akun Google</span>
              </>
            )}
          </button>

          {/* Security & Master Data Notice */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-red-600" />
              <span>Keamanan Akses &amp; Master Data Pengguna</span>
            </div>
            <p className="leading-relaxed">
              <strong>Kebijakan Akses:</strong> Untuk melindungi integritas data stok fisik dan audit pakan JAPFA, setiap kali Anda keluar dari link atau menutup browser, sistem mewajibkan login ulang.
            </p>
            <p className="text-[10px] text-slate-400">
              Kredensial username dan password dikelola secara terpusat oleh Kepala Gudang melalui Master Data.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

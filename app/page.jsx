'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { getAssetPath } from '../lib/utils';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  ShoppingBag, 
  HelpCircle,
  School,
  Lock
} from 'lucide-react';

export default function HomeLogin() {
  const router = useRouter();

  // Intro states:
  // showIntro: true means the intro DOM is present
  // introFading: true triggers the smooth fade-out CSS opacity transition
  const [showIntro, setShowIntro] = useState(true);
  const [introFading, setIntroFading] = useState(false);

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);

  useEffect(() => {
    // 1. Timer Intro Kanvas.gif: tayang ~2.2 detik, lalu fade-out smooth (700ms)
    const fadeTimer = setTimeout(() => {
      setIntroFading(true);
    }, 2200);

    const endTimer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);

    // 2. Check if user already logged in via Supabase or stored session
    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.warn('Session check:', err);
      }
    };
    checkActiveSession();

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [router]);

  const handleSkipIntro = () => {
    setIntroFading(true);
    setTimeout(() => setShowIntro(false), 300);
  };

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}${getAssetPath('/dashboard')}` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        alert('Info: ' + error.message + '\nAnda juga dapat langsung masuk menggunakan Mode Cepat Wali Murid.');
        setIsLoadingGoogle(false);
      }
    } catch (err) {
      alert('Gagal login Google. Silakan gunakan Mode Masuk Langsung.');
      setIsLoadingGoogle(false);
    }
  };

  const handleQuickAccess = (e) => {
    e.preventDefault();
    setIsLoadingGuest(true);
    
    // Simpan profil wali murid lokal untuk kemudahan pemesanan
    const parentProfile = {
      fullName: guestName.trim() || 'Wali Murid PENABUR',
      phone: guestPhone.trim() || '',
      isGuest: true,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('kanvas_parent_session', JSON.stringify(parentProfile));
    }

    setTimeout(() => {
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#F8FAFC] flex flex-col justify-between overflow-x-hidden">
      {/* =========================================================================
          INTRO ANIMATION OVERLAY (Intro Kanvas.gif + Smooth Fade Transition)
         ========================================================================= */}
      {showIntro && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070B14] text-white transition-opacity duration-700 ease-out select-none ${
            introFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Skip Button */}
          <button
            onClick={handleSkipIntro}
            className="absolute top-5 right-5 text-xs text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-md transition-all flex items-center gap-1 active:scale-95"
          >
            Lewati <ArrowRight size={13} />
          </button>

          {/* Intro GIF Container */}
          <div className="w-full max-w-[340px] px-6 flex flex-col items-center justify-center">
            <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center">
              <img
                src={getAssetPath('/intro-kanvas.gif')}
                alt="Intro Kanvas PENABUR"
                className="w-full h-full object-contain drop-shadow-[0_15px_35px_rgba(245,158,11,0.25)]"
              />
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-amber-300 font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>Memuat Kanvas PENABUR...</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          HALAMAN LOGIN & PORTAL WALI MURID (Mobile-First Experience)
         ========================================================================= */}
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 animate-fade-in">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 group">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-amber-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <img
              src={getAssetPath('/kanvas-logo-fix.png')}
              alt="Kanvas PENABUR"
              className="relative w-44 md:w-52 h-auto object-contain drop-shadow-md"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-[11px] font-bold tracking-wide uppercase mt-1 mb-2">
            <ShieldCheck size={13} className="text-blue-600" />
            Layanan Resmi BPK PENABUR
          </div>

          <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
            Pesan Seragam Sekolah
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-amber-600">
              Lebih Mudah & Praktis
            </span>
          </h1>

          <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-xs font-medium leading-relaxed">
            Pilih seragam sesuai cabang sekolah & jenjang anak Anda, cek ukuran akurat, dan konfirmasi pesanan langsung.
          </p>
        </div>

        {/* Feature Highlights Pill */}
        <div className="grid grid-cols-3 gap-2 my-6">
          <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5 font-bold">
              <School size={16} />
            </div>
            <span className="text-[10.5px] font-bold text-slate-800 leading-tight">80+ Sekolah</span>
            <span className="text-[9px] text-slate-400">Semua Jenjang</span>
          </div>

          <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-1.5 font-bold">
              <Sparkles size={16} />
            </div>
            <span className="text-[10.5px] font-bold text-slate-800 leading-tight">Size Akurat</span>
            <span className="text-[9px] text-slate-400">Size Chart S-10L</span>
          </div>

          <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5 font-bold">
              <ShoppingBag size={16} />
            </div>
            <span className="text-[10.5px] font-bold text-slate-800 leading-tight">Stok Terbuka</span>
            <span className="text-[9px] text-slate-400">Resmi Koperasi</span>
          </div>
        </div>

        {/* Action Card: Pilihan Akses Masuk */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md">
          {!showGuestForm ? (
            <div className="flex flex-col gap-3">
              {/* Primary: Quick Entry for Parents (Paling Cepat & Ramah Ortu) */}
              <button
                onClick={() => setShowGuestForm(true)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0F2C59] to-[#1E3A8A] text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              >
                <ShoppingBag size={18} className="text-amber-400" />
                <span>Mulai Pesan Seragam</span>
                <ArrowRight size={16} className="ml-auto" />
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  atau
                </span>
              </div>

              {/* Google OAuth Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoadingGoogle}
                className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>{isLoadingGoogle ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
              </button>
            </div>
          ) : (
            /* Quick Access Form */
            <form onSubmit={handleQuickAccess} className="flex flex-col gap-3 animate-fade-in">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Isi Data Singkat Wali Murid
                </span>
                <button
                  type="button"
                  onClick={() => setShowGuestForm(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Kembali
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nama Lengkap Orang Tua / Wali
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendra Wijaya"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nomor WhatsApp Aktif
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Nomor ini digunakan untuk update status pesanan seragam.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoadingGuest}
                className="w-full mt-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoadingGuest ? 'Membuka Katalog...' : 'Lanjut ke Katalog Seragam'}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>

        {/* Security & Help Footer */}
        <div className="mt-auto pt-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-medium">
            <Lock size={12} className="text-slate-400" />
            <span>Koneksi Aman Terverifikasi Koperasi BPK PENABUR</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Butuh bantuan pemesanan? Hubungi Koperasi di WhatsApp: <strong className="text-slate-600">0812-9000-xxxx</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

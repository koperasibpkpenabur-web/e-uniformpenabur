'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { getAssetPath, triggerHaptic } from '../lib/utils';
import { 
  getSchoolList, 
  deriveSchoolLevel, 
  getNextSchoolLevel,
  getAvailableGrades,
  cleanSchoolName,
  checkParentRegistered, 
  saveParentRegistration 
} from '../lib/schools';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  ShoppingBag, 
  School, 
  Lock, 
  AlertTriangle, 
  X, 
  UserCheck, 
  Check,
  Volume2,
  VolumeX,
  Smartphone,
  Download,
  Share2
} from 'lucide-react';

export default function HomeLogin() {
  const router = useRouter();
  const videoRef = useRef(null);

  // App Phase: 'intro' | 'loading' | 'login'
  // Opsi 2: Cek apakah pengguna sudah pernah melihat intro pada sesi ini
  const [appPhase, setAppPhase] = useState('intro');
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [fadeTransition, setFadeTransition] = useState(false);

  // Loading Screen States
  const [loadingProgress, setLoadingProgress] = useState(15);
  const [loadingStatusText, setLoadingStatusText] = useState('Menghubungkan ke Server Koperasi...');
  const [loadingChecks, setLoadingChecks] = useState([
    { id: 1, label: 'Koneksi Server Supabase', done: false },
    { id: 2, label: 'Katalog Seragam & Atribut', done: false },
    { id: 3, label: 'Data Sekolah & Whitelist', done: false },
    { id: 4, label: 'Kesiapan Aplikasi', done: false },
  ]);

  // School Whitelist List
  const [schoolList, setSchoolList] = useState([]);

  // Auth & Pop-up States
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [showUnregisteredModal, setShowUnregisteredModal] = useState(false);
  const [unregisteredEmail, setUnregisteredEmail] = useState('');

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    parentName: '',
    studentName: '',
    studentType: 'luar', // 'luar' (Siswa Baru dari Luar) | 'dalam' (Siswa Dalam PENABUR)
    schoolName: '',
    schoolLevel: '',
    studentClass: '',
    phone: '',
    email: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Audio Intro Video State & Controls
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showAudioToggle, setShowAudioToggle] = useState(false);

  // Fitur Pasang Aplikasi (PWA Direct Install)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isAppStandalone, setIsAppStandalone] = useState(false);

  // Cek PWA install prompt & URL parameter ?install=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsAppStandalone(standalone);

      const ua = window.navigator.userAgent.toLowerCase();
      const apple = /iphone|ipad|ipod/.test(ua);
      setIsIOSDevice(apple);

      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('install') === 'true' && !standalone) {
        setShowInstallModal(true);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  // Onboarding Guided Tour (Opsi A Spotlight)
  // null | 'welcome' | 'ask' | 'spotlight_register' | 'spotlight_form'
  const [guideState, setGuideState] = useState(null);

  useEffect(() => {
    if (appPhase === 'login') {
      try {
        const dismissed = localStorage.getItem('kanvas_tour_dismissed');
        if (!dismissed) {
          const timer = setTimeout(() => {
            setGuideState('welcome');
          }, 450);
          return () => clearTimeout(timer);
        }
      } catch (e) {}
    }
  }, [appPhase]);

  // 1. Inisialisasi Sesi (Smart Session & OAuth Detection)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Cek apakah ada token OAuth Google di URL (#access_token=... atau ?code=...)
        const hasAuthHash =
          window.location.hash.includes('access_token=') ||
          window.location.search.includes('code=');
        const hasSeenIntro = sessionStorage.getItem('kanvas_intro_seen');

        if (hasAuthHash || hasSeenIntro === 'true') {
          // Jika baru kembali dari Google OAuth atau sudah pernah tonton intro di sesi ini, langsung ke login
          setAppPhase('login');
        } else {
          setAppPhase('intro');
        }
      } catch (e) {
        setAppPhase('intro');
      }
      setIsSessionChecked(true);
    }
  }, []);

  // 2. Load school list
  useEffect(() => {
    const loadSchools = async () => {
      const list = await getSchoolList(supabase);
      setSchoolList(list);
      if (list.length > 0) {
        const firstSchool = list[0].name;
        const firstLevel = list[0].level || deriveSchoolLevel(firstSchool);
        const grades = getAvailableGrades(firstLevel);
        setRegisterForm((prev) => ({
          ...prev,
          schoolName: firstSchool,
          schoolLevel: firstLevel,
          studentClass: grades.length > 0 ? grades[0] : '-',
        }));
      }
    };
    loadSchools();
  }, []);

  // 3. Transisi Mulus dari Intro -> Loading (Tanpa Kebocoran Tampilan Login!)
  const handleIntroComplete = () => {
    setFadeTransition(true);
    setTimeout(() => {
      setAppPhase('loading');
      setFadeTransition(false);
    }, 300);
  };

  // Auto-play video dengan audio jika diizinkan browser
  useEffect(() => {
    if (appPhase === 'intro' && videoRef.current) {
      videoRef.current.muted = false;
      const promise = videoRef.current.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsAudioMuted(false);
            setShowAudioToggle(true);
          })
          .catch(() => {
            // Jika browser membatasi autoplay audio, fallback ke muted
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
              setIsAudioMuted(true);
              setShowAudioToggle(true);
            }
          });
      }
    }
  }, [appPhase]);

  const toggleIntroAudio = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsAudioMuted(nextMuted);
    }
  };

  // Video fallback timer: durasi video 5 detik, diberi batas 5.8 detik jika autoplay terhenti di beberapa HP
  useEffect(() => {
    if (appPhase === 'intro') {
      const timer = setTimeout(() => {
        handleIntroComplete();
      }, 5800);
      return () => clearTimeout(timer);
    }
  }, [appPhase]);

  // PWA Trigger Install
  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallModal(false);
      }
      setDeferredPrompt(null);
    } else if (isIOSDevice) {
      alert('Petunjuk iPhone/iPad:\n1. Ketuk tombol Bagikan (Share / kotak panah ke atas) di Safari.\n2. Gulir ke bawah dan pilih "Tambah ke Layar Utama" (Add to Home Screen).');
    } else {
      alert('Untuk memasang aplikasi Kanvas di HP:\nKetuk menu browser (titik 3 di pojok kanan atas) lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".');
    }
  };

  // 4. Loading Progression (~1.8 detik) lalu masuk ke Login
  useEffect(() => {
    if (appPhase === 'loading') {
      const t1 = setTimeout(() => {
        setLoadingProgress(45);
        setLoadingStatusText('Sinkronisasi Katalog Seragam & Atribut...');
        setLoadingChecks((prev) => prev.map((c) => (c.id === 1 ? { ...c, done: true } : c)));
      }, 400);

      const t2 = setTimeout(() => {
        setLoadingProgress(75);
        setLoadingStatusText('Memvalidasi Data Sekolah & Jenjang...');
        setLoadingChecks((prev) => prev.map((c) => (c.id === 2 ? { ...c, done: true } : c)));
      }, 900);

      const t3 = setTimeout(() => {
        setLoadingProgress(98);
        setLoadingStatusText('Kondisi Aplikasi Prima & Siap Digunakan...');
        setLoadingChecks((prev) => prev.map((c) => (c.id === 3 ? { ...c, done: true } : c)));
      }, 1400);

      const t4 = setTimeout(() => {
        setLoadingProgress(100);
        setLoadingChecks((prev) => prev.map((c) => (c.id === 4 ? { ...c, done: true } : c)));
        
        // Tandai bahwa intro & loading sudah selesai untuk sesi browser ini (Opsi 2)
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('kanvas_intro_seen', 'true');
          } catch (e) {}
        }

        setFadeTransition(true);
        setTimeout(() => {
          setAppPhase('login');
          setFadeTransition(false);
        }, 350);
      }, 1900);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [appPhase]);

  // 5. Cek Google Auth Callback & Pasang Event Listener (Akurat & Cepat seperti di Aksara)
  useEffect(() => {
    let isMounted = true;

    const processAuthSession = async (session) => {
      if (!session?.user || !isMounted) return;
      try {
        const userEmail = session.user.email;
        const { registered, profile } = await checkParentRegistered(supabase, userEmail, session.user.id);

        if (registered) {
          if (profile && typeof window !== 'undefined') {
            localStorage.setItem('kanvas_parent_session', JSON.stringify(profile));
          }
          router.push('/dashboard');
        } else {
          setUnregisteredEmail(userEmail || '');
          setRegisterForm((prev) => ({
            ...prev,
            email: userEmail || '',
            parentName: session.user.user_metadata?.full_name || prev.parentName,
          }));
          setShowUnregisteredModal(true);
        }
      } catch (err) {
        console.warn('Auth redirect check:', err);
      }
    };

    // 1. Cek sesi saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) processAuthSession(session);
    });

    // 2. Dengarkan perubahan status login (OAuth redirect callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        processAuthSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  const handleGoogleLogin = async () => {
    triggerHaptic(14);
    setIsLoadingGoogle(true);
    try {
      // Bersihkan sesi lokal lama sebelum membuka popup Google agar selalu menampilkan pemilih akun
      await supabase.auth.signOut();
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}${getAssetPath('/')}` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });

      if (error) {
        alert('Gagal login Google: ' + error.message);
        setIsLoadingGoogle(false);
      }
    } catch (err) {
      alert('Terjadi kendala saat login Google.');
      setIsLoadingGoogle(false);
    }
  };

  const handleRegisterSchoolChange = (schoolName) => {
    const found = schoolList.find((s) => cleanSchoolName(s.name) === cleanSchoolName(schoolName));
    const lockedLevel = found?.level || deriveSchoolLevel(schoolName);
    const grades = getAvailableGrades(lockedLevel);
    setRegisterForm((prev) => ({
      ...prev,
      schoolName: schoolName,
      schoolLevel: lockedLevel,
      studentClass: grades.length > 0 ? (grades.includes(prev.studentClass) ? prev.studentClass : grades[0]) : '-',
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.parentName.trim() || !registerForm.studentName.trim() || !registerForm.phone.trim()) {
      alert('Mohon lengkapi semua data pendaftaran.');
      return;
    }

    setIsRegistering(true);
    try {
      let authUserId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authUserId = session?.user?.id || null;
      } catch (e) {}

      await saveParentRegistration(supabase, registerForm, authUserId);
      if (guideState === 'spotlight_form') {
        try {
          localStorage.setItem('kanvas_guide_active', 'true');
          localStorage.setItem('kanvas_guide_step', '3');
        } catch (e) {}
      }
      setShowRegisterModal(false);
      alert(`Pendaftaran Berhasil!\nSelamat datang Bapak/Ibu ${registerForm.parentName}. Silakan melanjutkan pemesanan seragam.`);
      router.push('/dashboard');
    } catch (err) {
      alert('Gagal menyimpan pendaftaran: ' + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // Jangan render sebelum sesi di browser terverifikasi untuk menghindari flicker
  if (!isSessionChecked) {
    return <div className="w-full min-h-screen bg-[#070B14]"></div>;
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between overflow-x-hidden font-sans">
      {/* =========================================================================
          FASE 1: VIDEO INTRO 5 DETIK (Video Intro Kanvas.mp4)
          HANYA RENDER FASE INI AGAR TIDAK ADA KEDIPAN/KEBOCORAN HALAMAN LOGIN!
         ========================================================================= */}
      {appPhase === 'intro' && (
        <div
          onClick={() => {
            // Ketukan layar otomatis membuka audio jika sedang muted oleh browser
            if (videoRef.current && isAudioMuted) {
              videoRef.current.muted = false;
              setIsAudioMuted(false);
            }
          }}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070B14] text-white select-none transition-opacity duration-300 ease-out cursor-pointer ${
            fadeTransition ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Tombol Audio Speaker (Lewati dihapus sesuai instruksi branding Kanvas) */}
          {showAudioToggle && (
            <button
              onClick={toggleIntroAudio}
              className="absolute top-5 right-5 text-xs text-slate-200 hover:text-white bg-black/60 hover:bg-black/80 px-3.5 py-1.5 rounded-full backdrop-blur-md transition-all flex items-center gap-1.5 active:scale-95 z-50 border border-white/20 shadow-lg"
              title={isAudioMuted ? 'Ketuk untuk menyalakan audio' : 'Audio menyala'}
            >
              {isAudioMuted ? <VolumeX size={14} className="text-amber-400" /> : <Volume2 size={14} className="text-emerald-400" />}
              <span className="font-semibold">{isAudioMuted ? 'Nyalakan Audio' : 'Audio Aktif'}</span>
            </button>
          )}

          {/* Pemutar Video 5 Detik - Proper Full Screen Mobile */}
          <div className="w-full h-full max-w-lg md:max-h-[92vh] flex items-center justify-center relative overflow-hidden">
            <video
              ref={videoRef}
              src={getAssetPath('/video-intro-kanvas.mp4')}
              autoPlay
              playsInline
              preload="auto"
              onEnded={handleIntroComplete}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          FASE 2: HALAMAN LOADING SISTEM (Readiness Check)
          TRANSISI GELAP KE GELAP (#070B14 -> #0B1528) SEHINGGA SANGAT MULUS
         ========================================================================= */}
      {appPhase === 'loading' && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1528] text-white px-6 select-none transition-opacity duration-300 ease-out ${
            fadeTransition ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full max-w-xs flex flex-col items-center text-center">
            {/* Ambient Logo Glow */}
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-2xl animate-pulse"></div>
              <img
                src={getAssetPath('/kanvas-logo-only.png')}
                alt="Kanvas PENABUR"
                className="relative w-20 h-20 object-contain drop-shadow-[0_10px_25px_rgba(245,158,11,0.3)] animate-pulse-glow"
              />
            </div>

            <h2 className="text-lg font-black tracking-wide text-white mb-1">
              KANVAS PENABUR
            </h2>
            <p className="text-xs text-amber-300 font-semibold mb-6">
              Menyiapkan Pengalaman Terbaik Anda
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2 p-0.5 border border-slate-700/80 mb-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between w-full text-[10px] text-slate-400 font-mono mb-6">
              <span>{loadingStatusText}</span>
              <span className="font-bold text-amber-400">{loadingProgress}%</span>
            </div>

            {/* Checklist Indikator Kesiapan */}
            <div className="w-full bg-slate-900/60 rounded-2xl p-3.5 border border-slate-800 space-y-2 text-left">
              {loadingChecks.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 text-[11px] font-medium">{item.label}</span>
                  {item.done ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <Check size={12} /> Siap
                    </span>
                  ) : (
                    <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FASE 3: HALAMAN LOGIN RESMI KANVAS PENABUR
          HANYA DITAMPILKAN SETELAH LOADING SELESAI 100%!
         ========================================================================= */}
      {appPhase === 'login' && (
        <div className="flex-1 flex flex-col bg-[#F8FAFC] px-5 sm:px-7 pt-6 pb-6 animate-fade-in justify-between min-h-screen w-full max-w-lg mx-auto relative">
          {/* Header Branding */}
          <div className="flex flex-col items-center text-center relative pt-2">
            {/* Tombol Install App & Panduan Cepat */}
            <div className="absolute right-0 top-0 flex items-center gap-2">
              {!isAppStandalone && (
                <button
                  type="button"
                  onClick={() => setShowInstallModal(true)}
                  className="text-xs font-bold text-blue-900 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 flex items-center gap-1.5 transition-all shadow-2xs"
                  title="Pasang Aplikasi Kanvas di HP"
                >
                  <Download size={13} className="text-blue-700" />
                  <span>Install App</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setGuideState('welcome')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1 transition-all shadow-2xs"
              >
                <span>💡 Panduan</span>
              </button>
            </div>

            <div className="relative mb-3 group mt-2">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-amber-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <img
                src={getAssetPath('/kanvas-logo-fix.png')}
                alt="Kanvas PENABUR"
                className="relative w-48 md:w-56 h-auto object-contain drop-shadow-md"
              />
            </div>

            {/* Tulisan Resmi: Kanal Visual Atribut Sekolah BPK PENABUR */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-900 text-xs font-bold tracking-wide uppercase mb-2">
              <ShieldCheck size={14} className="text-blue-600" />
              Kanal Visual Atribut Sekolah BPK PENABUR
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              Pesan Seragam Sekolah
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-amber-600">
                Lebih Mudah & Praktis
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-600 mt-2 max-w-sm font-medium leading-relaxed">
              Masuk untuk mengakses katalog seragam resmi sesuai cabang sekolah & jenjang anak Anda.
            </p>
          </div>

          {/* Card Login (Posisi Naik & Center - 3 Highlights Dihilangkan) */}
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/80 shadow-md flex flex-col gap-4 my-auto relative z-40 w-full">
            <span className="text-sm font-bold text-slate-800 text-center block">
              Silakan Masuk dengan Akun Anda
            </span>

            {/* Tombol Login Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle}
              className="w-full py-4 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-900 text-slate-800 rounded-2xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>{isLoadingGoogle ? 'Memverifikasi Akun...' : 'Masuk dengan Akun Google'}</span>
            </button>

            {/* Link Belum punya akun? Daftar disini */}
            <div className="pt-2 border-t border-slate-100 text-center relative">
              {/* Tooltip Spotlight Step 1: Di atas tulisan "Daftar disini" */}
              {guideState === 'spotlight_register' && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 bg-slate-900 text-white rounded-xl p-2.5 shadow-2xl border border-amber-400 z-50 text-center animate-bounce-subtle">
                  <p className="text-xs font-black text-amber-300">
                    👉 Klik ini untuk memulai
                  </p>
                  <p className="text-[11px] text-slate-200 mt-0.5 leading-tight">
                    Pendaftaran akun wali murid & data siswa baru
                  </p>
                  {/* Panah bawah */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-amber-400"></div>
                </div>
              )}

              <p className="text-sm text-slate-600 font-medium">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    if (guideState === 'spotlight_register') {
                      setGuideState('spotlight_form');
                    }
                    setShowRegisterModal(true);
                  }}
                  className={`text-amber-600 hover:text-amber-700 font-bold underline cursor-pointer transition-all ${
                    guideState === 'spotlight_register'
                      ? 'bg-amber-400 text-slate-950 px-2.5 py-1 rounded-md ring-4 ring-amber-400/50 shadow-md font-black animate-pulse'
                      : ''
                  }`}
                >
                  Daftar disini
                </button>
              </p>
            </div>
          </div>

          {/* Security Footer (Posisi Lebih Dekat Tanpa Scroll) */}
          <div className="pt-4 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Lock size={13} className="text-slate-400" />
              <span>Koneksi Aman Terverifikasi Koperasi BPK PENABUR</span>
            </div>
          </div>

          {/* Dark Overlay untuk Spotlight Opsi A */}
          {guideState === 'spotlight_register' && (
            <div
              onClick={() => {
                setGuideState(null);
                try {
                  localStorage.setItem('kanvas_guide_active', 'false');
                } catch (e) {}
              }}
              className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-2xs transition-opacity"
            ></div>
          )}
        </div>
      )}

      {/* =========================================================================
          PANDUAN PEMESANAN: POP-UP 1 (SELAMAT DATANG)
         ========================================================================= */}
      {guideState === 'welcome' && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-sm text-center animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-900 to-amber-500 p-0.5 mx-auto mb-3 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <img src={getAssetPath('/kanvas-logo-only.png')} alt="Kanvas" className="w-9 h-9 object-contain" />
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1.5">
              Selamat Datang di Kanvas PENABUR
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Platform digital pemesanan seragam untuk sekolah BPK PENABUR.
            </p>
            <button
              type="button"
              onClick={() => setGuideState('ask')}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Lanjut</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PANDUAN PEMESANAN: POP-UP 2 (APAKAH MEMBUTUHKAN PANDUAN?)
         ========================================================================= */}
      {guideState === 'ask' && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-sm text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 font-bold text-xl shadow-xs">
              💡
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1.5">
              Apakah Anda Membutuhkan Panduan?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Kami dapat memandu Anda langkah demi langkah dalam memesan seragam sekolah putra-putri Anda.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setGuideState(null);
                  try {
                    localStorage.setItem('kanvas_tour_dismissed', 'true');
                    localStorage.setItem('kanvas_guide_active', 'false');
                  } catch (e) {}
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-98"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={() => {
                  setGuideState('spotlight_register');
                  try {
                    localStorage.setItem('kanvas_guide_active', 'true');
                  } catch (e) {}
                }}
                className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-98"
              >
                Ya, Mulai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POP-UP 1: MODAL "AKUN BELUM TERDAFTAR"
         ========================================================================= */}
      {showUnregisteredModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-sm text-center animate-fade-in relative">
            <button
              onClick={() => setShowUnregisteredModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center"
            >
              <X size={15} />
            </button>

            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Akun Belum Terdaftar
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Akun Google <strong className="text-slate-800">{unregisteredEmail || 'Anda'}</strong> belum terdaftar pada sistem Kanvas PENABUR. Silakan melakukan pendaftaran terlebih dahulu.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowUnregisteredModal(false);
                  setShowRegisterModal(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105"
              >
                Daftar Akun Baru Sekarang
              </button>
              <button
                onClick={() => setShowUnregisteredModal(false)}
                className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POP-UP 2: MODAL PENDAFTARAN WALI MURID (Lock Jenjang Otomatis)
         ========================================================================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <UserCheck size={20} className="text-blue-900" />
                <h3 className="font-bold text-base text-slate-900">Pendaftaran Akun Wali Murid</h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Lengkapi data di bawah ini untuk menghubungkan pemesanan seragam resmi siswa ke sekolah:
            </p>

            {guideState === 'spotlight_form' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700 shadow-sm text-xs mb-4 space-y-1 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                    <Sparkles size={14} /> Langkah 1: Pengisian Formulir
                  </span>
                  <span className="text-xs text-blue-200">Panduan Aktif</span>
                </div>
                <p className="text-xs text-blue-100 leading-snug">
                  Lengkapi data orang tua, nama siswa, kategori (Siswa Baru / Siswa Dalam), sekolah & kelas, lalu klik <b>Daftar Akun</b>.
                </p>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Nama Lengkap Orang Tua */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Lengkap Orang Tua *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendra Wijaya"
                  value={registerForm.parentName}
                  onChange={(e) => setRegisterForm({ ...registerForm, parentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Nama Lengkap Siswa */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jonathan Chris"
                  value={registerForm.studentName}
                  onChange={(e) => setRegisterForm({ ...registerForm, studentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Kategori Asal Siswa: Siswa Baru (Luar) vs Siswa Dalam PENABUR */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Kategori Asal Siswa *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setRegisterForm({ ...registerForm, studentType: 'luar' })}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer flex flex-col transition-all ${
                      registerForm.studentType === 'luar'
                        ? 'border-blue-700 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[11px] font-extrabold text-slate-900">Siswa Baru</span>
                    <span className="text-[9.5px] text-slate-500">Dari Luar PENABUR</span>
                  </div>

                  <div
                    onClick={() => setRegisterForm({ ...registerForm, studentType: 'dalam' })}
                    className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col transition-all ${
                      registerForm.studentType === 'dalam'
                        ? 'border-blue-700 bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-slate-900">Siswa Dalam</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Internal / Naik Jenjang</span>
                  </div>
                </div>
              </div>

              {/* Nama Sekolah (Dropdown dari tabel school_whitelist) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {registerForm.studentType === 'dalam' ? 'Sekolah PENABUR Saat Ini *' : 'Sekolah PENABUR Tujuan *'}
                </label>
                <select
                  required
                  value={registerForm.schoolName}
                  onChange={(e) => handleRegisterSchoolChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                >
                  {schoolList.map((sch, idx) => (
                    <option key={idx} value={sch.name}>
                      {sch.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400 mt-1 block">
                  Data diambil dari daftar resmi sekolah BPK PENABUR.
                </span>
              </div>

              {/* Jenjang (Otomatis Lock Sesuai Sekolah yang Dipilih!) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Jenjang Sekolah *
                  </label>
                  <span className="text-xs text-amber-600 font-bold flex items-center gap-0.5">
                    <Lock size={12} /> Terkunci Otomatis
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={registerForm.schoolLevel}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-sm font-black text-blue-900 cursor-not-allowed uppercase tracking-wider"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-extrabold rounded-md">
                    {registerForm.schoolLevel}
                  </div>
                </div>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  Jenjang otomatis dikunci berdasarkan sekolah (misal: SMPK 4 PENABUR &rarr; SMP).
                </span>
              </div>

              {/* Edukasi Akses Multi-Jenjang untuk Siswa Dalam */}
              {registerForm.studentType === 'dalam' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Sparkles size={14} className="text-amber-600" />
                    Akses Multi-Jenjang Siswa Internal:
                  </p>
                  <p className="leading-relaxed text-slate-700">
                    Siswa internal PENABUR dapat memesan seragam jenjang saat ini (<strong>{registerForm.schoolLevel}</strong>) serta jenjang lanjutan berikutnya (<strong>{getNextSchoolLevel(registerForm.schoolLevel) || 'Lanjutan'}</strong>).
                  </p>
                </div>
              )}

              {/* Kelas Siswa (Dropdown Dinamis: SD: 1-6, SMP: 7-9, SMA: 10-12, TK: Tidak Perlu Isi) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Kelas Siswa *
                </label>
                {getAvailableGrades(registerForm.schoolLevel).length > 0 ? (
                  <select
                    required
                    value={registerForm.studentClass}
                    onChange={(e) => setRegisterForm({ ...registerForm, studentClass: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                  >
                    {getAvailableGrades(registerForm.schoolLevel).map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
                    <span>Jenjang TK</span>
                    <span className="text-xs text-amber-700 font-extrabold bg-amber-100/80 px-2.5 py-0.5 rounded-md">
                      Tidak perlu mengisi kelas
                    </span>
                  </div>
                )}
                <span className="text-xs text-slate-400 mt-1 block">
                  {getAvailableGrades(registerForm.schoolLevel).length > 0
                    ? `Pilihan kelas otomatis disesuaikan untuk jenjang ${registerForm.schoolLevel}.`
                    : 'Untuk jenjang TK (TKK), siswa tidak memerlukan pengisian kelas.'}
                </span>
              </div>

              {/* No. HP (WhatsApp) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nomor HP / WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Email (Optional / otomatis dari Google jika ada) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  placeholder="email@gmail.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <CheckCircle2 size={18} className="text-amber-400" />
                  <span>{isRegistering ? 'Mendaftarkan Akun...' : 'Daftar Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pasang Aplikasi (Install PWA) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center relative animate-scale-up">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
            >
              <X size={16} />
            </button>

            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
              <Smartphone size={32} className="text-blue-900" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Pasang Aplikasi Kanvas PENABUR
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Akses pemesanan seragam lebih cepat langsung dari Layar Utama HP Anda tanpa perlu membuka browser berulang kali.
            </p>

            {isIOSDevice ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-slate-700 space-y-2 mb-4">
                <span className="font-bold block text-blue-900">Petunjuk Pemasangan di iPhone/iPad:</span>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-900">1.</span>
                  <span>Ketuk ikon <b>Bagikan (Share / kotak panah ke atas)</b> di bilah bawah Safari.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-900">2.</span>
                  <span>Gulir ke bawah lalu pilih <b>"Tambah ke Layar Utama" (Add to Home Screen)</b>.</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTriggerInstall}
                className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mb-3 active:scale-95"
              >
                <Download size={16} />
                <span>Pasang Aplikasi Sekarang</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Lanjutkan di Browser Saja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { getAssetPath, triggerHaptic } from '../../lib/utils';
import {
  DEFAULT_SCHOOL_WHITELIST,
  getSchoolList,
  deriveSchoolLevel,
  cleanSchoolName,
  getSchoolPaymentInfo,
  getNextSchoolLevel,
  getAvailableGrades
} from '../../lib/schools';
import {
  ShoppingBag,
  User,
  Home,
  Clock,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  School,
  Ruler,
  Building,
  Phone,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Check,
  X,
  Truck,
  Sparkles,
  LogOut,
  UserCheck,
  Edit3,
  UserPlus,
  Lock,
  QrCode,
  Package,
  Receipt,
  Calendar,
  Copy,
  ExternalLink,
  UploadCloud,
  Camera,
  RefreshCw
} from 'lucide-react';

const LETTER_SIZE_ORDER = [
  'SSS', 'SS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2L', '3L', '4L', '5L', '6L', '7L', '8L', '9L', '10L'
];

export const compareUniformSizes = (a, b) => {
  const strA = String(a || '').trim().toUpperCase();
  const strB = String(b || '').trim().toUpperCase();

  if (strA === strB) return 0;

  // 'KHUSUS' / 'CUSTOM' selalu berada di paling akhir urutan
  if (strA === 'KHUSUS' || strA.includes('KHUSUS')) return 1;
  if (strB === 'KHUSUS' || strB.includes('KHUSUS')) return -1;

  // 'ALL SIZE' / 'STANDAR' ditempatkan di depan
  if (strA === 'ALL SIZE' || strA === 'STANDAR') return -1;
  if (strB === 'ALL SIZE' || strB === 'STANDAR') return 1;

  // 1. Cek ukuran huruf standar (SS, S, M, L, XL, 3L s/d 10L)
  const idxLetterA = LETTER_SIZE_ORDER.indexOf(strA);
  const idxLetterB = LETTER_SIZE_ORDER.indexOf(strB);

  if (idxLetterA !== -1 && idxLetterB !== -1) {
    return idxLetterA - idxLetterB;
  }
  if (idxLetterA !== -1) return -1;
  if (idxLetterB !== -1) return 1;

  // 2. Cek apakah murni angka (misal celana: 25, 26, 27... atau sepatu: 32...50 atau jas lab: 5...15)
  const numA = Number(strA);
  const numB = Number(strB);

  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  // 3. Cek format range angka (misal kaos kaki: '15-16', '17-18', '23-24')
  const matchRangeA = strA.match(/^(\d+)/);
  const matchRangeB = strB.match(/^(\d+)/);
  if (matchRangeA && matchRangeB) {
    const startA = parseInt(matchRangeA[1], 10);
    const startB = parseInt(matchRangeB[1], 10);
    if (startA !== startB) return startA - startB;
  }

  return strA.localeCompare(strB, undefined, { numeric: true });
};

const sortSizes = (sizes) => {
  return [...sizes].sort(compareUniformSizes);
};

// Fallback Katalog Seragam Resmi BPK PENABUR (Dikosongkan agar bersih dari foto sampel eksternal)
const DEFAULT_PRODUCTS = [];

// Helper to extract product images array (supports multi-angle slide preview)
const getProductImages = (product) => {
  if (!product) return [getAssetPath('/kanvas-logo-fix.png')];
  let candidates = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    candidates = product.images.filter(Boolean);
  } else if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    candidates = product.image_urls.filter(Boolean);
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) candidates = parsed.filter(Boolean);
    } catch {
      if (product.images.includes(',')) {
        candidates = product.images.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
  }
  if (candidates.length === 0) {
    const fallback = product.imageUrl || product.image_url;
    if (fallback) candidates = [fallback];
  }
  // Filter out placeholder logo if genuine product photos exist
  const realImages = candidates.filter((img) => typeof img === 'string' && img.trim() && !img.includes('kanvas-logo'));
  if (realImages.length > 0) {
    return realImages;
  }
  return [getAssetPath('/kanvas-logo-fix.png')];
};

export default function MobileStorefront() {
  const router = useRouter();

  // Navigation Tabs: 'store' | 'orders' | 'profile'
  const [activeTab, setActiveTab] = useState('store');

  // Checkout flow state: 'browsing' | 'cart' | 'checkout' | 'success'
  const [checkoutStep, setCheckoutStep] = useState('browsing');

  // School list (clean list)
  const [schoolList, setSchoolList] = useState(DEFAULT_SCHOOL_WHITELIST);

  // Multi-Student & Parent Profiles
  const [parentProfile, setParentProfile] = useState({
    fullName: 'Orang Tua Murid',
    phone: '',
    email: '',
  });

  const [students, setStudents] = useState([]);
  const [activeStudentId, setActiveStudentId] = useState(null);

  // Filter States
  const [selectedSchool, setSelectedSchool] = useState('SDK 1 PENABUR');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Products
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Cart: Array of { id, productId, name, size, price, quantity, imageUrl, studentName, schoolName }
  const [cart, setCart] = useState([]);
  const [addedNotice, setAddedNotice] = useState(null);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

  // Modals
  const [activeProductModal, setActiveProductModal] = useState(null);
  const [modalSelectedSize, setModalSelectedSize] = useState('');
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [fullScreenPreviewImage, setFullScreenPreviewImage] = useState(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Touch Swipe Gesture Refs untuk Carousel Modal & Preview
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const isSwipingRef = useRef(false);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
    if (Math.abs(touchStartXRef.current - touchEndXRef.current) > 10) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = (modalImages) => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 35;
    if (modalImages && modalImages.length > 1) {
      if (diff > threshold) {
        // Swipe ke kiri -> Foto berikutnya
        triggerHaptic(10);
        setModalImageIndex((prev) => (prev < modalImages.length - 1 ? prev + 1 : 0));
      } else if (diff < -threshold) {
        // Swipe ke kanan -> Foto sebelumnya
        triggerHaptic(10);
        setModalImageIndex((prev) => (prev > 0 ? prev - 1 : modalImages.length - 1));
      }
    }
  };

  const handleOpenProductModal = (product) => {
    triggerHaptic(12);
    setActiveProductModal(product);
    setModalSelectedSize(product.variants[0]?.size || 'STANDAR');
    setModalImageIndex(0);
    setFullScreenPreviewImage(null);
    if (interactiveGuideStep === 'step_1_catalog' || interactiveGuideStep === 'a_catalog') {
      setInteractiveGuideStep('step_2_modal');
    }
  };

  // Profile Edit & Student Add/Edit Modals
  const [showEditParentModal, setShowEditParentModal] = useState(false);
  const [parentEditForm, setParentEditForm] = useState({ fullName: '', phone: '' });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState('add'); // 'add' | 'edit'
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    studentType: 'luar', // 'luar' | 'dalam'
    school: 'SDK 1 PENABUR',
    level: 'SD',
    grade: 'Kelas 1',
  });
  const [activeCatalogLevel, setActiveCatalogLevel] = useState(null);

  // Checkout Details
  const [deliveryMethod, setDeliveryMethod] = useState('koperasi'); // 'koperasi' | 'rumah'
  const [homeAddress, setHomeAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState(null);
  const [activePendingOrderId, setActivePendingOrderId] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  // Interval timer untuk hitung mundur 24 jam pesanan belum bayar
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format sisa waktu 24 jam
  const formatCountdown = (createdAt) => {
    if (!createdAt) return '24:00:00';
    const createdTime = new Date(createdAt).getTime();
    const expiresTime = createdTime + 24 * 60 * 60 * 1000;
    const diff = expiresTime - nowTick;
    if (diff <= 0) return 'Kedaluwarsa';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}j ${minutes}m ${seconds < 10 ? '0' : ''}${seconds}d`;
  };

  // Payment & Multi-step Checkout States
  const [copiedField, setCopiedField] = useState(null); // 'account' | 'amount' | 'note'
  const [isProofConfirmed, setIsProofConfirmed] = useState(false);
  const [proofDriveUrl, setProofDriveUrl] = useState('');
  const [showFinalConfirmModal, setShowFinalConfirmModal] = useState(false);

  // Metode B: Direct Upload via Google Apps Script (GAS) seperti di Aksara
  const [isUploadingGas, setIsUploadingGas] = useState(false);
  const [uploadGasError, setUploadGasError] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const directFileInputRef = useRef(null);

  // Kode unik urutan transaksi harian per sekolah (misal: 1, 2, 3...)
  const [schoolDailyCode, setSchoolDailyCode] = useState(1);

  // Onboarding Guided Tour Kontekstual Interaktif (4 Titik Emas Presisi - Spotlight Cutout)
  // null | 'step_1_catalog' | 'step_2_modal' | 'step_3_cart' | 'step_4_waiting' | 'step_4_payment'
  const [interactiveGuideStep, setInteractiveGuideStep] = useState(null);
  const [spotlightRect, setSpotlightRect] = useState(null);

  // Auto trigger untuk pengunjung pertama kali (atau yang mengaktifkan panduan di halaman awal)
  useEffect(() => {
    try {
      const guideCompleted = localStorage.getItem('kanvas_interactive_guide_done');
      if (guideCompleted !== 'true') {
        const timer = setTimeout(() => {
          setInteractiveGuideStep('step_1_catalog');
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch (e) { }
  }, []);

  // Sinkronisasi otomatis ke Step 4 saat orang tua masuk ke halaman instruksi rekening sekolah
  useEffect(() => {
    if (checkoutStep === 'payment_instruction' && (interactiveGuideStep === 'step_4_waiting' || interactiveGuideStep === 'step_3_cart')) {
      setInteractiveGuideStep('step_4_payment');
    }
  }, [checkoutStep, interactiveGuideStep]);

  const dismissInteractiveGuide = () => {
    setInteractiveGuideStep(null);
    setSpotlightRect(null);
    try {
      localStorage.setItem('kanvas_interactive_guide_done', 'true');
      localStorage.setItem('kanvas_guide_active', 'false');
    } catch (e) { }
  };

  const startInteractiveGuide = () => {
    try {
      localStorage.removeItem('kanvas_interactive_guide_done');
    } catch (e) { }
    if (checkoutStep === 'payment_instruction') {
      setInteractiveGuideStep('step_4_payment');
    } else if (activeProductModal) {
      setInteractiveGuideStep('step_2_modal');
    } else {
      setActiveTab('store');
      setCheckoutStep('browsing');
      setInteractiveGuideStep('step_1_catalog');
    }
  };

  // Kalkulasi koordinat Spotlight Cutout presisi untuk setiap target elemen aktif
  useEffect(() => {
    if (!interactiveGuideStep || interactiveGuideStep === 'step_4_waiting') {
      setSpotlightRect(null);
      return;
    }

    const updateRect = () => {
      let targetId = null;
      let shape = 'rect';
      let pad = 6;

      if (interactiveGuideStep === 'step_1_catalog' && activeTab === 'store' && checkoutStep === 'browsing' && !activeProductModal) {
        targetId = 'guide-first-product';
        shape = 'rect';
        pad = 6;
      } else if (interactiveGuideStep === 'step_2_modal' && activeProductModal) {
        targetId = 'guide-modal-actions';
        shape = 'rect';
        pad = 8;
      } else if (interactiveGuideStep === 'step_3_cart' && activeTab === 'store') {
        targetId = 'guide-header-cart';
        shape = 'circle';
        pad = 6;
      } else if (interactiveGuideStep === 'step_4_payment' && checkoutStep === 'payment_instruction') {
        targetId = 'guide-payment-account';
        shape = 'rect';
        pad = 6;
      }

      if (!targetId) {
        setSpotlightRect(null);
        return;
      }

      const el = document.getElementById(targetId);
      if (!el) {
        setSpotlightRect(null);
        return;
      }

      const r = el.getBoundingClientRect();
      if (shape === 'circle') {
        const size = Math.max(r.width, r.height) + pad * 2;
        const top = r.top + r.height / 2 - size / 2;
        const left = r.left + r.width / 2 - size / 2;
        setSpotlightRect({
          top: Math.round(top),
          left: Math.round(left),
          width: Math.round(size),
          height: Math.round(size),
          shape,
        });
      } else {
        setSpotlightRect({
          top: Math.round(r.top - pad),
          left: Math.round(r.left - pad),
          width: Math.round(r.width + pad * 2),
          height: Math.round(r.height + pad * 2),
          shape,
        });
      }
    };

    updateRect();
    const t1 = setTimeout(updateRect, 100);
    const t2 = setTimeout(updateRect, 300);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [interactiveGuideStep, activeTab, checkoutStep, activeProductModal, products]);

  // Active student object helper
  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === activeStudentId) || students[0] || null;
  }, [students, activeStudentId]);

  useEffect(() => {
    if (activeStudent) {
      setActiveCatalogLevel(activeStudent.level);
    }
  }, [activeStudent?.id, activeStudent?.level]);

  const currentSchoolName = activeStudent?.school || selectedSchool;
  const schoolPayment = useMemo(() => {
    return getSchoolPaymentInfo(schoolList, currentSchoolName);
  }, [schoolList, currentSchoolName]);

  const studentFirstName = (activeStudent?.name || 'Siswa').trim().split(' ')[0] || 'Siswa';
  const parentFirstName = (parentProfile.fullName || 'Ortu').trim().split(' ')[0] || 'Ortu';
  const transferNote = `${studentFirstName} ${parentFirstName}`;

  const copyToClipboard = (text, fieldName) => {
    triggerHaptic(15);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // 1A. Hitung Kode Unik Urutan Transaksi Harian Khusus Sekolah Ini
  useEffect(() => {
    let isSubscribed = true;
    const fetchSchoolDailyCode = async () => {
      try {
        if (!currentSchoolName) return;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
          .from('parent_orders')
          .select('*', { count: 'exact', head: true })
          .ilike('school_name', `%${cleanSchoolName(currentSchoolName)}%`)
          .gte('created_at', todayStart.toISOString());

        if (!error && isSubscribed) {
          const nextSeq = ((count || 0) % 999) + 1;
          setSchoolDailyCode(nextSeq);
        }
      } catch (e) {
        // Fallback tetap 1
      }
    };
    fetchSchoolDailyCode();
    return () => {
      isSubscribed = false;
    };
  }, [currentSchoolName]);

  // 1B. Direct Upload Bukti Transfer ke Google Drive via Google Apps Script (Metode B Aksara)
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbxaKhmlXfZ19f_z6C57wKv0HZRI1NzdCoGpVC2WLudaQKfVtKLOW3T8ccMTpvg1NeU/exec';

  const handleDirectUploadGas = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 5 MB.');
      return;
    }

    setPreviewImage(URL.createObjectURL(file));
    setUploadedFileName(file.name);
    setIsUploadingGas(true);
    setUploadGasError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result || '').toString().split(',')[1];
        if (!base64Data) {
          throw new Error('Gagal membaca data file foto.');
        }

        const gdriveLink = schoolPayment.gdriveUploadLink || '';
        let targetFolderId = '';
        const match = gdriveLink.match(/[-\w]{25,}/);
        if (match) targetFolderId = match[0];

        const cleanSchool = cleanSchoolName(currentSchoolName);
        const customFileName = `Bukti_${cleanSchool}_${transferNote.replace(/\s+/g, '_')}_${Date.now()}.jpg`;

        const response = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            fileName: customFileName,
            mimeType: file.type || 'image/jpeg',
            base64Data: base64Data,
            folderId: targetFolderId,
            schoolName: cleanSchool,
            academicYear: '2026/2027',
            type: 'parent_payment_receipt',
          }),
        });

        const result = await response.json();
        if (result.status === 'success' || result.fileUrl) {
          const finalUrl = result.fileUrl || result.url || '';
          setProofDriveUrl(finalUrl);
          setIsProofConfirmed(true);
        } else {
          throw new Error(result.error || result.message || 'Gagal mengunggah file ke Google Drive.');
        }
      } catch (err) {
        console.warn('Direct upload error:', err);
        setUploadGasError(err.message || 'Gagal mengupload file ke Google Drive sekolah.');
      } finally {
        setIsUploadingGas(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load School List & User Session
  useEffect(() => {
    const initData = async () => {
      // 1. Fetch clean school list
      const list = await getSchoolList(supabase);
      setSchoolList(list);

      // 2. Load Parent Session (Keluarkan otomatis jika tidak ada sesi aktif)
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('kanvas_parent_session');
          if (!stored) {
            router.replace('/?logout=true');
            return;
          }
          if (stored) {
            const parsed = JSON.parse(stored);
            setParentProfile({
              fullName: parsed.fullName || 'Wali Murid PENABUR',
              phone: parsed.phone || '',
              email: parsed.email || '',
            });

            // Multi-student format support
            let loadedStudents = [];
            if (Array.isArray(parsed.students) && parsed.students.length > 0) {
              loadedStudents = parsed.students.map((s) => ({
                ...s,
                school: cleanSchoolName(s.school),
                level: s.level || deriveSchoolLevel(s.school),
              }));
            } else if (parsed.studentName) {
              // Legacy single student
              const stdId = 'std-1';
              loadedStudents = [
                {
                  id: stdId,
                  name: parsed.studentName,
                  school: cleanSchoolName(parsed.schoolName || 'SDK 1 PENABUR'),
                  level: parsed.schoolLevel || deriveSchoolLevel(parsed.schoolName || 'SDK 1 PENABUR'),
                  grade: parsed.studentClass || 'Kelas 1',
                },
              ];
            }

            if (loadedStudents.length > 0) {
              setStudents(loadedStudents);
              const activeId = parsed.activeStudentId || loadedStudents[0].id;
              setActiveStudentId(activeId);
              const currentActive = loadedStudents.find((s) => s.id === activeId) || loadedStudents[0];
              setSelectedSchool(currentActive.school);
              setSelectedLevel(currentActive.level);
            }
          }

          const storedOrders = localStorage.getItem('kanvas_my_orders');
          if (storedOrders) {
            setMyOrders(JSON.parse(storedOrders));
          }
        } catch (e) {
          console.warn('LocalStorage load error:', e);
        }
      }
    };

    initData();

    fetchLiveParentOrders();
  }, []);

  // 3. Fetch live products dari Supabase (Server-Query Terarah Sesuai Jenjang Siswa Aktif)
  useEffect(() => {
    let isSubscribed = true;
    const fetchSupabaseProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const targetLvl = (activeStudent?.level || selectedLevel || 'SD').toUpperCase();
        const isInternal = activeStudent?.studentType === 'dalam';
        const nextLvl = isInternal ? getNextSchoolLevel(targetLvl) : null;
        const targetLevels = isInternal && nextLvl
          ? [targetLvl, nextLvl.toUpperCase(), 'ALL', 'SEMUA']
          : [targetLvl, 'ALL', 'SEMUA'];

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('level', targetLevels)
          .order('name');

        if (!error && data && data.length > 0 && isSubscribed) {
          const groupedMap = new Map();

          data.forEach((item) => {
            if (item.is_kanvas_active === false) return;

            const derivedLvl = (item.level || deriveSchoolLevel(item.name) || 'ALL').toUpperCase();
            const groupKey = `${derivedLvl}||${item.variant_group || item.name}`;
            let price = Number(item.price_student || item.price || 0);
            if (price <= 0) {
              const nm = (item.name || '').toLowerCase();
              if (nm.includes('sepatu')) price = 145000;
              else if (nm.includes('jas lab')) price = 95000;
              else if (nm.includes('rompi') || nm.includes('kotak')) price = 95000;
              else if (nm.includes('celana panjang') || nm.includes('kulot')) price = 110000;
              else if (nm.includes('celana') || nm.includes('rok')) price = 88000;
              else if (nm.includes('kemeja') || nm.includes('kaos')) price = 85000;
              else if (nm.includes('topi')) price = 25000;
              else if (nm.includes('dasi')) price = 20000;
              else if (nm.includes('kaos kaki')) price = 18000;
              else if (nm.includes('kacu') || nm.includes('baret')) price = 25000;
              else if (nm.includes('name tag') || nm.includes('buku') || nm.includes('agenda')) price = 15000;
              else price = 80000;
            }

            if (!groupedMap.has(groupKey)) {
              // Pemetaan Tipe & Kategori berdasarkan Standar Kode BPK PENABUR:
              const codeUpper = String(item.code || '').toUpperCase();
              const n = (item.name || '').toLowerCase();
              let normalizedCategory = 'Seragam';
              let typeCode = 'SRG';

              if (codeUpper.includes('KAK') || n.includes('kaos kaki')) {
                normalizedCategory = 'Kaos Kaki';
                typeCode = 'KAK';
              } else if (codeUpper.includes('TP') || n.includes('topi')) {
                normalizedCategory = 'Topi';
                typeCode = 'TP';
              } else if (codeUpper.includes('BK') || n.includes('buku') || n.includes('agenda') || n.includes('kertas')) {
                normalizedCategory = 'Buku';
                typeCode = 'BK';
              } else if (
                codeUpper.includes('PLK') ||
                n.includes('dasi') ||
                n.includes('kacu') ||
                n.includes('ring') ||
                n.includes('baret') ||
                n.includes('laken') ||
                n.includes('clemek') ||
                n.includes('name tag') ||
                n.includes('ambalan') ||
                n.includes('gudep')
              ) {
                normalizedCategory = 'Perlengkapan';
                typeCode = 'PLK';
              } else {
                normalizedCategory = 'Seragam';
                typeCode = 'SRG';
              }

              groupedMap.set(groupKey, {
                id: item.id,
                code: item.code,
                typeCode: typeCode,
                name: item.name,
                category: normalizedCategory,
                level: derivedLvl,
                description: item.description || `Produk resmi ${normalizedCategory} berstandar Koperasi BPK PENABUR.`,
                imageUrl: '',
                images: [],
                variants: [],
              });
            }

            const current = groupedMap.get(groupKey);

            // Kumpulkan URL gambar valid dari setiap varian tanpa memasukkan placeholder logo
            const rawUrl = item.image_url || (Array.isArray(item.images) ? item.images[0] : null);
            if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() && !rawUrl.includes('kanvas-logo') && !current.images.includes(rawUrl.trim())) {
              current.images.push(rawUrl.trim());
            }

            current.variants.push({
              size: item.size || 'STANDAR',
              price: price,
              stock: item.stock || 50,
              skuId: item.id,
            });
          });

          const formattedList = Array.from(groupedMap.values()).map((p) => {
            const realImages = p.images.filter((img) => img && !img.includes('kanvas-logo'));
            const hasRealImage = realImages.length > 0;
            const finalImages = hasRealImage ? realImages : [getAssetPath('/kanvas-logo-fix.png')];
            return {
              ...p,
              imageUrl: finalImages[0],
              images: finalImages,
              variants: p.variants.sort((a, b) => compareUniformSizes(a.size, b.size)),
            };
          });

          if (formattedList.length > 0 && isSubscribed) {
            setProducts(formattedList);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat katalog seragam:', err);
      } finally {
        if (isSubscribed) setIsLoadingProducts(false);
      }
    };

    fetchSupabaseProducts();
    return () => {
      isSubscribed = false;
    };
  }, [activeStudent?.level, activeStudent?.studentType, activeStudentId, selectedLevel]);

  // Sinkronisasi status riwayat pesanan langsung dari tabel Supabase parent_orders
  const fetchLiveParentOrders = async (fallbackLocalList = null) => {
    try {
      setIsSyncingOrders(true);
      let authUserId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authUserId = session?.user?.id || null;
      } catch (e) { }

      let localList = fallbackLocalList;
      if (!localList && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('kanvas_my_orders');
          if (raw) localList = JSON.parse(raw);
        } catch (e) { }
      }
      if (!Array.isArray(localList)) localList = myOrders || [];

      const localIds = localList.map((o) => o.id || o.order_number).filter(Boolean);
      const parentEmail = (parentProfile?.email || '').trim().toLowerCase();

      let query = supabase
        .from('parent_orders')
        .select('*, items:parent_order_items(*)');

      const orConditions = [];
      if (parentEmail) orConditions.push(`parent_email.eq.${parentEmail}`);
      if (authUserId) orConditions.push(`parent_auth_user_id.eq.${authUserId}`);
      if (localIds.length > 0) orConditions.push(`id.in.(${localIds.map((id) => `"${id}"`).join(',')})`);

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
      } else {
        setIsSyncingOrders(false);
        return;
      }

      const { data: remoteOrders, error } = await query.order('created_at', { ascending: false });

      if (!error && remoteOrders && remoteOrders.length > 0) {
        const remoteMap = new Map(remoteOrders.map((ro) => [ro.id, ro]));
        const merged = [];

        // Masukkan semua remote orders dengan data termutakhir
        remoteOrders.forEach((ro) => {
          const matchedLocal = localList.find((lo) => (lo.id || lo.order_number) === ro.id);
          merged.push({
            ...(matchedLocal || {}),
            ...ro,
            items: (ro.items && ro.items.length > 0)
              ? ro.items.map((it) => ({
                ...it,
                name: it.product_name || it.name,
                price: it.price_student || it.price || 0,
              }))
              : (matchedLocal?.items || []),
          });
        });

        // Pertahankan pesanan lokal yang belum ada di remote
        localList.forEach((lo) => {
          const loId = lo.id || lo.order_number;
          if (!remoteMap.has(loId)) {
            merged.push(lo);
          }
        });

        setMyOrders(merged);
        if (typeof window !== 'undefined') {
          localStorage.setItem('kanvas_my_orders', JSON.stringify(merged));
        }
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi live parent_orders:', err);
    } finally {
      setIsSyncingOrders(false);
    }
  };

  // Helper tampilan badge status pesanan di tab Pesanan Saya
  const renderOrderStatusBadge = (ordOrStatus) => {
    const ord = typeof ordOrStatus === 'object' && ordOrStatus !== null ? ordOrStatus : { status: ordOrStatus };
    const s = String(ord.status || 'submitted').toLowerCase();
    const payStatus = String(ord.payment_status || 'pending_verification').toLowerCase();
    const createdTime = ord.created_at ? new Date(ord.created_at).getTime() : Date.now();
    const isExpired = Date.now() - createdTime >= 24 * 60 * 60 * 1000;

    if (s === 'completed' || s === 'selesai') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-bold text-[10px] flex items-center gap-1">
          <CheckCircle2 size={11} className="text-emerald-600" />
          Pesanan Selesai
        </span>
      );
    }
    if (s === 'ready_for_pickup' || s === 'siap_diambil') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] flex items-center gap-1 animate-pulse">
          <CheckCircle2 size={11} className="text-emerald-600" />
          Siap Diambil di Sekolah
        </span>
      );
    }
    if (s === 'processing' || s === 'verified' || s === 'disiapkan') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px] flex items-center gap-1">
          <Clock size={11} className="text-blue-600" />
          Sedang Disiapkan
        </span>
      );
    }
    if (s === 'cancelled' || s === 'batal') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[10px] flex items-center gap-1">
          <AlertCircle size={11} className="text-rose-600" />
          Dibatalkan
        </span>
      );
    }
    if (payStatus === 'unpaid') {
      if (isExpired) {
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[10px] flex items-center gap-1">
            <AlertCircle size={11} className="text-rose-600" />
            Kedaluwarsa (24 Jam)
          </span>
        );
      }
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[10px] flex items-center gap-1 animate-pulse">
          <Clock size={11} className="text-amber-600" />
          Menunggu Pembayaran
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px] flex items-center gap-1">
        <Clock size={11} className="text-blue-600" />
        Menunggu Verifikasi
      </span>
    );
  };

  // Helper untuk switch active student
  const handleSelectStudent = (student) => {
    triggerHaptic(10);
    setActiveStudentId(student.id);
    setSelectedSchool(student.school);
    setSelectedLevel(student.level);

    // Simpan active student ke session
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kanvas_parent_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.activeStudentId = student.id;
          localStorage.setItem('kanvas_parent_session', JSON.stringify(parsed));
        }
      } catch (e) { }
    }
  };

  // Helper sync session ke localStorage & Supabase parent_accounts
  const syncSessionToStorage = async (updatedStudents, updatedParent, updatedActiveId) => {
    if (typeof window === 'undefined') return;
    const finalStudents = updatedStudents || students;
    const finalParentName = updatedParent ? updatedParent.fullName : parentProfile.fullName;
    const finalPhone = updatedParent ? updatedParent.phone : parentProfile.phone;
    const finalEmail = updatedParent ? updatedParent.email : parentProfile.email;
    const finalActiveId = updatedActiveId || activeStudentId;

    const payload = {
      fullName: finalParentName,
      phone: finalPhone,
      email: finalEmail,
      activeStudentId: finalActiveId,
      students: finalStudents,
      isRegistered: true,
    };

    // 1. Simpan ke LocalStorage HP (kanvas_parent_session dan kanvas_registered_parents)
    try {
      localStorage.setItem('kanvas_parent_session', JSON.stringify(payload));
      const storedParents = localStorage.getItem('kanvas_registered_parents');
      let parentList = storedParents ? JSON.parse(storedParents) : [];
      const cleanEmail = (finalEmail || '').trim().toLowerCase();
      const pIdx = parentList.findIndex(
        (p) => p.email && cleanEmail && p.email.toLowerCase() === cleanEmail
      );
      if (pIdx >= 0) {
        parentList[pIdx] = payload;
      } else {
        parentList.push(payload);
      }
      localStorage.setItem('kanvas_registered_parents', JSON.stringify(parentList));
    } catch (e) { }

    // 2. Simpan permanen ke Supabase tabel parent_accounts (Dual check update/insert agar tidak butuh unique constraint)
    if (supabase && finalEmail) {
      try {
        let authUserId = null;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          authUserId = session?.user?.id || null;
        } catch (e) { }

        const cleanEmail = finalEmail.trim().toLowerCase();
        const { data: existingRows } = await supabase
          .from('parent_accounts')
          .select('id')
          .ilike('email', cleanEmail)
          .limit(1);

        const accountRecord = {
          auth_user_id: authUserId,
          email: cleanEmail,
          phone: finalPhone,
          full_name: finalParentName,
          students: finalStudents,
          active_student_id: finalActiveId,
          updated_at: new Date().toISOString(),
        };

        if (existingRows && existingRows.length > 0) {
          await supabase
            .from('parent_accounts')
            .update(accountRecord)
            .eq('id', existingRows[0].id);
        } else {
          await supabase
            .from('parent_accounts')
            .insert([accountRecord]);
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi parent_accounts Supabase:', err);
      }
    }
  };

  // Handler Buka Modal Tambah Siswa
  const handleOpenAddStudent = () => {
    setStudentModalMode('add');
    setEditingStudentId(null);
    const defaultSchool = schoolList[0]?.name || 'SDK 1 PENABUR';
    const autoLevel = deriveSchoolLevel(defaultSchool);
    const grades = getAvailableGrades(autoLevel);
    setStudentForm({
      name: '',
      studentType: 'luar',
      school: defaultSchool,
      level: autoLevel,
      grade: grades.length > 0 ? grades[0] : '-',
    });
    setShowStudentModal(true);
  };

  // Handler Buka Modal Edit Siswa
  const handleOpenEditStudent = (student) => {
    setStudentModalMode('edit');
    setEditingStudentId(student.id);
    const grades = getAvailableGrades(student.level);
    setStudentForm({
      name: student.name,
      studentType: student.studentType || 'luar',
      school: student.school,
      level: student.level,
      grade: grades.length > 0 ? (student.grade && student.grade !== '-' ? student.grade : grades[0]) : '-',
    });
    setShowStudentModal(true);
  };

  // Simpan Tambah / Edit Siswa
  const handleSaveStudentModal = async (e) => {
    e.preventDefault();
    if (!studentForm.name.trim()) {
      alert('Mohon isi nama lengkap siswa.');
      return;
    }

    const currentLevel = studentForm.level || deriveSchoolLevel(studentForm.school);
    const nextLvl = studentForm.studentType === 'dalam' ? getNextSchoolLevel(currentLevel) : null;
    const allowed = nextLvl ? [currentLevel, nextLvl] : [currentLevel];
    const availableGrades = getAvailableGrades(currentLevel);
    const resolvedGrade = availableGrades.length > 0
      ? (studentForm.grade && studentForm.grade !== '-' ? studentForm.grade : availableGrades[0])
      : '-';

    if (studentModalMode === 'add') {
      const newId = `std-${Date.now()}`;
      const newStudentObj = {
        id: newId,
        name: studentForm.name.trim(),
        studentType: studentForm.studentType || 'luar',
        school: cleanSchoolName(studentForm.school),
        level: currentLevel,
        nextLevel: nextLvl,
        allowedLevels: allowed,
        grade: resolvedGrade,
      };
      const updated = [...students, newStudentObj];
      setStudents(updated);
      setActiveStudentId(newId);
      setSelectedSchool(newStudentObj.school);
      setSelectedLevel(newStudentObj.level);
      setActiveCatalogLevel(newStudentObj.level);
      await syncSessionToStorage(updated, null, newId);
      alert(`Siswa ${newStudentObj.name} berhasil ditambahkan!`);
    } else {
      // Edit
      const updated = students.map((s) => {
        if (s.id === editingStudentId) {
          return {
            ...s,
            name: studentForm.name.trim(),
            studentType: studentForm.studentType || 'luar',
            school: cleanSchoolName(studentForm.school),
            level: currentLevel,
            nextLevel: nextLvl,
            allowedLevels: allowed,
            grade: resolvedGrade,
          };
        }
        return s;
      });
      setStudents(updated);
      if (activeStudentId === editingStudentId) {
        setSelectedSchool(cleanSchoolName(studentForm.school));
        setSelectedLevel(currentLevel);
        setActiveCatalogLevel(currentLevel);
      }
      await syncSessionToStorage(updated, null, activeStudentId);
      alert('Data siswa berhasil diperbarui!');
    }

    setShowStudentModal(false);
  };

  // Simpan Edit Profil Wali Murid
  const handleSaveParentProfile = async (e) => {
    e.preventDefault();
    if (!parentEditForm.fullName.trim() || !parentEditForm.phone.trim()) {
      alert('Mohon lengkapi nama dan nomor WhatsApp.');
      return;
    }

    const updated = {
      ...parentProfile,
      fullName: parentEditForm.fullName.trim(),
      phone: parentEditForm.phone.trim(),
    };
    setParentProfile(updated);
    await syncSessionToStorage(null, updated, activeStudentId);
    setShowEditParentModal(false);
    alert('Profil wali murid berhasil diperbarui!');
  };

  // Helper pencocokan jenjang seragam yang ketat (Strict Level Matching SSOT)
  const isProductMatchingLevel = (product, targetLevel) => {
    if (!targetLevel || targetLevel === 'ALL') return true;
    const cleanTarget = targetLevel.toUpperCase().trim();
    const prodLevel = (product.level || '').toUpperCase().trim();
    const prodName = (product.name || '').toUpperCase().trim();

    // 1. Jika level produk sama persis (misal: SMP === SMP)
    if (prodLevel === cleanTarget) return true;

    // 2. Jika level produk universal (ALL / SEMUA / Aksesoris umum)
    if (prodLevel === 'ALL' || prodLevel === 'SEMUA') {
      // Pastikan nama produk tidak mengandung jenjang lain secara spesifik
      const otherLevels = ['TK', 'SD', 'SMP', 'SMA', 'SMK'].filter((l) => l !== cleanTarget);
      const mentionsOther = otherLevels.some((l) => prodName.includes(` ${l} `) || prodName.endsWith(` ${l}`) || prodName.includes(`${l}-`));
      return !mentionsOther;
    }

    // 3. Jika nama produk secara spesifik mengandung jenjang siswa (misal: 'Kemeja Putih Pendek SMP')
    if (prodName.includes(cleanTarget)) return true;

    return false;
  };

  // Filter products by Level Siswa Aktif (Strict Level SSOT), Kategori, dan Pencarian
  const filteredProducts = useMemo(() => {
    // Jika siswa internal PENABUR dan sedang memilih tab jenjang tertentu, gunakan activeCatalogLevel
    const activeLevel = activeCatalogLevel || activeStudent?.level || selectedLevel || 'SMP';
    return products.filter((p) => {
      const matchLevel = isProductMatchingLevel(p, activeLevel);
      const matchCat =
        selectedCategory === 'Semua' ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        (p.typeCode && p.typeCode.toUpperCase() === selectedCategory.toUpperCase());
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.typeCode && p.typeCode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchLevel && matchCat && matchSearch;
    });
  }, [products, activeCatalogLevel, activeStudent?.level, selectedLevel, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Kode unik harian per sekolah (urutan 1, 2, 3...)
  const uniqueVerificationCode = schoolDailyCode;
  const shippingFee = deliveryMethod === 'rumah' ? 18000 : 0;
  const finalTotalAmount = cartSubtotal + (cart.length > 0 ? uniqueVerificationCode + shippingFee : 0);

  // Cart actions
  const addToCart = (product, size) => {
    triggerHaptic(20);
    setIsCartBouncing(true);
    setTimeout(() => setIsCartBouncing(false), 500);
    const variant = product.variants.find((v) => v.size === size) || product.variants[0];
    const targetStudentName = activeStudent?.name || 'Siswa';
    const targetSchoolName = activeStudent?.school || selectedSchool;
    const cartItemId = `${product.id}-${variant.size}-${targetStudentName}`;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.id === cartItemId);
      if (existingIdx >= 0) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            id: cartItemId,
            productId: product.id,
            name: product.name,
            size: variant.size,
            price: variant.price,
            quantity: 1,
            imageUrl: product.imageUrl,
            category: product.category,
            studentName: targetStudentName,
            schoolName: targetSchoolName,
          },
        ];
      }
    });

    setAddedNotice(`+1 ${product.name} (${variant.size}) untuk ${targetStudentName}`);
    setTimeout(() => setAddedNotice(null), 2500);
    setActiveProductModal(null);
    if (interactiveGuideStep === 'step_2_modal' || interactiveGuideStep === 'a_modal') {
      setInteractiveGuideStep('step_3_cart');
    }
  };

  const updateCartQuantity = (cartItemId, delta) => {
    triggerHaptic(10);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Lanjut dari Form Ringkasan ke Panduan Rekening Sekolah & Catat Status Menunggu Pembayaran
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const studentName = activeStudent?.name || 'Siswa PENABUR';
    const schoolName = activeStudent?.school || selectedSchool;
    const schoolLevel = activeStudent?.level || selectedLevel;
    const studentGrade = activeStudent?.grade || '-';

    const orderNumber = activePendingOrderId || `KNP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    setActivePendingOrderId(orderNumber);

    const pendingOrderRecord = {
      id: orderNumber,
      order_number: orderNumber,
      school_name: schoolName,
      school_level: schoolLevel,
      student_name: studentName,
      student_class: studentGrade,
      parent_name: parentProfile.fullName || 'Wali Murid',
      parent_phone: parentProfile.phone || '-',
      parent_email: parentProfile.email || '-',
      total_amount: finalTotalAmount,
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'rumah' ? homeAddress : 'Ambil di Koperasi Sekolah',
      payment_method: 'transfer_sekolah',
      payment_status: 'unpaid',
      payment_receipt_url: null,
      transfer_note: transferNote,
      bank_name: schoolPayment.bankName,
      bank_account_number: schoolPayment.bankAccountNumber,
      status: 'submitted',
      academic_year: '2026/2027',
      created_at: new Date().toISOString(),
      items: [...cart],
    };

    try {
      let authUserId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authUserId = session?.user?.id || null;
      } catch (e) { }

      // Simpan status pesanan menunggu pembayaran ke Supabase
      await supabase.from('parent_orders').upsert([
        {
          id: orderNumber,
          parent_auth_user_id: authUserId,
          school_name: schoolName,
          school_level: schoolLevel,
          student_name: studentName,
          student_class: studentGrade,
          parent_name: parentProfile.fullName || 'Wali Murid',
          parent_phone: parentProfile.phone || '-',
          parent_email: parentProfile.email || null,
          total_amount: finalTotalAmount,
          payment_method: 'transfer_sekolah',
          payment_status: 'unpaid',
          payment_receipt_url: null,
          status: 'submitted',
          academic_year: '2026/2027',
          created_at: pendingOrderRecord.created_at,
        },
      ]);

      const itemsPayload = cart.map((item) => ({
        parent_order_id: orderNumber,
        product_id: item.productId && !String(item.productId).startsWith('mock-') && !String(item.productId).startsWith('prod-') ? item.productId : null,
        product_name: item.name,
        category: item.category || 'Seragam',
        size: item.size || 'STANDAR',
        quantity: item.quantity,
        price_student: item.price,
        subtotal: item.price * item.quantity,
      }));
      await supabase.from('parent_order_items').delete().eq('parent_order_id', orderNumber);
      await supabase.from('parent_order_items').insert(itemsPayload);
    } catch (err) {
      console.warn('Catatan simpan pesanan awal:', err);
    }

    // Perbarui riwayat lokal
    setMyOrders((prev) => {
      const filtered = prev.filter((o) => (o.id || o.order_number) !== orderNumber);
      const updated = [pendingOrderRecord, ...filtered];
      if (typeof window !== 'undefined') {
        localStorage.setItem('kanvas_my_orders', JSON.stringify(updated));
      }
      return updated;
    });

    setCheckoutStep('payment_instruction');
    if (interactiveGuideStep === 'step_4_waiting' || interactiveGuideStep === 'step_3_cart' || interactiveGuideStep === 'd_summary') {
      setInteractiveGuideStep('step_4_payment');
    }
  };

  // Selesaikan Pesanan Resmi setelah konfirmasi pembayaran & upload bukti bayar
  const handleFinalConfirmOrder = async () => {
    const studentName = activeStudent?.name || 'Siswa PENABUR';
    const schoolName = activeStudent?.school || selectedSchool;
    const schoolLevel = activeStudent?.level || selectedLevel;
    const studentGrade = activeStudent?.grade || '-';

    setIsSubmittingOrder(true);
    const orderNumber = activePendingOrderId || `KNP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const existingPending = myOrders.find((o) => (o.id || o.order_number) === orderNumber);
    const orderRecord = {
      id: orderNumber,
      order_number: orderNumber,
      school_name: schoolName,
      school_level: schoolLevel,
      student_name: studentName,
      student_class: studentGrade,
      parent_name: parentProfile.fullName || 'Wali Murid',
      parent_phone: parentProfile.phone || '-',
      parent_email: parentProfile.email || '-',
      total_amount: finalTotalAmount,
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'rumah' ? homeAddress : 'Ambil di Koperasi Sekolah',
      payment_method: 'transfer_sekolah',
      payment_status: 'pending_verification',
      payment_receipt_url: proofDriveUrl.trim() || 'Uploaded to School Google Drive',
      transfer_note: transferNote,
      bank_name: schoolPayment.bankName,
      bank_account_number: schoolPayment.bankAccountNumber,
      status: 'submitted',
      academic_year: '2026/2027',
      created_at: existingPending?.created_at || new Date().toISOString(),
      items: cart.length > 0 ? cart : (existingPending?.items || []),
    };

    try {
      let authUserId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authUserId = session?.user?.id || null;
      } catch (e) { }

      const { error: updErr } = await supabase
        .from('parent_orders')
        .update({
          payment_status: 'pending_verification',
          payment_receipt_url: proofDriveUrl.trim() || 'Uploaded to School Google Drive',
          total_amount: finalTotalAmount,
          parent_name: parentProfile.fullName || 'Wali Murid',
          parent_phone: parentProfile.phone || '-',
          parent_email: parentProfile.email || null,
        })
        .eq('id', orderNumber);

      if (updErr) {
        await supabase.from('parent_orders').upsert([
          {
            id: orderNumber,
            parent_auth_user_id: authUserId,
            school_name: schoolName,
            school_level: schoolLevel,
            student_name: studentName,
            student_class: studentGrade,
            parent_name: parentProfile.fullName || 'Wali Murid',
            parent_phone: parentProfile.phone || '-',
            parent_email: parentProfile.email || null,
            total_amount: finalTotalAmount,
            payment_method: 'transfer_sekolah',
            payment_status: 'pending_verification',
            payment_receipt_url: proofDriveUrl.trim() || 'Uploaded to School Google Drive',
            status: 'submitted',
            academic_year: '2026/2027',
          },
        ]);
      }

      if (cart.length > 0) {
        const itemsPayload = cart.map((item) => ({
          parent_order_id: orderNumber,
          product_id: item.productId && !String(item.productId).startsWith('mock-') && !String(item.productId).startsWith('prod-') ? item.productId : null,
          product_name: item.name,
          category: item.category || 'Seragam',
          size: item.size || 'STANDAR',
          quantity: item.quantity,
          price_student: item.price,
          subtotal: item.price * item.quantity,
        }));
        await supabase.from('parent_order_items').delete().eq('parent_order_id', orderNumber);
        await supabase.from('parent_order_items').insert(itemsPayload);
      }
    } catch (err) {
      console.warn('Catatan Supabase:', err);
    }

    const updatedHistory = myOrders.map((o) => ((o.id || o.order_number) === orderNumber ? orderRecord : o));
    if (!updatedHistory.find((o) => (o.id || o.order_number) === orderNumber)) {
      updatedHistory.unshift(orderRecord);
    }
    setMyOrders(updatedHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kanvas_my_orders', JSON.stringify(updatedHistory));
      localStorage.removeItem('kanvas_cart');
    }

    setCompletedOrder(orderRecord);
    setCart([]);
    setActivePendingOrderId(null);
    setIsSubmittingOrder(false);
    setShowFinalConfirmModal(false);
    setCheckoutStep('success');
    if (interactiveGuideStep) {
      dismissInteractiveGuide();
    }
  };

  // Lanjutkan Pembayaran dari Tab Pesanan Saya
  const handleResumePayment = (ord) => {
    setActivePendingOrderId(ord.id || ord.order_number);
    setActiveTab('store');
    setCheckoutStep('payment_instruction');
    triggerHaptic(15);
  };

  // Kembalikan Item Pesanan ke Keranjang Belanja
  const handleRevertToCart = (ord) => {
    const rawItems = Array.isArray(ord?.items) ? ord.items : [];
    if (rawItems.length === 0) {
      alert('Rincian seragam tidak ditemukan pada data pesanan ini.');
      return;
    }
    const restored = rawItems.map((it, idx) => ({
      id: it.id || `cart-${Date.now()}-${idx}`,
      productId: it.product_id || it.productId || `prod-${idx}`,
      name: it.product_name || it.name,
      category: it.category || 'Seragam',
      size: it.size || 'STANDAR',
      price: it.price_student || it.price || 0,
      quantity: it.quantity || 1,
      studentId: activeStudent?.id || null,
      studentName: ord.student_name || activeStudent?.name || 'Siswa',
      studentSchool: ord.school_name || activeStudent?.school || selectedSchool,
      imageUrl: it.imageUrl || it.image_url || getAssetPath('/kanvas-logo-fix.png'),
    }));

    setCart(restored);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kanvas_cart', JSON.stringify(restored));
    }
    setActiveTab('store');
    setCheckoutStep('cart');
    triggerHaptic(15);
  };

  // Batalkan Pesanan Menunggu Pembayaran
  const handleCancelOrder = async (ord) => {
    const orderId = ord.id || ord.order_number;
    if (!confirm(`Batalkan pesanan ${orderId}? Seluruh pilihan seragam akan dikembalikan ke keranjang belanja Anda.`)) {
      return;
    }
    try {
      await supabase.from('parent_orders').update({ status: 'cancelled' }).eq('id', orderId);
    } catch (e) { }

    setMyOrders((prev) => {
      const updated = prev.map((o) => ((o.id || o.order_number) === orderId ? { ...o, status: 'cancelled' } : o));
      if (typeof window !== 'undefined') {
        localStorage.setItem('kanvas_my_orders', JSON.stringify(updated));
      }
      return updated;
    });

    handleRevertToCart(ord);
  };

  const handleSignOut = async () => {
    if (confirm('Apakah Anda yakin ingin logout dari akun?')) {
      try {
        await supabase.auth.signOut();
      } catch (e) { }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kanvas_parent_session');
        // Tandai bahwa sesi sudah logout agar langsung masuk ke Login tanpa intro/loading
        sessionStorage.setItem('kanvas_logged_out', 'true');
        sessionStorage.setItem('kanvas_intro_seen', 'true');
        sessionStorage.setItem('kanvas_install_gate_dismissed', 'true');
      }
      router.replace('/?logout=true');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-800 select-none pb-20 font-sans">
      {/* =========================================================================
          TOP APP BAR (Mobile Header)
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#0F2C59] text-white shadow-md">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={getAssetPath('/kanvas-logo-only.png')}
              alt="Logo"
              className="w-8 h-8 object-contain rounded-full bg-white/10 p-0.5 border border-white/20"
            />
            <div>
              <span className="font-black text-base tracking-wide block leading-none text-white">
                KANVAS PENABUR
              </span>
              <span className="text-xs text-amber-300 font-semibold leading-tight">
                Storefront Seragam Siswa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={startInteractiveGuide}
              className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all border border-amber-400/30"
              title="Buka Panduan Pemesanan"
            >
              <span>💡 Panduan</span>
            </button>

            <button
              onClick={() => setIsSizeGuideOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Ruler size={14} className="text-amber-400" />
              <span>Ukuran</span>
            </button>

            <button
              id="guide-header-cart"
              onClick={() => {
                triggerHaptic(10);
                setCheckoutStep('cart');
                if (interactiveGuideStep === 'step_3_cart' || interactiveGuideStep === 'b_cart_arrow') {
                  setInteractiveGuideStep('step_4_waiting');
                }
              }}
              className={`relative p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all font-bold ${isCartBouncing ? 'animate-cart-pop' : ''}`}
            >
              <ShoppingBag size={18} />
              {cartTotalItems > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0F2C59] ${isCartBouncing ? 'animate-badge-pop' : 'animate-pulse'}`}>
                  {cartTotalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* =========================================================================
            POIN 6: PEMILIHAN SISWA (STUDENT SWITCHER) SEBELUM PEMESANAN SERAGAM
           ========================================================================= */}
        {activeTab === 'store' && checkoutStep === 'browsing' && (
          <div className="px-4 pb-3 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1">
                <UserCheck size={14} className="text-amber-400" />
                Pesan Seragam Untuk Siswa:
              </span>
              <button
                onClick={handleOpenAddStudent}
                className="text-xs text-amber-300 hover:text-white font-bold flex items-center gap-1"
              >
                <Plus size={14} /> Tambah Anak
              </button>
            </div>

            {/* List Siswa Terdaftar (Bisa Toggle Antara Anak 1, Anak 2, dst) */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
              {students.map((st) => {
                const isSelected = activeStudent?.id === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleSelectStudent(st)}
                    className={`px-3 py-1.5 rounded-xl text-left shrink-0 transition-all border ${isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                      : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="text-sm font-bold">{st.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${isSelected ? 'bg-slate-900 text-amber-300' : 'bg-white/20 text-blue-200'
                        }`}>
                        {st.level}
                      </span>
                    </div>
                    <span className={`text-xs block mt-0.5 truncate max-w-[200px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-blue-200'
                      }`}>
                      {st.school} • {st.grade}
                    </span>
                  </button>
                );
              })}

              {students.length === 0 && (
                <div
                  onClick={handleOpenAddStudent}
                  className="w-full bg-white/10 rounded-xl p-2.5 text-center text-xs sm:text-sm text-amber-300 cursor-pointer hover:bg-white/20 border border-dashed border-white/30"
                >
                  + Tambahkan Data Siswa
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Floating Notice: Added to Cart */}
      {addedNotice && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold border border-amber-400/30 animate-fade-in backdrop-blur-md max-w-[90vw] truncate">
          <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
          <span className="truncate">{addedNotice}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: STORE / KATALOG SERAGAM
         ========================================================================= */}
      {activeTab === 'store' && checkoutStep === 'browsing' && (
        <div className="flex-1 flex flex-col p-4 space-y-4 animate-fade-in">
          {/* Active Student Indicator Banner */}
          {activeStudent && (
            <div className="bg-gradient-to-r from-blue-900 to-[#0F2C59] text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-base">
                  {activeStudent.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-amber-300 font-semibold block leading-none">
                    Katalog Aktif:
                  </span>
                  <h4 className="text-sm font-bold truncate text-white mt-0.5">
                    {activeStudent.name} ({activeStudent.grade})
                  </h4>
                  <span className="text-xs text-blue-200 truncate block">
                    {activeStudent.school}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-black text-amber-300 border border-white/10 shrink-0">
                {activeStudent.level}
              </span>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kemeja, celana, rok, batik, pramuka..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Multi-Level Switcher Khusus Siswa Dalam PENABUR (Naik Jenjang / Lulusan) */}
          {activeStudent?.studentType === 'dalam' && (activeStudent?.nextLevel || getNextSchoolLevel(activeStudent?.level)) ? (
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  Pilihan Jenjang Pesanan Siswa Internal:
                </span>
                <span className="text-xs text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                  {activeStudent.name} • {activeStudent.grade}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCatalogLevel(activeStudent.level)}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${(activeCatalogLevel || activeStudent.level) === activeStudent.level
                    ? 'bg-[#0F2C59] text-white shadow-sm ring-2 ring-blue-900/30'
                    : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-100/50'
                    }`}
                >
                  <School size={14} />
                  <span>Jenjang {activeStudent.level} (Saat Ini)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCatalogLevel(activeStudent.nextLevel || getNextSchoolLevel(activeStudent.level))}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${(activeCatalogLevel || activeStudent.level) === (activeStudent.nextLevel || getNextSchoolLevel(activeStudent.level))
                    ? 'bg-[#0F2C59] text-white shadow-sm ring-2 ring-blue-900/30'
                    : 'bg-white border border-amber-200 text-slate-700 hover:bg-amber-100/50'
                    }`}
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Jenjang {activeStudent.nextLevel || getNextSchoolLevel(activeStudent.level)} (Lanjutan)</span>
                </button>
              </div>
              <p className="text-xs text-amber-800 italic text-center">
                * Anda dapat memesan seragam jenjang {activeStudent.level} dan {activeStudent.nextLevel || getNextSchoolLevel(activeStudent.level)} ke keranjang yang sama.
              </p>
            </div>
          ) : (
            /* Banner Kunci Jenjang Khusus Siswa Baru dari Luar */
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-900/10 via-blue-50 to-indigo-50/50 border border-blue-200/80 text-blue-950">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#0F2C59] text-amber-400 flex items-center justify-center text-xs font-black shadow-xs">
                  {activeStudent?.level || selectedLevel || 'SMP'}
                </span>
                <div>
                  <span className="text-xs font-black block leading-none text-slate-900">
                    Katalog Khusus Jenjang {activeStudent?.level || selectedLevel || 'SMP'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                    {activeStudent?.name || 'Siswa'} • {activeStudent?.school || selectedSchool}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-900 text-xs font-extrabold rounded-md flex items-center gap-1">
                <Lock size={12} />
                Siswa Baru (Terkunci)
              </span>
            </div>
          )}

          {/* Category Chips: Hanya Nama Kategori Bersih */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'Semua', label: 'Semua' },
              { id: 'Seragam', label: 'Seragam' },
              { id: 'Kaos Kaki', label: 'Kaos Kaki' },
              { id: 'Perlengkapan', label: 'Perlengkapan' },
              { id: 'Topi', label: 'Topi' },
              { id: 'Buku', label: 'Buku' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center ${selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="text-xs font-bold text-slate-700">
                Pilihan Seragam ({filteredProducts.length})
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Tahun Ajaran 2026/2027
              </span>
            </div>

            {isLoadingProducts ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 my-4 shadow-sm animate-pulse">
                <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <h3 className="font-bold text-sm text-slate-800">Memuat Katalog Seragam...</h3>
                <p className="text-xs text-slate-400 mt-1">Mengambil data jenjang siswa langsung dari sistem Kanvas</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 my-4 shadow-sm">
                <ShoppingBag size={36} className="mx-auto text-slate-300 mb-2" />
                <h3 className="font-bold text-sm text-slate-700">Seragam Tidak Ditemukan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Coba ganti kata kunci atau pilih tab jenjang lainnya.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {filteredProducts.map((product, pIdx) => {
                  const lowestPrice = Math.min(...product.variants.map((v) => v.price));
                  const productImages = getProductImages(product);
                  const isLogoPlaceholder = !product.imageUrl || product.imageUrl.includes('kanvas-logo');
                  return (
                    <div
                      key={product.id}
                      id={pIdx === 0 ? 'guide-first-product' : undefined}
                      onClick={() => handleOpenProductModal(product)}
                      className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col group relative card-press"
                    >
                      <div className="w-full aspect-square rounded-xl bg-slate-50 overflow-hidden mb-2.5 relative flex items-center justify-center p-2">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className={`w-full h-full ${isLogoPlaceholder ? 'object-contain p-2' : 'object-cover'} group-hover:scale-105 transition-transform duration-300 rounded-lg`}
                          onError={(e) => {
                            e.currentTarget.src = getAssetPath('/kanvas-logo-fix.png');
                            e.currentTarget.className = 'w-full h-full object-contain p-2 transition-transform duration-300 rounded-lg';
                          }}
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                          <span>{product.category}</span>
                          {product.typeCode && (
                            <span className="text-amber-400 font-mono text-[9px] bg-slate-800/90 px-1 rounded">
                              {product.typeCode}
                            </span>
                          )}
                        </span>
                        {productImages.length > 1 && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-sm">
                            📷 {productImages.length} Foto
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 min-h-[38px]">
                        {product.name}
                      </h4>

                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-xs text-slate-400">Mulai</span>
                        <span className="text-sm sm:text-base font-black text-blue-900">
                          Rp{lowestPrice.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                          {product.variants.length} Ukuran
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProductModal(product);
                          }}
                          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm font-bold active:scale-90 transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          CHECKOUT STEP 1: CART REVIEW
         ========================================================================= */}
      {checkoutStep === 'cart' && (
        <div className="flex-1 flex flex-col p-4 animate-fade-in">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 mb-4">
            <button
              onClick={() => setCheckoutStep('browsing')}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-black text-base text-slate-900">Keranjang Belanja</h2>
            <span className="text-xs text-slate-500 ml-auto font-semibold">
              {cartTotalItems} item
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mb-3">
                <ShoppingBag size={28} />
              </div>
              <h3 className="font-bold text-sm text-slate-800">Keranjang Masih Kosong</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Pilih seragam sekolah dari katalog dan tentukan ukuran yang sesuai.
              </p>
              <button
                onClick={() => setCheckoutStep('browsing')}
                className="mt-4 px-5 py-2.5 bg-[#0F2C59] text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110"
              >
                Kembali ke Katalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={`w-14 h-14 rounded-xl ${(!item.imageUrl || item.imageUrl.includes('kanvas-logo')) ? 'object-contain p-1.5' : 'object-cover'} bg-slate-50 shrink-0 border border-slate-100`}
                      onError={(e) => {
                        e.currentTarget.src = getAssetPath('/kanvas-logo-fix.png');
                        e.currentTarget.className = 'w-14 h-14 rounded-xl object-contain p-1.5 bg-slate-50 shrink-0 border border-slate-100';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                      <span className="text-[10px] text-blue-700 font-semibold block">
                        Untuk: {item.studentName || 'Siswa'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold">
                          Size {item.size}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          Rp{item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 shrink-0">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center shadow-xs font-bold"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold text-slate-900 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center shadow-xs font-bold"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2 text-xs">
                <span className="font-bold text-slate-800 block text-xs mb-1">
                  Ringkasan Belanja
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Seragam</span>
                  <span className="font-semibold">Rp{cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kode Unik Transfer (No. Urut Sekolah)</span>
                  <span className="font-bold text-amber-600">+{String(uniqueVerificationCode).padStart(3, '0')}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="font-black text-slate-900">Total Pembayaran</span>
                  <span className="text-blue-900 text-base font-black">
                    Rp{finalTotalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCheckoutStep('checkout');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#0F2C59] to-[#1E3A8A] text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <span>Lanjut ke Pengambilan & Pembayaran</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          POIN 2: CHECKOUT STEP (DATA SISWA TERVERIFIKASI TANPA INPUT ULANG!)
         ========================================================================= */}
      {checkoutStep === 'checkout' && (
        <form onSubmit={handleProceedToPayment} className="flex-1 flex flex-col p-4 animate-fade-in space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setCheckoutStep('cart')}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-black text-base text-slate-900">Pengambilan & Pembayaran</h2>
          </div>

          {/* CARD DATA SISWA TERDAFTAR (LANGSUNG TERTAMPIL OTOMATIS TANPA FORM INPUT ULANG!) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck size={16} className="text-blue-900" />
                Data Siswa Pemesan
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                ✓ Terverifikasi Pendaftaran
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Nama Siswa:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {activeStudent?.name || 'Siswa PENABUR'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Kelas / Tingkat:</span>
                <span className="font-bold text-slate-800">
                  {activeStudent?.grade || 'Kelas 1'}
                </span>
              </div>
              <div className="col-span-2 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
                <span className="text-[10px] text-blue-700 block font-bold leading-none mb-1">
                  Sekolah BPK PENABUR:
                </span>
                <span className="font-black text-xs text-blue-950 block">
                  {activeStudent?.school || selectedSchool} ({activeStudent?.level || selectedLevel})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Wali Murid:</span>
                <span className="font-semibold text-slate-800">{parentProfile.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">WhatsApp:</span>
                <span className="font-semibold text-slate-800">{parentProfile.phone}</span>
              </div>
            </div>
          </div>

          {/* Pilihan Cara Pengambilan */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <span className="block text-xs font-bold text-slate-900">
              Pilih Cara Pengambilan Seragam
            </span>

            <div
              onClick={() => setDeliveryMethod('koperasi')}
              className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${deliveryMethod === 'koperasi'
                ? 'border-blue-700 bg-blue-50/50'
                : 'border-slate-200 bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <Building size={18} className="text-blue-700" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Ambil di Koperasi Sekolah
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    Diambil saat pembagian seragam tahun ajaran baru
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                GRATIS
              </span>
            </div>

            <div
              onClick={() => setDeliveryMethod('rumah')}
              className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${deliveryMethod === 'rumah'
                ? 'border-blue-700 bg-blue-50/50'
                : 'border-slate-200 bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <Truck size={18} className="text-blue-700" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Kirim ke Alamat Rumah
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    Ekspedisi Jabodetabek (+Rp18.000)
                  </span>
                </div>
              </div>
            </div>

            {deliveryMethod === 'rumah' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Alamat Lengkap Pengiriman
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kode pos"
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Ringkasan Total Tagihan */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Total Pembayaran Seragam</span>
              <span className="text-base font-black text-blue-900">
                Rp{finalTotalAmount.toLocaleString('id-ID')}
              </span>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-[10px] font-bold">
              Transfer Rekening Sekolah
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#0F2C59] to-[#1E3A8A] text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-950/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span>Lanjut ke Info Rekening Sekolah</span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {/* =========================================================================
          CHECKOUT STEP 2A: INSTRUKSI PEMBAYARAN REKENING SEKOLAH & BERITA TRANSFER
         ========================================================================= */}
      {checkoutStep === 'payment_instruction' && (
        <div className="flex-1 flex flex-col p-4 animate-fade-in space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setCheckoutStep('checkout')}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h2 className="font-black text-sm text-slate-900">Pembayaran Rekening Sekolah</h2>
              <p className="text-[10.5px] text-slate-400">Tahap 1 dari 2: Salin Rekening & Keterangan Transfer</p>
            </div>
          </div>

          {/* CARD REKENING SEKOLAH RESMI */}
          <div id="guide-payment-account" className="bg-gradient-to-br from-blue-950 to-[#0F2C59] rounded-3xl p-5 text-white shadow-md space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                  Rekening Resmi Sekolah
                </span>
                <h3 className="font-extrabold text-sm text-white mt-0.5">{currentSchoolName}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-800/60 border border-blue-700 text-amber-400 font-black text-[11px]">
                {schoolPayment.bankName || 'BCA'}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-200 block">Nomor Rekening Tujuan:</span>
                  <span className="text-lg font-black tracking-wider text-amber-300 font-mono select-all">
                    {schoolPayment.bankAccountNumber || '0760256757'}
                  </span>
                  <span className="text-[10.5px] text-slate-200 block font-medium">
                    a.n. {schoolPayment.bankAccountHolder}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(schoolPayment.bankAccountNumber || '0760256757', 'account')}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  {copiedField === 'account' ? (
                    <>
                      <Check size={14} className="text-emerald-800" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Salin No. Rekening</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* TOTAL NOMINAL TRANSFER */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <div>
                <span className="text-[10px] text-blue-200 block">Total Nominal Tepat:</span>
                <span className="text-base font-black text-white">
                  Rp{finalTotalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(String(finalTotalAmount), 'amount')}
                className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-blue-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                {copiedField === 'amount' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedField === 'amount' ? 'Tersalin' : 'Salin Jumlah'}</span>
              </button>
            </div>
          </div>

          {/* CARD KHUSUS: KETERANGAN BERITA TRANSFER WAJIB */}
          <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-300 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-700 shrink-0" />
              <span className="font-extrabold text-xs text-amber-950">
                Wajib Ditulis di Berita / Keterangan Transfer M-Banking:
              </span>
            </div>

            <div className="bg-white rounded-xl p-3 border border-amber-200 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-slate-400 block font-semibold">Teks Keterangan Transfer:</span>
                <span className="text-base font-black text-slate-900 tracking-wide font-mono block select-all">
                  {transferNote}
                </span>
                <span className="text-[10px] text-amber-800 italic mt-0.5 block">
                  (Format: [Nama Depan Siswa] [Nama Depan Orang Tua])
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(transferNote, 'note')}
                className="px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all shadow-xs"
              >
                {copiedField === 'note' ? (
                  <>
                    <Check size={13} className="text-amber-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Salin Keterangan</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10.5px] text-amber-900 leading-tight">
              💡 <strong>Penting:</strong> Keterangan ini digunakan oleh PIC Sekolah untuk memverifikasi uang masuk di mutasi rekening koran sekolah.
            </p>
          </div>

          {/* CTA LANJUT KE UPLOAD BUKTI */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setCheckoutStep('upload_proof');
                if (interactiveGuideStep) {
                  dismissInteractiveGuide();
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <CheckCircle2 size={16} />
              <span>Konfirmasi Pembayaran & Lanjut Upload Bukti &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHECKOUT STEP 2B: UPLOAD BUKTI BAYAR KE GOOGLE DRIVE AKUN SEKOLAH
         ========================================================================= */}
      {checkoutStep === 'upload_proof' && (
        <div className="flex-1 flex flex-col p-4 animate-fade-in space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setCheckoutStep('payment_instruction')}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h2 className="font-black text-sm text-slate-900">Upload Bukti Transfer Sekolah</h2>
              <p className="text-[10.5px] text-slate-400">Tahap 2 dari 2: Unggah ke Google Drive Sekolah</p>
            </div>
          </div>

          {/* CARD RINGKASAN TRANSFER */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400 text-[11px]">Sekolah Tujuan:</span>
              <span className="font-bold text-slate-800">{currentSchoolName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-[11px]">Total Ditransfer:</span>
              <span className="font-black text-blue-900">Rp{finalTotalAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
              <span className="text-slate-400 text-[11px]">Keterangan Transfer:</span>
              <span className="font-mono font-bold text-slate-900">{transferNote}</span>
            </div>
          </div>

          {/* UPLOAD LANGSUNG KE GOOGLE DRIVE SEKOLAH (METODE B AKSARA) */}
          <div className="bg-white rounded-3xl p-5 border-2 border-blue-200 shadow-sm space-y-3.5 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center shadow-xs">
              <Camera size={24} />
            </div>
            <div>
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                Upload Foto Bukti Transfer
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Foto struk ATM atau screenshot m-banking Anda. Sistem akan mengunggahnya langsung ke Google Drive {currentSchoolName}.
              </p>
            </div>

            <input
              ref={directFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleDirectUploadGas}
            />

            {previewImage && (
              <div className="relative mx-auto w-36 h-36 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md">
                <img src={previewImage} alt="Bukti Transfer" className="w-full h-full object-cover" />
                {proofDriveUrl && (
                  <div className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[10px] font-bold py-1 flex items-center justify-center gap-1">
                    <Check size={12} /> Terupload ke Drive
                  </div>
                )}
              </div>
            )}

            {proofDriveUrl ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 size={16} />
                  <span>Bukti Transfer Berhasil Diunggah!</span>
                </div>
                <p className="text-[10.5px] text-emerald-700">
                  File tersimpan aman di Google Drive {currentSchoolName}.
                </p>
                <button
                  type="button"
                  onClick={() => directFileInputRef.current?.click()}
                  className="mt-1 text-[11px] font-bold text-blue-800 underline hover:text-blue-950"
                >
                  Ganti Foto Bukti Lain
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isUploadingGas}
                onClick={() => directFileInputRef.current?.click()}
                className={`w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${isUploadingGas
                  ? 'bg-slate-300 text-slate-600 cursor-wait'
                  : 'bg-gradient-to-r from-blue-900 to-[#0F2C59] text-white hover:brightness-110 shadow-blue-900/20'
                  }`}
              >
                {isUploadingGas ? (
                  <>
                    <RefreshCw size={15} className="animate-spin text-amber-400" />
                    <span>Sedang Mengunggah ke Google Drive...</span>
                  </>
                ) : (
                  <>
                    <Camera size={16} className="text-amber-400" />
                    <span>Ambil Foto / Pilih dari Galeri HP</span>
                  </>
                )}
              </button>
            )}

            {uploadGasError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-medium text-left">
                ⚠️ {uploadGasError}
                <br />
                <span className="text-[10px] text-rose-600">Anda dapat menggunakan tautan manual di bawah ini jika koneksi sedang terkendala.</span>
              </div>
            )}

            {/* Alternatif Buka Google Drive Manual jika diperlukan */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Atau buka folder manual:</span>
              <a
                href={schoolPayment.gdriveUploadLink || 'https://drive.google.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-800 hover:text-blue-950 font-bold flex items-center gap-1"
              >
                <span>Google Drive {currentSchoolName}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Tautan File Google Drive jika diupload manual */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Tautan File Google Drive (Otomatis Terisi setelah Upload)
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              value={proofDriveUrl}
              onChange={(e) => setProofDriveUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* CHECKBOX KONFIRMASI WAJIB */}
          <div
            onClick={() => setIsProofConfirmed(!isProofConfirmed)}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${isProofConfirmed
              ? 'border-emerald-600 bg-emerald-50/70'
              : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isProofConfirmed ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300'
                }`}
            >
              {isProofConfirmed && <Check size={14} />}
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-900 block leading-tight">
                Saya telah menyelesaikan pembayaran transfer dan mengunggah bukti bayar ke Google Drive sekolah.
              </span>
              <span className="text-[10.5px] text-slate-400 block mt-0.5">
                PIC Sekolah akan memverifikasi mutasi bank dan file bukti Anda.
              </span>
            </div>
          </div>

          {/* CTA SELESAIKAN PEMESANAN */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!isProofConfirmed}
              onClick={() => setShowFinalConfirmModal(true)}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${isProofConfirmed
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-emerald-700/20 hover:brightness-110 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              <CheckCircle2 size={16} />
              <span>Selesaikan Pemesanan & Notifikasi Sekolah</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHECKOUT STEP 3: SUCCESS RECEIPT
         ========================================================================= */}
      {checkoutStep === 'success' && completedOrder && (
        <div className="flex-1 flex flex-col p-4 animate-fade-in space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Pesanan Berhasil Masuk!</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Terima kasih. Pesanan seragam siswa telah tercatat di sistem Koperasi BPK PENABUR.
            </p>

            <div className="mt-4 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 inline-flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Nomor Pesanan:</span>
              <span className="text-xs font-black text-blue-900 tracking-wider">
                {completedOrder.id}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Nama Siswa</span>
              <span className="font-extrabold text-slate-900">{completedOrder.student_name}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Orang Tua / Wali</span>
              <span className="font-bold text-slate-800">{completedOrder.parent_name}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Sekolah & Kelas</span>
              <span className="font-bold text-slate-800 text-right">{completedOrder.school_name} (Kelas {completedOrder.student_class || '-'})</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Metode Pengambilan</span>
              <span className="font-bold text-slate-800 capitalize">
                {completedOrder.delivery_method === 'koperasi' ? 'Koperasi Sekolah' : 'Kirim Rumah'}
              </span>
            </div>

            <div className="pt-1">
              <span className="font-bold text-slate-700 block mb-2">Item Seragam:</span>
              <div className="space-y-1.5">
                {completedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600 text-[11px]">
                    <span>
                      {it.quantity}x {it.name} ({it.size})
                    </span>
                    <span className="font-semibold">
                      Rp{(it.price * it.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Total Pembayaran</span>
              <span className="text-blue-900 text-base">
                Rp{completedOrder.total_amount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                setActiveTab('orders');
                setCheckoutStep('browsing');
                fetchLiveParentOrders();
              }}
              className="w-full py-3 bg-[#0F2C59] text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-md flex items-center justify-center gap-2"
            >
              <Receipt size={15} className="text-amber-400" />
              <span>Lihat Bukti Pengambilan di "Pesanan Saya"</span>
            </button>
            <button
              onClick={() => {
                setCheckoutStep('browsing');
              }}
              className="w-full py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold"
            >
              Kembali Belanja Seragam Lain
            </button>
            <button
              onClick={() => {
                const message = encodeURIComponent(
                  `Halo Admin Koperasi BPK PENABUR, saya ingin konfirmasi pesanan seragam Kanvas nomor: ${completedOrder.id} untuk siswa ${completedOrder.student_name} (${completedOrder.school_name}).`
                );
                window.open(`https://wa.me/6281290001234?text=${message}`, '_blank');
              }}
              className="w-full py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1.5"
            >
              <Phone size={14} />
              <span>Konfirmasi via WhatsApp Koperasi</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ORDERS / RIWAYAT PESANAN SAYA
         ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="flex-1 flex flex-col p-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h2 className="font-black text-base text-slate-900">Riwayat Pesanan Seragam</h2>
              <p className="text-[11px] text-slate-400">Bukti resmi pengambilan seragam untuk PIC sekolah</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLiveParentOrders()}
                disabled={isSyncingOrders}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shadow-xs"
                title="Segarkan status pesanan dari sekolah"
              >
                <RefreshCw size={13} className={isSyncingOrders ? 'animate-spin text-blue-900' : ''} />
                <span className="text-[11px] hidden sm:inline">{isSyncingOrders ? 'Menyinkronkan...' : 'Segarkan'}</span>
              </button>
              <span className="text-xs text-blue-900 font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                {myOrders.length} Pesanan
              </span>
            </div>
          </div>

          {myOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Clock size={36} className="text-slate-300 mb-2" />
              <h3 className="font-bold text-sm text-slate-700">Belum Ada Riwayat Pesanan</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Pesanan seragam yang Anda buat akan tersimpan di sini dan kode pesanannya dapat ditunjukkan ke PIC sekolah saat pengambilan.
              </p>
              <button
                onClick={() => {
                  setActiveTab('store');
                  setCheckoutStep('browsing');
                }}
                className="mt-4 px-5 py-2.5 bg-[#0F2C59] text-white rounded-xl text-xs font-bold"
              >
                Mulai Pesan Seragam
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((ord, idx) => {
                const orderCode = ord.id || ord.order_number || `ORD-${idx + 1}`;
                const itemsList = Array.isArray(ord.items) ? ord.items : [];
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3 transition-all hover:border-blue-200"
                  >
                    {/* Header: Kode Pesanan & Status */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Receipt size={14} className="text-blue-900" />
                          <span className="text-xs font-black text-blue-950 tracking-wider">
                            {orderCode}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block flex items-center gap-1">
                          <Calendar size={10} />
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Hari ini'}
                        </span>
                      </div>
                      {renderOrderStatusBadge(ord)}
                    </div>

                    {/* Identitas Siswa & Sekolah */}
                    <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-[13px]">{ord.student_name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold text-[10px]">
                          Kelas {ord.student_class || '-'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <School size={12} className="text-slate-400" />
                        <span>{ord.school_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        <span>Wali: {ord.parent_name || '-'} ({ord.parent_phone || '-'})</span>
                      </div>
                    </div>

                    {/* Rincian Jenis Pesanan (Item Seragam, Ukuran, Qty) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span className="flex items-center gap-1">
                          <Package size={12} className="text-blue-900" />
                          Rincian Seragam Dipesan ({itemsList.length} jenis):
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white">
                        {itemsList.map((item, itemIdx) => (
                          <div key={itemIdx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-800 text-[11px] truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                  Size: {item.size}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  Qty: {item.quantity} pcs
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                              Rp{(((item.price ?? item.price_student) || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total Tagihan */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Metode Pengambilan</span>
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Building size={12} className="text-blue-900" />
                          {ord.delivery_method === 'rumah' ? 'Kirim ke Rumah' : 'Koperasi Sekolah'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-medium">Total Pesanan</span>
                        <span className="text-sm font-black text-blue-900">
                          Rp{ord.total_amount?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Status & Action Card */}
                    {String(ord.payment_status || '').toLowerCase() === 'unpaid' && String(ord.status || '').toLowerCase() !== 'cancelled' ? (
                      (() => {
                        const createdTime = ord.created_at ? new Date(ord.created_at).getTime() : Date.now();
                        const isExpired = Date.now() - createdTime >= 24 * 60 * 60 * 1000;
                        if (!isExpired) {
                          return (
                            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                  <Clock size={14} className="text-amber-600 animate-spin" />
                                  Sisa Waktu Pembayaran:
                                </span>
                                <span className="font-black text-amber-950 font-mono text-sm bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-xs">
                                  {formatCountdown(ord.created_at)}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-amber-800 leading-tight">
                                Harap transfer dan upload bukti bayar dalam 24 jam. Jika melewati batas waktu, pesanan otomatis dibatalkan dan seragam dapat dikembalikan ke keranjang.
                              </p>
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleResumePayment(ord)}
                                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                >
                                  <span>Lanjut Bayar & Upload Bukti &rarr;</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(ord)}
                                  className="px-3.5 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                                >
                                  Batalkan
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                                  <AlertCircle size={14} className="text-rose-600" />
                                  Batas Waktu Pembayaran Habis (24 Jam)
                                </span>
                              </div>
                              <p className="text-[10.5px] text-rose-800 leading-tight">
                                Pesanan ini telah kedaluwarsa karena tidak diselesaikan dalam 24 jam. Anda dapat mengembalikan seragam ini ke keranjang belanja Anda.
                              </p>
                              <button
                                type="button"
                                onClick={() => handleRevertToCart(ord)}
                                className="w-full py-2.5 bg-[#0F2C59] hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                              >
                                <ShoppingBag size={14} />
                                <span>Kembalikan Seragam ke Keranjang</span>
                              </button>
                            </div>
                          );
                        }
                      })()
                    ) : String(ord.status || '').toLowerCase() === 'cancelled' ? (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <p className="text-[10.5px] text-slate-500 leading-tight">
                          Pesanan telah dibatalkan. Anda dapat memasukkan kembali seragam ini ke dalam keranjang belanja.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRevertToCart(ord)}
                          className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <ShoppingBag size={13} />
                          <span>Pesan Ulang (Kembalikan ke Keranjang)</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Pesan Instruksi Pengambilan untuk PIC Seragam */}
                        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-2">
                          <QrCode size={16} className="text-blue-900 shrink-0" />
                          <p className="text-[10px] text-blue-900 leading-tight">
                            {String(ord.status || '').toLowerCase() === 'completed' || String(ord.status || '').toLowerCase() === 'selesai' ? (
                              <span><strong>Pesanan Selesai:</strong> Seragam telah berhasil diserahkan kepada siswa / wali murid. Simpan bukti ini untuk arsip Anda.</span>
                            ) : String(ord.status || '').toLowerCase() === 'ready_for_pickup' || String(ord.status || '').toLowerCase() === 'siap_diambil' ? (
                              <span className="text-emerald-950"><strong>Seragam Siap Diambil!</strong> Silakan datang ke ruang seragam / TU sekolah Anda dengan menunjukkan kode pesanan ini.</span>
                            ) : String(ord.status || '').toLowerCase() === 'processing' || String(ord.status || '').toLowerCase() === 'verified' ? (
                              <span className="text-blue-950"><strong>Sedang Disiapkan:</strong> Pembayaran telah diverifikasi. Petugas sekolah sedang mengemas seragam pesanan Anda.</span>
                            ) : (
                              <span><strong>Menunggu Verifikasi:</strong> Bukti transfer telah terkirim dan sedang diverifikasi oleh staf sekolah. Tunjukkan kode ini saat pengambilan.</span>
                            )}
                          </p>
                        </div>

                        {/* Tombol Tampilkan Tiket Pengambilan (Untuk PIC) */}
                        <button
                          onClick={() => setSelectedOrderReceipt(ord)}
                          className="w-full py-2.5 bg-gradient-to-r from-[#0F2C59] to-[#1E3A8A] text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          <Receipt size={14} className="text-amber-400" />
                          <span>Buka Bukti Pengambilan Seragam (Untuk PIC)</span>
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          POIN 4 & 5: TAB PROFIL WALI MURID (EDIT PROFIL & TAMBAH SISWA BARU)
         ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="flex-1 flex flex-col p-4 animate-fade-in space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="font-black text-base text-slate-900">Profil Akun & Data Siswa</h2>
          </div>

          {/* KARTU PROFIL WALI MURID */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F2C59] to-[#1E3A8A] text-white flex items-center justify-center font-black text-xl shadow-md">
                {parentProfile.fullName?.charAt(0) || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-900 truncate">
                  {parentProfile.fullName || 'Wali Murid PENABUR'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{parentProfile.phone || '0812-xxxx-xxxx'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold">
                  Akun Terverifikasi Kanvas
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setParentEditForm({
                  fullName: parentProfile.fullName,
                  phone: parentProfile.phone,
                });
                setShowEditParentModal(true);
              }}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Edit3 size={13} />
              <span>Edit Profil Wali Murid</span>
            </button>
          </div>

          {/* DAFTAR SISWA PENABUR TERDAFTAR (MULTI-SISWA) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck size={16} className="text-blue-900" />
                Daftar Siswa Terdaftar ({students.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {students.map((st) => (
                <div
                  key={st.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{st.name}</h4>
                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 text-[9.5px] font-black rounded-md">
                        {st.level}
                      </span>
                      {st.studentType === 'dalam' ? (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9.5px] font-bold rounded-md">
                          Siswa Dalam
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[9.5px] font-bold rounded-md">
                          Siswa Baru
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {st.school} • {st.grade}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenEditStudent(st)}
                    className="p-2 text-slate-500 hover:text-blue-900 rounded-lg hover:bg-white transition-all shrink-0"
                    title="Edit Data Siswa"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* TOMBOL POIN 5: TAMBAH SISWA BARU (ANAK KE-2 / BERIKUTNYA) */}
            <button
              onClick={handleOpenAddStudent}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <UserPlus size={15} />
              <span>+ Tambah Siswa Baru (Anak ke-2 / Berikutnya)</span>
            </button>
          </div>

          {/* Pusat Bantuan */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Bantuan & Panduan</span>

            <div
              onClick={() => setIsSizeGuideOpen(true)}
              className="flex items-center justify-between py-2 border-b border-slate-100 cursor-pointer hover:text-blue-900 text-xs font-semibold"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <Ruler size={16} className="text-blue-700" />
                <span>Panduan Ukuran Standar PENABUR</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            <div
              onClick={() => {
                alert(
                  'Koperasi Konsumen Karyawan BPK PENABUR Jakarta\nLayanan Seragam Resmi Siswa\nTelp/WA: 0812-9000-xxxx'
                );
              }}
              className="flex items-center justify-between py-2 border-b border-slate-100 cursor-pointer hover:text-blue-900 text-xs font-semibold"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <HelpCircle size={16} className="text-blue-700" />
                <span>Pusat Bantuan & Kontak Koperasi</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT PROFIL WALI MURID
         ========================================================================= */}
      {showEditParentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 w-full max-w-md sm:max-w-lg animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-base text-slate-900">Edit Profil Wali Murid</h3>
              <button
                onClick={() => setShowEditParentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveParentProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Orang Tua *
                </label>
                <input
                  type="text"
                  required
                  value={parentEditForm.fullName}
                  onChange={(e) => setParentEditForm({ ...parentEditForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  value={parentEditForm.phone}
                  onChange={(e) => setParentEditForm({ ...parentEditForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditParentModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TAMBAH / EDIT SISWA (LOCK JENJANG OTOMATIS)
         ========================================================================= */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 w-full max-w-md sm:max-w-lg animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-base text-slate-900">
                {studentModalMode === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
              </h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStudentModal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jonathan Chris"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Kategori Siswa: Siswa Baru (Luar) vs Siswa Dalam (Internal) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kategori Siswa *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentForm({ ...studentForm, studentType: 'luar' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${studentForm.studentType === 'luar'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <div className="font-bold text-[11px] flex items-center gap-1">
                      <span>🔘 Siswa Baru</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                      Dari luar PENABUR (1 jenjang terkunci)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentForm({ ...studentForm, studentType: 'dalam' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${studentForm.studentType === 'dalam'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <div className="font-bold text-[11px] flex items-center gap-1 text-emerald-900">
                      <span>✨ Siswa Dalam</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                      Internal / Naik jenjang (2 jenjang)
                    </p>
                  </button>
                </div>
              </div>

              {studentForm.studentType === 'dalam' && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">ℹ️</span>
                  <div>
                    <span className="font-bold">Akses Multi-Jenjang Siswa Internal:</span>
                    <p className="text-slate-600 text-[9.5px] mt-0.5">
                      Siswa jenjang <b>{studentForm.level}</b> dapat memesan seragam jenjang <b>{studentForm.level}</b> dan jenjang lanjutan <b>{getNextSchoolLevel(studentForm.level) || 'SMA'}</b> sekaligus dalam satu keranjang belanja.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Sekolah PENABUR *
                </label>
                <select
                  required
                  value={studentForm.school}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    const found = schoolList.find((s) => cleanSchoolName(s.name) === cleanSchoolName(chosen));
                    const autoLevel = found?.level || deriveSchoolLevel(chosen);
                    const grades = getAvailableGrades(autoLevel);
                    setStudentForm({
                      ...studentForm,
                      school: chosen,
                      level: autoLevel,
                      grade: grades.length > 0 ? (grades.includes(studentForm.grade) ? studentForm.grade : grades[0]) : '-'
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                >
                  {schoolList.map((sch, idx) => (
                    <option key={idx} value={sch.name}>
                      {sch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenjang Otomatis Terkunci Sesuai Sekolah */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Jenjang Sekolah
                  </label>
                  <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                    <Lock size={10} /> Terkunci Otomatis
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={studentForm.level}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-xs font-black text-blue-900 cursor-not-allowed uppercase tracking-wider"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-100 text-blue-800 text-[9.5px] font-extrabold rounded-md">
                    {studentForm.level}
                  </div>
                </div>
              </div>

              {/* Kelas Siswa: Dropdown Dinamis (SD: 1-6, SMP: 7-9, SMA: 10-12, TK: Tidak perlu isi) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kelas Siswa *
                </label>
                {getAvailableGrades(studentForm.level).length > 0 ? (
                  <select
                    required
                    value={studentForm.grade}
                    onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                  >
                    {getAvailableGrades(studentForm.level).map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                    <span>Jenjang TK</span>
                    <span className="text-[10px] text-amber-700 font-extrabold bg-amber-100/80 px-2 py-0.5 rounded-md">
                      Tidak perlu mengisi kelas
                    </span>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {getAvailableGrades(studentForm.level).length > 0
                    ? `Pilihan kelas otomatis disesuaikan untuk jenjang ${studentForm.level}.`
                    : 'Untuk jenjang TK (TKK), siswa tidak memerlukan pengisian kelas.'}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800"
                >
                  {studentModalMode === 'add' ? 'Simpan Siswa Baru' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SIZE SELECTOR & ENLARGED PRODUCT PREVIEW (WITH MULTI-PHOTO SLIDER)
         ========================================================================= */}
      {activeProductModal && (() => {
        const modalImages = getProductImages(activeProductModal);
        const activeImageUrl = modalImages[modalImageIndex] || modalImages[0] || activeProductModal.imageUrl;

        const handlePrevImage = (e) => {
          e?.stopPropagation();
          triggerHaptic(10);
          setModalImageIndex((prev) => (prev > 0 ? prev - 1 : modalImages.length - 1));
        };

        const handleNextImage = (e) => {
          e?.stopPropagation();
          triggerHaptic(10);
          setModalImageIndex((prev) => (prev < modalImages.length - 1 ? prev + 1 : 0));
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:p-4 animate-fade-in">
            <div className="bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-slate-200 max-h-[92vh] overflow-y-auto w-full sm:max-w-lg md:max-w-xl mx-auto">
              {/* Header: Title & Close Button */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="pr-4">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
                      <span>{activeProductModal.category}</span>
                      {activeProductModal.typeCode && (
                        <span className="bg-blue-200/80 text-blue-950 px-1 rounded text-[10px] font-mono">
                          {activeProductModal.typeCode}
                        </span>
                      )}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                      Jenjang {activeProductModal.level}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                    {activeProductModal.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg sm:text-xl font-black text-blue-900">
                      Rp
                      {(
                        activeProductModal.variants.find((v) => v.size === modalSelectedSize)?.price ||
                        activeProductModal.variants[0]?.price ||
                        0
                      ).toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      (Ukuran {modalSelectedSize || activeProductModal.variants[0]?.size})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveProductModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors"
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Enlarged Photo Preview with Slider / Carousel (Touch Swipe & Tap to View Full Image) */}
              <div className="my-3.5">
                <div
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(modalImages)}
                  onClick={() => {
                    if (isSwipingRef.current) return;
                    if (activeImageUrl && !activeImageUrl.includes('kanvas-logo')) {
                      setFullScreenPreviewImage(activeImageUrl);
                    }
                  }}
                  className="relative w-full aspect-square max-h-64 sm:max-h-72 max-w-xs sm:max-w-sm mx-auto rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-inner group flex items-center justify-center p-2 cursor-pointer"
                  title="Ketuk foto untuk melihat tampilan utuh"
                >
                  <img
                    src={activeImageUrl}
                    alt={`${activeProductModal.name} - Foto ${modalImageIndex + 1}`}
                    className={`w-full h-full ${(!activeImageUrl || activeImageUrl.includes('kanvas-logo')) ? 'object-contain p-6' : 'object-contain p-1'} transition-all duration-300 select-none`}
                    onError={(e) => {
                      e.currentTarget.src = getAssetPath('/kanvas-logo-fix.png');
                      e.currentTarget.className = 'w-full h-full object-contain p-6 transition-all duration-300 select-none';
                    }}
                  />

                  {/* Badges on top */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold shadow-sm">
                    {modalImageIndex === 0
                      ? 'Tampak Depan'
                      : modalImageIndex === 1
                        ? 'Detail Bahan & Kerah'
                        : 'Tampak Belakang / Lipatan'}
                  </div>

                  {modalImages.length > 1 && (
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-amber-300 text-xs font-black shadow-sm">
                      {modalImageIndex + 1} / {modalImages.length}
                    </div>
                  )}

                  {/* Left / Right Slide Buttons if 2 or more images */}
                  {modalImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center active:scale-90 transition-all border border-slate-200"
                        title="Foto Sebelumnya"
                        aria-label="Foto Sebelumnya"
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center active:scale-90 transition-all border border-slate-200"
                        title="Foto Selanjutnya"
                        aria-label="Foto Selanjutnya"
                      >
                        <ChevronRight size={22} />
                      </button>

                      {/* Dots indicator */}
                      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center items-center gap-1.5">
                        {modalImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setModalImageIndex(idx)}
                            className={`h-2 rounded-full transition-all ${modalImageIndex === idx
                              ? 'w-6 bg-amber-400 shadow-sm'
                              : 'w-2 bg-white/70 hover:bg-white'
                              }`}
                            aria-label={`Lihat foto ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip if multiple images */}
                {modalImages.length > 1 && (
                  <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
                    {modalImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setModalImageIndex(idx)}
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${modalImageIndex === idx
                          ? 'border-blue-900 shadow-md scale-105'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className={`w-full h-full ${(!img || img.includes('kanvas-logo')) ? 'object-contain p-1.5' : 'object-cover'}`}
                          onError={(e) => {
                            e.currentTarget.src = getAssetPath('/kanvas-logo-fix.png');
                            e.currentTarget.className = 'w-full h-full object-contain p-1.5';
                          }}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-slate-500 italic shrink-0 ml-1">
                      (Geser foto untuk melihat sudut lain)
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Produk
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeProductModal.description}
                </p>
              </div>

              {/* Wrapper untuk Spotlight Panduan: Pilihan Ukuran & Tambah ke Keranjang */}
              <div id="guide-modal-actions" className="rounded-2xl p-1 -m-1 transition-all space-y-3.5">
                {/* Size Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">Pilih Ukuran Seragam:</span>
                    <button
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                    >
                      <Ruler size={14} /> Panduan Ukuran
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {activeProductModal.variants.map((v) => (
                      <button
                        key={v.size}
                        onClick={() => setModalSelectedSize(v.size)}
                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${modalSelectedSize === v.size
                          ? 'border-blue-900 bg-blue-900 text-white shadow-md scale-105'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                      >
                        {v.size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex gap-2.5">
                  <button
                    onClick={() => setActiveProductModal(null)}
                    className="flex-1 py-3 sm:py-3.5 bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => addToCart(activeProductModal, modalSelectedSize)}
                    className="flex-[2] py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 hover:brightness-105 flex items-center justify-center gap-2 active:scale-95 transition-all btn-shimmer btn-ripple"
                  >
                    <ShoppingBag size={17} />
                    <span>Tambah ke Keranjang</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL: SIZE GUIDE POP-UP
         ========================================================================= */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 w-full max-w-md sm:max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Ruler size={20} className="text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">Panduan Ukuran Resmi</h3>
              </div>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-3">
              Standar konveksi seragam BPK PENABUR (dalam centimeter):
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs sm:text-sm mb-3">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Lingkar Dada</th>
                    <th className="p-2.5">Panjang</th>
                    <th className="p-2.5">Estimasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  <tr><td className="p-2.5 font-bold text-blue-900">SS</td><td className="p-2.5">80 cm</td><td className="p-2.5">56 cm</td><td className="p-2.5">TK - SD 1</td></tr>
                  <tr><td className="p-2.5 font-bold text-blue-900">S</td><td className="p-2.5">86 cm</td><td className="p-2.5">60 cm</td><td className="p-2.5">SD 1 - 2</td></tr>
                  <tr><td className="p-2.5 font-bold text-blue-900">M</td><td className="p-2.5">92 cm</td><td className="p-2.5">64 cm</td><td className="p-2.5">SD 3 - 4</td></tr>
                  <tr><td className="p-2.5 font-bold text-blue-900">L</td><td className="p-2.5">98 cm</td><td className="p-2.5">68 cm</td><td className="p-2.5">SD 5 - SMP</td></tr>
                  <tr><td className="p-2.5 font-bold text-blue-900">XL</td><td className="p-2.5">104 cm</td><td className="p-2.5">72 cm</td><td className="p-2.5">SMP - SMA</td></tr>
                  <tr><td className="p-2.5 font-bold text-blue-900">3L</td><td className="p-2.5">110 cm</td><td className="p-2.5">76 cm</td><td className="p-2.5">Jumbo</td></tr>
                  <tr><td className="p-2.5 font-bold text-blue-900">4L-6L</td><td className="p-2.5">116-128 cm</td><td className="p-2.5">80 cm</td><td className="p-2.5">Ekstra Jumbo</td></tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 font-medium">
              💡 <strong>Tips Memilih:</strong> Jika ragu di antara dua ukuran, disarankan memilih <strong>1 ukuran lebih besar</strong> untuk mengantisipasi pertumbuhan anak selama 1 tahun ajaran.
            </div>

            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="w-full mt-4 py-3 bg-[#0F2C59] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:brightness-110 transition-all"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FULL-SCREEN UNTOUCHED IMAGE PREVIEW (GAMBAR UTUH)
         ========================================================================= */}
      {fullScreenPreviewImage && activeProductModal && (() => {
        const modalImages = getProductImages(activeProductModal);
        const currentImage = modalImages[modalImageIndex] || fullScreenPreviewImage;

        return (
          <div
            onClick={() => setFullScreenPreviewImage(null)}
            className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 animate-fade-in select-none"
          >
            {/* Top Bar: Title & Close Button */}
            <div className="flex items-center justify-between text-white pb-2 z-10 w-full max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="truncate pr-4">
                <h4 className="font-bold text-sm sm:text-base text-white truncate">{activeProductModal.name}</h4>
                {modalImages.length > 1 && (
                  <span className="text-xs text-amber-300 font-medium">
                    Foto {modalImageIndex + 1} dari {modalImages.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setFullScreenPreviewImage(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all shrink-0 active:scale-95"
                title="Tutup Preview"
                aria-label="Tutup Preview"
              >
                <X size={22} />
              </button>
            </div>

            {/* Main Image (Centered, Uncropped, High-Res) */}
            <div
              className="flex-1 flex items-center justify-center relative w-full h-full my-auto overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(modalImages)}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImage}
                alt={activeProductModal.name}
                className="max-h-[82vh] max-w-[95vw] w-auto h-auto object-contain rounded-xl shadow-2xl transition-all duration-300"
                onError={(e) => {
                  e.currentTarget.src = getAssetPath('/kanvas-logo-fix.png');
                }}
              />

              {/* Navigation arrows in full screen */}
              {modalImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(10);
                      setModalImageIndex((prev) => (prev > 0 ? prev - 1 : modalImages.length - 1));
                    }}
                    className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center transition-all active:scale-90 shadow-lg"
                    title="Foto Sebelumnya"
                    aria-label="Foto Sebelumnya"
                  >
                    <ChevronLeft size={26} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(10);
                      setModalImageIndex((prev) => (prev < modalImages.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center transition-all active:scale-90 shadow-lg"
                    title="Foto Selanjutnya"
                    aria-label="Foto Selanjutnya"
                  >
                    <ChevronRight size={26} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom hint */}
            <div className="text-center pt-2 text-slate-400 text-xs">
              <span>Ketuk di luar gambar atau tombol silang untuk menutup</span>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL: TIKET PENGAMBILAN SERAGAM RESMI (UNTUK PIC SERAGAM SEKOLAH)
         ========================================================================= */}
      {selectedOrderReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in space-y-4">
            {/* Header Tiket */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0F2C59] text-white flex items-center justify-center shadow-xs">
                  <Receipt size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                    Bukti Pengambilan Seragam
                  </h3>
                  <p className="text-xs text-slate-500">Kanvas PENABUR • Koperasi Sekolah</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderReceipt(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Kode Pesanan Utama (Besar & Kontras untuk PIC) */}
            <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-2xl p-4 text-white text-center shadow-md space-y-1">
              <span className="text-xs font-bold tracking-widest text-blue-200 uppercase">
                Kode Pesanan Verifikasi PIC
              </span>
              <div className="text-2xl font-black tracking-wider text-amber-400 font-mono py-1 select-all">
                {selectedOrderReceipt.id || selectedOrderReceipt.order_number}
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                ✓ Pesanan Sah Terverifikasi
              </span>
            </div>

            {/* Identitas Siswa & Wali Murid */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 text-xs">Nama Siswa:</span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedOrderReceipt.student_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400 text-[11px]">Sekolah:</span>
                <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">
                  {selectedOrderReceipt.school_name}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400 text-[11px]">Kelas:</span>
                <span className="font-bold text-slate-800">{selectedOrderReceipt.student_class || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400 text-[11px]">Wali Murid:</span>
                <span className="font-bold text-slate-800">{selectedOrderReceipt.parent_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[11px]">No. WhatsApp:</span>
                <span className="font-bold text-slate-800">{selectedOrderReceipt.parent_phone || '-'}</span>
              </div>
            </div>

            {/* Tabel Rincian Jenis Seragam & Ukuran */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Package size={13} className="text-blue-900" />
                Daftar Seragam yang Diterima Siswa:
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {(selectedOrderReceipt.items || []).map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-slate-800 text-[11px] block">{it.name}</span>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-bold mr-1.5">
                        Size: {it.size}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Qty: {it.quantity} potong
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      Rp{(it.price * it.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 px-1 text-xs font-black text-slate-900">
                <span>Total Nilai Pesanan:</span>
                <span className="text-blue-900 text-sm">
                  Rp{selectedOrderReceipt.total_amount?.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Petunjuk Resmi PIC Seragam */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1 text-[11px]">
                <AlertCircle size={13} className="text-amber-700" />
                Catatan Petugas / PIC Seragam Sekolah:
              </p>
              <p className="text-[10px] leading-relaxed text-amber-800">
                Harap memeriksa kode pesanan di atas dan mencocokkan nama siswa serta jenis & ukuran seragam sebelum menyerahkan paket kepada orang tua siswa.
              </p>
            </div>

            {/* Tombol Tutup */}
            <button
              onClick={() => setSelectedOrderReceipt(null)}
              className="w-full py-3 bg-[#0F2C59] text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-md"
            >
              Tutup Bukti Pengambilan
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: KONFIRMASI FINAL SEBELUM NOTIFIKASI AKSARA & SIMPAN PESANAN
         ========================================================================= */}
      {showFinalConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md sm:max-w-lg animate-fade-in text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <AlertCircle size={32} />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Konfirmasi Pemesanan & Pembayaran
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 mt-2 font-semibold leading-relaxed">
                Apakah Anda sudah menyelesaikan semua proses pemesanan dan pembayaran?
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Setelah klik <strong>Ya</strong>, pesanan resmi tercatat dan notifikasi verifikasi akan dikirimkan langsung ke PIC {currentSchoolName} di sistem Aksara.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isSubmittingOrder}
                onClick={handleFinalConfirmOrder}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
              >
                <CheckCircle2 size={18} />
                <span>{isSubmittingOrder ? 'Memproses Pesanan...' : 'Ya, Selesaikan Pemesanan'}</span>
              </button>

              <button
                type="button"
                disabled={isSubmittingOrder}
                onClick={() => setShowFinalConfirmModal(false)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-bold transition-all"
              >
                Tidak, Periksa Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PANDUAN PEMESANAN SPOTLIGHT CUTOUT TERBIMBING (4 TITIK EMAS PRESISI DENGAN PANAH PENUNJUK)
         ========================================================================= */}
      {interactiveGuideStep && interactiveGuideStep !== 'step_4_waiting' && (
        <>
          {/* Spotlight Cutout Overlay (Dark backdrop 80% dengan transparent cutout & border emas bercahaya) */}
          {spotlightRect && (
            <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden transition-all duration-300">
              <div
                style={{
                  top: `${spotlightRect.top}px`,
                  left: `${spotlightRect.left}px`,
                  width: `${spotlightRect.width}px`,
                  height: `${spotlightRect.height}px`,
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.80)',
                }}
                className={`absolute pointer-events-none transition-all duration-300 ${spotlightRect.shape === 'circle' ? 'rounded-full' : 'rounded-3xl'
                  } ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)]`}
              >
                {/* Ping glow highlight */}
                <div
                  className={`w-full h-full animate-ping opacity-25 border-2 border-amber-300 ${spotlightRect.shape === 'circle' ? 'rounded-full' : 'rounded-3xl'
                    }`}
                />
              </div>
            </div>
          )}

          {/* Fallback Backdrop saat elemen target sedang dimuat / dihitung */}
          {!spotlightRect && (
            <div
              onClick={dismissInteractiveGuide}
              className="fixed inset-0 z-[55] bg-slate-950/70 backdrop-blur-2xs transition-opacity"
            />
          )}

          {/* Langkah 1: Di Katalog (Sorot Seragam Pertama) */}
          {interactiveGuideStep === 'step_1_catalog' && activeTab === 'store' && checkoutStep === 'browsing' && !activeProductModal && (
            <div className="fixed bottom-20 left-4 right-4 z-[56] flex justify-center pointer-events-auto animate-fade-in">
              <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400 max-w-sm w-full space-y-2 relative animate-scale-up">
                {/* Panah Penunjuk ke Atas (Menunjuk langsung ke kartu seragam pertama) */}
                <div className="absolute -top-3 left-1/4 sm:left-1/3 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-amber-400 animate-bounce" />

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" />
                    Panduan 1/4: Pilih Seragam
                  </span>
                  <button onClick={dismissInteractiveGuide} className="text-[11px] text-slate-400 hover:text-white font-bold">
                    Lewati
                  </button>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-slate-100">
                  Silakan pilih seragam yang ingin Anda pesan.
                </p>
                <div className="flex items-center gap-1.5 text-[10.5px] text-amber-300 font-medium">
                  <ArrowUp size={14} className="animate-bounce shrink-0" />
                  <span>Ketuk kartu seragam di atas untuk melihat detail dan memilih ukuran</span>
                </div>
              </div>
            </div>
          )}

          {/* Langkah 2: Di Modal Produk (Sorot Ukuran & Tombol Tambah ke Keranjang) */}
          {interactiveGuideStep === 'step_2_modal' && activeProductModal && (
            <div className="fixed top-12 sm:top-16 left-4 right-4 z-[58] flex justify-center pointer-events-auto animate-fade-in">
              <div className="bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border-2 border-amber-400 max-w-sm w-full space-y-1.5 relative animate-scale-up">
                {/* Panah Penunjuk ke Bawah (Menunjuk langsung ke tombol ukuran dan keranjang) */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-amber-400 animate-bounce" />

                <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" />
                    Panduan 2/4: Ukuran & Keranjang
                  </span>
                  <button onClick={dismissInteractiveGuide} className="text-[11px] text-slate-400 hover:text-white font-bold">
                    Lewati
                  </button>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-slate-100">
                  Pilih ukuran seragam yang sesuai, lalu ketuk tombol <strong className="text-amber-300">Tambah ke Keranjang</strong>.
                </p>
                <div className="flex items-center gap-1.5 text-[10.5px] text-amber-300 font-medium pt-0.5">
                  <ArrowDown size={14} className="animate-bounce shrink-0" />
                  <span>Pilih ukuran (SS/S/M/L/XL) lalu tekan tombol di bawah</span>
                </div>
              </div>
            </div>
          )}

          {/* Langkah 3: Sorot Ikon Keranjang di Header Kanan Atas */}
          {interactiveGuideStep === 'step_3_cart' && activeTab === 'store' && (
            <div className="fixed top-16 right-3 sm:right-6 z-[56] max-w-xs w-72 pointer-events-auto animate-scale-up">
              <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400 space-y-2 relative">
                {/* Panah Penunjuk ke Atas (Menunjuk langsung ke ikon keranjang kuning) */}
                <div className="absolute -top-3 right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-amber-400 animate-bounce" />

                <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <ShoppingBag size={13} className="text-amber-400" />
                    Panduan 3/4: Buka Keranjang
                  </span>
                  <button onClick={dismissInteractiveGuide} className="text-[11px] text-slate-400 hover:text-white font-bold">
                    Lewati
                  </button>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-slate-100">
                  Seragam berhasil masuk ke keranjang! Anda dapat memilih seragam lain atau langsung membuka keranjang.
                </p>
                <button
                  onClick={() => {
                    setCheckoutStep('cart');
                    setInteractiveGuideStep('step_4_waiting');
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <span>Buka Keranjang Sekarang</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Langkah 4: Di Halaman Instruksi Pembayaran (Sorot Rekening Resmi & Nominal) */}
          {interactiveGuideStep === 'step_4_payment' && checkoutStep === 'payment_instruction' && (
            <div className="fixed bottom-20 left-4 right-4 z-[56] flex justify-center pointer-events-auto animate-fade-in">
              <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400 max-w-sm w-full space-y-2.5 relative animate-scale-up">
                {/* Panah Penunjuk ke Atas (Menunjuk langsung ke kartu rekening resmi sekolah) */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-amber-400 animate-bounce" />

                <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" />
                    Panduan 4/4: Salin Rekening & Nominal
                  </span>
                  <button onClick={dismissInteractiveGuide} className="text-[11px] text-slate-400 hover:text-white font-bold">
                    Tutup
                  </button>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-slate-100">
                  Salin <strong className="text-amber-300">No. Rekening</strong> resmi sekolah dan <strong className="text-amber-300">Total Nominal</strong> (termasuk kode unik). Selesaikan transfer via M-Banking/ATM, lalu lanjutkan upload bukti transfer.
                </p>
                <button
                  onClick={dismissInteractiveGuide}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-105 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Check size={14} className="stroke-[3]" />
                  <span>Paham & Selesaikan Panduan</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          GLOBAL BOTTOM NAVIGATION BAR (Mobile Bottom Bar)
         ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around py-3 shadow-lg w-full sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto md:rounded-b-[36px]">
        <button
          onClick={() => {
            setActiveTab('store');
            setCheckoutStep('browsing');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'store' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
        >
          <Home size={22} />
          <span className="text-xs font-semibold">Katalog</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('orders');
            setCheckoutStep('browsing');
            fetchLiveParentOrders();
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'orders' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
        >
          <Clock size={22} />
          <span className="text-xs font-semibold">Pesanan Saya</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('profile');
            setCheckoutStep('browsing');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
        >
          <User size={22} />
          <span className="text-xs font-semibold">Profil</span>
        </button>
      </nav>
    </div>
  );
}

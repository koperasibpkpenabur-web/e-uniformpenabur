'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { getAssetPath } from '../../lib/utils';
import { DEFAULT_SCHOOL_WHITELIST } from '../../lib/schools';
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
  Share2,
  Download,
  Building,
  Phone,
  ArrowRight,
  Check,
  X,
  CreditCard,
  Truck,
  RotateCcw,
  Sparkles,
  LogOut
} from 'lucide-react';

// Urutan ukuran standar seragam sekolah
const SIZE_ORDER = ['SS', 'S', 'M', 'L', 'XL', '2L', '3L', '4L', '5L', '6L', '7L', '8L', '9L', '10L', 'STANDAR', 'ALL SIZE'];

const sortSizes = (sizes) => {
  return [...sizes].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.toUpperCase());
    const indexB = SIZE_ORDER.indexOf(b.toUpperCase());
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
};

// Daftar referensi sekolah BPK PENABUR dari whitelist
const PENABUR_SCHOOLS = DEFAULT_SCHOOL_WHITELIST;

// Fallback Katalog Seragam Resmi BPK PENABUR (jika data Supabase belum disinkronkan)
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-sd-kemeja-pendek',
    name: 'Kemeja Putih Pendek SD',
    category: 'Nasional',
    level: 'SD',
    description: 'Bahan TC Oxford kualitas prima, adem, jahitan kuat dengan bordir logo PENABUR resmi.',
    imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format&fit=crop&q=60',
    variants: [
      { size: 'SS', price: 78000, stock: 45 },
      { size: 'S', price: 80000, stock: 60 },
      { size: 'M', price: 82000, stock: 75 },
      { size: 'L', price: 85000, stock: 80 },
      { size: 'XL', price: 88000, stock: 50 },
      { size: '3L', price: 92000, stock: 25 },
      { size: '4L', price: 96000, stock: 15 }
    ]
  },
  {
    id: 'prod-sd-celana-merah',
    name: 'Celana Pendek Merah SD',
    category: 'Nasional',
    level: 'SD',
    description: 'Bahan Drill premium tahan luntur, dilengkapi karet pinggang samping fleksibel.',
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&auto=format&fit=crop&q=60',
    variants: [
      { size: 'SS', price: 85000, stock: 35 },
      { size: 'S', price: 88000, stock: 50 },
      { size: 'M', price: 90000, stock: 65 },
      { size: 'L', price: 93000, stock: 70 },
      { size: 'XL', price: 96000, stock: 40 },
      { size: '3L', price: 102000, stock: 20 }
    ]
  },
  {
    id: 'prod-sd-rok-merah',
    name: 'Rok Rempel Merah SD',
    category: 'Nasional',
    level: 'SD',
    description: 'Bahan Famatex awet dan rapi, lipitan plisket tahan cuci berulang.',
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&auto=format&fit=crop&q=60',
    variants: [
      { size: 'SS', price: 90000, stock: 30 },
      { size: 'S', price: 92000, stock: 45 },
      { size: 'M', price: 95000, stock: 60 },
      { size: 'L', price: 98000, stock: 65 },
      { size: 'XL', price: 102000, stock: 35 },
      { size: '3L', price: 108000, stock: 15 }
    ]
  },
  {
    id: 'prod-batik-penabur',
    name: 'Kemeja Batik Resmi PENABUR',
    category: 'Batik',
    level: 'ALL',
    description: 'Batik motif khas BPK PENABUR, bahan katun primisima sejuk dan nyaman dipakai sepanjang hari.',
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop&q=60',
    variants: [
      { size: 'S', price: 98000, stock: 40 },
      { size: 'M', price: 102000, stock: 55 },
      { size: 'L', price: 105000, stock: 60 },
      { size: 'XL', price: 109000, stock: 30 },
      { size: '3L', price: 115000, stock: 20 }
    ]
  },
  {
    id: 'prod-pramuka-siaga',
    name: 'Setelan Seragam Pramuka',
    category: 'Pramuka',
    level: 'ALL',
    description: 'Standar Kwartir Nasional & BPK PENABUR, bahan tebal tidak mudah sobek.',
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=60',
    variants: [
      { size: 'S', price: 95000, stock: 35 },
      { size: 'M', price: 98000, stock: 45 },
      { size: 'L', price: 102000, stock: 50 },
      { size: 'XL', price: 106000, stock: 25 }
    ]
  },
  {
    id: 'prod-olahraga-set',
    name: 'Setelan Kaos & Celana Olahraga',
    category: 'Olahraga',
    level: 'ALL',
    description: 'Bahan dry-fit pori mikro cepat serap keringat, celana training elastis dengan kantong samping.',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60',
    variants: [
      { size: 'S', price: 115000, stock: 30 },
      { size: 'M', price: 120000, stock: 40 },
      { size: 'L', price: 125000, stock: 45 },
      { size: 'XL', price: 130000, stock: 20 }
    ]
  },
  {
    id: 'prod-aksesoris-dasi-topi',
    name: 'Paket Aksesoris (Dasi + Topi + Kaos Kaki)',
    category: 'Aksesoris',
    level: 'ALL',
    description: 'Dasi bordir logo PENABUR, topi berstandar resmi, dan 2 pasang kaos kaki putih PENABUR.',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&auto=format&fit=crop&q=60',
    variants: [
      { size: 'ALL SIZE', price: 55000, stock: 120 }
    ]
  }
];

export default function MobileStorefront() {
  const router = useRouter();

  // Navigation Tabs: 'store' | 'orders' | 'profile'
  const [activeTab, setActiveTab] = useState('store');

  // Checkout flow state: 'browsing' | 'cart' | 'checkout' | 'success'
  const [checkoutStep, setCheckoutStep] = useState('browsing');

  // Filter States
  const [selectedSchool, setSelectedSchool] = useState('SDK 1 PENABUR Jakarta');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Data Products & Raw Supabase Products
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Cart: Array of { id, productId, name, size, price, quantity, imageUrl }
  const [cart, setCart] = useState([]);
  const [addedNotice, setAddedNotice] = useState(null);

  // Modal Detail & Size Selector
  const [activeProductModal, setActiveProductModal] = useState(null);
  const [modalSelectedSize, setModalSelectedSize] = useState('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // User & Student Information for Order
  const [parentProfile, setParentProfile] = useState({
    fullName: 'Orang Tua Murid',
    phone: '',
  });

  const [studentForm, setStudentForm] = useState({
    name: '',
    school: 'SDK 1 PENABUR Jakarta',
    level: 'SD',
    grade: 'Kelas 1',
  });

  const [deliveryMethod, setDeliveryMethod] = useState('koperasi'); // 'koperasi' | 'rumah'
  const [homeAddress, setHomeAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [myOrders, setMyOrders] = useState([]);

  // Load User Session & Initial Products
  useEffect(() => {
    // 1. Load Parent Session from localStorage or Supabase
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kanvas_parent_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          setParentProfile(parsed);
          if (parsed.studentName) {
            setStudentForm({
              name: parsed.studentName,
              school: parsed.schoolName || 'SDK 1 PENABUR Jakarta',
              level: parsed.schoolLevel || 'SD',
              grade: parsed.studentClass || 'Kelas 1',
            });
          }
          if (parsed.schoolName) {
            setSelectedSchool(parsed.schoolName);
          }
          if (parsed.schoolLevel) {
            setSelectedLevel(parsed.schoolLevel);
          }
        }
        const storedOrders = localStorage.getItem('kanvas_my_orders');
        if (storedOrders) {
          setMyOrders(JSON.parse(storedOrders));
        }
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    }

    // 2. Fetch live products from Supabase
    const fetchSupabaseProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');

        if (data && data.length > 0) {
          // Kelompokkan SKU produk menjadi format produk bervarian
          const groupedMap = new Map();

          data.forEach((item) => {
            // Abaikan jika ditandai non-aktif di Kanvas
            if (item.is_kanvas_active === false) return;

            const groupKey = item.variant_group || item.name;
            const price = Number(item.price_student || item.price || 0);

            if (!groupedMap.has(groupKey)) {
              groupedMap.set(groupKey, {
                id: item.id,
                name: item.name,
                category: item.category || 'Nasional',
                level: item.level || 'ALL',
                description: item.description || 'Seragam berstandar resmi Koperasi BPK PENABUR.',
                imageUrl: item.image_url || 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format&fit=crop&q=60',
                variants: [],
              });
            }

            const current = groupedMap.get(groupKey);
            current.variants.push({
              size: item.size || 'STANDAR',
              price: price,
              stock: item.stock || 50,
              skuId: item.id,
            });
          });

          const formattedList = Array.from(groupedMap.values()).map((p) => ({
            ...p,
            variants: p.variants.sort((a, b) => {
              const idxA = SIZE_ORDER.indexOf(a.size.toUpperCase());
              const idxB = SIZE_ORDER.indexOf(b.size.toUpperCase());
              return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
            }),
          }));

          if (formattedList.length > 0) {
            setProducts(formattedList);
          }
        }
      } catch (err) {
        console.warn('Menggunakan katalog bawaan:', err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchSupabaseProducts();
  }, []);

  // Update selected level when school changes
  const handleSchoolChange = (schoolName) => {
    setSelectedSchool(schoolName);
    setStudentForm((prev) => ({ ...prev, school: schoolName }));
    const found = PENABUR_SCHOOLS.find((s) => s.name === schoolName);
    if (found && selectedLevel === 'ALL') {
      setSelectedLevel(found.level);
    }
  };

  // Filter products by Level, Category, and Search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchLevel = selectedLevel === 'ALL' || p.level === 'ALL' || p.level === selectedLevel;
      const matchCat = selectedCategory === 'Semua' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLevel && matchCat && matchSearch;
    });
  }, [products, selectedLevel, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const uniqueVerificationCode = 142;
  const shippingFee = deliveryMethod === 'rumah' ? 18000 : 0;
  const finalTotalAmount = cartSubtotal + (cart.length > 0 ? uniqueVerificationCode + shippingFee : 0);

  // Cart actions
  const addToCart = (product, size) => {
    const variant = product.variants.find((v) => v.size === size) || product.variants[0];
    const cartItemId = `${product.id}-${variant.size}`;

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
          },
        ];
      }
    });

    setAddedNotice(`+1 ${product.name} (${variant.size})`);
    setTimeout(() => setAddedNotice(null), 2500);
    setActiveProductModal(null);
  };

  const updateCartQuantity = (cartItemId, delta) => {
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

  // Submit Order to Supabase & Local History
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!studentForm.name.trim()) {
      alert('Mohon isi nama lengkap siswa.');
      return;
    }

    setIsSubmittingOrder(true);
    const orderNumber = `KNP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderRecord = {
      id: orderNumber,
      order_number: orderNumber,
      school_name: selectedSchool,
      student_name: studentForm.name,
      student_class: studentForm.grade,
      parent_name: parentProfile.fullName || 'Wali Murid',
      parent_phone: parentProfile.phone || '-',
      total_amount: finalTotalAmount,
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'rumah' ? homeAddress : 'Ambil di Koperasi Sekolah',
      status: 'submitted',
      academic_year: '2026/2027',
      created_at: new Date().toISOString(),
      items: cart,
    };

    // 1. Coba simpan ke Supabase `parent_orders`
    try {
      await supabase.from('parent_orders').insert([
        {
          id: orderNumber,
          school_name: selectedSchool,
          student_name: studentForm.name,
          student_class: studentForm.grade,
          parent_name: parentProfile.fullName,
          parent_phone: parentProfile.phone,
          total_amount: finalTotalAmount,
          status: 'submitted',
          academic_year: '2026/2027',
        },
      ]);

      // Insert items
      const itemsPayload = cart.map((item) => ({
        parent_order_id: orderNumber,
        product_id: item.productId,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price_student: item.price,
        subtotal: item.price * item.quantity,
      }));
      await supabase.from('parent_order_items').insert(itemsPayload);
    } catch (err) {
      console.warn('Supabase insert catatan:', err);
    }

    // 2. Simpan ke local state & localStorage agar selalu tampil di riwayat
    const updatedHistory = [orderRecord, ...myOrders];
    setMyOrders(updatedHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kanvas_my_orders', JSON.stringify(updatedHistory));
    }

    setCompletedOrder(orderRecord);
    setCart([]);
    setIsSubmittingOrder(false);
    setCheckoutStep('success');
  };

  const handleSignOut = async () => {
    if (confirm('Keluar dari sesi pemesanan?')) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kanvas_parent_session');
      }
      router.push('/');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-800 select-none pb-20">
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
              <span className="font-black text-sm tracking-wide block leading-none text-white">
                KANVAS PENABUR
              </span>
              <span className="text-[10px] text-amber-300 font-semibold leading-tight">
                Storefront Seragam Siswa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Size Guide Button */}
            <button
              onClick={() => setIsSizeGuideOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <Ruler size={13} className="text-amber-400" />
              <span>Ukuran</span>
            </button>

            {/* Cart Icon with badge */}
            <button
              onClick={() => setCheckoutStep('cart')}
              className="relative p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 transition-all font-bold"
            >
              <ShoppingBag size={17} />
              {cartTotalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0F2C59] animate-pulse">
                  {cartTotalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Selected School Pill & Dropdown (Hanya tampil di tab store) */}
        {activeTab === 'store' && checkoutStep === 'browsing' && (
          <div className="px-4 pb-3 pt-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15 flex items-center gap-2">
              <School size={16} className="text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-blue-200 block font-semibold leading-none">
                  Cabang Sekolah Pilihan:
                </span>
                <select
                  value={selectedSchool}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  className="w-full bg-transparent text-white text-xs font-bold outline-none cursor-pointer truncate mt-0.5"
                >
                  {PENABUR_SCHOOLS.map((sch) => (
                    <option key={sch.id} value={sch.name} className="text-slate-900">
                      {sch.name} ({sch.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Floating Alert: Added to Cart Notice */}
      {addedNotice && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold border border-amber-400/30 animate-fade-in backdrop-blur-md">
          <CheckCircle2 size={16} className="text-amber-400" />
          <span>{addedNotice}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: STORE / KATALOG SERAGAM
         ========================================================================= */}
      {activeTab === 'store' && checkoutStep === 'browsing' && (
        <div className="flex-1 flex flex-col p-4 space-y-4 animate-fade-in">
          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kemeja, celana, rok, batik, pramuka..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Level Tabs (TK, SD, SMP, SMA, ALL) */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'ALL', label: 'Semua Jenjang' },
              { id: 'TK', label: 'TK' },
              { id: 'SD', label: 'SD' },
              { id: 'SMP', label: 'SMP' },
              { id: 'SMA', label: 'SMA/K' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedLevel === lvl.id
                    ? 'bg-[#0F2C59] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Category Chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {['Semua', 'Nasional', 'Batik', 'Pramuka', 'Olahraga', 'Aksesoris'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
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

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 my-4 shadow-sm">
                <ShoppingBag size={36} className="mx-auto text-slate-300 mb-2" />
                <h3 className="font-bold text-sm text-slate-700">Seragam Tidak Ditemukan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Coba ganti kata kunci atau pilih jenjang yang lain.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const lowestPrice = Math.min(...product.variants.map((v) => v.price));
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        setActiveProductModal(product);
                        setModalSelectedSize(product.variants[0]?.size || 'STANDAR');
                      }}
                      className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col group relative"
                    >
                      {/* Image Frame */}
                      <div className="w-full aspect-square rounded-xl bg-slate-50 overflow-hidden mb-2 relative flex items-center justify-center p-2">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/75 backdrop-blur-sm text-[9px] font-bold text-white uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>

                      {/* Content */}
                      <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 min-h-[32px]">
                        {product.name}
                      </h4>

                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-[10px] text-slate-400">Mulai</span>
                        <span className="text-xs font-black text-blue-900">
                          Rp{lowestPrice.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Size Tags preview */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {product.variants.length} Ukuran
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProductModal(product);
                            setModalSelectedSize(product.variants[0]?.size || 'STANDAR');
                          }}
                          className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm font-bold active:scale-90 transition-all"
                        >
                          <Plus size={14} />
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
          CHECKOUT STEP: CART REVIEW
         ========================================================================= */}
      {checkoutStep === 'cart' && (
        <div className="flex-1 flex flex-col p-4 animate-fade-in">
          {/* Header */}
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
              {/* Item List */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-50 shrink-0 border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold">
                          Size {item.size}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">
                          Rp{item.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Selector */}
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

              {/* Order Summary Box */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2 text-xs">
                <span className="font-bold text-slate-800 block text-xs mb-1">
                  Ringkasan Belanja
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Seragam</span>
                  <span className="font-semibold">Rp{cartSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kode Verifikasi Unik</span>
                  <span className="font-bold text-amber-600">+{uniqueVerificationCode}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="font-black text-slate-900">Total Pembayaran</span>
                  <span className="font-black text-blue-900 text-base">
                    Rp{finalTotalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Proceed Button */}
              <button
                onClick={() => setCheckoutStep('checkout')}
                className="w-full py-3.5 bg-gradient-to-r from-[#0F2C59] to-[#1E3A8A] text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <span>Lanjut Isi Data Siswa & Pengambilan</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CHECKOUT STEP: DATA SISWA & METODE PENGAMBILAN
         ========================================================================= */}
      {checkoutStep === 'checkout' && (
        <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col p-4 animate-fade-in space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setCheckoutStep('cart')}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-black text-base text-slate-900">Data Siswa & Pengambilan</h2>
          </div>

          {/* Form Data Siswa */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <User size={15} className="text-blue-700" />
              <span>Data Siswa Pemesan</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Kelas / Tingkat
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1A / Kelas 7"
                  value={studentForm.grade}
                  onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Sekolah PENABUR
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedSchool}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 truncate"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                required
                value={parentProfile.fullName}
                onChange={(e) => setParentProfile({ ...parentProfile, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Metode Pengambilan */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <span className="block text-xs font-bold text-slate-900">
              Pilih Cara Pengambilan Seragam
            </span>

            <div
              onClick={() => setDeliveryMethod('koperasi')}
              className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                deliveryMethod === 'koperasi'
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
              className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                deliveryMethod === 'rumah'
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
                    Ekspedisi resmi Jabodetabek (+Rp18.000)
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

          {/* Rekening Transfer Resmi */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
            <span className="block text-xs font-bold text-slate-900">
              Instruksi Transfer Resmi
            </span>
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-white font-black text-blue-900 flex items-center justify-center text-xs shadow-xs border border-blue-100">
                BCA
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-slate-500 block leading-none">
                  Koperasi Konsumen Karyawan BPK Penabur
                </span>
                <span className="text-xs font-black tracking-wider text-slate-900">
                  0760256757
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Verifikasi otomatis sesuai nominal tepat Rp{finalTotalAmount.toLocaleString('id-ID')}.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmittingOrder}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <CheckCircle2 size={16} />
            <span>{isSubmittingOrder ? 'Memproses Pesanan...' : 'Konfirmasi & Kirim Pesanan'}</span>
          </button>
        </form>
      )}

      {/* =========================================================================
          CHECKOUT STEP: SUCCESS RECEIPT
         ========================================================================= */}
      {checkoutStep === 'success' && completedOrder && (
        <div className="flex-1 flex flex-col p-4 animate-fade-in space-y-4">
          {/* Success Banner */}
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

          {/* Receipt Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Nama Siswa</span>
              <span className="font-bold text-slate-800">{completedOrder.student_name}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Sekolah</span>
              <span className="font-bold text-slate-800 text-right">{completedOrder.school_name}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Metode Pengambilan</span>
              <span className="font-bold text-slate-800 capitalize">
                {completedOrder.delivery_method === 'koperasi' ? 'Koperasi Sekolah' : 'Kirim Rumah'}
              </span>
            </div>

            {/* List of items */}
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

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                alert(`Kwitansi pesanan ${completedOrder.id} tersimpan di menu Pesanan Saya.`);
                setCheckoutStep('browsing');
              }}
              className="w-full py-3 bg-[#0F2C59] text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-md"
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
            <h2 className="font-black text-base text-slate-900">Riwayat Pesanan Seragam</h2>
            <span className="text-xs text-slate-400 font-semibold">{myOrders.length} Pesanan</span>
          </div>

          {myOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Clock size={36} className="text-slate-300 mb-2" />
              <h3 className="font-bold text-sm text-slate-700">Belum Ada Riwayat Pesanan</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Pesanan yang Anda buat akan tersimpan di sini dan dapat dipantau statusnya.
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
            <div className="space-y-3">
              {myOrders.map((ord, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 tracking-wide">
                      {ord.id || ord.order_number}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] uppercase">
                      Menunggu Verifikasi
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800 block">{ord.student_name}</span>
                    <span className="text-[11px] text-slate-400">{ord.school_name}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Total Tagihan</span>
                    <span className="text-xs font-black text-slate-900">
                      Rp{ord.total_amount?.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: PROFIL & BANTUAN
         ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="flex-1 flex flex-col p-4 animate-fade-in space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="font-black text-base text-slate-900">Profil Wali Murid</h2>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F2C59] to-[#1E3A8A] text-white flex items-center justify-center font-black text-xl shadow-md">
              {parentProfile.fullName?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-slate-900 truncate">
                {parentProfile.fullName || 'Wali Murid PENABUR'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{parentProfile.phone || '0812-xxxx-xxxx'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold">
                Terverifikasi Kanvas
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Informasi & Bantuan</span>

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
            <span>Keluar dari Aplikasi</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          MODAL: SIZE SELECTOR & BOTTOM SHEET
         ========================================================================= */}
      {activeProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-[32px] p-5 shadow-2xl border-t border-slate-200 max-h-[85vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={activeProductModal.imageUrl}
                  alt={activeProductModal.name}
                  className="w-16 h-16 rounded-2xl object-cover bg-slate-50 border border-slate-100"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {activeProductModal.name}
                  </h3>
                  <span className="text-sm font-black text-blue-900 mt-1 block">
                    Rp
                    {(
                      activeProductModal.variants.find((v) => v.size === modalSelectedSize)?.price ||
                      activeProductModal.variants[0]?.price ||
                      0
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveProductModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500 my-3 leading-relaxed">
              {activeProductModal.description}
            </p>

            {/* Size Selector */}
            <div className="my-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Pilih Ukuran:</span>
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[11px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                >
                  <Ruler size={13} /> Panduan Ukuran
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeProductModal.variants.map((v) => (
                  <button
                    key={v.size}
                    onClick={() => setModalSelectedSize(v.size)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                      modalSelectedSize === v.size
                        ? 'border-blue-900 bg-blue-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to Cart CTA */}
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setActiveProductModal(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={() => addToCart(activeProductModal, modalSelectedSize)}
                className="flex-[2] py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 hover:brightness-105 flex items-center justify-center gap-2"
              >
                <ShoppingBag size={15} />
                <span>Tambah ke Keranjang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SIZE GUIDE POP-UP (Panduan Ukuran BPK PENABUR)
         ========================================================================= */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 w-full max-w-sm max-h-[85vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Ruler size={18} className="text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">Panduan Ukuran Resmi</h3>
              </div>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Standar konveksi seragam BPK PENABUR (dalam centimeter):
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs mb-3">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Size</th>
                    <th className="p-2">Lingkar Dada</th>
                    <th className="p-2">Panjang</th>
                    <th className="p-2">Estimasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  <tr><td className="p-2 font-bold text-blue-900">SS</td><td className="p-2">80 cm</td><td className="p-2">56 cm</td><td className="p-2">TK - SD 1</td></tr>
                  <tr><td className="p-2 font-bold text-blue-900">S</td><td className="p-2">86 cm</td><td className="p-2">60 cm</td><td className="p-2">SD 1 - 2</td></tr>
                  <tr><td className="p-2 font-bold text-blue-900">M</td><td className="p-2">92 cm</td><td className="p-2">64 cm</td><td className="p-2">SD 3 - 4</td></tr>
                  <tr><td className="p-2 font-bold text-blue-900">L</td><td className="p-2">98 cm</td><td className="p-2">68 cm</td><td className="p-2">SD 5 - SMP</td></tr>
                  <tr><td className="p-2 font-bold text-blue-900">XL</td><td className="p-2">104 cm</td><td className="p-2">72 cm</td><td className="p-2">SMP - SMA</td></tr>
                  <tr><td className="p-2 font-bold text-blue-900">3L</td><td className="p-2">110 cm</td><td className="p-2">76 cm</td><td className="p-2">Jumbo</td></tr>
                  <tr><td className="p-2 font-bold text-blue-900">4L-6L</td><td className="p-2">116-128 cm</td><td className="p-2">80 cm</td><td className="p-2">Ekstra Jumbo</td></tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
              💡 <strong>Tips Memilih:</strong> Jika ragu di antara dua ukuran, disarankan memilih <strong>1 ukuran lebih besar</strong> untuk mengantisipasi pertumbuhan anak selama 1 tahun ajaran.
            </div>

            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="w-full mt-4 py-2.5 bg-[#0F2C59] text-white rounded-xl text-xs font-bold"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          GLOBAL BOTTOM NAVIGATION BAR (Mobile Bottom Bar)
         ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around py-2.5 shadow-lg max-w-[440px] mx-auto md:rounded-b-[32px]">
        <button
          onClick={() => {
            setActiveTab('store');
            setCheckoutStep('browsing');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'store' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px]">Katalog</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('orders');
            setCheckoutStep('browsing');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'orders' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Clock size={20} />
          <span className="text-[10px]">Pesanan Saya</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('profile');
            setCheckoutStep('browsing');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'profile' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <User size={20} />
          <span className="text-[10px]">Profil</span>
        </button>
      </nav>
    </div>
  );
}

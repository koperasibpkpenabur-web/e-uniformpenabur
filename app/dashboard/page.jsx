'use client';
import React, { useState, useEffect } from 'react';
import { User, Home, ShoppingCart, ChevronRight, CheckCircle, ChevronLeft, Upload, Minus, Plus, MapPin, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [parentName, setParentName] = useState('Memuat...');
  const [childrenList, setChildrenList] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [productsList, setProductsList] = useState([
    { id: 1, name: 'PAKET LENGKAP SD', price: 350000, type: 'Paket Lengkap', level: 'SD', img: 'paket' },
    { id: 2, name: 'Seragam Putih Lengan Pendek', price: 95000, type: 'Satuan', level: 'SD', img: 'seragam' },
  ]);

  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('SD');
  const [selectedTab, setSelectedTab] = useState('Paket Lengkap');
  const [deliveryMethod, setDeliveryMethod] = useState('koperasi'); // koperasi | rumah
  const [address, setAddress] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      
      const userId = session.user.id;

      // Ambil nama orang tua
      const { data: parentData } = await supabase
        .from('parents')
        .select('full_name')
        .eq('id', userId)
        .single();
        
      if (parentData) setParentName(parentData.full_name);

      // Ambil data anak
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId);
        
      if (childrenData) {
        setChildrenList(childrenData);
        if (childrenData.length > 0) setSelectedChild(childrenData[0]);
      }
      
      setIsLoadingData(false);
    };
    
    fetchData();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const uniqueCode = 142; // Example 3 digit unique code
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = subtotal + uniqueCode;

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    setCart(newCart);
  };

  const updateSize = (index, size) => {
    const newCart = [...cart];
    newCart[index].size = size;
    setCart(newCart);
  };

  const handleOrderUniform = (child) => {
    setSelectedChild(child);
    setSelectedLevel(child.level);
    setCurrentScreen('products');
  };

  const filteredProducts = productsList.filter(p => p.level === selectedLevel);

  const renderDashboard = () => (
    <div className="min-h-screen flex flex-col relative bg-[#f4f6f8] pb-20 md:pb-0">
      <div className="bg-[#182c4f] pt-12 pb-28 px-6 md:px-12 text-white rounded-b-[2.5rem] md:rounded-b-[4rem]">
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-6">
          <p className="text-sm md:text-base">Halo, {parentName}!</p>
          <button onClick={handleSignOut} title="Keluar" className="w-10 h-10 md:w-12 md:h-12 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-200 transition-colors shadow-md">
            <LogOut size={20} />
          </button>
        </div>
        <h1 className="max-w-5xl mx-auto text-2xl md:text-3xl font-bold">Beranda Orang Tua</h1>
      </div>

      <div className="-mt-20 px-4 md:px-12 relative z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
        <div className="flex-1 overflow-hidden">
          <h3 className="mb-3 text-white px-2 font-bold drop-shadow-md">Anak Saya</h3>
          
          {isLoadingData ? (
            <div className="text-center py-10 bg-white rounded-3xl shadow-xl">Memuat data anak...</div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 px-2 -mx-2 hide-scrollbar">
              {childrenList.map((child) => (
                <div key={child.id} className="snap-center shrink-0 w-[85%] md:w-72 bg-white rounded-3xl p-6 shadow-xl flex flex-col items-center">
                  <div className="w-24 h-24 bg-blue-50 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${child.full_name}`} alt={child.full_name} className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-gray-900 mb-1 font-bold">{child.full_name}</h2>
                  <p className="text-sm text-gray-500 mb-6">{child.level} {child.grade}</p>
                  <button
                    onClick={() => handleOrderUniform(child)}
                    className="w-full bg-[#67a683] text-white py-3.5 rounded-xl font-bold hover:bg-[#5b9576] transition-colors shadow-lg shadow-[#67a683]/30"
                  >
                    Pesan Seragam {child.full_name.split(' ')[0]}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-80 lg:w-96">
          <h3 className="mb-3 text-white px-2 font-bold md:mt-0 mt-2 drop-shadow-md">Riwayat Pesanan</h3>
          <div className="bg-white rounded-3xl p-5 shadow-xl flex justify-between items-center cursor-pointer hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3 bg-[#eef7f2] text-[#67a683] px-4 py-3 rounded-2xl w-full border border-[#d1ebd9]">
              <CheckCircle size={20} />
              <div className="flex-1">
                <span className="font-bold text-[13px] block">ORD-2918 (Budi)</span>
                <span className="text-xs">Menunggu Verifikasi</span>
              </div>
              <ChevronRight size={20} className="text-[#67a683]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="min-h-screen flex flex-col relative bg-[#f4f6f8] pb-32">
      <div className="bg-[#182c4f] pt-12 pb-14 px-4 md:px-12 text-white">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => setCurrentScreen('dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
          <div className="flex-1 text-center md:text-left">
            <h2 className="mb-1 text-lg md:text-2xl font-bold">Katalog Seragam</h2>
            <p className="text-sm md:text-base text-blue-200">{selectedChild.name} • {selectedChild.level} {selectedChild.grade}</p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="bg-[#f4f6f8] flex-1 rounded-t-[2.5rem] -mt-8 pt-8 px-4 md:px-12 w-full relative z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-3xl shadow-md flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="bg-gray-50 rounded-2xl h-40 md:h-48 mb-4 flex items-center justify-center overflow-hidden p-4 relative group">
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-[#182c4f] shadow-sm">
                    {product.type}
                  </div>
                  <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${product.img}`} alt={product.name} className="w-full h-full object-contain mix-blend-multiply opacity-80 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-[13px] md:text-sm leading-snug mb-1 text-gray-900 line-clamp-2 min-h-[40px] font-semibold">{product.name}</h3>
                <p className="font-extrabold text-[#182c4f] mb-5 text-[15px] md:text-base">Rp{product.price.toLocaleString('id-ID')}</p>
                <div className="mt-auto">
                  <button className="w-full bg-[#67a683] text-white text-xs md:text-sm py-3 rounded-xl font-bold hover:bg-[#5b9576] transition-colors shadow-lg shadow-[#67a683]/20 flex items-center justify-center gap-2">
                    <Plus size={16} /> Tambah
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-5 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-center md:text-left text-sm text-gray-600">
            {cart.length} Item di Keranjang | Total: <span className="font-black text-[#182c4f] text-base md:text-xl ml-1">Rp{subtotal.toLocaleString('id-ID')}</span>
          </p>
          <button
            onClick={() => setCurrentScreen('checkout')}
            className="w-full md:w-auto px-8 bg-[#67a683] text-white py-3.5 rounded-xl font-bold hover:bg-[#5b9576] transition-colors shadow-lg shadow-[#67a683]/30"
          >
            Lanjut Checkout
          </button>
        </div>
      </div>
    </div>
  );

  const renderCheckout = () => (
    <div className="min-h-screen flex flex-col relative bg-[#f4f6f8] pb-32">
      <div className="bg-[#182c4f] pt-12 pb-14 px-4 md:px-12 text-white">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => setCurrentScreen('products')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
          <h2 className="flex-1 text-center md:text-left text-lg md:text-2xl font-bold">Keranjang & Checkout</h2>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="bg-[#f4f6f8] flex-1 rounded-t-[2.5rem] -mt-8 pt-8 px-4 md:px-12 w-full relative z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto">

          <h3 className="mb-4 text-gray-800 px-1 font-bold">Daftar Seragam</h3>
          <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm mb-8 divide-y divide-gray-100 border border-gray-100">
            {cart.map((item, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center p-2 shrink-0">
                    <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.img}`} alt={item.name} className="w-full h-full mix-blend-multiply opacity-80" />
                  </div>
                  <div>
                    <p className="font-bold text-[14px] text-gray-900 mb-1">{item.name}</p>
                    <p className="text-sm font-extrabold text-[#182c4f]">Rp{item.price.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 ml-20 md:ml-0">
                  {/* Size Selector */}
                  <select
                    value={item.size}
                    onChange={(e) => updateSize(idx, e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-sm font-bold outline-none focus:border-[#67a683]"
                  >
                    {['S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>Ukuran {s}</option>)}
                  </select>

                  {/* Quantity */}
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-1">
                    <button onClick={() => updateQuantity(idx, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-gray-600 shadow-sm border border-gray-100 hover:text-red-500"><Minus size={14} /></button>
                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-gray-600 shadow-sm border border-gray-100 hover:text-[#67a683]"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mb-4 text-gray-800 px-1 font-bold">Pilih Metode Pengambilan</h3>
          <div className="bg-white rounded-3xl p-5 shadow-sm mb-8 space-y-5 border border-gray-100">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="radio" checked={deliveryMethod === 'koperasi'} onChange={() => setDeliveryMethod('koperasi')} className="peer appearance-none w-6 h-6 rounded-full border-2 border-gray-300 checked:border-[#67a683] transition-colors" />
                <div className="absolute w-3 h-3 rounded-full bg-[#67a683] scale-0 peer-checked:scale-100 transition-transform"></div>
              </div>
              <span className="flex-1 text-[14px] font-semibold text-gray-800">Ambil di Koperasi Sekolah</span>
              <span className="bg-[#eef7f2] border border-[#c1e6ce] text-[#67a683] text-[11px] px-3 py-1 rounded-full font-black uppercase tracking-wide">Gratis</span>
            </label>
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="radio" checked={deliveryMethod === 'rumah'} onChange={() => setDeliveryMethod('rumah')} className="peer appearance-none w-6 h-6 rounded-full border-2 border-gray-300 checked:border-[#67a683] transition-colors" />
                <div className="absolute w-3 h-3 rounded-full bg-[#67a683] scale-0 peer-checked:scale-100 transition-transform"></div>
              </div>
              <span className="flex-1 text-[14px] font-semibold text-gray-800">Kirim ke Alamat Rumah</span>
            </label>

            {deliveryMethod === 'rumah' && (
              <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><MapPin size={16} /> Alamat Lengkap Pengiriman</label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#67a683] focus:bg-white transition-colors"
                  rows="3"
                  placeholder="Nama Jalan, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>

          <h3 className="mb-4 text-gray-800 px-1 font-bold">Metode Pembayaran (Transfer Bank)</h3>
          <div className="bg-white rounded-3xl p-6 shadow-sm mb-8 border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="w-16 h-10 bg-white rounded flex items-center justify-center font-black text-blue-800 italic border border-gray-200">BCA</div>
              <div>
                <p className="text-sm text-gray-500 mb-1">BCA a.n Koperasi BPK PENABUR</p>
                <p className="font-mono text-lg font-bold tracking-widest text-[#182c4f]">821 009 2381</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Subtotal Seragam</span>
                <span>Rp{subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>Kode Unik (Verifikasi Otomatis)</span>
                <span className="text-orange-500 font-bold">+{uniqueCode}</span>
              </div>
              <div className="flex justify-between items-center bg-[#f4f6f8] p-4 rounded-xl">
                <span className="font-bold text-gray-800">Total Harus Dibayar</span>
                <span className="font-black text-2xl text-[#67a683]">Rp{totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <p className="text-xs text-center text-gray-500 mt-3 font-medium">Mohon transfer tepat sampai 3 digit terakhir agar pesanan terverifikasi otomatis.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setCurrentScreen('upload_proof')}
            className="w-full py-4 bg-[#67a683] text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-[#5b9576] transition-all shadow-lg shadow-[#67a683]/30"
          >
            <span className="font-black text-[14px] md:text-[15px] tracking-wide">KONFIRMASI & UPLOAD BUKTI BAYAR</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderUploadProof = () => (
    <div className="min-h-screen flex flex-col relative bg-[#f4f6f8]">
      <div className="bg-[#182c4f] pt-12 pb-14 px-4 md:px-12 text-white">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => setCurrentScreen('checkout')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
          <h2 className="flex-1 text-center md:text-left text-lg md:text-2xl font-bold">Upload Bukti Bayar</h2>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="bg-[#f4f6f8] flex-1 rounded-t-[2.5rem] -mt-8 pt-12 px-4 md:px-12 w-full relative z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto text-center">

          <div className="w-20 h-20 bg-blue-100 text-[#182c4f] rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload size={32} />
          </div>

          <h3 className="text-xl font-black text-gray-900 mb-2">Konfirmasi Pembayaran</h3>
          <p className="text-sm text-gray-500 mb-8 px-4">
            Silakan unggah foto struk transfer atau screenshot m-banking Anda sejumlah <strong className="text-[#67a683]">Rp{totalAmount.toLocaleString('id-ID')}</strong>.
          </p>

          <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-gray-300 hover:border-[#67a683] transition-colors cursor-pointer mb-8 relative">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setProofFile(e.target.files[0])}
            />
            {proofFile ? (
              <div className="text-[#67a683] font-bold flex flex-col items-center">
                <CheckCircle size={32} className="mb-2" />
                {proofFile.name}
              </div>
            ) : (
              <div className="text-gray-400 font-medium">
                <p>Ketuk untuk memilih foto</p>
                <p className="text-xs mt-1">Maks 5MB (JPG, PNG)</p>
              </div>
            )}
          </div>

          <button
            disabled={!proofFile}
            onClick={() => {
              alert('Bukti berhasil diunggah! Menunggu verifikasi admin.');
              setCurrentScreen('dashboard');
            }}
            className="w-full py-4 bg-[#182c4f] text-white rounded-2xl font-black tracking-wide disabled:opacity-50 hover:bg-[#12213b] transition-colors shadow-lg"
          >
            KIRIM BUKTI PEMBAYARAN
          </button>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="min-h-screen flex flex-col relative bg-[#f4f6f8] pb-32">
      <div className="bg-[#182c4f] pt-12 pb-14 px-4 text-white">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentScreen('dashboard')} className="p-2 hover:bg-white/10 rounded-full"><ChevronLeft size={24} /></button>
          <h2 className="text-xl font-bold">Pesanan Saya</h2>
        </div>
      </div>
      <div className="p-6 text-center text-gray-500 mt-4">Belum ada riwayat pesanan.</div>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen flex flex-col relative bg-[#f4f6f8] pb-32">
      <div className="bg-[#182c4f] pt-12 pb-14 px-4 text-white">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentScreen('dashboard')} className="p-2 hover:bg-white/10 rounded-full"><ChevronLeft size={24} /></button>
          <h2 className="text-xl font-bold">Profil & Pengaturan</h2>
        </div>
      </div>
      <div className="p-6 bg-white mx-4 -mt-6 rounded-3xl shadow-sm">
        <h3 className="font-bold mb-4 text-gray-800">Ubah Data Profil</h3>
        <p className="text-sm text-gray-500 mb-6">Untuk mengubah nama orang tua, Anda dapat menghubungi admin koperasi. Saat ini fitur ubah nama dari web sedang dalam tahap pengembangan.</p>
        
        <h3 className="font-bold mb-4 text-gray-800 border-t pt-4">Data Anak</h3>
        <button onClick={() => router.push('/register')} className="w-full bg-[#eef7f2] border border-[#c1e6ce] text-[#67a683] py-3.5 rounded-xl font-bold hover:bg-[#d5eedf] transition-colors flex items-center justify-center gap-2">
          <Plus size={18} /> Tambah Data Anak Baru
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      <div className="w-full min-h-screen bg-[#f4f6f8] font-sans">
        {currentScreen === 'dashboard' && renderDashboard()}
        {currentScreen === 'products' && renderProducts()}
        {currentScreen === 'checkout' && renderCheckout()}
        {currentScreen === 'upload_proof' && renderUploadProof()}
        {currentScreen === 'orders' && renderOrders()}
        {currentScreen === 'profile' && renderProfile()}

        {/* Global Bottom Nav (Only on Dashboard) */}
        {currentScreen === 'dashboard' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 flex justify-around py-4 pb-6 z-30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] md:max-w-md md:mx-auto md:rounded-t-3xl md:bottom-4 md:border">
            <div onClick={() => setCurrentScreen('dashboard')} className={`flex flex-col items-center cursor-pointer group transition-colors ${currentScreen === 'dashboard' ? 'text-[#182c4f]' : 'text-gray-400 hover:text-[#182c4f]'}`}>
              <Home size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] mt-1.5 font-bold">Home</span>
            </div>
            <div onClick={() => setCurrentScreen('orders')} className={`flex flex-col items-center cursor-pointer group transition-colors ${currentScreen === 'orders' ? 'text-[#182c4f]' : 'text-gray-400 hover:text-[#182c4f]'}`}>
              <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] mt-1.5 font-semibold">Pesanan Saya</span>
            </div>
            <div onClick={() => setCurrentScreen('profile')} className={`flex flex-col items-center cursor-pointer group transition-colors ${currentScreen === 'profile' ? 'text-[#182c4f]' : 'text-gray-400 hover:text-[#182c4f]'}`}>
              <User size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] mt-1.5 font-semibold">Profil</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

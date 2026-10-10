'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check auth state when the component mounts or URL hash changes
    const checkUserAndRedirect = async (session) => {
      if (session?.user) {
        setIsLoading(true);
        try {
          const user = session.user;
          
          // 1. Ensure Parent exists in parents table
          const { data: parentData, error: parentError } = await supabase
            .from('parents')
            .select('id')
            .eq('id', user.id)
            .single();

          if (parentError && parentError.code === 'PGRST116') {
            // Parent doesn't exist, create it
            await supabase.from('parents').insert([
              { 
                id: user.id, 
                full_name: user.user_metadata?.full_name || 'Orang Tua' 
              }
            ]);
          }

          // 2. Check if Parent has any children
          const { data: children, error: childrenError } = await supabase
            .from('children')
            .select('id')
            .eq('parent_id', user.id);

          if (!children || children.length === 0) {
            router.push('/register');
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error("Error during authentication flow:", error);
          setIsLoading(false);
        }
      }
    };

    // Initial check in case they are already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserAndRedirect(session);
    });

    // Listen to login events (like when redirecting back from Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUserAndRedirect(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/register` : undefined
      }
    });
  };

  return (
    <div className="h-[100dvh] bg-[#182c4f] flex flex-col md:flex-row md:items-center relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute top-[20%] left-[-10%] w-64 h-64 bg-[#67a683] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      {/* Top Section */}
      <div className="flex-[1.2] md:flex-1 pt-12 md:pt-0 px-8 flex flex-col justify-center max-w-md mx-auto md:ml-[10%] w-full z-10">
        <div className="flex items-center gap-2 mb-6 text-white opacity-90">
          <ShieldCheck size={28} className="text-[#67a683]" />
          <span className="font-bold text-lg tracking-widest uppercase">E-Unibook Penabur</span>
        </div>
        
        <h1 className="text-3xl md:text-5xl text-white font-black mb-3 md:mb-6 leading-tight">
          Selamat Datang,<br />Wali Murid
        </h1>
        <p className="text-blue-200 text-sm md:text-lg max-w-sm mb-4 md:mb-0">
          Silakan masuk untuk mulai memesan seragam sekolah anak Anda dengan mudah dan aman.
        </p>
      </div>

      {/* Bottom Section */}
      <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 pb-8 md:p-10 md:mr-[10%] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] max-w-md mx-auto w-full relative z-20 flex flex-col justify-center">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 md:hidden"></div>
        
        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-[56px] border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="font-bold text-gray-700">Memuat...</span>
          ) : (
            <>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-gray-700">Masuk dengan Akun Google</span>
            </>
          )}
        </button>
        
        <div className="mt-6 text-center text-xs md:text-sm text-gray-500 flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-gray-400 shrink-0" />
          Data Anda diamankan dengan enkripsi standar perbankan
        </div>

        <div className="mt-8 md:mt-10 text-center">
          <a href="https://wa.me/1234567890" target="_blank" rel="noreferrer" className="text-xs md:text-sm font-bold text-[#67a683] hover:text-[#528a6c] transition-colors">
            Butuh Bantuan? Hubungi Admin via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function RegisterChild() {
  const router = useRouter();
  const [level, setLevel] = useState('');
  const [school, setSchool] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [dbSchools, setDbSchools] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        router.push('/');
      }
    });

    const fetchSchools = async () => {
      const { data, error } = await supabase.from('schools').select('*');
      if (data) setDbSchools(data);
    };
    fetchSchools();
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;
    
    setIsLoading(true);
    const { error } = await supabase.from('children').insert([
      {
        parent_id: userId,
        full_name: name,
        school_id: school, // This now stores the UUID
        level: level,
        grade: grade
      }
    ]);

    if (error) {
      console.error("Error inserting child:", error);
      alert("Gagal menyimpan data anak. Silakan coba lagi.");
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#182c4f] py-8 px-8 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Profil Anak</h2>
          <p className="text-blue-200 text-sm">Lengkapi data anak Anda untuk menyesuaikan katalog seragam.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-8 space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Jenjang Pendidikan</label>
            <div className="relative">
              <select 
                required
                value={level}
                onChange={(e) => { setLevel(e.target.value); setSchool(''); }}
                className="block w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3.5 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-[#67a683] transition-colors"
              >
                <option value="" disabled>Pilih Jenjang</option>
                <option value="TK">TK</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Sekolah</label>
            <div className="relative">
              <select 
                required
                disabled={!level}
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="block w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3.5 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-[#67a683] transition-colors disabled:opacity-50"
              >
                <option value="" disabled>Pilih Sekolah</option>
                {dbSchools.filter(s => s.level === level).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap Anak</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cth: Budi Santoso"
              className="block w-full bg-gray-50 border border-gray-200 text-gray-700 py-3.5 px-4 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-[#67a683] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kelas / Rombel</label>
            <div className="relative">
              <select 
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="block w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3.5 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-[#67a683] transition-colors"
              >
                <option value="" disabled>Pilih Kelas</option>
                {['1A', '1B', '2A', '2B', '3A', '3B'].map((g, idx) => (
                  <option key={idx} value={g}>{g}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#67a683] text-white py-4 rounded-xl font-bold hover:bg-[#5b9576] transition-colors shadow-lg shadow-[#67a683]/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan & Masuk ke Dashboard'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

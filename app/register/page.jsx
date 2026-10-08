'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function RegisterChild() {
  const router = useRouter();
  
  const [children, setChildren] = useState([
    { name: '', level: '', school: '', grade: '' },
    { name: '', level: '', school: '', grade: '' },
    { name: '', level: '', school: '', grade: '' }
  ]);
  
  const [parentName, setParentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [dbSchools, setDbSchools] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        
        // Fetch existing parent name
        const { data: parentData } = await supabase
          .from('parents')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
          
        if (parentData) setParentName(parentData.full_name);
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

  const updateChild = (index, field, value) => {
    const newChildren = [...children];
    newChildren[index][field] = value;
    if (field === 'level') newChildren[index].school = '';
    setChildren(newChildren);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;
    
    if (!parentName.trim()) {
      alert("Harap isi Nama Orang Tua!");
      return;
    }

    // Validate Child 1
    const child1 = children[0];
    if (!child1.name || !child1.level || !child1.school || !child1.grade) {
      alert("Harap lengkapi semua data Anak Ke-1!");
      return;
    }

    // Filter valid children
    const validChildren = children.filter(c => c.name && c.level && c.school && c.grade);
    
    setIsLoading(true);
    
    // Update Parent Name
    const { error: parentError } = await supabase
      .from('parents')
      .update({ full_name: parentName })
      .eq('id', userId);

    if (parentError) {
      console.error("Error updating parent:", parentError);
      alert("Gagal memperbarui nama orang tua.");
      setIsLoading(false);
      return;
    }
    
    const insertPayload = validChildren.map(c => ({
      parent_id: userId,
      full_name: c.name,
      school_id: c.school,
      level: c.level,
      grade: c.grade
    }));

    const { error } = await supabase.from('children').insert(insertPayload);

    if (error) {
      console.error("Error inserting child:", error);
      alert(`Gagal menyimpan data anak.\nError: ${error.message || 'Unknown'}\nDetails: ${error.details || ''}\nHint: ${error.hint || ''}`);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#182c4f] py-8 px-8 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Profil Anak</h2>
          <p className="text-blue-200 text-sm">Anda dapat mendaftarkan hingga 3 anak sekaligus.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-8 space-y-8">
          
          <div className="p-4 sm:p-6 rounded-2xl border-2 border-[#182c4f]/20 bg-blue-50/30">
            <h3 className="font-bold text-[#182c4f] mb-4 border-b border-[#182c4f]/10 pb-2">Data Orang Tua / Wali</h3>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Orang Tua</label>
              <input 
                type="text" 
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Nama Lengkap Orang Tua"
                className="block w-full bg-white border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:border-[#182c4f]"
              />
            </div>
          </div>

          {[0, 1, 2].map((index) => (
            <div key={index} className={`p-4 sm:p-6 rounded-2xl border-2 ${index === 0 ? 'border-[#67a683]/30 bg-[#eef7f2]/30' : 'border-gray-100 bg-gray-50/50'}`}>
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
                Anak Ke-{index + 1} {index === 0 && <span className="text-red-500 text-xs ml-2">*Wajib Diisi</span>}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required={index === 0}
                    value={children[index].name}
                    onChange={(e) => updateChild(index, 'name', e.target.value)}
                    placeholder="Nama Anak"
                    className="block w-full bg-white border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:border-[#67a683]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Jenjang</label>
                    <div className="relative">
                      <select 
                        required={index === 0 || children[index].name !== ''}
                        value={children[index].level}
                        onChange={(e) => updateChild(index, 'level', e.target.value)}
                        className="block w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-[#67a683]"
                      >
                        <option value="" disabled>Pilih Jenjang</option>
                        <option value="TK">TK (Taman Kanak-Kanak)</option>
                        <option value="SD">SD (Sekolah Dasar)</option>
                        <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                        <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                        <option value="Primary School">Primary School</option>
                        <option value="Lower Secondary">Lower Secondary</option>
                        <option value="Upper Secondary">Upper Secondary</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Kelas</label>
                    <div className="relative">
                      <select 
                        required={index === 0 || children[index].name !== ''}
                        value={children[index].grade}
                        onChange={(e) => updateChild(index, 'grade', e.target.value)}
                        className="block w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-[#67a683]"
                      >
                        <option value="" disabled>Pilih Kelas</option>
                        {['KBB', 'TK-A', 'TK-B', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g, idx) => (
                          <option key={idx} value={g}>{g}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Sekolah</label>
                  <div className="relative">
                    <select 
                      required={index === 0 || children[index].name !== ''}
                      disabled={!children[index].level}
                      value={children[index].school}
                      onChange={(e) => updateChild(index, 'school', e.target.value)}
                      className="block w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-[#67a683] disabled:opacity-50"
                    >
                      <option value="" disabled>Pilih Sekolah</option>
                      {dbSchools.filter(s => s.level === children[index].level).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#67a683] text-white py-4 rounded-xl font-bold hover:bg-[#5b9576] transition-colors shadow-lg shadow-[#67a683]/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Semua Data & Masuk Dashboard'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

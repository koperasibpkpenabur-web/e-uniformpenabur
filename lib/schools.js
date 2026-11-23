/**
 * Referensi Sekolah & Helper Jenjang untuk Kanvas PENABUR
 * Sesuai dengan data tabel school_whitelist BPK PENABUR
 */

export const deriveSchoolLevel = (schoolName) => {
  if (!schoolName) return '';
  const s = schoolName.toUpperCase().trim();
  if (s.startsWith('TKK') || s.includes('TK ')) return 'TK';
  if (s.startsWith('SDK') || s.includes('SD ')) return 'SD';
  if (s.startsWith('SMPK') || s.includes('SMP ')) return 'SMP';
  if (s.startsWith('SMKK') || s.includes('SMK ')) return 'SMK';
  if (s.startsWith('SMAK') || s.includes('SMA ')) return 'SMA';
  return 'SD';
};

export const DEFAULT_SCHOOL_WHITELIST = [
  // --- TKK (Taman Kanak-Kanak) ---
  { name: 'TKK 1 PENABUR Jakarta (Samanhudi)', level: 'TK' },
  { name: 'TKK 2 PENABUR Jakarta (Pembangunan)', level: 'TK' },
  { name: 'TKK 3 PENABUR Jakarta (Gunung Sahari)', level: 'TK' },
  { name: 'TKK 5 PENABUR Jakarta (Sunrise Garden)', level: 'TK' },
  { name: 'TKK 6 PENABUR Jakarta (Muara Karang)', level: 'TK' },
  { name: 'TKK 8 PENABUR Jakarta (Cipinang Indah)', level: 'TK' },
  { name: 'TKK 9 PENABUR Jakarta (Halimun)', level: 'TK' },
  { name: 'TKK 10 PENABUR Jakarta (PIK)', level: 'TK' },
  { name: 'TKK 11 PENABUR Jakarta (Surya Gardenia)', level: 'TK' },
  { name: 'TKK PENABUR Gading Serpong', level: 'TK' },
  { name: 'TKK PENABUR Kota Modern (Tangerang)', level: 'TK' },
  { name: 'TKK PENABUR Kota Wisata (Cibubur)', level: 'TK' },
  { name: 'TKK PENABUR Harapan Indah (Bekasi)', level: 'TK' },
  { name: 'TKK PENABUR Agus Salim (Bekasi)', level: 'TK' },
  { name: 'TKK PENABUR Summarecon Bekasi', level: 'TK' },
  { name: 'TKK PENABUR Bintaro Jaya', level: 'TK' },
  { name: 'TKK PENABUR Depok', level: 'TK' },
  { name: 'TKK PENABUR Bogor', level: 'TK' },
  { name: 'TKK PENABUR Sukabumi', level: 'TK' },
  { name: 'TKK PENABUR Serang', level: 'TK' },
  { name: 'TKK PENABUR Tirta Marta', level: 'TK' },

  // --- SDK (Sekolah Dasar) ---
  { name: 'SDK 1 PENABUR Jakarta (Samanhudi)', level: 'SD' },
  { name: 'SDK 2 PENABUR Jakarta (Pembangunan)', level: 'SD' },
  { name: 'SDK 3 PENABUR Jakarta (Gunung Sahari)', level: 'SD' },
  { name: 'SDK 4 PENABUR Jakarta (Cipinang Indah)', level: 'SD' },
  { name: 'SDK 6 PENABUR Jakarta (Muara Karang)', level: 'SD' },
  { name: 'SDK 8 PENABUR Jakarta (Cipinang)', level: 'SD' },
  { name: 'SDK 9 PENABUR Jakarta (Halimun)', level: 'SD' },
  { name: 'SDK 10 PENABUR Jakarta (PIK)', level: 'SD' },
  { name: 'SDK 11 PENABUR Jakarta (Surya Gardenia)', level: 'SD' },
  { name: 'SDK PENABUR Gading Serpong', level: 'SD' },
  { name: 'SDK PENABUR Kota Modern (Tangerang)', level: 'SD' },
  { name: 'SDK PENABUR Kota Wisata (Cibubur)', level: 'SD' },
  { name: 'SDK PENABUR Harapan Indah (Bekasi)', level: 'SD' },
  { name: 'SDK PENABUR Agus Salim (Bekasi)', level: 'SD' },
  { name: 'SDK PENABUR Summarecon Bekasi', level: 'SD' },
  { name: 'SDK PENABUR Bintaro Jaya', level: 'SD' },
  { name: 'SDK PENABUR Depok', level: 'SD' },
  { name: 'SDK PENABUR Bogor', level: 'SD' },
  { name: 'SDK PENABUR Sukabumi', level: 'SD' },
  { name: 'SDK PENABUR Serang', level: 'SD' },
  { name: 'SDK PENABUR Tirta Marta', level: 'SD' },

  // --- SMPK (Sekolah Menengah Pertama) ---
  { name: 'SMPK 1 PENABUR Jakarta (Samanhudi)', level: 'SMP' },
  { name: 'SMPK 2 PENABUR Jakarta (Pembangunan)', level: 'SMP' },
  { name: 'SMPK 3 PENABUR Jakarta (Gunung Sahari)', level: 'SMP' },
  { name: 'SMPK 4 PENABUR Jakarta (Cipinang Indah)', level: 'SMP' },
  { name: 'SMPK 5 PENABUR Jakarta (Cipinang Indah)', level: 'SMP' },
  { name: 'SMPK 6 PENABUR Jakarta (Muara Karang)', level: 'SMP' },
  { name: 'SMPK 7 PENABUR Jakarta (Kulit)', level: 'SMP' },
  { name: 'SMPK 8 PENABUR Jakarta', level: 'SMP' },
  { name: 'SMPK PENABUR Gading Serpong', level: 'SMP' },
  { name: 'SMPK PENABUR Kota Modern (Tangerang)', level: 'SMP' },
  { name: 'SMPK PENABUR Kota Wisata (Cibubur)', level: 'SMP' },
  { name: 'SMPK PENABUR Harapan Indah (Bekasi)', level: 'SMP' },
  { name: 'SMPK PENABUR Agus Salim (Bekasi)', level: 'SMP' },
  { name: 'SMPK PENABUR Summarecon Bekasi', level: 'SMP' },
  { name: 'SMPK PENABUR Bintaro Jaya', level: 'SMP' },
  { name: 'SMPK PENABUR Depok', level: 'SMP' },
  { name: 'SMPK PENABUR Bogor', level: 'SMP' },
  { name: 'SMPK PENABUR Sukabumi', level: 'SMP' },
  { name: 'SMPK PENABUR Serang', level: 'SMP' },
  { name: 'SMPK PENABUR Tirta Marta', level: 'SMP' },

  // --- SMAK & SMKK (Sekolah Menengah Atas / Kejuruan) ---
  { name: 'SMAK 1 PENABUR Jakarta (Tj. Duren)', level: 'SMA' },
  { name: 'SMAK 2 PENABUR Jakarta (Pintu Air)', level: 'SMA' },
  { name: 'SMAK 3 PENABUR Jakarta (Gunung Sahari)', level: 'SMA' },
  { name: 'SMAK 4 PENABUR Jakarta (Sunrise Garden)', level: 'SMA' },
  { name: 'SMAK 5 PENABUR Jakarta (Kelapa Gading)', level: 'SMA' },
  { name: 'SMAK 6 PENABUR Jakarta (Muara Karang)', level: 'SMA' },
  { name: 'SMAK 7 PENABUR Jakarta (Cipinang Indah)', level: 'SMA' },
  { name: 'SMAK PENABUR Gading Serpong', level: 'SMA' },
  { name: 'SMAK PENABUR Kota Modern (Tangerang)', level: 'SMA' },
  { name: 'SMAK PENABUR Kota Wisata (Cibubur)', level: 'SMA' },
  { name: 'SMAK PENABUR Harapan Indah (Bekasi)', level: 'SMA' },
  { name: 'SMAK PENABUR Summarecon Bekasi', level: 'SMA' },
  { name: 'SMAK PENABUR Bintaro Jaya', level: 'SMA' },
  { name: 'SMAK PENABUR Bogor', level: 'SMA' },
  { name: 'SMAK PENABUR Sukabumi', level: 'SMA' },
  { name: 'SMAK PENABUR Serang', level: 'SMA' },
  { name: 'SMAK PENABUR Tirta Marta', level: 'SMA' },
  { name: 'SMKK 1 PENABUR Jakarta (Farmasi)', level: 'SMK' }
];

/**
 * Fetch daftar sekolah dari Supabase `school_whitelist`, fallback ke data bawaan
 */
export async function getSchoolList(supabase) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('school_whitelist')
        .select('*')
        .order('nama_sekolah', { ascending: true });

      if (data && data.length > 0) {
        return data.map((item) => {
          const schoolName = (item.nama_sekolah || item.Nama_Sekolah || item.email || '').trim();
          const rawJenjang = item.Jenjang || item.jenjang || deriveSchoolLevel(schoolName);
          return {
            name: schoolName,
            level: rawJenjang,
            email: item.email || '',
          };
        });
      }
    }
  } catch (err) {
    console.warn('Menggunakan fallback data sekolah:', err);
  }

  return DEFAULT_SCHOOL_WHITELIST;
}

/**
 * Cek apakah email atau user ID sudah terdaftar di Supabase atau penyimpanan lokal
 */
export async function checkParentRegistered(supabase, email, userId) {
  const cleanEmail = (email || '').trim().toLowerCase();
  
  // 1. Cek dari localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('kanvas_registered_parents');
      if (stored) {
        const list = JSON.parse(stored);
        const found = list.find(
          (p) =>
            (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail) ||
            (userId && p.userId && p.userId === userId)
        );
        if (found) return { registered: true, profile: found };
      }
    } catch (e) {}
  }

  // 2. Cek di Supabase `parent_orders`
  if (supabase && cleanEmail) {
    try {
      const { data, error } = await supabase
        .from('parent_orders')
        .select('parent_name, parent_phone, parent_email, school_name, school_level, student_name, student_class')
        .or(`parent_email.eq.${cleanEmail},parent_phone.eq.${cleanEmail}`)
        .limit(1);

      if (data && data.length > 0) {
        const row = data[0];
        const profile = {
          email: cleanEmail,
          userId: userId || null,
          parentName: row.parent_name,
          studentName: row.student_name,
          schoolName: row.school_name,
          schoolLevel: row.school_level,
          studentClass: row.student_class,
          phone: row.parent_phone,
        };
        saveParentLocally(profile);
        return { registered: true, profile };
      }
    } catch (err) {
      console.warn('Cek registrasi Supabase:', err);
    }
  }

  return { registered: false, profile: null };
}

/**
 * Simpan data pendaftaran wali murid ke Supabase dan localStorage
 */
export async function saveParentRegistration(supabase, profileData) {
  // 1. Simpan di localStorage
  saveParentLocally(profileData);

  // 2. Simpan session aktif
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      'kanvas_parent_session',
      JSON.stringify({
        fullName: profileData.parentName,
        phone: profileData.phone,
        email: profileData.email,
        studentName: profileData.studentName,
        schoolName: profileData.schoolName,
        schoolLevel: profileData.schoolLevel,
        studentClass: profileData.studentClass,
        isRegistered: true,
      })
    );
  }

  // 3. Simpan catatan profil di Supabase jika terkoneksi
  if (supabase) {
    try {
      await supabase.from('parent_orders').insert([
        {
          id: `REG-${Date.now()}`,
          parent_name: profileData.parentName,
          parent_phone: profileData.phone,
          parent_email: profileData.email || null,
          school_name: profileData.schoolName,
          school_level: profileData.schoolLevel,
          student_name: profileData.studentName,
          student_class: profileData.studentClass,
          status: 'registered_profile',
          academic_year: '2026/2027',
          total_amount: 0,
        },
      ]);
    } catch (err) {
      console.warn('Catatan registrasi Supabase:', err);
    }
  }

  return true;
}

function saveParentLocally(profile) {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('kanvas_registered_parents');
    const list = stored ? JSON.parse(stored) : [];
    const exists = list.some(
      (p) =>
        (profile.email && p.email && p.email.toLowerCase() === profile.email.toLowerCase()) ||
        (profile.phone && p.phone && p.phone === profile.phone)
    );
    if (!exists) {
      list.push(profile);
      localStorage.setItem('kanvas_registered_parents', JSON.stringify(list));
    }
  } catch (e) {}
}

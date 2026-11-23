/**
 * Referensi Sekolah & Helper Jenjang untuk Kanvas PENABUR
 * Sesuai dengan data tabel school_whitelist BPK PENABUR (SSOT)
 */

// Bersihkan nama sekolah dari tanda kurung atau wilayah dalam kurung
export const cleanSchoolName = (name) => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
};

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

// Daftar Bersih Sekolah BPK PENABUR (Tanpa dalam kurung / nama wilayah tambahan)
export const DEFAULT_SCHOOL_WHITELIST = [
  // --- TKK (Taman Kanak-Kanak) ---
  { name: 'TKK 1 PENABUR', level: 'TK' },
  { name: 'TKK 2 PENABUR', level: 'TK' },
  { name: 'TKK 3 PENABUR', level: 'TK' },
  { name: 'TKK 5 PENABUR', level: 'TK' },
  { name: 'TKK 6 PENABUR', level: 'TK' },
  { name: 'TKK 8 PENABUR', level: 'TK' },
  { name: 'TKK 9 PENABUR', level: 'TK' },
  { name: 'TKK 10 PENABUR', level: 'TK' },
  { name: 'TKK 11 PENABUR', level: 'TK' },
  { name: 'TKK PENABUR Gading Serpong', level: 'TK' },
  { name: 'TKK PENABUR Kota Modern', level: 'TK' },
  { name: 'TKK PENABUR Kota Wisata', level: 'TK' },
  { name: 'TKK PENABUR Harapan Indah', level: 'TK' },
  { name: 'TKK PENABUR Agus Salim', level: 'TK' },
  { name: 'TKK PENABUR Summarecon Bekasi', level: 'TK' },
  { name: 'TKK PENABUR Bintaro Jaya', level: 'TK' },
  { name: 'TKK PENABUR Depok', level: 'TK' },
  { name: 'TKK PENABUR Tirta Marta', level: 'TK' },

  // --- SDK (Sekolah Dasar) ---
  { name: 'SDK 1 PENABUR', level: 'SD' },
  { name: 'SDK 2 PENABUR', level: 'SD' },
  { name: 'SDK 3 PENABUR', level: 'SD' },
  { name: 'SDK 4 PENABUR', level: 'SD' },
  { name: 'SDK 6 PENABUR', level: 'SD' },
  { name: 'SDK 8 PENABUR', level: 'SD' },
  { name: 'SDK 9 PENABUR', level: 'SD' },
  { name: 'SDK 10 PENABUR', level: 'SD' },
  { name: 'SDK 11 PENABUR', level: 'SD' },
  { name: 'SDK PENABUR Gading Serpong', level: 'SD' },
  { name: 'SDK PENABUR Kota Modern', level: 'SD' },
  { name: 'SDK PENABUR Kota Wisata', level: 'SD' },
  { name: 'SDK PENABUR Harapan Indah', level: 'SD' },
  { name: 'SDK PENABUR Agus Salim', level: 'SD' },
  { name: 'SDK PENABUR Summarecon Bekasi', level: 'SD' },
  { name: 'SDK PENABUR Bintaro Jaya', level: 'SD' },
  { name: 'SDK PENABUR Depok', level: 'SD' },
  { name: 'SDK PENABUR Tirta Marta', level: 'SD' },

  // --- SMPK (Sekolah Menengah Pertama) ---
  { name: 'SMPK 1 PENABUR', level: 'SMP' },
  { name: 'SMPK 2 PENABUR', level: 'SMP' },
  { name: 'SMPK 3 PENABUR', level: 'SMP' },
  { name: 'SMPK 4 PENABUR', level: 'SMP' },
  { name: 'SMPK 5 PENABUR', level: 'SMP' },
  { name: 'SMPK 6 PENABUR', level: 'SMP' },
  { name: 'SMPK 7 PENABUR', level: 'SMP' },
  { name: 'SMPK 8 PENABUR', level: 'SMP' },
  { name: 'SMPK PENABUR Gading Serpong', level: 'SMP' },
  { name: 'SMPK PENABUR Kota Modern', level: 'SMP' },
  { name: 'SMPK PENABUR Kota Wisata', level: 'SMP' },
  { name: 'SMPK PENABUR Harapan Indah', level: 'SMP' },
  { name: 'SMPK PENABUR Agus Salim', level: 'SMP' },
  { name: 'SMPK PENABUR Summarecon Bekasi', level: 'SMP' },
  { name: 'SMPK PENABUR Bintaro Jaya', level: 'SMP' },
  { name: 'SMPK PENABUR Depok', level: 'SMP' },
  { name: 'SMPK PENABUR Tirta Marta', level: 'SMP' },

  // --- SMAK & SMKK (Sekolah Menengah Atas / Kejuruan) ---
  { name: 'SMAK 1 PENABUR', level: 'SMA' },
  { name: 'SMAK 2 PENABUR', level: 'SMA' },
  { name: 'SMAK 3 PENABUR', level: 'SMA' },
  { name: 'SMAK 4 PENABUR', level: 'SMA' },
  { name: 'SMAK 5 PENABUR', level: 'SMA' },
  { name: 'SMAK 6 PENABUR', level: 'SMA' },
  { name: 'SMAK 7 PENABUR', level: 'SMA' },
  { name: 'SMAK PENABUR Gading Serpong', level: 'SMA' },
  { name: 'SMAK PENABUR Kota Modern', level: 'SMA' },
  { name: 'SMAK PENABUR Kota Wisata', level: 'SMA' },
  { name: 'SMAK PENABUR Harapan Indah', level: 'SMA' },
  { name: 'SMAK PENABUR Summarecon Bekasi', level: 'SMA' },
  { name: 'SMAK PENABUR Bintaro Jaya', level: 'SMA' },
  { name: 'SMAK PENABUR Tirta Marta', level: 'SMA' },
  { name: 'SMKK 1 PENABUR', level: 'SMK' }
];

/**
 * Fetch daftar sekolah dari Supabase `school_whitelist`, selalu bersihkan tanda kurung
 */
export async function getSchoolList(supabase) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('school_whitelist')
        .select('*')
        .order('nama_sekolah', { ascending: true });

      if (data && data.length > 0) {
        const seen = new Set();
        const cleaned = [];

        data.forEach((item) => {
          const rawName = (item.nama_sekolah || item.Nama_Sekolah || item.email || '').trim();
          const cleanName = cleanSchoolName(rawName);
          if (cleanName && !seen.has(cleanName)) {
            seen.add(cleanName);
            const rawJenjang = item.Jenjang || item.jenjang || deriveSchoolLevel(cleanName);
            cleaned.push({
              name: cleanName,
              level: rawJenjang,
              email: item.email || '',
              bankName: item.bank_name || 'BCA',
              bankAccountNumber: item.bank_account_number || '',
              bankAccountHolder: item.bank_account_holder || `BPK PENABUR - ${cleanName}`,
              gdriveUploadLink: item.gdrive_upload_link || '',
            });
          }
        });

        if (cleaned.length > 0) return cleaned;
      }
    }
  } catch (err) {
    console.warn('Menggunakan fallback daftar sekolah bersih:', err);
  }

  return DEFAULT_SCHOOL_WHITELIST;
}

/**
 * Dapatkan informasi rekening dan link Google Drive sekolah
 */
export function getSchoolPaymentInfo(schoolList, schoolName) {
  const cleanTarget = cleanSchoolName(schoolName || '');
  const school = (schoolList || []).find((s) => cleanSchoolName(s.name) === cleanTarget);
  return {
    bankName: school?.bankName || 'BCA',
    bankAccountNumber: school?.bankAccountNumber || '0760256757',
    bankAccountHolder: school?.bankAccountHolder || `BPK PENABUR - ${cleanTarget || 'Sekolah'}`,
    gdriveUploadLink: school?.gdriveUploadLink || 'https://drive.google.com',
  };
}

/**
 * Cek apakah email atau user ID sudah terdaftar
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
      const { data } = await supabase
        .from('parent_orders')
        .select('*')
        .or(`parent_email.eq.${cleanEmail},parent_phone.eq.${cleanEmail}`)
        .limit(1);

      if (data && data.length > 0) {
        const row = data[0];
        const studentId = `std-1`;
        const profile = {
          email: cleanEmail,
          userId: userId || null,
          fullName: row.parent_name,
          phone: row.parent_phone,
          activeStudentId: studentId,
          students: [
            {
              id: studentId,
              name: row.student_name,
              school: cleanSchoolName(row.school_name),
              level: row.school_level || deriveSchoolLevel(row.school_name),
              grade: row.student_class,
            },
          ],
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
 * Simpan data pendaftaran wali murid dengan dukungan multi-siswa
 */
export async function saveParentRegistration(supabase, form) {
  const studentId = `std-${Date.now()}`;
  const initialStudent = {
    id: studentId,
    name: form.studentName,
    school: cleanSchoolName(form.schoolName),
    level: form.schoolLevel || deriveSchoolLevel(form.schoolName),
    grade: form.studentClass,
  };

  const profileData = {
    fullName: form.parentName,
    phone: form.phone,
    email: form.email || '',
    activeStudentId: studentId,
    students: [initialStudent],
    isRegistered: true,
  };

  // 1. Simpan di localStorage profil aktif & daftar akun
  saveParentLocally(profileData);

  if (typeof window !== 'undefined') {
    localStorage.setItem('kanvas_parent_session', JSON.stringify(profileData));
  }

  // 2. Simpan catatan profil di Supabase
  if (supabase) {
    try {
      await supabase.from('parent_orders').insert([
        {
          id: `REG-${Date.now()}`,
          parent_name: profileData.fullName,
          parent_phone: profileData.phone,
          parent_email: profileData.email || null,
          school_name: initialStudent.school,
          school_level: initialStudent.level,
          student_name: initialStudent.name,
          student_class: initialStudent.grade,
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

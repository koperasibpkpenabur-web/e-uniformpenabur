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
  if (s.includes('SPK-SD') || (s.includes('SPK') && (s.includes('SD') || s.includes('PRIMARY')))) return 'SPK-SD';
  if (s.includes('SPK-SMP') || (s.includes('SPK') && (s.includes('SMP') || s.includes('JUNIOR') || s.includes('SECONDARY')))) return 'SPK-SMP';
  if (s.includes('SPK-SMA') || (s.includes('SPK') && (s.includes('SMA') || s.includes('SENIOR')))) return 'SPK-SMA';
  if (s.startsWith('TKK') || s.includes('TK ') || s.includes('TK-')) return 'TK';
  if (s.startsWith('SDK') || s.includes('SD ') || s.includes('SD-')) return 'SD';
  if (s.startsWith('SMPK') || s.includes('SMP ') || s.includes('SMP-')) return 'SMP';
  if (s.startsWith('SMKK') || s.includes('SMK ') || s.includes('SMK-')) return 'SMK';
  if (s.startsWith('SMAK') || s.includes('SMA ') || s.includes('SMA-')) return 'SMA';
  return 'SD';
};

// Dapatkan jenjang lanjutan berikutnya untuk siswa dalam PENABUR
export const getNextSchoolLevel = (level) => {
  const l = (level || '').toUpperCase().trim();
  if (l === 'TK') return 'SD';
  if (l === 'SD') return 'SMP';
  if (l === 'SMP') return 'SMA';
  if (l === 'SPK-SD') return 'SPK-SMP';
  if (l === 'SPK-SMP') return 'SPK-SMA';
  return null;
};

// Dapatkan pilihan kelas berdasarkan jenjang sekolah:
// SD: 1, 2, 3, 4, 5, 6
// SMP: 7, 8, 9
// SMA: 10, 11, 12
// SPK-SD: 1, 2, 3, 4, 5, 6
// SPK-SMP: 7, 8, 9
// SPK-SMA: 10, 11, 12
// TK: tidak perlu mengisi kelas (return [])
export const getAvailableGrades = (level) => {
  if (!level) return [];
  const l = (level || '').toUpperCase().trim();

  // TK tidak perlu mengisi kelas
  if (l === 'TK' || l.startsWith('TK') || l.includes('TK')) {
    return [];
  }

  // SD & SPK-SD: 1, 2, 3, 4, 5, 6
  if (l === 'SD' || l === 'SPK-SD' || l.includes('SD')) {
    return ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  }

  // SMP & SPK-SMP: 7, 8, 9
  if (l === 'SMP' || l === 'SPK-SMP' || l.includes('SMP')) {
    return ['Kelas 7', 'Kelas 8', 'Kelas 9'];
  }

  // SMA & SPK-SMA & SMK: 10, 11, 12
  if (l === 'SMA' || l === 'SPK-SMA' || l === 'SMK' || l.includes('SMA') || l.includes('SMK')) {
    return ['Kelas 10', 'Kelas 11', 'Kelas 12'];
  }

  return ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
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

  // 2. Cek di Supabase `parent_accounts` (Tabel Profil SSOT Kanvas PENABUR)
  if (supabase && (cleanEmail || userId)) {
    try {
      let query = supabase.from('parent_accounts').select('*');
      if (cleanEmail) {
        query = query.ilike('email', cleanEmail);
      } else if (userId) {
        query = query.eq('auth_user_id', userId);
      }

      const { data, error } = await query.limit(1);

      if (data && data.length > 0) {
        const row = data[0];
        const studentList = Array.isArray(row.students) && row.students.length > 0
          ? row.students
          : [
              {
                id: row.active_student_id || 'std-1',
                name: 'Siswa PENABUR',
                school: 'PENABUR',
                level: 'SD',
                grade: 'Kelas 1',
              },
            ];

        const profile = {
          email: row.email || cleanEmail,
          userId: userId || row.auth_user_id || null,
          fullName: row.full_name || 'Wali Murid',
          phone: row.phone || '',
          activeStudentId: row.active_student_id || studentList[0]?.id || 'std-1',
          students: studentList,
          isRegistered: true,
        };
        saveParentLocally(profile);
        return { registered: true, profile };
      }
    } catch (err) {
      console.warn('Cek registrasi parent_accounts:', err);
    }

    // 3. Fallback: Cek di Supabase `parent_orders` jika pernah bertransaksi
    try {
      const { data } = await supabase
        .from('parent_orders')
        .select('*')
        .or(`parent_email.ilike.${cleanEmail},parent_phone.eq.${cleanEmail}`)
        .order('created_at', { ascending: false })
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
          isRegistered: true,
        };
        saveParentLocally(profile);
        return { registered: true, profile };
      }
    } catch (err) {
      console.warn('Cek registrasi Supabase parent_orders:', err);
    }
  }

  return { registered: false, profile: null };
}

/**
 * Simpan data pendaftaran wali murid dengan dukungan multi-siswa
 */
export async function saveParentRegistration(supabase, form, authUserId = null) {
  const studentId = `std-${Date.now()}`;
  const studentType = form.studentType || 'luar';
  const currentLvl = form.schoolLevel || deriveSchoolLevel(form.schoolName);
  const nextLvl = studentType === 'dalam' ? getNextSchoolLevel(currentLvl) : null;
  const allowedLevels = studentType === 'dalam' && nextLvl ? [currentLvl, nextLvl] : [currentLvl];

  const initialStudent = {
    id: studentId,
    name: form.studentName,
    studentType: studentType, // 'luar' | 'dalam'
    school: cleanSchoolName(form.schoolName),
    level: currentLvl,
    nextLevel: nextLvl,
    allowedLevels: allowedLevels,
    grade: form.studentClass,
  };

  const profileData = {
    fullName: form.parentName,
    phone: form.phone,
    email: (form.email || '').trim().toLowerCase(),
    userId: authUserId || null,
    activeStudentId: studentId,
    students: [initialStudent],
    isRegistered: true,
  };

  // 1. Simpan di localStorage profil aktif & daftar akun
  saveParentLocally(profileData);

  if (typeof window !== 'undefined') {
    localStorage.setItem('kanvas_parent_session', JSON.stringify(profileData));
  }

  // 2. Simpan catatan profil di Supabase tabel `parent_accounts`
  if (supabase) {
    try {
      await supabase.from('parent_accounts').upsert(
        [
          {
            auth_user_id: authUserId || null,
            email: profileData.email || null,
            phone: profileData.phone,
            full_name: profileData.fullName,
            students: profileData.students,
            active_student_id: profileData.activeStudentId,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'email' }
      );
    } catch (err) {
      console.warn('Catatan registrasi Supabase parent_accounts:', err);
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

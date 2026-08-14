// ─────────────────────────────────────────────────────────────────────────────
// constants.js — YAHAN APNA DATA BHARO
// Step 1: Admin login karke browser mein URL dekho → sahi path likho
// Step 2: .env file mein credentials daalo
// ─────────────────────────────────────────────────────────────────────────────

export const BASE_URL = 'https://jp-verma-fee-collection.klaimify.workers.dev';

// ── LOGIN CREDENTIALS (.env file se aata hai) ─────────────────────────────────
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error('ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env');
}

export const ADMIN_CREDS = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
};


// ── ROUTES — browser mein kholke URLs copy karo ──────────────────────────────
// HOW TO FIND: Admin login karo → har page pe jaao → URL copy karo
export const ROUTES = {
  // Admin login page URL (browser mein dekho)
  adminLogin:  '/admin/login',      // ← agar alag ho to yahan change karo

  // Dashboard URL (login ke baad kahan jaata hai)
  dashboard:   '/admin/dashboard',  // ← browser mein check karo

  // Masters — screenshot mein URL dikh raha tha:
  // https://jp-verma-fee-collection.klaimify.workers.dev/admin/masters/course-types
  courseTypes:      '/admin/masters/course-types',
  branches:         '/admin/masters/branches',
  courses:          '/admin/masters/courses',
  feeHeads:         '/admin/masters/fee-heads',
  subFeeHeads:      '/admin/masters/sub-fee-heads',
  academicYears:    '/admin/masters/academic-years',
  batches:          '/admin/masters/batches',
  electiveSubjects: '/admin/masters/elective-subjects',
  castes:           '/admin/masters/castes',
  genders:          '/admin/masters/genders',

  // Baaki pages — browser mein jaake URL dekho
  students:        '/admin/students',        // ← verify karo
  feeStructure:    '/admin/fee-structure',   // ← verify karo
  portalConfig:    '/admin/portal-config',   // ← verify karo
  admissionBuffer: '/admin/admission-buffer',// ← verify karo
  reports:         '/admin/reports',         // ← verify karo
  studentPortal:   '/',                      // Student portal homepage
};

// ── TEST DATA ─────────────────────────────────────────────────────────────────
// Har test mein unique naam use karta hai taaki real data se clash na ho
export const UNIQUE = () => `_AUTO_${Date.now()}`;

// Security test payloads — do not change
export const XSS_PAYLOAD     = '<script>alert("xss")</script>';
export const SQL_PAYLOAD      = "' OR '1'='1";
export const WHITESPACE_INPUT = '     ';
export const LONG_STRING      = 'A'.repeat(300);
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
console.log(
  'ADMIN_PASSWORD:',
  process.env.ADMIN_PASSWORD ? 'LOADED' : 'NOT LOADED'
);
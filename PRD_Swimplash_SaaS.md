# PRD — SwimplashOS SaaS Platform
**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Ready for Agent Execution  
**Tech Stack:** Next.js 14 (App Router) + Tailwind CSS + Firebase (Auth + Firestore) + Cloudinary + Fonnte  
**Deploy Target:** Vercel (or Cloudflare Pages)

---

## 0. AGENT INSTRUCTIONS

> This document is structured for agentic execution in Google Antigravity.
> Read ALL sections before starting. Do not skip sections.
> Follow this execution order strictly:
> 1. Setup project & folder structure
> 2. Configure Firebase & environment variables
> 3. Build data layer (Firestore schema + helper functions)
> 4. Build UI pages in module order (Section 4)
> 5. Implement business logic per module
> 6. Run acceptance criteria checks per module before moving on

**Rules for the agent:**
- Use TypeScript for all files
- Use Tailwind CSS for all styling (no external UI library unless specified)
- Every Firestore write must go through a helper function in `/lib/firebase/`
- Never hardcode tenant ID — always read from auth context
- All monetary values stored as integers (in cents/rupiah, no decimals)
- Dates stored as Firestore Timestamps
- All pages under `/app/(dashboard)/` must be protected by auth middleware

---

## 1. PROJECT OVERVIEW

**Product Name:** SwimplashOS  
**Type:** Internal SaaS — Multi-branch swim course management system  
**Primary User:** Swimplash business owner and admins  
**Goal:** Replace manual Google Sheets tracking with a proper web app for managing students, class schedules, attendance, trainer salary, and finances — with a real-time dashboard.

**Core Problems Solved:**
1. Manual sesi tracking prone to error
2. No visibility on paket status per murid
3. Attendance takes too long (not 1-click)
4. Trainer salary calculation is manual
5. No unified financial report across branches

---

## 2. ROLES & PERMISSIONS

| Role | Description | Access |
|---|---|---|
| `super_admin` | Owner / business level | All branches, all features, settings |
| `admin_cabang` | Branch manager | Only their branch — students, attendance, finance |
| `pelatih` | Trainer | Only their own sessions — attendance input only |

**Auth:** Firebase Authentication (email + password).  
**Role stored in:** Firestore → `tenants/{tenantId}/users/{uid}` → field `role` and `branchId`.

---

## 3. FIRESTORE SCHEMA

> Tenant ID for Swimplash = `swimplash`. Hardcode for now. Structure is multi-tenant ready.

```
tenants/
  {tenantId}/
    settings/
      general        → { businessName, logoUrl, maxRescheduleDays: 30 }

    branches/
      {branchId}/    → { name, address, phone, isActive }

    users/
      {uid}/         → { name, email, role, branchId, createdAt }

    trainers/
      {trainerId}/   → { name, branchId, phone, ratePerSession, isActive }

    classes/
      {classId}/     → {
                         name,
                         branchId,
                         trainerId,
                         dayOfWeek,       // 0=Sun, 1=Mon, ..., 6=Sat
                         timeStart,       // "08:00"
                         timeEnd,         // "09:00"
                         maxCapacity,
                         studentIds[],    // array of studentId
                         isActive
                       }

    students/
      {studentId}/   → {
                         name,
                         phone,           // for WA reminder
                         parentName,
                         branchId,
                         classId,
                         photoUrl,        // Cloudinary
                         createdAt,
                         activePackage: {
                           packageId,
                           totalSessions,
                           usedSessions,
                           startDate,     // Timestamp
                           expiryDate,    // Timestamp (startDate + 30 days)
                           status         // "active" | "almost_done" | "done" | "expired"
                         }
                       }

    packages/
      {packageId}/   → { name, totalSessions, price, description }

    attendance/
      {attendanceId}/ → {
                          date,            // Timestamp
                          classId,
                          branchId,
                          trainerId,
                          sessionRecords[]: {
                            studentId,
                            status         // "hadir" | "reschedule" | "no_show"
                          },
                          createdAt,
                          createdBy        // uid
                        }

    trainer_sessions/
      {trainerSessionId}/ → {
                              trainerId,
                              branchId,
                              month,        // "2026-04" (YYYY-MM)
                              totalSessions,
                              ratePerSession,
                              totalSalary,
                              isPaid,
                              paidAt
                            }

    finance/
      {transactionId}/ → {
                           date,           // Timestamp
                           type,           // "income" | "expense"
                           category,       // "paket_murid" | "gaji_pelatih" | "operasional" | "lainnya"
                           amount,         // integer, in IDR
                           branchId,
                           description,
                           createdBy,
                           referenceId     // optional: studentId or trainerSessionId
                         }
```

---

## 4. MODULES & FEATURES

### MODULE 1 — Authentication

**Pages:**
- `/login` — Email + password login form
- Redirect to `/dashboard` on success

**Logic:**
- On login, fetch user doc from Firestore to get `role` and `branchId`
- Store in React context (`AuthContext`)
- Middleware in `middleware.ts` protects all `/app/(dashboard)/` routes
- Redirect to `/login` if not authenticated

**Acceptance Criteria:**
- [ ] User can log in with email + password
- [ ] Failed login shows error message
- [ ] Unauthenticated user redirected to `/login`
- [ ] Role and branchId available globally via context

---

### MODULE 2 — Data Murid (Student Management)

**Pages:**
- `/students` — List all students (filterable by branch, status)
- `/students/new` — Form tambah murid baru
- `/students/{id}` — Detail murid: info, paket aktif, riwayat absensi

**Fields — Add Student Form:**
- Nama murid (required)
- Nama orang tua
- No HP (WA)
- Foto (upload ke Cloudinary)
- Cabang (dropdown)
- Kelas (dropdown, filtered by branch)
- Pilih Paket (dropdown from `packages` collection)
- Tanggal mulai paket

**Logic:**
- On student creation, set `activePackage`:
  - `startDate` = input date
  - `expiryDate` = startDate + 30 days
  - `usedSessions` = 0
  - `status` = "active"
- Status auto-calculated:
  - `expired` if today > expiryDate
  - `done` if usedSessions >= totalSessions
  - `almost_done` if remainingSessions <= 2 AND not expired/done
  - `active` otherwise
- Recalculate status on every attendance write

**Status Badge Colors:**
- `active` → green
- `almost_done` → orange
- `done` → red
- `expired` → gray

**Acceptance Criteria:**
- [ ] Can add new student with package
- [ ] Student list shows correct status badges
- [ ] Filter by branch works
- [ ] Student detail shows remaining sessions and days left
- [ ] Cannot add student without selecting a class

---

### MODULE 3 — Jadwal & Kelas (Class Schedule)

**Pages:**
- `/classes` — List semua kelas (per cabang)
- `/classes/new` — Form buat kelas baru
- `/classes/{id}` — Detail kelas: info, daftar murid, jadwal

**Fields — Add Class Form:**
- Nama kelas (e.g., "Kelas A - Senin Pagi")
- Cabang
- Pelatih (dropdown dari trainers)
- Hari (Senin–Minggu)
- Jam mulai & selesai
- Kapasitas maksimal

**Logic:**
- When creating a class, `studentIds` starts as empty array
- Adding a student to a class updates both `student.classId` and `class.studentIds`
- Warn if adding student would exceed `maxCapacity`

**Acceptance Criteria:**
- [ ] Can create and edit class
- [ ] Class list shows current student count vs capacity
- [ ] Trainer dropdown only shows trainers in same branch
- [ ] Capacity warning shown when full

---

### MODULE 4 — Absensi (Attendance) ⭐ CORE FEATURE

**Pages:**
- `/attendance` — List sesi hari ini per cabang (landing page utama)
- `/attendance/session/{classId}` — Input absensi untuk 1 sesi
- `/attendance/history` — Riwayat absensi (filterable by date, class, branch)

**Attendance Input Flow:**
1. User pilih kelas dari list sesi hari ini
2. System load semua murid di kelas tersebut
3. Default: semua murid status = "hadir"
4. Pelatih hanya mengubah murid yang TIDAK hadir
5. Status options per murid:
   - ✅ Hadir (default)
   - 🔄 Reschedule
   - ❌ No Show
6. Tombol "Simpan Absensi" → save ke Firestore

**Session Impact Logic (run on save):**

```
For each student in session:
  if status == "hadir":
    usedSessions += 1
    recalculate package status

  if status == "reschedule":
    usedSessions unchanged
    check if today <= expiryDate → if not, status = "expired"

  if status == "no_show":
    usedSessions += 1  // session hangus
    recalculate package status
```

**Trainer Session Tracking (run on save):**
```
Find or create trainer_sessions doc for trainerId + month
totalSessions += 1
totalSalary = totalSessions * ratePerSession
```

**Acceptance Criteria:**
- [ ] Today's classes shown on `/attendance` landing
- [ ] Default all students to "hadir" on load
- [ ] Saving attendance correctly deducts sessions
- [ ] Reschedule does NOT deduct session
- [ ] No Show DOES deduct session
- [ ] Cannot submit attendance twice for same class on same date
- [ ] Trainer session count increments on each save

---

### MODULE 5 — Manajemen Pelatih (Trainer Management)

**Pages:**
- `/trainers` — List pelatih per cabang
- `/trainers/new` — Form tambah pelatih
- `/trainers/{id}` — Detail pelatih: info, rekap sesi per bulan, riwayat gaji

**Fields — Add Trainer Form:**
- Nama
- No HP
- Cabang
- Tarif per sesi (IDR)

**Salary Calculation:**
- Auto-calculated from `trainer_sessions` collection
- Display per month: total sesi × tarif = total gaji
- "Tandai Lunas" button → sets `isPaid = true`, `paidAt = now()`
- On marking paid: auto-create finance transaction:
  ```
  type: "expense"
  category: "gaji_pelatih"
  amount: totalSalary
  referenceId: trainerSessionId
  ```

**Acceptance Criteria:**
- [ ] Trainer list shows active sessions this month
- [ ] Monthly salary calculation correct
- [ ] "Tandai Lunas" creates finance record automatically
- [ ] Cannot mark paid twice

---

### MODULE 6 — Keuangan (Finance)

**Pages:**
- `/finance` — List transaksi (filterable by type, category, branch, date range)
- `/finance/new` — Form tambah transaksi manual

**Fields — Add Transaction Form:**
- Tanggal
- Tipe: Income / Expense
- Kategori (dropdown)
- Nominal (IDR)
- Cabang
- Keterangan

**Income categories:** `paket_murid`, `lainnya`  
**Expense categories:** `gaji_pelatih`, `operasional`, `lainnya`

**Auto-entries (no manual input needed):**
- Gaji pelatih → auto from Module 5 "Tandai Lunas"
- (Future: Pembayaran paket murid jika ada payment gateway)

**Summary Bar (top of page):**
- Total Income (current month)
- Total Expense (current month)
- Profit = Income - Expense

**Acceptance Criteria:**
- [ ] Can add manual income/expense
- [ ] Summary bar shows correct monthly totals
- [ ] Filter by branch works correctly
- [ ] Gaji pelatih entries appear automatically after "Tandai Lunas"

---

### MODULE 7 — Dashboard & Laporan

**Page:** `/dashboard` (default landing after login)

**Sections:**

#### A. Summary Cards (real-time)
- Total murid aktif (across accessible branches)
- Murid hampir habis paket (status: almost_done)
- Total income bulan ini
- Total expense bulan ini
- Profit bulan ini

#### B. Charts (required)
All charts use data from Firestore, rendered with **Recharts** library.

1. **Grafik Pertumbuhan Murid** (Line Chart)
   - X-axis: bulan (12 bulan terakhir)
   - Y-axis: jumlah murid baru per bulan
   - Data source: `students.createdAt`

2. **Grafik Revenue** (Bar Chart)
   - X-axis: bulan
   - Y-axis: total income
   - Data source: `finance` where `type == "income"`

3. **Grafik Expense** (Bar Chart)
   - X-axis: bulan
   - Y-axis: total expense
   - Data source: `finance` where `type == "expense"`

4. **Grafik Profit** (Line Chart)
   - X-axis: bulan
   - Y-axis: income - expense
   - Derived from Revenue + Expense data

#### C. Breakdown per Cabang (Table)
| Cabang | Murid Aktif | Income Bulan Ini | Expense Bulan Ini |
|---|---|---|---|

**Acceptance Criteria:**
- [ ] All 4 charts render with real data
- [ ] Summary cards update in real-time (Firestore listener)
- [ ] super_admin sees all branches
- [ ] admin_cabang sees only their branch
- [ ] Charts show last 12 months of data

---

### MODULE 8 — Settings

**Page:** `/settings`  
**Access:** super_admin only

**Sections:**
- Business info (name, logo)
- Kelola cabang (add/edit/deactivate)
- Kelola paket (add/edit/deactivate)
- Kelola akun user (invite, assign role & branch)
- Konfigurasi WhatsApp (Fonnte API key)

**Acceptance Criteria:**
- [ ] Only super_admin can access /settings
- [ ] Can add/deactivate branches
- [ ] Can add/edit packages
- [ ] Can invite new user and assign role
- [ ] Fonnte API key saved to Firestore settings

---

## 5. FOLDER STRUCTURE

```
/app
  /(auth)
    /login/page.tsx
  /(dashboard)
    /layout.tsx              ← sidebar + topbar
    /dashboard/page.tsx
    /students/page.tsx
    /students/new/page.tsx
    /students/[id]/page.tsx
    /classes/page.tsx
    /classes/new/page.tsx
    /classes/[id]/page.tsx
    /attendance/page.tsx
    /attendance/session/[classId]/page.tsx
    /attendance/history/page.tsx
    /trainers/page.tsx
    /trainers/new/page.tsx
    /trainers/[id]/page.tsx
    /finance/page.tsx
    /finance/new/page.tsx
    /settings/page.tsx

/lib
  /firebase
    /client.ts               ← Firebase init
    /auth.ts                 ← Auth helpers
    /students.ts             ← Student CRUD
    /attendance.ts           ← Attendance logic
    /trainers.ts             ← Trainer + salary logic
    /finance.ts              ← Finance CRUD
    /dashboard.ts            ← Aggregation queries
  /utils
    /packageStatus.ts        ← Status calculation logic
    /dateHelpers.ts

/components
  /ui                        ← Reusable: Button, Badge, Card, Modal, Table
  /layout                    ← Sidebar, Topbar, MobileNav
  /charts                    ← Recharts wrappers
  /attendance                ← AttendanceCard, StudentRow
  /students                  ← StudentCard, PackageStatusBadge

/context
  /AuthContext.tsx

/middleware.ts               ← Route protection
```

---

## 6. ENVIRONMENT VARIABLES

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

FONNTE_API_KEY=                    # for WA reminders (Phase 2)

NEXT_PUBLIC_TENANT_ID=swimplash    # hardcoded for now
```

---

## 7. BUSINESS LOGIC REFERENCE

### Package Status Calculation
```typescript
function calculatePackageStatus(pkg: ActivePackage): PackageStatus {
  const today = new Date();
  const expiry = pkg.expiryDate.toDate();
  const remaining = pkg.totalSessions - pkg.usedSessions;

  if (today > expiry) return "expired";
  if (remaining <= 0) return "done";
  if (remaining <= 2) return "almost_done";
  return "active";
}
```

### Attendance Impact
```typescript
async function processAttendance(records: SessionRecord[], classId: string) {
  for (const record of records) {
    if (record.status === "hadir" || record.status === "no_show") {
      await incrementUsedSessions(record.studentId);
    }
    // reschedule → no change to sessions
    await updatePackageStatus(record.studentId);
  }
  await updateTrainerSessionCount(classId);
}
```

### Reschedule Rules
- Allowed only if: `today <= student.activePackage.expiryDate`
- Does not deduct session
- Does not extend expiryDate
- If reschedule attempted after expiry → status = "expired", session hangus

### No Show Rules
- If no confirmation from student → mark as No Show
- Session deducted (hangus)
- Same behavior as "hadir" for session count

---

## 8. UI/UX GUIDELINES

- **Language:** Bahasa Indonesia for all UI labels
- **Color scheme:** Blue primary (`#1E40AF`), green for active, orange for almost_done, red for done, gray for expired
- **Mobile-first:** All pages must be usable on mobile screen (min-width: 375px)
- **Sidebar:** Collapsible on mobile, always visible on desktop
- **Loading states:** Show skeleton loader on all data fetches
- **Empty states:** Show friendly message + CTA when list is empty
- **Error states:** Show toast notification on write errors

---

## 9. PHASE ROADMAP

| Phase | Scope | Target |
|---|---|---|
| **Phase 1 (MVP)** | Auth + Students + Classes + Attendance + Package Status | Week 1–2 |
| **Phase 2** | Trainers + Salary + Finance | Week 3 |
| **Phase 3** | Dashboard charts + Reports | Week 4 |
| **Phase 4** | WA Reminders (Fonnte) + Settings | Week 5 |
| **Phase 5** | Multi-tenant (sell to other swim schools) | TBD |

---

## 10. OUT OF SCOPE (v1.0)

- Payment gateway integration (Midtrans/Xendit)
- Mobile app (React Native)
- Parent-facing portal
- Online class booking by students
- CCTV / class recording integration

---

## 11. FIRST TASK FOR AGENT

Start with Phase 1 MVP. Execute in this order:

1. `npx create-next-app@latest swimplashos --typescript --tailwind --app`
2. Install dependencies: `firebase`, `recharts`, `cloudinary`
3. Create `/lib/firebase/client.ts` with Firebase init
4. Create `AuthContext` with role-based access
5. Create `middleware.ts` for route protection
6. Create Firestore helper functions for `students` collection
7. Build `/login` page
8. Build `/students` list page with status badges
9. Build `/students/new` form
10. Build `/attendance` landing with today's classes
11. Build `/attendance/session/[classId]` with 1-click attendance input

Generate a Plan Artifact before executing each step.
```

# Enterprise CRM Proyek MPC & EPC Indonesia (`EPC-Simulation`)

Sistem **Enterprise Customer Relationship Management (CRM) & Project Lifecycle Governance** berstandar internasional yang dirancang khusus untuk lanskap korporasi besar, BUMN, anak usaha BUMN, dan perusahaan publik (Tbk) di Indonesia — mendukung skema ganda **EPC (*Engineering, Procurement & Construction* B2B)** serta **MPC (*Master Planned Community* / Kawasan Terpadu)**.

---

## Standar Tata Kelola & Kepatuhan Regulasi

* **Standar Internasional:** ISO/IEC 27001:2022 (*Information Security & Immutable Audit Log*), ISO 9001:2015 (*Document Control*), ITIL v4 (*SLA Retention Helpdesk*), PMBOK 7 (*Earned Physical Progress & Milestone Billing*), dan WCAG 2.1 AA.
* **Kepatuhan Indonesia:**
  * **UU No. 27 Tahun 2022 (UU PDP):** Perekaman *explicit consent timestamp* & *automatic field masking* atas NIK/NPWP 16 digit bagi peran non-otorisasi.
  * **Coretax DJP Tax Engine:** Perhitungan presisi DPP, Diskon, PPN (11%/12%), PPh Pasal 23 (2%), PPh Final Pasal 4(2) Jasa Konstruksi EPC Terintegrasi (2,65%), dan PPh Final Pengalihan Hak Properti MPC (2,5%).
  * **Transaksi Elektronik & Pembayaran:** Pelacakan nomor seri **e-Meterai PERURI**, status Tanda Tangan Elektronik **PSrE Komdigi** (*Peruri Sign / Privy / Vida*), Virtual Account **SNAP BI**, serta referensi sinkronisasi **SAP S/4HANA FI**.

---

## Paket Perdokumenan Standar Korporasi Indonesia (`/docs`)

Seluruh dokumen tata kelola menggunakan standar penomoran baku `[KODE-ENTITAS]/[KODE-DIVISI]/[JENIS-DOK]/[KODE-PROYEK]/[TAHUN]/[NO-URUT]`:

1. [`00-MASTER-DOCUMENT-INDEX.md`](./docs/00-MASTER-DOCUMENT-INDEX.md) — Indeks Induk Deliverable SDLC & Tata Penomoran
2. [`01-KAK-TOR-PROJECT-CHARTER.md`](./docs/01-KAK-TOR-PROJECT-CHARTER.md) — Kerangka Acuan Kerja (`MPC/IT-PMO/KAK/CRM-APP/2026/001`)
3. [`02-PRD-ENTERPRISE-CRM-MPC.md`](./docs/02-PRD-ENTERPRISE-CRM-MPC.md) — Product Requirements Document (`MPC/IT-PMO/PRD/CRM-APP/2026/001`)
4. [`03-FSD-TSD-SYSTEM-WORKFLOW.md`](./docs/03-FSD-TSD-SYSTEM-WORKFLOW.md) — Functional & Technical Specification + Workflow (`MPC/IT-ARC/FSD/CRM-APP/2026/001`)
5. [`04-SIT-UAT-TEST-SCRIPT.md`](./docs/04-SIT-UAT-TEST-SCRIPT.md) — Skenario & Hasil Uji Terima UAT (`MPC/IT-QA/UAT/CRM-APP/2026/001`)
6. [`05-TEMPLATE-BA-UAT-DAN-BAST.md`](./docs/05-TEMPLATE-BA-UAT-DAN-BAST.md) — Template Resmi BA-UAT & BAST Go-Live (`MPC/LEGAL-IT/BAST/CRM-APP/2026/001`)
7. [`06-SOP-JUKNIS-OPERASIONAL.md`](./docs/06-SOP-JUKNIS-OPERASIONAL.md) — SOP & Petunjuk Teknis Lintas Divisi (`MPC/QMS-IT/SOP/CRM-APP/2026/001`)

---

## Arsitektur Teknis & Cara Menjalankan

* **Frontend & API:** Next.js (App Router, TypeScript), React 19, Tailwind CSS, Lucide Icons, `@vercel/functions` Custom Metrics.
* **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless` over TLS 1.3).
* **Deployment:** Vercel Fluid Compute terhubung ke GitHub `devazee/EPC-Simulation`.

```bash
# 1. Instalasi dependensi
npm install

# 2. Salin konfigurasi environment (.env.local)
cp .env.example .env.local
# Isi DATABASE_URL dengan connection string Neon PostgreSQL Anda

# 3. Migrasi 9 tabel inti & seed data simulasi ke Neon PostgreSQL
npm run db:setup

# 4. Jalankan server pengembangan lokal
npm run dev
```

### Konfigurasi Vercel Environment Variables
Pada dashboard Vercel (**Project Settings → Environment Variables**), tambahkan:
* `DATABASE_URL` = *Connection string Neon PostgreSQL Anda (`?sslmode=require`)*
* `NEXT_PUBLIC_ENTITY_CODE` = `MPC`
* `NEXT_PUBLIC_COMPANY_NAME` = `PT Nusantara MPC & EPC Infrastruktur Tbk`

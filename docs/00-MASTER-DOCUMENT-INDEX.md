# INDEKS INDUK DOKUMEN TATA KELOLA PROYEK TI (MASTER SDLC DELIVERABLE MATRIX)
**Sistem Aplikasi Website Enterprise CRM Proyek MPC & EPC Indonesia**

---

## IDENTITAS PENGENDALIAN DOKUMEN (DOCUMENT CONTROL)

| Atribut Dokumen | Keterangan |
| :--- | :--- |
| **Nama Proyek** | Pengembangan Aplikasi Enterprise CRM Proyek MPC & EPC Terintegrasi |
| **Judul Dokumen** | Master SDLC Deliverable Matrix & Standar Tata Penomoran Dokumen Korporasi |
| **Nomor Dokumen** | `MPC/IT-PMO/IDX/CRM-APP/2026/000` |
| **Versi / Revisi** | v1.0 (Baseline Eksekusi) |
| **Tanggal Efektif** | 25 November 2026 |
| **Klasifikasi Keamanan** | **RAHASIA / INTERNAL KORPORASI** *(Dilarang menggandakan tanpa izin tertulis)* |
| **Pemilik Dokumen** | Divisi Teknologi Informasi, PMO & Transformasi Digital |

---

## 1. Standar Tata Kelola & Regulasi Acuan

Seluruh perancangan arsitektur, kode sumber, basis data, dan perdokumenan pada repositori ini disusun mengikuti standar tata kelola internasional dan kepatuhan regulasi korporasi besar/BUMN/Tbk di Indonesia:

1. **ISO/IEC 27001:2022** — Sistem Manajemen Keamanan Informasi (RBAC ketat, enkripsi TLS 1.3 & AES-256, *immutable audit trail*, pemisahan tugas/*segregation of duties*).
2. **ISO 9001:2015 & COBIT 2019** — Sistem Manajemen Mutu & Tata Kelola TI Korporasi (kontrol versi dokumen, matriks pengesahan berjenjang, ketertelusuran kebutuhan hingga pengujian).
3. **PMBOK 7th Edition** — Manajemen siklus proyek EPC (*Engineering, Procurement & Construction*) & pengembangan kawasan terpadu (*Master Planned Community*), *milestone billing*, dan *earned progress*.
4. **ITIL v4** — Manajemen layanan purna jual, masa retensi/garansi pasca-BAST, dan penanganan tiket keluhan berbasis *Service Level Agreement* (SLA).
5. **WCAG 2.1 Level AA** — Standar aksesibilitas antarmuka web internasional (rasio kontras warna, navigasi keyboard `Ctrl+K`, struktur semantik ARIA).
6. **UU No. 27 Tahun 2022 (UU PDP)** — Pelindungan Data Pribadi (pencatatan *explicit consent timestamp*, *field masking* otomatis atas NIK/NPWP bagi pengguna non-otorisasi, dan retensi data).
7. **Regulasi Transaksi Elektronik & Perpajakan Nasional** — Kesiapan integrasi Tanda Tangan Elektronik tersertifikasi **PSrE Komdigi**, **e-Meterai PERURI** (Rp10.000), serta perhitungan otomatis **PPN 11%/12%**, **PPh Pasal 23**, dan **PPh Final Pasal 4 ayat (2)** sesuai skema **Coretax DJP**.

---

## 2. Standar Tata Penomoran Dokumen Korporasi

Seluruh dokumen resmi dalam siklus hidup pengembangan sistem (*SDLC*) dan operasional bisnis menggunakan format baku berikut:

```text
[KODE-ENTITAS]/[KODE-DIVISI]/[JENIS-DOK]/[KODE-PROYEK]/[TAHUN]/[NO-URUT]
```

* **KODE-ENTITAS:** `MPC` (PT Nusantara MPC Infrastruktur Tbk — Entitas Induk Simulasi)
* **KODE-DIVISI:** `IT-PMO` (Project Management Office TI), `IT-ARC` (Arsitektur & Keamanan TI), `IT-QA` (Quality Assurance), `LEGAL-IT` (Hukum & Kepatuhan TI), `QMS-IT` (Quality Management System)
* **JENIS-DOK:** `KAK` (Kerangka Acuan Kerja), `PRD` (Product Requirements Document), `FSD` (Functional & Technical Specification), `UAT` (User Acceptance Test), `BAST` (Berita Acara Serah Terima), `SOP` (Standar Operasional Prosedur)

---

## 3. Daftar Dokumen Wajib Siklus Proyek TI (Deliverable Matrix)

| No | Kode Dokumen | Nama Dokumen & Berkas | Fase SDLC | Penyusun & Penyetuju |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `MPC/IT-PMO/KAK/CRM-APP/2026/001` | [01-KAK-TOR-PROJECT-CHARTER.md](./01-KAK-TOR-PROJECT-CHARTER.md) | Inisiasi | Disusun: PMO • Disetujui: Direksi / Sponsor Proyek |
| 2 | `MPC/IT-PMO/PRD/CRM-APP/2026/001` | [02-PRD-ENTERPRISE-CRM-MPC.md](./02-PRD-ENTERPRISE-CRM-MPC.md) | Perencanaan | Disusun: Product/BA • Disetujui: VP Bisnis & VP IT |
| 3 | `MPC/IT-ARC/FSD/CRM-APP/2026/001` | [03-FSD-TSD-SYSTEM-WORKFLOW.md](./03-FSD-TSD-SYSTEM-WORKFLOW.md) | Desain & Workflow | Disusun: System Architect • Disetujui: Head of IT & Security |
| 4 | `MPC/IT-QA/UAT/CRM-APP/2026/001` | [04-SIT-UAT-TEST-SCRIPT.md](./04-SIT-UAT-TEST-SCRIPT.md) | Pengujian | Disusun: QA Lead • Disetujui: Key User Lintas Divisi |
| 5 | `MPC/LEGAL-IT/BAST/CRM-APP/2026/001` | [05-TEMPLATE-BA-UAT-DAN-BAST.md](./05-TEMPLATE-BA-UAT-DAN-BAST.md) | Rilis & Go-Live | Ditandatangani: Pihak Pertama, Pihak Kedua & Direksi |
| 6 | `MPC/QMS-IT/SOP/CRM-APP/2026/001` | [06-SOP-JUKNIS-OPERASIONAL.md](./06-SOP-JUKNIS-OPERASIONAL.md) | Operasional | Disusun: Tim Implementasi • Disahkan: Divisi Kepatuhan |

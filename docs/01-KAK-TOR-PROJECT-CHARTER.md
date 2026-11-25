# KERANGKA ACUAN KERJA (KAK / TERMS OF REFERENCE) & PROJECT CHARTER
**Pengembangan Sistem Aplikasi Website Enterprise CRM Proyek MPC & EPC**

---

## IDENTITAS PENGENDALIAN DOKUMEN (DOCUMENT CONTROL)

| Atribut Dokumen | Keterangan |
| :--- | :--- |
| **Nama Proyek** | Pengembangan Aplikasi Enterprise CRM Proyek MPC & EPC |
| **Judul Dokumen** | Kerangka Acuan Kerja (Terms of Reference / Project Charter) |
| **Nomor Dokumen** | `MPC/IT-PMO/KAK/CRM-APP/2026/001` |
| **Versi / Revisi** | v1.0 |
| **Tanggal Efektif** | 25 November 2026 |
| **Klasifikasi Keamanan** | **RAHASIA / INTERNAL KORPORASI** *(Dilarang menggandakan tanpa izin tertulis)* |
| **Pemilik Dokumen** | Project Management Office (PMO) & Divisi Transformasi Digital |

### RIWAYAT PERUBAHAN DOKUMEN (REVISION HISTORY)

| Versi | Tanggal | Penyusun | Deskripsi Perubahan | Status |
| :--- | :--- | :--- | :--- | :--- |
| v0.1 | 18/11/2026 | Tim PMO Korporasi | Penyusunan draf inisiasi dan justifikasi investasi TI | Draf Awal |
| v0.9 | 22/11/2026 | Komite Arsitektur & Legal | Penyelarasan kepatuhan UU PDP, Coretax DJP, dan ISO 27001 | Tinjauan Komite |
| v1.0 | 25/11/2026 | Kepala Divisi PMO TI | Pengesahan dokumen KAK sebagai mandat eksekusi proyek | Berlaku Efektif |

### LEMBAR PENGESAHAN BERJENJANG (SIGN-OFF MATRIX)

| Peran Otorisasi | Nama Lengkap | Jabatan & Divisi | Tanggal | Tanda Tangan / TTE |
| :--- | :--- | :--- | :--- | :--- |
| **Disusun Oleh (Prepared By)** | `[Nama Lengkap PMO]` | Head of IT PMO | 25/11/2026 | *(TTE PSrE)* |
| **Diperiksa Oleh (Reviewed By)** | `[Nama Lengkap VP Bisnis]` | VP Commercial, Tender & EPC Operations | 25/11/2026 | *(TTE PSrE)* |
| **Diperiksa Oleh (Reviewed By)** | `[Nama Lengkap VP Legal]` | VP Legal, Risk & Governance (GRC) | 25/11/2026 | *(TTE PSrE)* |
| **Disetujui Oleh (Approved By)** | `[Nama Direktur Utama]` | Direktur Utama / Executive Sponsor | 25/11/2026 | *(TTE & Stempel)* |

---

## BAB I — LATAR BELAKANG & TUJUAN STRATEGIS

### 1.1 Latar Belakang
Dalam pengelolaan proyek berskala besar di Indonesia—baik kontrak **Engineering, Procurement & Construction (EPC)** B2B maupun pengembangan kawasan terpadu **Master Planned Community (MPC)**—proses akuisisi tender/prospek, penyusunan *Bill of Quantities* (BoQ)/simulasi harga, persetujuan deviasi diskon, verifikasi KYC badan hukum/perorangan, kontrak bermeterai elektronik, penagihan termin progres fisik (*Monthly Certificate*), hingga serah terima lapangan (BAST) dan masa retensi masih kerap terfragmentasi di berbagai lembar kerja manual dan aplikasi terpisah.

Fragmentasi ini menimbulkan tiga risiko utama bagi korporasi:
1. **Kebocoran Margin & Keterlambatan Siklus Tender/Kontrak:** Proses persetujuan berjenjang (*tiered approval*) yang berjalan manual memperlambat penerbitan penawaran resmi dan berisiko melewati batas kewenangan diskon.
2. **Risiko Kepatuhan Hukum & Pajak:** Ketidakseragaman validasi NIK/NPWP 16 digit/NITKU/NIB, persetujuan eksplisit UU No. 27 Tahun 2022 (UU PDP), serta potensi selisih perhitungan PPN dan PPh Konstruksi/Jasa.
3. **Temuan Audit Internal (SPI) & Eksternal (KAP/ISO):** Tidak tersedianya jejak audit yang tidak dapat diubah (*immutable audit log*) atas perubahan nilai kontrak, jadwal termin, dan persetujuan BAST.

### 1.2 Maksud & Tujuan
1. Membangun **Single Source of Truth** lintas divisi Marketing, Commercial/Tender, Legal, Finance/Tax, Project Execution, dan After-Sales Care.
2. Memangkas waktu siklus *Lead/RFQ-to-Contract* minimal **35%** melalui otomatisasi CPQ (*Configure, Price, Quote*) dan persetujuan berjenjang ber-SLA.
3. Menjamin ketertiban penagihan termin/angsuran hingga **99,5%** akurasi jadwal dan rekonsiliasi.
4. Mencapai target **Zero Major Audit Finding** melalui pencatatan *immutable audit log* berstandar ISO/IEC 27001:2022.

---

## BAB II — RUANG LINGKUP PEKERJAAN

### 2.1 Lingkup Dalam Pekerjaan (*In-Scope*)
1. **Modul Executive Command Center:** Pemantauan KPI *real-time*, *revenue & cashflow forecast*, rasio menang tender, serta antrean persetujuan direksi.
2. **Modul Omnichannel Lead & Tender Capture:** Pencatatan prospek dari WhatsApp Business API, portal tender/LPSE swasta, pameran/buku tamu QR, dan *lead scoring* otomatis dengan deteksi duplikasi.
3. **Modul Hybrid Pipeline Management (EPC B2B & Kawasan MPC):**
   * *Jalur EPC Konstruksi & Pengadaan B2B:* `RFQ / Tender` → `Aanwijzing & Survey` → `Proposal & BoQ` → `Negosiasi & Klarifikasi` → `SPK / Kontrak` → `BAST`.
   * *Jalur Kawasan Terpadu / Properti MPC:* `Lead Masuk` → `Site Visit` → `NUP / Reservasi` → `Booking Fee` → `PPJB / Akad` → `BAST Unit`.
4. **Modul Accounts, KYC Indonesia & UU PDP Vault:** Validasi struktur NIK (16 digit), NPWP 16 digit/NITKU, NIB OSS, pencatatan persetujuan UU PDP, serta *field masking* otomatis.
5. **Modul CPQ, Tax Engine & Multi-Tier Approval:** Kalkulasi otomatis PPN (11%/12%), PPh Pasal 23 (2%), PPh Final Pasal 4(2) Jasa Konstruksi/Pengalihan Hak (2,65% / 2,5% / 4%), serta eskalasi otomatis Level 0–3.
6. **Modul Digital Contract, Milestone Billing & BAST:** Pengelolaan nomor SPK/PPJB, status e-Meterai PERURI & TTE PSrE, penagihan berbasis progres fisik (*Monthly Certificate*) atau termin, dan checklist BAST digital berpenanda lokasi (*geotag*).
7. **Modul After-Sales Retensi, SLA Ticketing (ITIL v4) & Governance:** Pelacakan masa retensi konstruksi/garansi kawasan, tiket keluhan ber-SLA, Pusat Dokumen Standar Korporasi, serta *Immutable Audit Trail*.

### 2.2 Lingkup Luar Pekerjaan (*Out-of-Scope* Fase 1)
* Penggantian sistem inti akuntansi buku besar (*General Ledger* pada SAP S/4HANA / Oracle ERP)—integrasi dilakukan melalui konektor API/ekspor terstruktur.
* Pembayaran *payroll* internal karyawan perusahaan.

---

## BAB III — ARSITEKTUR DEPLOYMENT & MILESTONE PELAKSANAAN

| Fase | Tahapan Pekerjaan | Deliverable Utama | Target Status |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Perencanaan & Tata Kelola | Dokumen KAK, PRD, FSD/TSD, Matriks UAT, Template BAST & SOP | Selesai |
| **Fase 2** | Penyediaan Infrastruktur Cloud | Repositori GitHub (`EPC-Simulation`), Database Neon PostgreSQL TLS, & Vercel Fluid Compute | Selesai |
| **Fase 3** | Pembangunan Inti Sistem | Skema Database ACID, API Transaksional, RBAC, Tax Engine, & 6 Modul Antarmuka Utama | Eksekusi Penuh |
| **Fase 4** | Pengujian & Serah Terima | Verifikasi Build Produksi, Pengujian End-to-End, BA-UAT, & Go-Live Produksi | Siap Rilis |

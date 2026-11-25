# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Aplikasi Website Enterprise CRM Proyek MPC & EPC Indonesia**

---

## IDENTITAS PENGENDALIAN DOKUMEN (DOCUMENT CONTROL)

| Atribut Dokumen | Keterangan |
| :--- | :--- |
| **Nama Proyek** | Pengembangan Aplikasi Enterprise CRM Proyek MPC & EPC |
| **Judul Dokumen** | Product Requirements Document (PRD) |
| **Nomor Dokumen** | `MPC/IT-PMO/PRD/CRM-APP/2026/001` |
| **Versi / Revisi** | v1.0 |
| **Tanggal Efektif** | 25 November 2026 |
| **Klasifikasi Keamanan** | **RAHASIA / INTERNAL KORPORASI** *(Dilarang menggandakan tanpa izin tertulis)* |
| **Pemilik Dokumen** | Divisi Teknologi Informasi & Transformasi Digital |

### RIWAYAT PERUBAHAN DOKUMEN (REVISION HISTORY)

| Versi | Tanggal | Penyusun | Deskripsi Perubahan | Status |
| :--- | :--- | :--- | :--- | :--- |
| v0.1 | 19/11/2026 | Product Manager / BA | Penyusunan draf awal kebutuhan bisnis dan alur sistem | Draf Awal |
| v0.9 | 23/11/2026 | System Architect | Penyesuaian matriks otorisasi, pajak Coretax, dan kepatuhan UU PDP | Tinjauan Teknis |
| v1.0 | 25/11/2026 | PMO Lead | Pengesahan dokumen final sebagai acuan eksekusi (*Baseline*) | Berlaku Efektif |

### LEMBAR PENGESAHAN BERJENJANG (SIGN-OFF MATRIX)

| Peran Otorisasi | Nama Lengkap | Jabatan & Divisi | Tanggal | Tanda Tangan / TTE |
| :--- | :--- | :--- | :--- | :--- |
| **Disusun Oleh (Prepared By)** | `[Nama Lengkap BA/PM]` | Product Manager / Business Analyst | 25/11/2026 | *(Paraf/TTE)* |
| **Diperiksa Oleh (Reviewed By)** | `[Nama Lengkap Architect]` | Head of IT Architecture & Security | 25/11/2026 | *(Paraf/TTE)* |
| **Diperiksa Oleh (Reviewed By)** | `[Nama Lengkap VP Sales]` | VP Commercial / EPC Project Operations | 25/11/2026 | *(Paraf/TTE)* |
| **Disetujui Oleh (Approved By)** | `[Nama Direktur Utama]` | Direktur Utama / Direktur Proyek | 25/11/2026 | *(TTE & Stempel)* |

---

## BAB I — PENDAHULUAN

### 1.1 Tujuan Bisnis & Indikator Keberhasilan (*North Star KPIs*)
1. **Sentralisasi Data & Single Source of Truth:** Mengeliminasi silo data antara tim Marketing, Commercial/Tender, Legal, Finance, dan Project Delivery dalam satu repositori PostgreSQL terenkripsi.
2. **Akselerasi Siklus Konversi (*Lead/RFQ-to-Contract*):** Memangkas waktu pemrosesan dari prospek/tender masuk hingga penandatanganan SPK/Kontrak/PPJB sebesar **35%** melalui otomatisasi persetujuan berjenjang dan integrasi tanda tangan elektronik.
3. **Ketertiban Penagihan & Serah Terima:** Mencapai **99,5%** akurasi jadwal penagihan termin progres fisik (*Monthly Certificate*)/cicilan serta pelacakan penuh atas Berita Acara Serah Terima (BAST) dan masa retensi/garansi.
4. **Kepatuhan Audit (*Zero Audit Finding*):** Menyediakan *immutable audit trail* atas seluruh mutasi data kritis untuk pemeriksaan SPI, KAP, maupun auditor ISO/IEC 27001.

---

## BAB II — PERSONA PENGGUNA & MATRIKS HAK AKSES (RBAC)

| Role / Jabatan | Kode Sistem | Cakupan Akses Data | Kewenangan Utama dalam Sistem |
| :--- | :--- | :--- | :--- |
| **Direksi / C-Level** | `DIREKSI` | Seluruh Proyek & Entitas (Read/Approve) | Memantau Executive Dashboard, *revenue forecast*, membuka data KYC penuh, serta menyetujui deviasi kontrak/diskon Level 3 (>7% atau nilai strategis). |
| **VP Commercial / Project Director** | `VP_SALES` | Tingkat Divisi / Unit Bisnis | Mengelola kuota & target, memonitor *pipeline*, menugaskan ulang *key account*, dan menyetujui *approval* Level 2 (>3% s.d. 7%). |
| **Sales / Account Manager** | `MANAGER` | Tim Penjualan / Tender | Menyetujui *approval* Level 1 (≤3% atau pergeseran termin ≤7 hari) serta supervisi penawaran BoQ. |
| **Account Executive / Bid Engineer** | `SALES_AE` | Data Prospek & Klien Milik Sendiri | Mengelola *leads*, aktivitas tindak lanjut (WhatsApp/Aanwijzing), menyusun Quotation/BoQ/NUP, dan mengunggah dokumen KYC klien (NIK/NPWP ter-*masking* setelah simpan). |
| **Legal & Tax / Finance Officer** | `LEGAL_FINANCE` | Dokumen Kontrak, KYC & Termin | Memvalidasi NIK/NPWP/NIB tanpa *masking*, meninjau draf SPK/PPJB, membubuhkan e-Meterai PERURI, menerbitkan *invoice* termin + PPN/PPh, dan rekonsiliasi pembayaran. |
| **Project / Estate Manager** | `PROJECT_MANAGER` | Proyek Aktif & Pasca-Kontrak | Mengelola persentase progres fisik proyek/unit, mengunggah laporan lapangan, serta mengeksekusi inspeksi dan BAST digital. |
| **Customer Care / Helpdesk** | `HELPDESK` | Tiket Keluhan & Masa Retensi | Menangani komplain pasca-BAST, melacak *Service Level Agreement* (SLA), dan eskalasi ke kontraktor/tim teknis. |
| **System Administrator (IT)** | `SYSADMIN` | Konfigurasi Sistem & Audit Log | Mengatur RBAC, parameter pajak, alur *workflow*, integrasi API, serta memantau log keamanan (tanpa akses ubah nilai transaksi finansial). |

---

## BAB III — SPESIFIKASI KEBUTUHAN SISTEM

### 3.1 Spesifikasi Fitur Fungsional (Prioritas MoSCoW)

| Kode | Modul Sistem | Deskripsi Kebutuhan Fungsional | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Omnichannel Lead & Tender Capture** | Integrasi prospek dari WhatsApp Business API (WABA), portal e-Procurement/Tender, landing page web, QR buku tamu pameran, dan rujukan mitra. Dilengkapi deteksi duplikasi telepon/email/NPWP dan *Lead Scoring* otomatis (0–100) berbasis BANT. | *Must Have* |
| **FR-02** | **Dynamic Hybrid Pipeline (EPC & MPC)** | Tampilan Kanban interaktif & High-Density Table. Mendukung perpindahan tahapan transaksi baik untuk **Mode Proyek EPC B2B** (`RFQ/Tender` → `Aanwijzing/Survey` → `Proposal & BoQ` → `Negosiasi` → `SPK/Kontrak` → `BAST`) maupun **Mode Kawasan MPC** (`Lead` → `Survey Lokasi` → `NUP` → `Booking Fee` → `PPJB/KPR` → `BAST`). | *Must Have* |
| **FR-03** | **KYC Indonesia & UU PDP Consent** | Validasi format NIK (16 digit), NPWP 16 digit/NITKU, dan NIB OSS (13 digit); perekaman *timestamp* & dasar hukum persetujuan eksplisit UU No. 27/2022 (UU PDP); serta *field masking* otomatis (`3174********0001`) bagi peran di luar `LEGAL_FINANCE` dan `DIREKSI`. | *Must Have* |
| **FR-04** | **CPQ, Tax Engine & Tiered Approval** | Penyusunan Quotation / BoQ otomatis dengan kalkulasi DPP, Diskon, PPN (11% atau PPN Barang Mewah/Umum 12%), PPh Pasal 23 (2%), atau PPh Final Pasal 4(2) Jasa Konstruksi Terintegrasi EPC (2,65%) / Pengalihan Hak Tanah & Bangunan (2,5%), disertai penguncian status otomatis apabila diskon melebihi wewenang pembuat. | *Must Have* |
| **FR-05** | **Digital Contract (PSrE & e-Meterai)** | Generator kontrak SPK/Kontrak EPC/PPJB bernomor baku korporasi, pencatatan nomor seri e-Meterai PERURI, serta pelacakan status tanda tangan elektronik tersertifikasi PSrE (Privy/Vida/Peruri Sign). | *Should Have* |
| **FR-06** | **Milestone Billing & Payment Tracking** | Jadwal penagihan berbasis progres fisik (*Down Payment*, *Monthly Certificate / Termin Progres*, *BAST Billing*, *Retensi 5%*) dengan perhitungan nilai bersih kas masuk, status Virtual Account SNAP BI, dan indikator jatuh tempo. | *Must Have* |
| **FR-07** | **Digital BAST & SLA Ticketing (ITIL v4)** | Formulir daftar periksa (*checklist*) serah terima lapangan beserta koordinat *geotag* lokasi proyek, penerbitan nomor BAST digital, perhitungan otomatis masa retensi/garansi (90–365 hari), dan manajemen tiket komplain ber-SLA. | *Must Have* |
| **FR-08** | **Executive BI, Corporate Docs & Audit Trail** | Visualisasi *real-time* nilai pipeline, rasio konversi, *aging* tagihan proyek, sebaran proyek nasional, Pusat Template Dokumen Korporasi siap cetak, serta *Immutable Audit Log* (`actor`, `role`, `action`, `entity`, `old_value`, `new_value`, `ip_address`, `timestamp`). | *Must Have* |

### 3.2 Matriks Alur Persetujuan Berjenjang (*Corporate Approval Matrix*)

| Level | Kriteria Deviasi Diskon / Termin | Pejabat Penyetuju | Target SLA | Aturan Tambahan |
| :--- | :--- | :--- | :--- | :--- |
| **Level 0** | Diskon `0%` & sesuai termin baku | **Sistem Otomatis** | Instan | Langsung siap terbit Quotation resmi |
| **Level 1** | Diskon `> 0%` s.d. `3,0%` atau geser termin `≤ 7 hari` | **Sales / Account Manager** | 4 Jam Kerja | Notifikasi langsung ke antrean Manager |
| **Level 2** | Diskon `> 3,0%` s.d. `7,0%` atau klausul minor | **VP Commercial / GM Divisi** | 8 Jam Kerja | Wajib lolos verifikasi kelengkapan KYC Legal |
| **Level 3** | Diskon `> 7,0%` atau Nilai Kontrak `≥ Rp50 Miliar` | **Direksi / Komite Proyek** | 24 Jam Kerja | Wajib catatan justifikasi margin proyek |

---

## BAB IV — KEBUTUHAN NON-FUNGSIONAL & KEPATUHAN

1. **Keamanan Data (ISO/IEC 27001:2022):** Koneksi terenkripsi TLS 1.3 ke basis data PostgreSQL (`sslmode=require`), pemisahan variabel lingkungan sensitif dari kode sumber, proteksi *SQL Injection* melalui *parameterized queries*, dan pencatatan jejak audit yang hanya mengizinkan operasi `INSERT` (*append-only* pada level aplikasi).
2. **Performa & Ketersediaan:** Dibangun di atas Next.js App Router pada Vercel Fluid Compute dengan koneksi *connection pooler* Neon PostgreSQL di *region* Asia Tenggara (`ap-southeast-1` Singapura) untuk latensi rendah dari wilayah Indonesia.
3. **Lokalisasi & Aksesibilitas:** Mendukung pengalih bahasa instan (**Bahasa Indonesia** & **English**), pemformatan mata uang Rupiah (`IDR`) & Dolar AS (`USD`), zona waktu Indonesia (`WIB / WITA / WIT`), serta kepatuhan kontras dan navigasi keyboard WCAG 2.1 AA.

---

## BAB V — KRITERIA KEBERTERIMAAN (ACCEPTANCE CRITERIA)

1. Seluruh 8 kebutuhan fungsional (`FR-01` s.d. `FR-08`) berjalan secara *end-to-end* di atas database **Neon PostgreSQL** nyata (bukan penyimpanan statis sementara di memori).
2. Perubahan diskon penawaran di atas `0%` secara otomatis memicu status `PENDING_APPROVAL` pada level pejabat yang tepat sesuai *Corporate Approval Matrix*.
3. Pengguna dengan peran selain `LEGAL_FINANCE` dan `DIREKSI` hanya melihat NIK dan NPWP dalam format ter-*masking* sesuai prinsip minimalisasi data UU PDP.
4. Setiap aksi penambahan maupun pembaruan transaksi secara otomatis menghasilkan baris baru pada tabel `audit_logs` yang dapat diperiksa pada modul Governance.

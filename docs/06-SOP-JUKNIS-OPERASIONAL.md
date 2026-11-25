# STANDAR OPERASIONAL PROSEDUR (SOP) & PETUNJUK TEKNIS PENGGUNA (JUKNIS)
**Aplikasi Website Enterprise CRM Proyek MPC & EPC Indonesia**

---

## IDENTITAS PENGENDALIAN DOKUMEN (DOCUMENT CONTROL)

| Atribut Dokumen | Keterangan |
| :--- | :--- |
| **Nama Proyek** | Pengembangan Aplikasi Enterprise CRM Proyek MPC & EPC |
| **Judul Dokumen** | Standar Operasional Prosedur (SOP) & Petunjuk Teknis Operasional |
| **Nomor Dokumen** | `MPC/QMS-IT/SOP/CRM-APP/2026/001` |
| **Versi / Revisi** | v1.0 |
| **Tanggal Efektif** | 25 November 2026 |
| **Klasifikasi Keamanan** | **INTERNAL KORPORASI** |
| **Pemilik Dokumen** | Divisi Quality Management System (ISO 9001) & Transformasi Digital |

### LEMBAR PENGESAHAN SOP

| Peran Otorisasi | Nama Lengkap | Jabatan & Divisi | Tanggal | Tanda Tangan / TTE |
| :--- | :--- | :--- | :--- | :--- |
| **Disusun Oleh** | `[Nama Tim Implementasi]` | Enterprise CRM Implementation Lead | 25/11/2026 | *(Paraf/TTE)* |
| **Diperiksa Oleh** | `[Nama Head of Compliance]` | Head of QMS & GRC Compliance | 25/11/2026 | *(Paraf/TTE)* |
| **Disahkan Oleh** | `[Nama Direktur Operasi]` | Direktur Operasi & Komersial | 25/11/2026 | *(TTE & Stempel)* |

---

## PROSEDUR OPERASIONAL BAKU PER UNIT KERJA

### 1. Prosedur Akuisisi Prospek & Kepatuhan UU PDP (Tim Marketing & Sales AE)
1. Buka menu **Leads & Omnichannel** pada bilah navigasi kiri.
2. Sebelum menyimpan data pribadi perorangan maupun narahubung korporasi, pastikan pernyataan **Explicit Consent UU No. 27 Tahun 2022 (UU PDP)** telah terkonfirmasi dari kanal masuk (formulir web, pesan pembuka WhatsApp Business API, atau formulir tender).
3. Masukkan nama, institusi, nilai indikatif, serta kanal akuisisi. Sistem akan memvalidasi tidak adanya duplikasi email/nomor telepon dan menghitung **Skor BANT** otomatis.

### 2. Prosedur Pengelolaan Pipeline Proyek EPC & MPC (Sales AE / Bid Engineer)
1. Buka menu **Deals & Pipeline**, lalu pilih filter vertikal (`Semua`, `EPC Konstruksi B2B`, atau `MPC Kawasan Terpadu`) serta mode tampilan (**Kanban Board** atau **High-Density Table**).
2. Perbarui tahapan proyek secara disiplin setiap selesai melaksanakan *Aanwijzing / Site Visit*, pengiriman *Proposal & BoQ*, maupun *Negosiasi Akhir*.

### 3. Prosedur Verifikasi KYC & Perlindungan Data (Tim Legal & Finance)
1. Buka menu **Accounts, KYC & Contracts**.
2. Bagi peran selain `LEGAL_FINANCE` dan `DIREKSI`, nomor **NIK (16 digit)** dan **NPWP 16 digit / NITKU** secara otomatis disamarkan (*masked*).
3. Petugas `LEGAL_FINANCE` wajib memeriksa kesesuaian 16 digit NIK/NPWP dan 13 digit NIB OSS terhadap dokumen resmi klien sebelum mengubah status KYC menjadi **`VERIFIED`**.

### 4. Prosedur Penyusunan Penawaran (CPQ), Pajak & Persetujuan Berjenjang
1. Pada tab **CPQ & Approval**, pilih proyek aktif, masukkan nilai Dasar Pengenaan Pajak (DPP), persentase diskon (jika ada), serta skema pajak (**PPN 11%/12%** dan **PPh Pasal 23 / PPh Final Pasal 4(2) Jasa Konstruksi EPC 2,65% / Properti 2,5%**).
2. Apabila terdapat pengajuan diskon:
   * `≤ 3,0%`: Wajib disetujui oleh **Manager** (SLA 4 jam kerja).
   * `> 3,0% s.d. 7,0%`: Wajib disetujui oleh **VP Commercial / GM** (SLA 8 jam kerja).
   * `> 7,0%` atau nilai kontrak strategis `≥ Rp50 Miliar`: Wajib disetujui oleh **Direksi** (SLA 24 jam kerja).
3. Pejabat penyetuju dapat memproses pengajuan langsung dari **Executive Command Center** atau tab **Approval Matrix**.

### 5. Prosedur Penagihan Termin, BAST Digital & Layanan Masa Retensi
1. Setelah penawaran berstatus `APPROVED` dan KYC `VERIFIED`, petugas `LEGAL_FINANCE` menerbitkan nomor kontrak **SPK / Kontrak EPC / PPJB** beserta nomor seri **e-Meterai PERURI** dan jadwal termin.
2. Selama eksekusi proyek, `PROJECT_MANAGER` memperbarui persentase progres fisik lapangan pada menu **Billing, Termin & BAST** dan menerbitkan **BAST Digital** lengkap dengan skor daftar periksa (*checklist*) serta koordinat *geotag* lokasi.
3. Selama masa retensi/garansi aktif, petugas `HELPDESK` mencatat setiap keluhan pada menu **After-Sales SLA & Governance** dan menyelesaikannya sebelum tenggat waktu *countdown* SLA berakhir.
4. Tim Audit Internal (SPI) dapat meninjau seluruh rekaman aktivitas pada tab **Immutable Audit Log** dan mencetak template dokumen resmi pada menu **Corporate Docs**.

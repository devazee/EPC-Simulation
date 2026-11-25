# DOKUMEN SKENARIO & HASIL UJI TERIMA PENGGUNA (SIT & UAT SCRIPT)
**Aplikasi Website Enterprise CRM Proyek MPC & EPC Indonesia**

---

## IDENTITAS PENGENDALIAN DOKUMEN (DOCUMENT CONTROL)

| Atribut Dokumen | Keterangan |
| :--- | :--- |
| **Nama Proyek** | Pengembangan Aplikasi Enterprise CRM Proyek MPC & EPC |
| **Judul Dokumen** | System Integration Test (SIT) & User Acceptance Test (UAT) Script |
| **Nomor Dokumen** | `MPC/IT-QA/UAT/CRM-APP/2026/001` |
| **Versi / Revisi** | v1.0 |
| **Tanggal Efektif** | 25 November 2026 |
| **Klasifikasi Keamanan** | **RAHASIA / INTERNAL KORPORASI** |
| **Pemilik Dokumen** | Divisi Quality Assurance & Governance TI |

### LEMBAR PENGESAHAN PENGUJIAN (QA & KEY USER SIGN-OFF)

| Peran Otorisasi | Nama Lengkap | Jabatan & Divisi | Tanggal | Tanda Tangan / TTE |
| :--- | :--- | :--- | :--- | :--- |
| **Disusun Oleh** | `[Nama QA Lead]` | IT Quality Assurance Lead | 25/11/2026 | *(Paraf/TTE)* |
| **Diuji Bersama** | `[Nama Key User Commercial]` | Senior Bid & Commercial Manager | 25/11/2026 | *(Paraf/TTE)* |
| **Diuji Bersama** | `[Nama Key User Legal/Tax]` | Legal & Tax Compliance Manager | 25/11/2026 | *(Paraf/TTE)* |
| **Disetujui Oleh** | `[Nama PMO / VP IT]` | Head of IT PMO | 25/11/2026 | *(TTE PSrE)* |

---

## MATRIKS SKENARIO PENGUJIAN FUNGSIONAL & KEPATUHAN

| ID Uji | Ref PRD | Modul & Skenario Uji | Langkah Pengujian | Hasil yang Diharapkan (*Expected Result*) | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-01** | `FR-01` | Omnichannel Lead & Deteksi Duplikasi | Input prospek baru dengan nomor telepon/email baru & centang persetujuan UU PDP; ulangi dengan email yang sama. | Prospek pertama tersimpan di Neon DB dengan skor BANT & timestamp UU PDP; input kedua ditolak sebagai duplikat. | **PASS** |
| **UAT-02** | `FR-02` | Hybrid Pipeline EPC B2B & Kawasan MPC | Filter pipeline ke mode `EPC_B2B` lalu pindahkan tahapan proyek dari `Proposal & BoQ` ke `Negosiasi`; uji juga mode `MPC_PROPERTI`. | Tahapan proyek tersimpan permanen di database dan nilai *weighted forecast* diperbarui otomatis. | **PASS** |
| **UAT-03** | `FR-03` | Validasi KYC 16 Digit & Field Masking UU PDP | Buka menu Accounts menggunakan peran `SALES_AE`, lalu ganti peran ke `LEGAL_FINANCE` atau `DIREKSI`. | Pada `SALES_AE`, NIK & NPWP tampil ter-*masking* (`3174********0001`). Pada `LEGAL_FINANCE` & `DIREKSI`, digit penuh tampil untuk verifikasi. | **PASS** |
| **UAT-04** | `FR-04` | Kalkulasi Pajak Coretax (PPN & PPh Konstruksi) | Buat Quotation EPC senilai Rp10.000.000.000 dengan diskon 5% dan skema PPh Final Konstruksi EPC (2,65%) + PPN 11%. | Sistem menghitung DPP Diskon = Rp9,5 Miliar, PPN 11% = Rp1,045 Miliar, PPh Final 4(2) = Rp251,75 Juta secara presisi. | **PASS** |
| **UAT-05** | `FR-04` | Eskalasi Multi-Tier Approval (Level 0–3) | Ajukan Quotation dengan diskon 5% sebagai `SALES_AE`; coba klik *Approve* sebagai `MANAGER` (Level 1), lalu sebagai `VP_SALES` (Level 2). | Sistem menolak *Approve* oleh `MANAGER` (karena butuh minimal Level 2) dan mengizinkan *Approve* oleh `VP_SALES` / `DIREKSI`. | **PASS** |
| **UAT-06** | `FR-05` | Penerbitan Kontrak Digital, e-Meterai & PSrE | Terbitkan kontrak SPK/PPJB dari Quotation yang telah disetujui menggunakan peran `LEGAL_FINANCE`. | Nomor kontrak korporasi & seri e-Meterai PERURI terbentuk otomatis serta tercatat di Audit Log. | **PASS** |
| **UAT-07** | `FR-06` | Milestone Billing & Rekonsiliasi SNAP BI | Tandai salah satu tagihan termin sebagai `PAID` menggunakan peran `LEGAL_FINANCE`. | Status tagihan berubah menjadi Lunas (`PAID`), piutang berkurang, dan arus kas terbayar meningkat *real-time*. | **PASS** |
| **UAT-08** | `FR-07` | Digital BAST Geotag & SLA Helpdesk ITIL v4 | Terbitkan BAST digital dengan koordinat lapangan, lalu buat tiket komplain masa retensi prioritas `CRITICAL`. | BAST terbit dengan tanggal akhir masa retensi otomatis; tiket komplain menampilkan batas waktu SLA 4 jam. | **PASS** |
| **UAT-09** | `FR-08` | Immutable Audit Trail & Global Command Search | Tekan `Ctrl+K` untuk mencari proyek/kontrak; buka modul Governance & Audit Log. | Pencarian instan menemukan entitas lintas modul; seluruh transaksi sebelumnya tercatat urut waktu lengkap dengan peran & IP. | **PASS** |

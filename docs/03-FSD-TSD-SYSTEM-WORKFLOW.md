# FUNCTIONAL & TECHNICAL SPECIFICATION DOCUMENT (FSD / TSD) & DESIGN WORKFLOW
**Aplikasi Website Enterprise CRM Proyek MPC & EPC Indonesia**

---

## IDENTITAS PENGENDALIAN DOKUMEN (DOCUMENT CONTROL)

| Atribut Dokumen | Keterangan |
| :--- | :--- |
| **Nama Proyek** | Pengembangan Aplikasi Enterprise CRM Proyek MPC & EPC |
| **Judul Dokumen** | Functional & Technical Specification Document (FSD/TSD) & Design Workflow |
| **Nomor Dokumen** | `MPC/IT-ARC/FSD/CRM-APP/2026/001` |
| **Versi / Revisi** | v1.0 |
| **Tanggal Efektif** | 25 November 2026 |
| **Klasifikasi Keamanan** | **RAHASIA / INTERNAL KORPORASI** *(Dilarang menggandakan tanpa izin tertulis)* |
| **Pemilik Dokumen** | Divisi Arsitektur Sistem & Keamanan Informasi (IT Architecture & InfoSec) |

### RIWAYAT PERUBAHAN DOKUMEN (REVISION HISTORY)

| Versi | Tanggal | Penyusun | Deskripsi Perubahan | Status |
| :--- | :--- | :--- | :--- | :--- |
| v0.1 | 20/11/2026 | Lead System Architect | Penyusunan topologi cloud-native, skema ERD, dan API kontrak | Draf Awal |
| v0.9 | 24/11/2026 | InfoSec & Database Lead | Penambahan skema UU PDP masking, append-only audit log, dan Neon TLS | Tinjauan Teknis |
| v1.0 | 25/11/2026 | Head of IT Architecture | Pengesahan spesifikasi fungsional dan teknis final | Berlaku Efektif |

### LEMBAR PENGESAHAN BERJENJANG (SIGN-OFF MATRIX)

| Peran Otorisasi | Nama Lengkap | Jabatan & Divisi | Tanggal | Tanda Tangan / TTE |
| :--- | :--- | :--- | :--- | :--- |
| **Disusun Oleh (Prepared By)** | `[Nama System Architect]` | Principal System Architect | 25/11/2026 | *(TTE PSrE)* |
| **Diperiksa Oleh (Reviewed By)** | `[Nama CISO / InfoSec]` | Head of Information Security (ISO 27001) | 25/11/2026 | *(TTE PSrE)* |
| **Disetujui Oleh (Approved By)** | `[Nama VP IT]` | VP Teknologi Informasi & Digital | 25/11/2026 | *(TTE & Stempel)* |

---

## BAB I — ALUR PROSES BISNIS END-TO-END (SYSTEM WORKFLOW)

### 1.1 Diagram Alir Siklus Hidup CRM Proyek EPC & MPC

```mermaid
flowchart TD
    A["1. Omnichannel Acquisition<br/>(WABA / Tender LPSE / Web / Event QR)"] --> B["Auto-Deduplikasi & Rekam Consent UU PDP"]
    B --> C["Lead Scoring Otomatis (BANT 0-100)<br/>& Distribusi ke AE / Bid Engineer"]
    C --> D{"Mode Vertikal Proyek"}
    D -->|"EPC Konstruksi & Pengadaan B2B"| E1["RFQ/Tender -> Aanwijzing -> Proposal & BoQ -> Negosiasi"]
    D -->|"Master Planned Community (MPC)"| E2["Survey Lokasi -> NUP -> Booking Fee -> Simulasi KPR/Tunai"]
    E1 --> F["CPQ & Tax Engine<br/>(Hitung DPP, Diskon, PPN 11%/12%, PPh 23 / PPh Final 4(2))"]
    E2 --> F
    F --> G{"Cek Deviasi Diskon / Plafon"}
    G -->|"Diskon 0% (Level 0)"| I["Verifikasi KYC (NIK / NPWP 16 Digit / NIB)<br/>oleh Legal & Finance"]
    G -->|"Diskon <= 3% (Level 1)"| H1["Approval Manager (SLA 4 Jam)"]
    G -->|"Diskon > 3% s.d. 7% (Level 2)"| H2["Approval VP / GM Divisi (SLA 8 Jam)"]
    G -->|"Diskon > 7% / >= Rp50M (Level 3)"| H3["Approval Direksi / Komite (SLA 24 Jam)"]
    H1 --> I
    H2 --> I
    H3 --> I
    I --> J["Terbit Kontrak SPK / PPJB<br/>+ e-Meterai PERURI + TTE PSrE"]
    J --> K["Eksekusi Proyek & Milestone Billing<br/>(DP / Monthly Certificate Termin / VA SNAP BI)"]
    K --> L["Inspeksi Lapangan Geotag<br/>& Penerbitan BAST Digital"]
    L --> M["Masa Retensi / Garansi<br/>& Helpdesk Tiket Ber-SLA (ITIL v4)"]
```

### 1.2 Sequence Diagram Otorisasi Berjenjang & Jejak Audit

```mermaid
sequenceDiagram
    actor AE as Sales AE / Bid Engineer
    participant UI as Next.js Enterprise UI
    participant API as Fluid Compute API + Tax Engine
    participant DB as Neon PostgreSQL (TLS 1.3)
    actor APR as Pejabat Penyetuju (Manager/VP/Direksi)
    actor LEG as Legal & Finance Officer

    AE->>UI: Input Quotation / BoQ + Diskon Khusus (mis. 5,5%)
    UI->>API: POST /api/quotations (payload + actor role)
    API->>API: Hitung PPN, PPh & Tentukan Level Approval (Level 2 - VP)
    API->>DB: INSERT quotations (status = PENDING_APPROVAL, required_level = 2)
    API->>DB: INSERT audit_logs (immutable record)
    API-->>UI: Status Terkunci Menunggu Persetujuan VP (SLA 8 Jam)
    APR->>UI: Buka Approval Inbox & Tinjau Margin Proyek
    APR->>API: PATCH /api/quotations/[id]/approve (decision = APPROVED)
    API->>DB: UPDATE quotations SET status = APPROVED & INSERT audit_logs
    LEG->>UI: Verifikasi NIK/NPWP/NIB & Generate Nomor Kontrak + e-Meterai
    LEG->>API: POST /api/contracts
    API->>DB: INSERT contracts & milestone_billings & audit_logs
```

---

## BAB II — ARSITEKTUR TEKNIS CLOUD-NATIVE

| Lapisan Arsitektur | Teknologi Standar | Keterangan Implementasi |
| :--- | :--- | :--- |
| **Presentation & Frontend** | Next.js (App Router, TypeScript), React, Tailwind CSS, Lucide Icons | Antarmuka aksesibel WCAG 2.1 AA, responsif untuk Desktop Eksekutif & Tablet Inspeksi Lapangan, Global Command Palette (`Ctrl+K`), dan i18n (`ID`/`EN`). |
| **Application & Compute** | Vercel Fluid Compute (Node.js LTS Runtime) + `@vercel/functions` | API Routes RESTful terukur dengan instrumen observabilitas *Custom Metrics* (`metric()`). |
| **Database & Persistence** | Neon Serverless PostgreSQL (`ap-southeast-1` AWS Singapore) | Koneksi terenkripsi TLS (`sslmode=require`) menggunakan `@neondatabase/serverless`, transaksi ACID, dan integritas referensial penuh. |
| **Security & Governance** | RBAC Context Guard + UU PDP Masking Utility + Append-Only Audit Trail | *Field masking* dinamis berdasarkan hak akses pengguna dan pencatatan mutasi data secara otomatis. |

---

## BAB III — DESAIN BASIS DATA (KAMUS DATA INTI)

```mermaid
erDiagram
    ACCOUNTS ||--o{ DEALS : "memiliki proyek/transaksi"
    LEADS ||--o| ACCOUNTS : "dikonversi menjadi"
    DEALS ||--o{ QUOTATIONS : "memiliki penawaran/BoQ"
    DEALS ||--o| CONTRACTS : "diikat oleh SPK/PPJB"
    CONTRACTS ||--o{ MILESTONE_BILLINGS : "memiliki jadwal termin"
    DEALS ||--o| BAST_RECORDS : "diserahterimakan melalui"
    DEALS ||--o{ SLA_TICKETS : "memiliki tiket retensi/komplain"

    LEADS {
        serial id PK
        varchar lead_code UK
        varchar full_name
        varchar company_name
        varchar channel
        varchar segment_mode
        int bants_score
        boolean pdp_consent
        timestamptz pdp_consent_at
        varchar status
    }
    ACCOUNTS {
        serial id PK
        varchar account_code UK
        varchar entity_name
        varchar account_type
        varchar nik_16
        varchar npwp_16
        varchar nib_13
        varchar kyc_status
        boolean pdp_explicit_consent
    }
    DEALS {
        serial id PK
        varchar deal_code UK
        int account_id FK
        varchar project_name
        varchar pipeline_mode
        varchar stage
        numeric estimated_value
        int win_probability
        int physical_progress
        varchar location_city
    }
    QUOTATIONS {
        serial id PK
        varchar quote_number UK
        int deal_id FK
        numeric subtotal_dpp
        numeric discount_pct
        varchar tax_scheme
        numeric ppn_amount
        numeric pph_amount
        numeric grand_total
        int required_approval_level
        varchar approval_status
    }
    CONTRACTS {
        serial id PK
        varchar contract_number UK
        int deal_id FK
        varchar contract_type
        varchar emeterai_serial
        varchar psre_provider
        varchar sign_status
        numeric contract_value
    }
    MILESTONE_BILLINGS {
        serial id PK
        varchar invoice_number UK
        int contract_id FK
        varchar term_name
        numeric progress_trigger_pct
        numeric gross_amount
        numeric ppn_amount
        numeric pph_withheld
        date due_date
        varchar payment_status
    }
    BAST_RECORDS {
        serial id PK
        varchar bast_number UK
        int deal_id FK
        numeric checklist_score
        varchar geotag_coords
        date handover_date
        date retention_end_date
        varchar status
    }
    SLA_TICKETS {
        serial id PK
        varchar ticket_number UK
        int deal_id FK
        varchar priority
        varchar category
        timestamptz sla_deadline
        varchar status
    }
    AUDIT_LOGS {
        serial id PK
        varchar actor_name
        varchar actor_role
        varchar action_type
        varchar entity_name
        varchar entity_ref
        text summary_diff
        varchar ip_address
        timestamptz created_at
    }
```

---

## BAB IV — SPESIFIKASI ENDPOINT API INTERNAL (RESTful JSON)

| Method | Endpoint | Deskripsi Fungsi | Otorisasi Peran |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/crm/bootstrap` | Mengambil ringkasan KPI, *leads*, *accounts* (dengan masking UU PDP sesuai peran), *deals*, *quotations*, *contracts*, *billings*, *BAST*, *SLA tickets*, dan *audit logs*. | Seluruh Peran Terautentikasi (dengan Filter Masking) |
| `POST` | `/api/crm/leads` | Registrasi prospek baru + deteksi duplikasi + rekam persetujuan UU PDP + hitung skor BANT. | `SALES_AE`, `MANAGER`, `VP_SALES`, `SYSADMIN` |
| `PATCH` | `/api/crm/deals` | Memindahkan tahapan *pipeline* transaksi atau memperbarui progres fisik lapangan (%). | `SALES_AE`, `MANAGER`, `VP_SALES`, `PROJECT_MANAGER` |
| `POST` | `/api/crm/accounts` | Pendaftaran profil klien & dokumen KYC (validasi 16 digit NIK/NPWP & 13 digit NIB) atau verifikasi KYC oleh Legal. | `SALES_AE`, `LEGAL_FINANCE` |
| `POST` | `/api/crm/quotations` | Membuat penawaran CPQ/BoQ dengan perhitungan PPN/PPh otomatis & penentuan level persetujuan (Level 0–3). | `SALES_AE`, `MANAGER`, `VP_SALES` |
| `PATCH` | `/api/crm/quotations` | Menyetujui (*Approve*) atau menolak (*Reject*) pengajuan deviasi diskon sesuai wewenang jabatan. | `MANAGER` (L1), `VP_SALES` (L2), `DIREKSI` (L3) |
| `POST` | `/api/crm/contracts` | Menerbitkan kontrak digital SPK/PPJB + nomor seri e-Meterai PERURI + jadwal termin awal. | `LEGAL_FINANCE`, `VP_SALES`, `DIREKSI` |
| `PATCH` | `/api/crm/billings` | Rekonsiliasi status pembayaran termin Virtual Account SNAP BI (`PAID` / `ISSUED`). | `LEGAL_FINANCE` |
| `POST` | `/api/crm/bast` | Menerbitkan Berita Acara Serah Terima (BAST) digital beserta *geotag* & masa retensi otomatis. | `PROJECT_MANAGER`, `DIREKSI` |
| `POST` / `PATCH` | `/api/crm/tickets` | Membuka tiket keluhan masa retensi ber-SLA ITIL v4 atau menyelesaikan tiket. | `HELPDESK`, `PROJECT_MANAGER` |

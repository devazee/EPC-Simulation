import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnvLocal();

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(rawUrl);

async function main() {
  console.log('==> Connecting to Neon PostgreSQL (TLS 1.3)...');
  const versionRes = await sql`SELECT version(), current_database(), current_user`;
  console.log('==> Connected:', versionRes[0].current_database, 'as', versionRes[0].current_user);

  console.log('==> Creating 9 Enterprise CRM tables (EPC & MPC Indonesia)...');

  await sql`
    CREATE TABLE IF NOT EXISTS crm_leads (
      id SERIAL PRIMARY KEY,
      lead_code VARCHAR(32) UNIQUE NOT NULL,
      full_name VARCHAR(120) NOT NULL,
      job_title VARCHAR(100) NOT NULL,
      company_name VARCHAR(160) NOT NULL,
      email VARCHAR(140) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      channel VARCHAR(40) NOT NULL,
      segment_mode VARCHAR(32) NOT NULL DEFAULT 'EPC_B2B',
      estimated_budget NUMERIC(18,2) NOT NULL DEFAULT 0,
      bant_score INT NOT NULL DEFAULT 70,
      assigned_ae VARCHAR(100) NOT NULL,
      pdp_consent BOOLEAN NOT NULL DEFAULT TRUE,
      pdp_consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status VARCHAR(32) NOT NULL DEFAULT 'QUALIFIED',
      last_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_accounts (
      id SERIAL PRIMARY KEY,
      account_code VARCHAR(32) UNIQUE NOT NULL,
      entity_name VARCHAR(180) NOT NULL,
      account_type VARCHAR(40) NOT NULL,
      industry_sector VARCHAR(100) NOT NULL,
      pic_name VARCHAR(120) NOT NULL,
      pic_role VARCHAR(100) NOT NULL,
      pic_email VARCHAR(140) NOT NULL,
      pic_phone VARCHAR(40) NOT NULL,
      nik_16 VARCHAR(16) NOT NULL,
      npwp_16 VARCHAR(16) NOT NULL,
      nitku_22 VARCHAR(22) NOT NULL,
      nib_13 VARCHAR(13) NOT NULL,
      city_province VARCHAR(120) NOT NULL,
      kyc_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
      kyc_verified_by VARCHAR(100),
      pdp_explicit_consent BOOLEAN NOT NULL DEFAULT TRUE,
      pdp_consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_deals (
      id SERIAL PRIMARY KEY,
      deal_code VARCHAR(40) UNIQUE NOT NULL,
      account_id INT REFERENCES crm_accounts(id) ON DELETE SET NULL,
      project_name VARCHAR(200) NOT NULL,
      pipeline_mode VARCHAR(32) NOT NULL DEFAULT 'EPC_B2B',
      stage VARCHAR(40) NOT NULL DEFAULT 'RFQ_TENDER',
      estimated_value NUMERIC(18,2) NOT NULL DEFAULT 0,
      currency VARCHAR(8) NOT NULL DEFAULT 'IDR',
      win_probability INT NOT NULL DEFAULT 50,
      physical_progress INT NOT NULL DEFAULT 0,
      pic_ae VARCHAR(100) NOT NULL,
      project_manager VARCHAR(100) NOT NULL,
      location_city VARCHAR(100) NOT NULL,
      province_region VARCHAR(80) NOT NULL,
      target_close_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '45 days',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_quotations (
      id SERIAL PRIMARY KEY,
      quote_number VARCHAR(64) UNIQUE NOT NULL,
      deal_id INT REFERENCES crm_deals(id) ON DELETE CASCADE,
      boq_summary TEXT NOT NULL,
      subtotal_dpp NUMERIC(18,2) NOT NULL,
      discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
      discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
      net_dpp NUMERIC(18,2) NOT NULL,
      ppn_rate NUMERIC(5,2) NOT NULL DEFAULT 11.00,
      ppn_amount NUMERIC(18,2) NOT NULL,
      pph_scheme VARCHAR(40) NOT NULL DEFAULT 'PPH_FINAL_EPC_265',
      pph_rate NUMERIC(5,2) NOT NULL DEFAULT 2.65,
      pph_amount NUMERIC(18,2) NOT NULL,
      grand_total_gross NUMERIC(18,2) NOT NULL,
      net_cash_receivable NUMERIC(18,2) NOT NULL,
      term_deviation_days INT NOT NULL DEFAULT 0,
      required_approval_level INT NOT NULL DEFAULT 0,
      approval_status VARCHAR(32) NOT NULL DEFAULT 'AUTO_APPROVED',
      requested_by VARCHAR(100) NOT NULL,
      approved_by VARCHAR(100),
      approval_notes TEXT,
      sla_hours INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      decided_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_contracts (
      id SERIAL PRIMARY KEY,
      contract_number VARCHAR(64) UNIQUE NOT NULL,
      deal_id INT REFERENCES crm_deals(id) ON DELETE CASCADE,
      quote_id INT REFERENCES crm_quotations(id) ON DELETE SET NULL,
      contract_type VARCHAR(40) NOT NULL,
      emeterai_serial VARCHAR(64) NOT NULL,
      emeterai_status VARCHAR(32) NOT NULL DEFAULT 'STAMPED',
      psre_provider VARCHAR(40) NOT NULL DEFAULT 'PERURI_SIGN',
      sign_status VARCHAR(32) NOT NULL DEFAULT 'FULLY_SIGNED',
      contract_value NUMERIC(18,2) NOT NULL,
      retention_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
      signed_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_billings (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(64) UNIQUE NOT NULL,
      contract_id INT REFERENCES crm_contracts(id) ON DELETE CASCADE,
      deal_id INT REFERENCES crm_deals(id) ON DELETE CASCADE,
      term_name VARCHAR(120) NOT NULL,
      progress_trigger_pct INT NOT NULL DEFAULT 0,
      dpp_amount NUMERIC(18,2) NOT NULL,
      ppn_amount NUMERIC(18,2) NOT NULL,
      pph_withheld NUMERIC(18,2) NOT NULL,
      total_invoice NUMERIC(18,2) NOT NULL,
      snap_va_number VARCHAR(40) NOT NULL,
      due_date DATE NOT NULL,
      payment_status VARCHAR(32) NOT NULL DEFAULT 'ISSUED',
      paid_at TIMESTAMPTZ,
      erp_sync_ref VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_bast (
      id SERIAL PRIMARY KEY,
      bast_number VARCHAR(64) UNIQUE NOT NULL,
      deal_id INT REFERENCES crm_deals(id) ON DELETE CASCADE,
      inspector_name VARCHAR(100) NOT NULL,
      client_rep_name VARCHAR(100) NOT NULL,
      checklist_passed INT NOT NULL DEFAULT 24,
      checklist_total INT NOT NULL DEFAULT 25,
      geotag_coords VARCHAR(120) NOT NULL,
      defect_notes TEXT,
      handover_date DATE NOT NULL DEFAULT CURRENT_DATE,
      retention_days INT NOT NULL DEFAULT 180,
      retention_end_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '180 days',
      psre_signed BOOLEAN NOT NULL DEFAULT TRUE,
      status VARCHAR(40) NOT NULL DEFAULT 'SIGNED_ACTIVE_RETENTION',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_sla_tickets (
      id SERIAL PRIMARY KEY,
      ticket_number VARCHAR(40) UNIQUE NOT NULL,
      deal_id INT REFERENCES crm_deals(id) ON DELETE CASCADE,
      reporter_name VARCHAR(100) NOT NULL,
      category VARCHAR(48) NOT NULL,
      priority VARCHAR(24) NOT NULL DEFAULT 'HIGH',
      subject VARCHAR(200) NOT NULL,
      assigned_team VARCHAR(100) NOT NULL,
      sla_target_hours INT NOT NULL DEFAULT 8,
      sla_deadline TIMESTAMPTZ NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
      resolution_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_audit_logs (
      id SERIAL PRIMARY KEY,
      log_hash VARCHAR(64) NOT NULL,
      actor_name VARCHAR(100) NOT NULL,
      actor_role VARCHAR(40) NOT NULL,
      action_type VARCHAR(48) NOT NULL,
      module_name VARCHAR(48) NOT NULL,
      entity_ref VARCHAR(80) NOT NULL,
      change_summary TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      ip_address VARCHAR(48) NOT NULL DEFAULT '103.144.18.42',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const existingAccounts = await sql`SELECT COUNT(*)::int AS cnt FROM crm_accounts`;
  if (existingAccounts[0].cnt === 0) {
    console.log('==> Seeding realistic Indonesian EPC & MPC Enterprise CRM records...');

    await sql`
      INSERT INTO crm_leads (lead_code, full_name, job_title, company_name, email, phone, channel, segment_mode, estimated_budget, bant_score, assigned_ae, pdp_consent, status, last_message)
      VALUES
        ('LD-2026-001', 'Ir. Hendra Wijaya, M.T.', 'VP Engineering & Capex', 'PT Krakatau Energi Industri', 'hendra.wijaya@krakatau-energi.co.id', '+628119203401', 'LPSE_TENDER', 'EPC_B2B', 84500000000, 94, 'Raka Pratama', TRUE, 'QUALIFIED', 'Dokumen RKS & Tor Aanwijzing PLTS Atap 18 MWp Cilegon telah dikirim via portal e-Proc.'),
        ('LD-2026-002', 'Siti Nurhaliza Kusuma', 'GM Procurement & Supply Chain', 'PT Petrokimia Nusantara Gresik', 'sn.kusuma@petronusantara.co.id', '+6281230048811', 'WABA', 'EPC_B2B', 62000000000, 89, 'Raka Pratama', TRUE, 'QUALIFIED', 'Mohon jadwal presentasi teknis BoQ Water Treatment Plant (WTP) Kapasitas 450 lps.'),
        ('LD-2026-003', 'Bambang Suryono, S.E.', 'Direktur Pengembangan Aset', 'PT Kawasan Industri Subang Mandiri', 'bambang.s@subangmandiri.id', '+628118802219', 'EVENT_QR', 'MPC_PROPERTI', 48000000000, 86, 'Nadia Kusuma', TRUE, 'QUALIFIED', 'Tertarik akuisisi Kavling Industri Kaveling Blok C-12 (3,2 Ha) + Gudang Built-to-Suit.'),
        ('LD-2026-004', 'Dr. Kevin Tanoto', 'Managing Partner', 'Nusantara Data Center Holdings', 'ktanoto@ndcholdings.sg', '+628167709182', 'WEB_PORTAL', 'EPC_B2B', 145000000000, 96, 'Raka Pratama', TRUE, 'CONVERTED', 'Substation GIS 150kV & Civil MEP Hyperscale Campus Cikarang — lanjut tahap negosiasi kontrak.'),
        ('LD-2026-005', 'Dewi Anggraini Putri', 'Family Office Director', 'Anggraini Capital & Land', 'dewi@anggrainicapital.co.id', '+6281399881120', 'PARTNER_REF', 'MPC_PROPERTI', 19500000000, 82, 'Nadia Kusuma', TRUE, 'NEW', 'Permintaan simulasi termin 24x untuk 3 unit Shophouse Boulevard Kawasan Terpadu BSD Timur.')
    `;

    await sql`
      INSERT INTO crm_accounts (account_code, entity_name, account_type, industry_sector, pic_name, pic_role, pic_email, pic_phone, nik_16, npwp_16, nitku_22, nib_13, city_province, kyc_status, kyc_verified_by, pdp_explicit_consent)
      VALUES
        ('ACC-BUMN-001', 'PT Krakatau Energi Industri (Perseroan)', 'BUMN_KORPORASI', 'Energi & Infrastruktur Baja', 'Ir. Hendra Wijaya, M.T.', 'VP Engineering & Capex', 'hendra.wijaya@krakatau-energi.co.id', '+628119203401', '3672011805780001', '0100182930510000', '0100182930510000000001', '9120301829411', 'Cilegon, Banten (WIB)', 'VERIFIED', 'Arif Budiman, S.H. (Legal)', TRUE),
        ('ACC-TBK-002', 'PT Nusantara Data Center Infrastruktur Tbk', 'SWASTA_TBK', 'Hyperscale Data Center & Telco', 'Dr. Kevin Tanoto', 'Chief Infrastructure Officer', 'ktanoto@ndcholdings.sg', '+628167709182', '3174042209810003', '0284910293840000', '0284910293840000000001', '8120019283746', 'Bekasi / Cikarang, Jawa Barat (WIB)', 'VERIFIED', 'Arif Budiman, S.H. (Legal)', TRUE),
        ('ACC-BUMN-003', 'PT Otorita Karya Nusantara Logistik', 'BUMN_KORPORASI', 'Kawasan Logistik & Pelabuhan', 'Ir. Wahyu Darmawan', 'Project Director IKN', 'wahyu.darmawan@oknl.co.id', '+628115409921', '6471051403760002', '0192837465010000', '0192837465010000000002', '9120485739201', 'Balikpapan / IKN, Kalimantan Timur (WITA)', 'VERIFIED', 'Arif Budiman, S.H. (Legal)', TRUE),
        ('ACC-MPC-004', 'PT Kawasan Industri Subang Mandiri', 'SWASTA_TBK', 'Manufaktur EV & Logistik Terpadu', 'Bambang Suryono, S.E.', 'Direktur Pengembangan Aset', 'bambang.s@subangmandiri.id', '+628118802219', '3213030911790004', '0319283746550000', '0319283746550000000001', '0220193847561', 'Subang, Jawa Barat (WIB)', 'PENDING_REVIEW', NULL, TRUE),
        ('ACC-MPC-005', 'PT Petrokimia Nusantara Gresik', 'BUMN_KORPORASI', 'Industri Kimia & Utilitas Air', 'Siti Nurhaliza Kusuma', 'GM Procurement & Supply Chain', 'sn.kusuma@petronusantara.co.id', '+6281230048811', '3525145208840002', '0139485726100000', '0139485726100000000001', '9120112233445', 'Gresik, Jawa Timur (WIB)', 'VERIFIED', 'Arif Budiman, S.H. (Legal)', TRUE)
    `;

    await sql`
      INSERT INTO crm_deals (deal_code, account_id, project_name, pipeline_mode, stage, estimated_value, currency, win_probability, physical_progress, pic_ae, project_manager, location_city, province_region, target_close_date)
      VALUES
        ('PRJ-EPC-2026-001', 2, 'EPC Substation GIS 150kV & MEP Hyperscale Data Center Cikarang', 'EPC_B2B', 'SPK_KONTRAK', 145000000000, 'IDR', 95, 68, 'Raka Pratama', 'Ir. Dimas Prakoso, PMP', 'Cikarang', 'Jawa Barat (WIB)', '2026-12-15'),
        ('PRJ-EPC-2026-002', 3, 'EPC Integrated Fuel & Water Storage Terminal IKN Nusantara', 'EPC_B2B', 'BAST_HANDOVER', 98500000000, 'IDR', 100, 100, 'Raka Pratama', 'Ir. Dimas Prakoso, PMP', 'Sepaku - IKN', 'Kalimantan Timur (WITA)', '2026-11-20'),
        ('PRJ-EPC-2026-003', 1, 'EPC Solar PV Rooftop 18 MWp & BESS Kawasan Baja Cilegon', 'EPC_B2B', 'NEGOSIASI', 84500000000, 'IDR', 80, 0, 'Raka Pratama', 'Ir. Bagus Santoso, IPM', 'Cilegon', 'Banten (WIB)', '2026-12-28'),
        ('PRJ-EPC-2026-004', 5, 'Design & Build Industrial WTP 450 LPS & Zero Liquid Discharge', 'EPC_B2B', 'PROPOSAL_BOQ', 62000000000, 'IDR', 65, 0, 'Raka Pratama', 'Ir. Bagus Santoso, IPM', 'Gresik', 'Jawa Timur (WIB)', '2027-01-20'),
        ('PRJ-MPC-2026-005', 4, 'Akuisisi Lot Industri Blok C-12 (3,2 Ha) & Warehouse Smartpolitan', 'MPC_PROPERTI', 'BOOKING_FEE', 48000000000, 'IDR', 75, 25, 'Nadia Kusuma', 'Ir. Ratna Permata, M.Ars', 'Subang', 'Jawa Barat (WIB)', '2026-12-18'),
        ('PRJ-MPC-2026-006', 2, 'Komersial Executive Hub & Command Office Tower Kavling B-04', 'MPC_PROPERTI', 'PPJB_KPR', 36500000000, 'IDR', 90, 82, 'Nadia Kusuma', 'Ir. Ratna Permata, M.Ars', 'BSD - Tangerang', 'Banten (WIB)', '2026-12-05')
    `;

    await sql`
      INSERT INTO crm_quotations (quote_number, deal_id, boq_summary, subtotal_dpp, discount_pct, discount_amount, net_dpp, ppn_rate, ppn_amount, pph_scheme, pph_rate, pph_amount, grand_total_gross, net_cash_receivable, term_deviation_days, required_approval_level, approval_status, requested_by, approved_by, approval_notes, sla_hours, decided_at)
      VALUES
        ('MPC/COM/QUO/2026/001', 1, 'BoQ Paket Lengkap GIS 150kV, Transformer 2x60 MVA, Scada Automation & Civil Works', 145000000000, 2.00, 2900000000, 142100000000, 11.00, 15631000000, 'PPH_FINAL_EPC_265', 2.65, 3765650000, 157731000000, 153965350000, 0, 3, 'APPROVED', 'Raka Pratama', 'Ir. Suryo Wibowo (Direktur Utama)', 'Disetujui Komite Proyek (Nilai Kontrak Strategis > Rp50M, Gross Margin terjaga 18,4%).', 24, NOW() - INTERVAL '14 days'),
        ('MPC/COM/QUO/2026/002', 2, 'BoQ EPC Tangki Timbun 2x5.000 KL, Jetty Piping, Fire Fighting NFPA & Instrumentasi', 98500000000, 0.00, 0, 98500000000, 11.00, 10835000000, 'PPH_FINAL_EPC_265', 2.65, 2610250000, 109335000000, 106724750000, 0, 3, 'APPROVED', 'Raka Pratama', 'Ir. Suryo Wibowo (Direktur Utama)', 'Sesuai plafon tender BUMN IKN tanpa diskon.', 24, NOW() - INTERVAL '60 days'),
        ('MPC/COM/QUO/2026/003', 3, 'BoQ Tier-1 Bifacial PV Modules 18 MWp, Inverter Skid, BESS 5 MWh & Struktur Baja', 84500000000, 5.50, 4647500000, 79852500000, 11.00, 8783775000, 'PPH_FINAL_EPC_265', 2.65, 2116091250, 88636275000, 86520183750, 5, 3, 'PENDING_L3', 'Raka Pratama', NULL, 'Pengajuan diskon kompetitif 5,5% + nilai proyek Rp79,85M membutuhkan otorisasi Direksi (Level 3).', 24, NULL),
        ('MPC/COM/QUO/2026/004', 5, 'Penawaran Kavling Industri Blok C-12 (32.000 m2) + Konstruksi Gudang Standar Green Building', 48000000000, 4.50, 2160000000, 45840000000, 11.00, 5042400000, 'PPH_FINAL_PROP_250', 2.50, 1146000000, 50882400000, 49736400000, 0, 2, 'PENDING_L2', 'Nadia Kusuma', NULL, 'Diskon early-bird investor kawasan 4,5% menunggu persetujuan VP Commercial (Level 2).', 8, NULL),
        ('MPC/COM/QUO/2026/005', 6, 'Simulasi PPJB Tunai Bertahap 12x Komersial Executive Hub Kavling B-04', 36500000000, 2.50, 912500000, 35587500000, 11.00, 3914625000, 'PPH_FINAL_PROP_250', 2.50, 889687500, 39502125000, 38612437500, 0, 1, 'APPROVED', 'Nadia Kusuma', 'Dian Sastroamidjojo (Sales Manager)', 'Diskon korporasi 2,5% dalam koridor wewenang Level 1.', 4, NOW() - INTERVAL '10 days')
    `;

    await sql`
      INSERT INTO crm_contracts (contract_number, deal_id, quote_id, contract_type, emeterai_serial, emeterai_status, psre_provider, sign_status, contract_value, retention_pct, signed_at)
      VALUES
        ('MPC/LEG/SPK-EPC/2026/001', 1, 1, 'KONTRAK_EPC', 'PERURI-EM-261108892014', 'STAMPED', 'PERURI_SIGN', 'FULLY_SIGNED', 157731000000, 5.00, NOW() - INTERVAL '12 days'),
        ('MPC/LEG/SPK-EPC/2026/002', 2, 2, 'KONTRAK_EPC', 'PERURI-EM-260904418273', 'STAMPED', 'PRIVY_ID', 'FULLY_SIGNED', 109335000000, 5.00, NOW() - INTERVAL '55 days'),
        ('MPC/LEG/PPJB-MPC/2026/003', 6, 5, 'PPJB_NOTARIS', 'PERURI-EM-261109931045', 'STAMPED', 'VIDA_SIGN', 'WAITING_CLIENT', 39502125000, 5.00, NULL)
    `;

    await sql`
      INSERT INTO crm_billings (invoice_number, contract_id, deal_id, term_name, progress_trigger_pct, dpp_amount, ppn_amount, pph_withheld, total_invoice, snap_va_number, due_date, payment_status, paid_at, erp_sync_ref)
      VALUES
        ('INV/MPC-FIN/2026/001', 1, 1, 'Uang Muka (Down Payment 20%)', 0, 28420000000, 3126200000, 753130000, 31546200000, '8890800120260001', '2026-11-18', 'PAID', NOW() - INTERVAL '9 days', 'SAP-FI-19002841'),
        ('INV/MPC-FIN/2026/002', 1, 1, 'Termin I — Monthly Certificate Progres Fisik 50%', 50, 42630000000, 4689300000, 1129695000, 47319300000, '8890800120260002', '2026-12-05', 'ISSUED', NULL, 'SAP-FI-19003119'),
        ('INV/MPC-FIN/2026/003', 2, 2, 'Pelunasan Termin BAST I (95% Kumulatif)', 100, 93575000000, 10293250000, 2479737500, 103868250000, '8890800220260001', '2026-11-22', 'PAID', NOW() - INTERVAL '4 days', 'SAP-FI-19002580'),
        ('INV/MPC-FIN/2026/004', 2, 2, 'Pencairan Retensi Pemeliharaan (5%)', 100, 4925000000, 541750000, 130512500, 5466750000, '8890800220260002', '2027-05-19', 'SCHEDULED', NULL, 'SAP-FI-19002581'),
        ('INV/MPC-FIN/2026/005', 3, 6, 'Booking Fee & Angsuran PPJB Ke-1 (30%)', 30, 10676250000, 1174387500, 266906250, 11850637500, '8890800620260001', '2026-11-20', 'OVERDUE', NULL, 'SAP-FI-19003204')
    `;

    await sql`
      INSERT INTO crm_bast (bast_number, deal_id, inspector_name, client_rep_name, checklist_passed, checklist_total, geotag_coords, defect_notes, handover_date, retention_days, retention_end_date, psre_signed, status)
      VALUES
        ('MPC/PMO/BAST/2026/001', 2, 'Ir. Dimas Prakoso, PMP', 'Ir. Wahyu Darmawan (PT OKNL IKN)', 25, 25, '-0.9728, 116.7089 (Sepaku, IKN Kaltim)', 'Seluruh uji hidrostatik tangki, kalibrasi flowmeter & integrasi fire-pump NFPA-20 lulus 100%.', '2026-11-20', 180, '2027-05-19', TRUE, 'SIGNED_ACTIVE_RETENTION')
    `;

    await sql`
      INSERT INTO crm_sla_tickets (ticket_number, deal_id, reporter_name, category, priority, subject, assigned_team, sla_target_hours, sla_deadline, status, resolution_notes)
      VALUES
        ('TCK-SLA-2026-001', 2, 'Ir. Wahyu Darmawan', 'MEP_ELECTRICAL', 'HIGH', 'Kalibrasi ulang sensor tekanan transmitter PT-204 pada jalur pipa manifold B', 'Tim Instrumentasi & Scada Kaltim', 8, NOW() + INTERVAL '5 hours', 'IN_PROGRESS', 'Teknisi lapangan telah tiba di site Sepaku membawa modul kalibrator HART.'),
        ('TCK-SLA-2026-002', 2, 'Staf Operasi Terminal IKN', 'DOCUMENT_ADMIN', 'LOW', 'Permintaan salinan As-Built Drawing P&ID Revisi Final format DWG & PDF bertanda tangan', 'Engineering Document Control', 24, NOW() + INTERVAL '18 hours', 'RESOLVED', 'Berkas As-Built Drawing telah diunggah ke portal serah terima dokumen.')
    `;

    await sql`
      INSERT INTO crm_audit_logs (log_hash, actor_name, actor_role, action_type, module_name, entity_ref, change_summary, old_value, new_value, ip_address)
      VALUES
        ('sha256:9f82c1d4a7e10b22', 'Arif Budiman, S.H.', 'LEGAL_FINANCE', 'KYC_VERIFIED', 'ACCOUNTS_KYC', 'ACC-BUMN-001', 'Verifikasi validitas NPWP 16 digit, NIB OSS, dan persetujuan eksplisit UU PDP.', 'PENDING_REVIEW', 'VERIFIED', '103.144.18.12'),
        ('sha256:4b71e8092ca5109f', 'Ir. Suryo Wibowo', 'DIREKSI', 'TIER3_APPROVED', 'QUOTATIONS_CPQ', 'MPC/COM/QUO/2026/001', 'Persetujuan Level 3 Direksi atas penawaran EPC Substation GIS 150kV senilai Rp157,73 Miliar.', 'PENDING_L3', 'APPROVED', '103.144.18.05'),
        ('sha256:7d31a662f09b441e', 'Arif Budiman, S.H.', 'LEGAL_FINANCE', 'CONTRACT_STAMPED', 'DIGITAL_CONTRACT', 'MPC/LEG/SPK-EPC/2026/001', 'Pembubuhan e-Meterai PERURI & tanda tangan PSrE Kontrak EPC Cikarang.', 'DRAFT', 'FULLY_SIGNED (PERURI-EM-261108892014)', '103.144.18.12'),
        ('sha256:2e19c553b88a710c', 'Ir. Dimas Prakoso, PMP', 'PROJECT_MANAGER', 'BAST_ISSUED', 'DIGITAL_BAST', 'MPC/PMO/BAST/2026/001', 'Penerbitan BAST Digital berpenanda lokasi (-0.9728, 116.7089) proyek Terminal IKN.', 'PROGRES_98%', 'SIGNED_ACTIVE_RETENTION (180 Hari)', '114.122.41.88')
    `;
  } else {
    console.log('==> Existing data detected in Neon DB — skipping duplicate seed.');
  }

  const counts = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM crm_leads) AS leads,
      (SELECT COUNT(*)::int FROM crm_accounts) AS accounts,
      (SELECT COUNT(*)::int FROM crm_deals) AS deals,
      (SELECT COUNT(*)::int FROM crm_quotations) AS quotations,
      (SELECT COUNT(*)::int FROM crm_contracts) AS contracts,
      (SELECT COUNT(*)::int FROM crm_billings) AS billings,
      (SELECT COUNT(*)::int FROM crm_bast) AS bast,
      (SELECT COUNT(*)::int FROM crm_sla_tickets) AS tickets,
      (SELECT COUNT(*)::int FROM crm_audit_logs) AS audit_logs
  `;

  console.log('==> Neon PostgreSQL Verification Summary:', JSON.stringify(counts[0], null, 2));
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

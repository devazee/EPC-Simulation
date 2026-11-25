import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const DOC_MANIFEST = [
  {
    id: 'idx',
    docCode: 'MPC/IT-PMO/IDX/CRM-APP/2026/000',
    title: 'Master SDLC Deliverable Matrix & Standar Penomoran',
    phase: 'Tata Kelola Induk',
    filename: '00-MASTER-DOCUMENT-INDEX.md',
  },
  {
    id: 'kak',
    docCode: 'MPC/IT-PMO/KAK/CRM-APP/2026/001',
    title: 'Kerangka Acuan Kerja (KAK / Terms of Reference)',
    phase: 'Inisiasi Proyek',
    filename: '01-KAK-TOR-PROJECT-CHARTER.md',
  },
  {
    id: 'prd',
    docCode: 'MPC/IT-PMO/PRD/CRM-APP/2026/001',
    title: 'Product Requirements Document (PRD)',
    phase: 'Perencanaan Bisnis',
    filename: '02-PRD-ENTERPRISE-CRM-MPC.md',
  },
  {
    id: 'fsd',
    docCode: 'MPC/IT-ARC/FSD/CRM-APP/2026/001',
    title: 'Functional & Technical Specification (FSD/TSD) & Workflow',
    phase: 'Desain Arsitektur',
    filename: '03-FSD-TSD-SYSTEM-WORKFLOW.md',
  },
  {
    id: 'uat',
    docCode: 'MPC/IT-QA/UAT/CRM-APP/2026/001',
    title: 'Dokumen Skenario & Hasil Uji Terima (SIT & UAT)',
    phase: 'Quality Assurance',
    filename: '04-SIT-UAT-TEST-SCRIPT.md',
  },
  {
    id: 'bast',
    docCode: 'MPC/LEGAL-IT/BAST/CRM-APP/2026/001',
    title: 'Template Berita Acara UAT & Serah Terima Sistem (BAST)',
    phase: 'Rilis & Go-Live',
    filename: '05-TEMPLATE-BA-UAT-DAN-BAST.md',
  },
  {
    id: 'sop',
    docCode: 'MPC/QMS-IT/SOP/CRM-APP/2026/001',
    title: 'SOP & Petunjuk Teknis Operasional Lintas Divisi',
    phase: 'Operasional',
    filename: '06-SOP-JUKNIS-OPERASIONAL.md',
  },
];

export async function GET() {
  const docsDir = path.join(process.cwd(), 'docs');
  const items = DOC_MANIFEST.map((doc) => {
    const fullPath = path.join(docsDir, doc.filename);
    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      content = `# ${doc.title}\nBerkas ${doc.filename} tidak ditemukan.`;
    }
    return { ...doc, content };
  });

  return NextResponse.json({ documents: items });
}

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import logoKiriSrc from '../../assets/icons/laporan/hasil/logo kiri.webp';
import logoKananSrc from '../../assets/icons/laporan/hasil/logo kanan.webp';

/* ─── Constants ─── */
const PW = 210, ML = 20, MR = 20, CW = PW - ML - MR; // A4 width, margins, content width (mm)
const PAGE_BOTTOM = 282; // max y before footer
const HEADER_END = 38;   // y after header line
const BODY_START = 44;   // y content starts

/* ─── Types ─── */
export interface PdfExportData {
  meeting: { title: string; organizer: string; start_time: string; end_time: string; status: string };
  room: { name: string; location?: string } | null;
  attendance_summary: { total: number; hadir: number; tidak_hadir: number };
  participants: { nama: string; nip: string; unit_kerja: string; status: string; check_in: string | null }[];
  employees: { full_name: string; nip: string; signature_url?: string | null; employee_type?: { employee_type: string } | null; position?: { position: string } | null; work_unit?: { work_unit: string } | null }[];
  notulensiContent: string | null;
  directorName: string;
  directorPosition: string;
  notulisName: string;
  notulisPosition: string;
  documents: { id: number; type: string; file_name: string; url: string | null }[];
  exportSections: { info: boolean; undangan: boolean; kehadiran: boolean; notulensi: boolean; dokumentasi: boolean };
}

/* ─── Helpers ─── */
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function fmtDateLong(d: string) {
  const dt = new Date(d);
  return `${DAYS[dt.getDay()]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}
function fmtDateShort(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
}
function fmtTime(d: string) {
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2, '0')}.${String(dt.getMinutes()).padStart(2, '0')}`;
}
function fmtJember(d: string) {
  const dt = new Date(d);
  return `Jember, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

/** Convert absolute backend URL to relative so Vite proxy handles it */
function proxyUrl(url: string): string {
  // Convert http://localhost:8000/storage/... → /storage/...
  try {
    const u = new URL(url, window.location.origin);
    if (u.pathname.startsWith('/storage')) return u.pathname;
  } catch { /* ignore */ }
  // If it already starts with /storage, or is a relative/data URL, return as-is
  return url;
}

async function loadImg(url: string): Promise<string | null> {
  try {
    const proxied = proxyUrl(url);
    const resp = await fetch(proxied);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = blobUrl; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      return c.toDataURL('image/png');
    } finally { URL.revokeObjectURL(blobUrl); }
  } catch {
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      return c.toDataURL('image/png');
    } catch { return null; }
  }
}

/* ─── Draw header on current page ─── */
function drawHeader(doc: jsPDF, logoL: string | null, logoR: string | null) {
  // Logo kiri: original 22x18, scaled 1.5x → 33x27
  if (logoL) doc.addImage(logoL, 'PNG', ML, 5, 33, 27);
  // Logo kanan: original 18x18, scaled 1.8x → 32x32
  if (logoR) doc.addImage(logoR, 'PNG', PW - MR - 32, 2, 32, 32);

  const cx = PW / 2;
  doc.setFont('times', 'bold'); doc.setFontSize(14);
  doc.text('RUMAH SAKIT CITRA HUSADA JEMBER', cx, 14, { align: 'center' });
  doc.setFont('times', 'normal'); doc.setFontSize(9);
  doc.text('Jl. Teratai No. 22 Jember', cx, 19, { align: 'center' });
  doc.text('Telp. (0331) 486200 Fax. (0331) 427088', cx, 23, { align: 'center' });
  doc.text('Website : www.rscitrahusada.com  Email : rs_citrahusada@yahoo.co.id', cx, 27, { align: 'center' });
  doc.setDrawColor(0); doc.setLineWidth(0.6);
  doc.line(ML, 34, PW - MR, 34);
  doc.setLineWidth(0.15);
  doc.line(ML, 35, PW - MR, 35);
}

function newPage(doc: jsPDF, logoL: string | null, logoR: string | null): number {
  doc.addPage();
  drawHeader(doc, logoL, logoR);
  return BODY_START;
}

function ensureSpace(doc: jsPDF, y: number, need: number, logoL: string | null, logoR: string | null): number {
  if (y + need > PAGE_BOTTOM) return newPage(doc, logoL, logoR);
  return y;
}

/* ─── Section 1: Informasi Rapat ─── */
function drawInfoPage(doc: jsPDF, data: PdfExportData, logoL: string | null, logoR: string | null) {
  drawHeader(doc, logoL, logoR);
  let y = 50;
  doc.setFont('times', 'bold'); doc.setFontSize(13);
  doc.text('Informasi Rapat', PW / 2, y, { align: 'center' });
  doc.setLineWidth(0.4);
  const tw = doc.getTextWidth('Informasi Rapat');
  doc.line(PW / 2 - tw / 2, y + 1, PW / 2 + tw / 2, y + 1);
  y += 18;

  const rows = [
    ['Judul Rapat', data.meeting.title],
    ['Tanggal', fmtDateShort(data.meeting.start_time)],
    ['Waktu', `${fmtTime(data.meeting.start_time)} - ${fmtTime(data.meeting.end_time)}`],
    ['Ruangan', data.room?.name || '-'],
    ['Jumlah Peserta', String(data.attendance_summary.total)],
    ['Jumlah Karyawan Hadir', String(data.attendance_summary.hadir)],
    ['Jumlah Karyawan Tidak Hadir', String(data.attendance_summary.tidak_hadir)],
  ];

  doc.setFont('times', 'normal'); doc.setFontSize(11);
  for (const [label, value] of rows) {
    doc.text(label, ML + 10, y);
    doc.text(':', ML + 80, y);
    doc.text(value, ML + 84, y);
    y += 8;
  }
}

/* ─── Section 3: Daftar Kehadiran ─── */
async function drawAttendancePage(doc: jsPDF, data: PdfExportData, logoL: string | null, logoR: string | null, sigMap: Map<string, string | null>) {
  let y = newPage(doc, logoL, logoR);

  // Sub-header info
  doc.setFont('times', 'normal'); doc.setFontSize(10);
  const infoRows = [
    ['Hari/Tgl', fmtDateLong(data.meeting.start_time)],
    ['Acara', data.meeting.title],
    ['Tempat', data.room?.name || '-'],
    ['Jam', `${fmtTime(data.meeting.start_time)} s/d selesai`],
  ];
  for (const [label, val] of infoRows) {
    doc.setFont('times', 'normal');
    doc.text(label, ML, y);
    doc.text(':', ML + 25, y);
    doc.text(`: ${val}`, ML + 25, y);
    y += 5.5;
  }
  y += 4;

  // Table header
  const colX = [ML, ML + 12, ML + 70, ML + 125]; // NO, NAMA, JABATAN, TTD
  const colW = [12, 58, 55, 45];
  const headers = ['NO', 'NAMA', 'JABATAN', 'TANDA\nTANGAN'];
  const headerH = 12;

  doc.setFont('times', 'bold'); doc.setFontSize(9);
  doc.setDrawColor(0); doc.setLineWidth(0.3);

  function drawTableHeader(atY: number) {
    for (let i = 0; i < 4; i++) {
      doc.rect(colX[i], atY, colW[i], headerH);
      const lines = headers[i].split('\n');
      const lineH = 4;
      const startTextY = atY + (headerH - lines.length * lineH) / 2 + lineH - 0.5;
      lines.forEach((line, li) => {
        doc.text(line, colX[i] + colW[i] / 2, startTextY + li * lineH, { align: 'center' });
      });
    }
  }

  drawTableHeader(y);
  y += headerH;

  // Table rows
  doc.setFont('times', 'normal'); doc.setFontSize(9);
  const rowH = 16; // height per row to fit signature

  for (let i = 0; i < data.participants.length; i++) {
    const p = data.participants[i];
    y = ensureSpace(doc, y, rowH + 2, logoL, logoR);
    if (y === BODY_START) { // new page was added — redraw table header
      drawTableHeader(y);
      y += headerH;
    }

    // Find employee
    const emp = data.employees.find(e =>
      (p.nip && p.nip !== '-' && e.nip === p.nip) ||
      e.full_name?.toLowerCase().trim() === p.nama?.toLowerCase().trim()
    );
    const jabatan = emp?.position?.position || emp?.employee_type?.employee_type || p.unit_kerja || '-';

    // Draw row borders
    for (let c = 0; c < 4; c++) doc.rect(colX[c], y, colW[c], rowH);

    // NO
    doc.text(String(i + 1) + '.', colX[0] + colW[0] / 2, y + rowH / 2 + 1, { align: 'center' });

    // NAMA (with text wrapping)
    const namaLines = doc.splitTextToSize(p.nama, colW[1] - 4);
    doc.text(namaLines, colX[1] + 2, y + 5);

    // JABATAN (with text wrapping)
    const jabLines = doc.splitTextToSize(jabatan, colW[2] - 4);
    doc.text(jabLines, colX[2] + 2, y + 5);

    // TANDA TANGAN — paste signature image if available
    if (p.status === 'Hadir') {
      const sigKey = emp?.full_name || p.nama;
      const sigB64 = sigMap.get(sigKey);
      if (sigB64) {
        try {
          doc.addImage(sigB64, 'PNG', colX[3] + 4, y + 1, colW[3] - 8, rowH - 3);
        } catch { /* fallback: show number */ 
          doc.text(`${i + 1}.`, colX[3] + colW[3] / 2, y + rowH / 2 + 1, { align: 'center' });
        }
      } else {
        doc.text(`${i + 1}.`, colX[3] + colW[3] / 2, y + rowH / 2 + 1, { align: 'center' });
      }
    }

    y += rowH;
  }
}

/* ─── Section 4+5: Notulen Rapat + Penanggung Jawab ─── */
async function drawNotulenPages(doc: jsPDF, data: PdfExportData, logoL: string | null, logoR: string | null, sigMap: Map<string, string | null>) {
  let y = newPage(doc, logoL, logoR);

  // Title
  doc.setFont('times', 'bold'); doc.setFontSize(13);
  doc.text('NOTULEN RAPAT', PW / 2, y, { align: 'center' });
  const tw2 = doc.getTextWidth('NOTULEN RAPAT');
  doc.setLineWidth(0.4);
  doc.line(PW / 2 - tw2 / 2, y + 1, PW / 2 + tw2 / 2, y + 1);
  y += 10;

  // Info sub-header
  doc.setFont('times', 'normal'); doc.setFontSize(10);
  const notInfo = [
    ['Hari/Tanggal', fmtDateLong(data.meeting.start_time)],
    ['Waktu', `${fmtTime(data.meeting.start_time)} WIB s/d selesai`],
    ['Tempat', data.room?.name || '-'],
    ['Acara', data.meeting.title],
  ];
  for (const [label, val] of notInfo) {
    doc.setFont('times', 'bold');
    doc.text(label, ML, y);
    doc.setFont('times', 'normal');
    doc.text(`: ${val}`, ML + 30, y);
    y += 5.5;
  }
  y += 6;

  // Render notulensi HTML content with html2canvas
  if (data.notulensiContent) {
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:640px;padding:10px;background:#fff;font-family:Times New Roman,serif;font-size:14px;line-height:1.6;color:#000;';
    container.innerHTML = data.notulensiContent;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { useCORS: true, allowTaint: true, scale: 2, backgroundColor: '#ffffff' });
      document.body.removeChild(container);

      // Calculate dimensions
      const imgW = CW; // 170mm
      const imgH = (canvas.height / canvas.width) * imgW;
      const pxPerMm = canvas.width / imgW;
      const availFirst = PAGE_BOTTOM - y;
      const availNext = PAGE_BOTTOM - BODY_START;

      if (imgH <= availFirst) {
        // Fits on current page
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', ML, y, imgW, imgH);
        y += imgH + 2;
      } else {
        // Multi-page: slice the canvas
        let srcY = 0;
        let remaining = canvas.height;
        let firstPage = true;

        while (remaining > 0) {
          const avail = firstPage ? availFirst : availNext;
          const sliceH = Math.min(remaining, avail * pxPerMm);

          // Create slice canvas
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceH;
          sliceCanvas.getContext('2d')!.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

          const sliceMmH = sliceH / pxPerMm;
          doc.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', ML, firstPage ? y : BODY_START, imgW, sliceMmH);

          srcY += sliceH;
          remaining -= sliceH;
          y = (firstPage ? y : BODY_START) + sliceMmH + 2;

          if (remaining > 0) {
            y = newPage(doc, logoL, logoR);
            firstPage = false;
          }
        }
      }
    } catch {
      document.body.removeChild(container);
      doc.setFont('times', 'italic'); doc.setFontSize(10);
      doc.text('(Tidak dapat merender notulensi)', ML, y);
      y += 8;
    }
  }

  // ─── Closing: Penanggung Jawab & Notulis ───
  const closingH = 70;
  y = ensureSpace(doc, y, closingH, logoL, logoR);
  y += 10;

  // Date line
  doc.setFont('times', 'normal'); doc.setFontSize(10);
  doc.text(fmtJember(data.meeting.start_time), PW - MR, y, { align: 'right' });
  y += 10;

  // Two columns
  const leftX = ML + 20;
  const rightX = PW - MR - 45;

  doc.setFont('times', 'normal'); doc.setFontSize(10);
  doc.text('Mengetahui', leftX, y, { align: 'center' });
  doc.text('Notulis', rightX, y, { align: 'center' });
  y += 4;

  // Signatures
  const sigY = y;
  const dirSig = sigMap.get(data.directorName);
  const notSig = sigMap.get(data.notulisName);
  if (dirSig) {
    try { doc.addImage(dirSig, 'PNG', leftX - 18, sigY, 36, 18); } catch { /* skip */ }
  }
  if (notSig) {
    try { doc.addImage(notSig, 'PNG', rightX - 18, sigY, 36, 18); } catch { /* skip */ }
  }
  y = sigY + 22;

  // Names
  doc.setFont('times', 'bold');
  doc.text(data.directorName || '_______________', leftX, y, { align: 'center' });
  doc.text(data.notulisName || '_______________', rightX, y, { align: 'center' });
  y += 5;

  // Positions
  doc.setFont('times', 'normal'); doc.setFontSize(9);
  doc.text(data.directorPosition || '', leftX, y, { align: 'center' });
  doc.text(data.notulisPosition || '', rightX, y, { align: 'center' });
}

/* ─── Section 6: Dokumentasi ─── */
async function drawDokumentasiPage(doc: jsPDF, data: PdfExportData, logoL: string | null, logoR: string | null) {
  const dokDocs = data.documents.filter(d => d.type !== 'undangan' && d.url);
  if (dokDocs.length === 0) return;

  let y = newPage(doc, logoL, logoR);

  doc.setFont('times', 'bold'); doc.setFontSize(12);
  doc.text(`Dokumentasi ${data.meeting.title}`, PW / 2, y, { align: 'center' });
  y += 10;

  for (const dokDoc of dokDocs) {
    if (!dokDoc.url) continue;
    const imgB64 = await loadImg(dokDoc.url);
    if (!imgB64) continue;

    // Get image dimensions
    const img = new Image();
    img.src = imgB64;
    await new Promise<void>(r => { img.onload = () => r(); });
    const aspect = img.naturalHeight / img.naturalWidth;
    const imgW = Math.min(CW - 20, 140); // max 140mm wide
    const imgH = imgW * aspect;

    y = ensureSpace(doc, y, imgH + 8, logoL, logoR);
    doc.addImage(imgB64, 'PNG', ML + (CW - imgW) / 2, y, imgW, imgH);
    y += imgH + 8;
  }
}

/* ─── Main Export Function ─── */
export async function generateLaporanPdf(data: PdfExportData): Promise<void> {
  // Load logos
  const [logoL, logoR] = await Promise.all([loadImg(logoKiriSrc), loadImg(logoKananSrc)]);

  // Pre-load all signature images
  const sigMap = new Map<string, string | null>();
  for (const emp of data.employees) {
    if (emp.signature_url && !sigMap.has(emp.full_name)) {
      sigMap.set(emp.full_name, await loadImg(emp.signature_url));
    }
  }

  // Create PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ─── Page 1: Informasi Rapat ───
  if (data.exportSections.info) {
    drawInfoPage(doc, data, logoL, logoR);
  }

  // ─── Page 2+: Daftar Kehadiran ───
  if (data.exportSections.kehadiran) {
    await drawAttendancePage(doc, data, logoL, logoR, sigMap);
  }

  // ─── Page 3+: Notulen Rapat + TTD ───
  if (data.exportSections.notulensi) {
    await drawNotulenPages(doc, data, logoL, logoR, sigMap);
  }

  // ─── Page 4+: Dokumentasi ───
  if (data.exportSections.dokumentasi) {
    await drawDokumentasiPage(doc, data, logoL, logoR);
  }

  // ─── Get main PDF as bytes ───
  const mainPdfBytes = doc.output('arraybuffer');

  // ─── Merge undangan PDF if selected ───
  if (data.exportSections.undangan) {
    const undanganDocs = data.documents.filter(d => d.type === 'undangan' && d.url);
    if (undanganDocs.length > 0) {
      try {
        const finalPdf = await PDFDocument.load(mainPdfBytes);

        for (const uDoc of undanganDocs) {
          if (!uDoc.url) continue;
          try {
            const proxiedUrl = proxyUrl(uDoc.url);
            const resp = await fetch(proxiedUrl);
            const undanganBytes = await resp.arrayBuffer();
            const undanganPdf = await PDFDocument.load(undanganBytes);
            const pages = await finalPdf.copyPages(undanganPdf, undanganPdf.getPageIndices());

            // Insert undangan pages after page 1 (index 1)
            let insertIdx = 1;
            for (const page of pages) {
              finalPdf.insertPage(insertIdx, page);
              insertIdx++;
            }
          } catch (e) {
            console.warn('Could not embed undangan PDF:', e);
          }
        }

        const finalBytes = await finalPdf.save();
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        downloadBlob(blob, `Laporan_${data.meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        return;
      } catch (e) {
        console.warn('pdf-lib merge failed, downloading without undangan:', e);
      }
    }
  }

  // Download without undangan merge
  doc.save(`Laporan_${data.meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

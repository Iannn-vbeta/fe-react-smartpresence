import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingService } from '../../services/meetingService';
import type { MeetingDetailData, ParticipantWithAttendance } from '../../types/meeting';
import './MeetingDetail.css';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<MeetingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* scan modal */
  const [showScan, setShowScan] = useState(false);
  const [scanNip, setScanNip] = useState('');
  const [scanResult, setScanResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await meetingService.show(Number(id));
      setData(res.data);
    } catch {
      setError('Gagal memuat detail rapat.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* scan barcode */
  const handleScan = async () => {
    if (!id || !scanNip.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await meetingService.scanBarcode(Number(id), scanNip.trim());
      setScanResult({ ok: true, msg: res.message || 'Absensi berhasil!' });
      setScanNip('');
      fetchData();
    } catch (err: unknown) {
      let msg = 'Gagal memproses scan.';
      if (err && typeof err === 'object' && 'response' in err) {
        const ae = err as { response?: { data?: { message?: string } } };
        msg = ae.response?.data?.message || msg;
      }
      setScanResult({ ok: false, msg });
    } finally {
      setScanning(false);
      setTimeout(() => scanRef.current?.focus(), 100);
    }
  };

  /* manual attendance */
  const handleManualAttendance = async (p: ParticipantWithAttendance) => {
    if (!id) return;
    try {
      await meetingService.manualAttendance(Number(id), p.id);
      fetchData();
    } catch {
      // ignore
    }
  };

  if (loading) return <div className="meeting-loading">Memuat detail rapat...</div>;
  if (error) return <div className="meeting-error">{error}</div>;
  if (!data) return null;

  const { meeting, participants_with_attendance, attendance_summary } = data;

  return (
    <div className="meeting-detail-page">
      {/* Header */}
      <div className="meeting-page-header">
        <div className="meeting-page-header-text">
          <h1>Presensi Rapat</h1>
          <p>Catat kehadiran peserta rapat</p>
        </div>
        <div className="attendance-counters">
          <div className="attendance-counter">
            <span className="attendance-counter-value hadir">{attendance_summary.hadir}</span>
            <span className="attendance-counter-label">Hadir</span>
          </div>
          <div className="attendance-counter">
            <span className="attendance-counter-value terlambat">0</span>
            <span className="attendance-counter-label">Terlambat</span>
          </div>
          <div className="attendance-counter">
            <span className="attendance-counter-value tidak-hadir">{attendance_summary.tidak_hadir}</span>
            <span className="attendance-counter-label">Tidak Hadir</span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="detail-info-card">
        <h2>
          <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
          Informasi Rapat
        </h2>

        <div className="detail-row single">
          <div className="detail-field">
            <label>Judul Rapat</label>
            <div className="detail-field-value">{meeting.title}</div>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-field">
            <label>Tanggal</label>
            <div className="detail-field-value">{formatDate(meeting.start_time)}</div>
          </div>
          <div className="detail-field">
            <label>Pihak Penyelenggara</label>
            <div className="detail-field-value">{meeting.organizer || '-'}</div>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-field">
            <label>Waktu Mulai</label>
            <div className="detail-field-value">{formatTime(meeting.start_time)}</div>
          </div>
          <div className="detail-field">
            <label>Waktu Selesai</label>
            <div className="detail-field-value">{formatTime(meeting.end_time)}</div>
          </div>
        </div>

        <div className="detail-row single">
          <div className="detail-field">
            <label>Tempat Rapat</label>
            <div className="detail-field-value">{meeting.room?.name || '-'}</div>
          </div>
        </div>
      </div>

      {/* Attendance list */}
      <div className="attendance-card">
        <div className="attendance-header">
          <h3>
            <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            Data Peserta Rapat ({attendance_summary.total} peserta)
          </h3>
          <button className="scan-barcode-btn" onClick={() => { setShowScan(true); setScanResult(null); setScanNip(''); }}>
            <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h2V6h-2v3zm6 0h2V6h-2v3zm-3 0h2V6h-2v3zm-3 4h2v-3h-2v3zm6 0h2v-3h-2v3zm-3 0h2v-3h-2v3z"/></svg>
            Scan Barcode
          </button>
        </div>

        <div className="attendance-list">
          {participants_with_attendance.map(p => (
            <div className={`attendance-item${p.status === 'tidak_hadir' ? ' absent' : ''}`} key={p.id}>
              <div className="attendance-avatar">{initials(p.employee.full_name)}</div>
              <div className="attendance-info">
                <div className="attendance-name">{p.employee.full_name}</div>
                  {[p.employee.position?.position, p.employee.work_unit?.work_unit, `NIP: ${p.employee.nip}`].filter(Boolean).join(' • ')}
              </div>
              <div className="attendance-actions">
                {p.status === 'hadir' ? (
                  <span className="attendance-status-icon hadir">
                    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                    {p.check_in_time ? formatTime(p.check_in_time) : 'Hadir'}
                  </span>
                ) : (
                  <>
                    <span className="attendance-status-icon tidak-hadir">
                      <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
                    </span>
                    <button className="manual-attend-btn" onClick={() => handleManualAttendance(p)}>Hadirkan</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="detail-footer">
        <button className="btn-cancel" onClick={() => navigate('/meetings')}>Batal</button>
        <button className="btn-submit" onClick={() => navigate('/meetings')}>Simpan Presensi</button>
      </div>

      {/* Scan barcode modal */}
      {showScan && (
        <div className="modal-overlay" onClick={() => setShowScan(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Scan Barcode / Input NIP</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem' }}>
              Arahkan barcode scanner ke kolom input atau ketik NIP secara manual.
            </p>
            <input
              ref={scanRef}
              className="scan-input"
              type="text"
              placeholder="Masukkan NIP..."
              value={scanNip}
              onChange={e => setScanNip(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleScan(); }}
              autoFocus
              disabled={scanning}
            />
            {scanResult && (
              <div className={`scan-result ${scanResult.ok ? 'success' : 'error'}`}>
                {scanResult.msg}
              </div>
            )}
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowScan(false)}>Tutup</button>
              <button className="btn-submit" onClick={handleScan} disabled={scanning || !scanNip.trim()}>
                {scanning ? 'Memproses...' : 'Proses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

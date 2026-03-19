import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { meetingService, meetingRoomService, employeeService } from '../../services/meetingService';
import type { MeetingRoom, Employee, MeetingFormData } from '../../types/meeting';
import './MeetingForm.css';

/* helpers */
function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function toLocalDatetimeValue(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MeetingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  /* dropdown data */
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);

  /* form */
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [roomId, setRoomId] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participants, setParticipants] = useState<Employee[]>([]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loadingDetail, setLoadingDetail] = useState(isEdit);

  /* employee search modal */
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [empResults, setEmpResults] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);

  /* load rooms */
  useEffect(() => {
    meetingRoomService.list().then(setRooms).catch(() => {});
  }, []);

  /* load meeting detail for edit */
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const res = await meetingService.show(Number(id));
        const m = res.data.meeting;
        setTitle(m.title);
        setOrganizer(m.organizer || '');
        setRoomId(m.room_id);
        setStartTime(toLocalDatetimeValue(m.start_time));
        setEndTime(toLocalDatetimeValue(m.end_time));
        setParticipants(m.participants?.map(p => p.employee) || []);
      } catch {
        // ignore
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [isEdit, id]);

  /* search employees */
  const searchEmployees = useCallback(async (q: string) => {
    setEmpLoading(true);
    try {
      const res = await employeeService.list({ search: q, per_page: 20 });
      setEmpResults(res.data.data || []);
    } catch {
      setEmpResults([]);
    } finally {
      setEmpLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showEmpModal) return;
    const t = setTimeout(() => searchEmployees(empSearch), 300);
    return () => clearTimeout(t);
  }, [empSearch, showEmpModal, searchEmployees]);

  /* add / remove participant */
  const addParticipant = (emp: Employee) => {
    if (!participants.find(p => p.id === emp.id)) {
      setParticipants(prev => [...prev, emp]);
    }
  };
  const removeParticipant = (empId: number) => {
    setParticipants(prev => prev.filter(p => p.id !== empId));
  };

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    const payload: MeetingFormData = {
      title,
      organizer,
      room_id: roomId as number,
      start_time: startTime ? new Date(startTime).toISOString() : '',
      end_time: endTime ? new Date(endTime).toISOString() : '',
      participant_employee_ids: participants.map(p => p.id),
      participant_work_unit_ids: [],
    };

    try {
      if (isEdit && id) {
        await meetingService.update(Number(id), payload);
      } else {
        await meetingService.store(payload);
      }
      navigate('/meetings');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
        if (axiosErr.response?.data?.errors) {
          setErrors(axiosErr.response.data.errors);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingDetail) {
    return <div className="meeting-loading">Memuat data rapat...</div>;
  }

  return (
    <div className="meeting-form-page">
      {/* Header */}
      <div className="meeting-page-header">
        <div className="meeting-page-header-text">
          <h1>{isEdit ? 'Edit Jadwal Rapat' : 'Tambah Jadwal Rapat'}</h1>
          <p>{isEdit ? 'Ubah informasi jadwal rapat' : 'Buat jadwal rapat baru untuk RS Citra Husada'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Info Card */}
        <div className="meeting-form-card">
          <h2 className="meeting-form-card-title">
            <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
            Informasi Rapat
          </h2>

          <div className="form-row single">
            <div className="form-field">
              <label>Judul Rapat <span className="required">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Masukkan judul rapat" required />
              {errors.title && <div className="form-field-error">{errors.title[0]}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Tanggal & Waktu Mulai <span className="required">*</span></label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              {errors.start_time && <div className="form-field-error">{errors.start_time[0]}</div>}
            </div>
            <div className="form-field">
              <label>Pihak Penyelenggara <span className="required">*</span></label>
              <input type="text" value={organizer} onChange={e => setOrganizer(e.target.value)} placeholder="Nama penyelenggara" />
              {errors.organizer && <div className="form-field-error">{errors.organizer[0]}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Waktu Mulai <span className="required">*</span></label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Waktu Selesai <span className="required">*</span></label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required />
              {errors.end_time && <div className="form-field-error">{errors.end_time[0]}</div>}
            </div>
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Tempat Rapat <span className="required">*</span></label>
              <select value={roomId} onChange={e => setRoomId(e.target.value ? Number(e.target.value) : '')} required>
                <option value="">Pilih tempat rapat</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {errors.room_id && <div className="form-field-error">{errors.room_id[0]}</div>}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="participants-card">
          <div className="participants-header">
            <h3>
              <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              Data Peserta Rapat ({participants.length} peserta)
            </h3>
            <button type="button" className="add-participant-btn" onClick={() => { setShowEmpModal(true); setEmpSearch(''); }}>
              <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              Tambah Peserta Rapat
            </button>
          </div>

          {errors.participants && <div className="form-field-error" style={{ marginBottom: '0.75rem' }}>{errors.participants[0]}</div>}

          {participants.length === 0 ? (
            <div className="participants-empty">Belum ada peserta ditambahkan.</div>
          ) : (
            <div className="participant-list">
              {participants.map(p => (
                <div className="participant-item" key={p.id}>
                  <div className="participant-avatar">{initials(p.full_name)}</div>
                  <div className="participant-info">
                    <div className="participant-name">{p.full_name}</div>
                    <div className="participant-detail">
                      {[p.position?.name, p.work_unit?.name, `NIP: ${p.nip}`].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                  <button type="button" className="participant-remove-btn" onClick={() => removeParticipant(p.id)} title="Hapus peserta">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="meeting-form-footer">
          <button type="button" className="btn-cancel" onClick={() => navigate('/meetings')}>Batal</button>
          <button type="submit" className="btn-submit" disabled={saving}>
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Jadwal Rapat'}
          </button>
        </div>
      </form>

      {/* Employee search modal */}
      {showEmpModal && (
        <div className="modal-overlay" onClick={() => setShowEmpModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3>Tambah Peserta Rapat</h3>
            <input
              className="employee-search-input"
              type="text"
              placeholder="Cari karyawan berdasarkan nama atau NIP..."
              value={empSearch}
              onChange={e => setEmpSearch(e.target.value)}
              autoFocus
            />
            <div className="employee-search-list">
              {empLoading ? (
                <div className="employee-search-loading">Mencari...</div>
              ) : empResults.length === 0 ? (
                <div className="employee-search-loading">Tidak ditemukan.</div>
              ) : (
                empResults.map(emp => {
                  const isSelected = participants.some(p => p.id === emp.id);
                  return (
                    <div
                      key={emp.id}
                      className={`employee-search-item${isSelected ? ' selected' : ''}`}
                      onClick={() => { addParticipant(emp); }}
                    >
                      <div className="employee-search-item-avatar">{initials(emp.full_name)}</div>
                      <div className="employee-search-item-info">
                        <div className="employee-search-item-name">{emp.full_name}</div>
                        <div className="employee-search-item-detail">
                          {[emp.position?.name, emp.work_unit?.name, `NIP: ${emp.nip}`].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                      {isSelected && <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>}
                    </div>
                  );
                })
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn-submit" type="button" onClick={() => setShowEmpModal(false)}>Selesai</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

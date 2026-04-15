import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { meetingService, meetingRoomService } from '../../services/meetingService';
import { employeeService, workUnitService } from '../../services/employeeService';
import { useAuthStore } from '../../store/authStore';
import type { MeetingRoom, MeetingFormData } from '../../types/meeting';
import type { Employee, WorkUnit } from '../../types/employee';
import './MeetingForm.css';

/* Map role string from backend to display-friendly label */
function getRoleDisplayName(role?: string): string {
  if (!role) return '';
  const map: Record<string, string> = {
    'super_admin': 'Super Admin',
    'admin': 'Admin',
    'sekretaris': 'Sekretaris',
    'manajemen': 'Manajemen',
    'karyawan': 'Karyawan',
  };
  return map[role] || role;
}

/* helpers */
function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function toLocalDateValue(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function toLocalTimeValue(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const AVATAR_COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#0ea5e9'];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MeetingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  /* dropdown data */
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);

  /* form */
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState(() => {
    // Auto-fill with logged-in user's username for new meetings
    if (!id) return user?.username || '';
    return '';
  });
  const [roomId, setRoomId] = useState<number | ''>('');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTimeOnly, setStartTimeOnly] = useState('');
  const [endTimeOnly, setEndTimeOnly] = useState('');
  const [participants, setParticipants] = useState<Employee[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loadingDetail, setLoadingDetail] = useState(isEdit);

  /* ─── Division-based participant modal ─── */
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [divisions, setDivisions] = useState<WorkUnit[]>([]);
  const [divisionEmployees, setDivisionEmployees] = useState<Record<number, Employee[]>>({});
  const [allEmployeesMap, setAllEmployeesMap] = useState<Record<number, Employee>>({});
  const [expandedDivisions, setExpandedDivisions] = useState<Set<number>>(new Set());
  const [pendingSelection, setPendingSelection] = useState<Set<number>>(new Set());
  const [divisionSearch, setDivisionSearch] = useState('');
  const [divisionDataLoaded, setDivisionDataLoaded] = useState(false);
  const [divisionLoading, setDivisionLoading] = useState(false);

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
        setMeetingDate(toLocalDateValue(m.start_time));
        setStartTimeOnly(toLocalTimeValue(m.start_time));
        setEndTimeOnly(toLocalTimeValue(m.end_time));
        setParticipants(m.participants?.map(p => p.employee) || []);
      } catch {
        // ignore
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [isEdit, id]);

  /* load division data (once) */
  const loadDivisionData = useCallback(async () => {
    if (divisionDataLoaded) return;
    setDivisionLoading(true);
    try {
      const units = await workUnitService.list();
      setDivisions(units);

      const empMap: Record<number, Employee[]> = {};
      const allMap: Record<number, Employee> = {};

      await Promise.all(
        units.map(async (unit) => {
          const res = await employeeService.list({ work_unit_id: unit.id, per_page: 200 });
          const emps = res.data.data || [];
          empMap[unit.id] = emps;
          emps.forEach(emp => { allMap[emp.id] = emp; });
        })
      );

      setDivisionEmployees(empMap);
      setAllEmployeesMap(allMap);
      setDivisionDataLoaded(true);
    } catch {
      // ignore
    } finally {
      setDivisionLoading(false);
    }
  }, [divisionDataLoaded]);

  /* open modal */
  const openParticipantModal = useCallback(() => {
    setPendingSelection(new Set(participants.map(p => p.id)));
    setDivisionSearch('');
    setExpandedDivisions(new Set());
    setShowEmpModal(true);
    loadDivisionData();
  }, [participants, loadDivisionData]);

  /* filtered participants based on search */
  const filteredParticipants = useMemo(() => {
    const q = participantSearch.toLowerCase().trim();
    if (!q) return participants;
    return participants.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      (p.position?.position || '').toLowerCase().includes(q) ||
      (p.work_unit?.work_unit || '').toLowerCase().includes(q) ||
      (p.nip || '').toLowerCase().includes(q)
    );
  }, [participants, participantSearch]);

  /* filtered divisions based on search */
  const filteredDivisions = useMemo(() => {
    const q = divisionSearch.toLowerCase().trim();
    if (!q) return divisions;
    return divisions.filter(div => {
      const emps = divisionEmployees[div.id] || [];
      return (
        div.work_unit.toLowerCase().includes(q) ||
        emps.some(e => e.full_name.toLowerCase().includes(q))
      );
    });
  }, [divisions, divisionEmployees, divisionSearch]);

  /* get filtered employees within a division */
  const getFilteredEmployees = useCallback((divId: number) => {
    const emps = divisionEmployees[divId] || [];
    const q = divisionSearch.toLowerCase().trim();
    if (!q) return emps;
    return emps.filter(e => e.full_name.toLowerCase().includes(q));
  }, [divisionEmployees, divisionSearch]);

  /* toggle expand */
  const toggleExpand = (divId: number) => {
    setExpandedDivisions(prev => {
      const next = new Set(prev);
      if (next.has(divId)) next.delete(divId);
      else next.add(divId);
      return next;
    });
  };

  /* toggle single employee */
  const toggleEmployee = (empId: number) => {
    setPendingSelection(prev => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  /* select all / deselect all for a division */
  const toggleSelectAllDivision = (divId: number) => {
    const emps = getFilteredEmployees(divId);
    const allSelected = emps.every(e => pendingSelection.has(e.id));
    setPendingSelection(prev => {
      const next = new Set(prev);
      if (allSelected) {
        emps.forEach(e => next.delete(e.id));
      } else {
        emps.forEach(e => next.add(e.id));
      }
      return next;
    });
  };

  /* save modal selection */
  const handleModalSave = () => {
    const selectedEmps: Employee[] = [];
    pendingSelection.forEach(id => {
      const emp = allEmployeesMap[id];
      if (emp) selectedEmps.push(emp);
    });
    setParticipants(selectedEmps);
    setShowEmpModal(false);
  };

  /* remove participant from list */
  const removeParticipant = (empId: number) => {
    setParticipants(prev => prev.filter(p => p.id !== empId));
  };

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    const startIso = meetingDate && startTimeOnly ? new Date(`${meetingDate}T${startTimeOnly}`).toISOString() : '';
    const endIso = meetingDate && endTimeOnly ? new Date(`${meetingDate}T${endTimeOnly}`).toISOString() : '';

    const payload: MeetingFormData = {
      title,
      organizer,
      room_id: roomId as number,
      start_time: startIso,
      end_time: endIso,
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
              <label>Tanggal Rapat <span className="required">*</span></label>
              <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required />
              {errors.start_time && <div className="form-field-error">{errors.start_time[0]}</div>}
            </div>
            <div className="form-field">
              <label>Pihak Penyelenggara <span className="required">*</span></label>
              <input type="text" value={organizer} readOnly className="input-readonly" placeholder="Penyelenggara" />
              {errors.organizer && <div className="form-field-error">{errors.organizer[0]}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Waktu Mulai <span className="required">*</span></label>
              <input type="time" value={startTimeOnly} onChange={e => setStartTimeOnly(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Waktu Selesai <span className="required">*</span></label>
              <input type="time" value={endTimeOnly} onChange={e => setEndTimeOnly(e.target.value)} required />
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
            <button type="button" className="add-participant-btn" onClick={openParticipantModal}>
              <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              Tambah Peserta Rapat
            </button>
          </div>

          {errors.participants && <div className="form-field-error" style={{ marginBottom: '0.75rem' }}>{errors.participants[0]}</div>}

          {/* Search peserta */}
          {participants.length > 0 && (
            <div className="participant-search-wrapper">
              <svg className="participant-search-icon" viewBox="0 0 24 24" width="18" height="18">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#94a3b8"/>
              </svg>
              <input
                type="text"
                className="participant-search-input"
                placeholder="Cari peserta berdasarkan nama, jabatan, atau NIP..."
                value={participantSearch}
                onChange={e => setParticipantSearch(e.target.value)}
              />
              {participantSearch && (
                <button type="button" className="participant-search-clear" onClick={() => setParticipantSearch('')}>
                  ✕
                </button>
              )}
            </div>
          )}

          {participants.length === 0 ? (
            <div className="participants-empty">Belum ada peserta ditambahkan.</div>
          ) : filteredParticipants.length === 0 ? (
            <div className="participants-empty">Tidak ada peserta yang cocok dengan pencarian.</div>
          ) : (
            <div className={`participant-list${filteredParticipants.length > 5 ? ' scrollable' : ''}`}>
              {filteredParticipants.map(p => (
                <div className="participant-item" key={p.id}>
                  <div className="participant-avatar" style={{ background: avatarColor(p.full_name) }}>{initials(p.full_name)}</div>
                  <div className="participant-info">
                    <div className="participant-name">{p.full_name}</div>
                    <div className="participant-detail">
                      {[p.position?.position, p.work_unit?.work_unit, `NIP: ${p.nip}`].filter(Boolean).join(' • ')}
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

      {/* ─── Division & Participant Selection Modal ─── */}
      {showEmpModal && (
        <div className="modal-overlay" onClick={() => setShowEmpModal(false)}>
          <div className="division-modal-box" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="division-modal-header">
              <h3>Division & Participant Selection</h3>
              <button type="button" className="division-modal-close" onClick={() => setShowEmpModal(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
              </button>
            </div>

            {/* Search */}
            <div className="division-search-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#94a3b8"/></svg>
              <input
                type="text"
                className="division-search-input"
                placeholder="Search participants by name..."
                value={divisionSearch}
                onChange={e => setDivisionSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Division list */}
            <div className="division-list">
              {divisionLoading ? (
                <div className="division-loading">Memuat data divisi...</div>
              ) : filteredDivisions.length === 0 ? (
                <div className="division-loading">Tidak ada divisi ditemukan.</div>
              ) : (
                filteredDivisions.map(div => {
                  const emps = getFilteredEmployees(div.id);
                  const totalMembers = (divisionEmployees[div.id] || []).length;
                  const isExpanded = expandedDivisions.has(div.id);
                  const allSelected = emps.length > 0 && emps.every(e => pendingSelection.has(e.id));
                  const someSelected = emps.some(e => pendingSelection.has(e.id));

                  return (
                    <div className="division-section" key={div.id}>
                      {/* Division header */}
                      <div className="division-header" onClick={() => toggleExpand(div.id)}>
                        <div className="division-header-left">
                          <div className="division-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="#1d4ed8"/></svg>
                          </div>
                          <div className="division-title-info">
                            <span className="division-name">{div.work_unit}</span>
                            <span className="division-count">{totalMembers} members</span>
                          </div>
                        </div>
                        <div className="division-header-right">
                          <label className="division-select-all" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                              onChange={() => toggleSelectAllDivision(div.id)}
                            />
                            <span>Select All</span>
                          </label>
                          <svg className={`division-chevron ${isExpanded ? 'expanded' : ''}`} viewBox="0 0 24 24" width="20" height="20">
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" fill="#64748b"/>
                          </svg>
                        </div>
                      </div>

                      {/* Employee list */}
                      {isExpanded && (
                        <div className="division-members">
                          {emps.length === 0 ? (
                            <div className="division-no-members">Tidak ada anggota ditemukan.</div>
                          ) : (
                            emps.map(emp => {
                              const checked = pendingSelection.has(emp.id);
                              return (
                                <div
                                  key={emp.id}
                                  className={`division-member-item ${checked ? 'checked' : ''}`}
                                  onClick={() => toggleEmployee(emp.id)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleEmployee(emp.id)}
                                    onClick={e => e.stopPropagation()}
                                    className="member-checkbox"
                                  />
                                  <div className="member-avatar" style={{ background: avatarColor(emp.full_name) }}>
                                    {initials(emp.full_name)}
                                  </div>
                                  <div className="member-info">
                                    <div className="member-name">{emp.full_name}</div>
                                    <div className="member-position">{emp.position?.position || '-'}</div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="division-modal-footer">
              <span className="division-selected-count">{pendingSelection.size} peserta dipilih</span>
              <div className="division-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEmpModal(false)}>Cancel</button>
                <button type="button" className="btn-division-save" onClick={handleModalSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

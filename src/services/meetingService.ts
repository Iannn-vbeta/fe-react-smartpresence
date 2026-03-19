import api from './api';
import type {
  Meeting,
  MeetingDetailData,
  MeetingFormData,
  MeetingRoom,
  Employee,
  WorkUnit,
  PaginatedResponse,
} from '../types/meeting';

/* ─── Meetings ─── */
export const meetingService = {
  async list(params?: Record<string, string | number>): Promise<{ data: PaginatedResponse<Meeting> }> {
    const res = await api.get('/meetings', { params });
    return res.data;
  },

  async show(id: number): Promise<{ data: MeetingDetailData }> {
    const res = await api.get(`/meeting/${id}`);
    return res.data;
  },

  async store(data: MeetingFormData): Promise<{ data: Meeting }> {
    const res = await api.post('/meeting', data);
    return res.data;
  },

  async update(id: number, data: Partial<MeetingFormData>): Promise<{ data: Meeting }> {
    const res = await api.patch(`/meeting/${id}`, data);
    return res.data;
  },

  async destroy(id: number): Promise<void> {
    await api.delete(`/meeting/${id}`);
  },

  async scanBarcode(meetingId: number, nip: string) {
    const res = await api.post(`/meeting/${meetingId}/scan`, { nip });
    return res.data;
  },

  async manualAttendance(meetingId: number, participantId: number) {
    const res = await api.patch(`/meeting/${meetingId}/attendance/${participantId}`);
    return res.data;
  },
};

/* ─── Dropdown data ─── */
export const meetingRoomService = {
  async list(): Promise<MeetingRoom[]> {
    const res = await api.get('/meeting-rooms');
    // The API returns paginated data or all data
    return res.data.data?.data || res.data.data || [];
  },
};

export const employeeService = {
  async list(params?: Record<string, string | number>): Promise<{ data: PaginatedResponse<Employee> }> {
    const res = await api.get('/employees', { params });
    return res.data;
  },
};

export const workUnitService = {
  async list(): Promise<WorkUnit[]> {
    const res = await api.get('/work-units');
    return res.data.data || [];
  },
};

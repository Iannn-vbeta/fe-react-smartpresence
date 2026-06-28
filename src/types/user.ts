export interface LoginRequest {
  nip?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Role {
  id: number;
  role: string;
}

export interface User {
  id: number;
  name: string;
  nip: string;
  role_id: number;
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface UserFormData {
  name: string;
  nip: string;
  password?: string;
  role_id: number | '';
}

export interface PaginatedUsersResponse {
  current_page: number;
  data: User[];
  last_page: number;
  per_page: number;
  total: number;
}

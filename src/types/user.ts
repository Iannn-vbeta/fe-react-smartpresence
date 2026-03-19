export interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

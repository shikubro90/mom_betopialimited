export type Role = "USER" | "ADMIN";

export interface User {
  id:        string;
  email:     string;
  name:      string | null;
  role:      Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  data?:  T;
  error?: string;
}

export type UserRole = 'ADMIN' | 'USER'

export interface AuthUser {
  uid: string
  email: string
  role: UserRole
  fullName: string | null
  phone: string | null
}

export interface LoginResponse {
  uid: string
  email: string
}

export interface RegisterResponse {
  uid: string
  fullName: string
  email: string
  phone: string | null
}

export interface AuthMeResponse {
  uid: string
  email: string
  role: UserRole
  fullName: string | null
  phone: string | null
}

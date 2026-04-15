import axios from 'axios'
import type { AuthMeResponse, LoginResponse, RegisterResponse } from './types/auth'
import type {
  FoodItem,
  FoodUpsertPayload,
  Menu,
  MenuImageUploadResponse,
  MenuUpsertPayload,
  OrderStatus,
  OrderStatusUpdatePayload,
  OrderRequestDTO,
  OrderResponseDTO,
  ReclamationCreateRequestDTO,
  ReclamationResponseDTO,
} from './types/dashboard'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/resto-backend'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function resolveBackendUrl(url?: string | null) {
  if (!url) {
    return null
  }

  try {
    return new URL(url, API_BASE_URL).toString()
  } catch {
    return url
  }
}

export const authApi = {
  register: (payload: { fullName: string; email: string; phone?: string; password: string }) =>
    api.post<RegisterResponse>('/api/auth/register', payload),
  login: (payload: { email: string; password: string }) => api.post<LoginResponse>('/api/auth/login', payload),
  firebaseLogin: (payload: { token: string }) => api.post<LoginResponse>('/api/auth/firebase', payload),
  me: () => api.get<AuthMeResponse>('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
}

export const menuApi = {
  getAllMenus: (_token?: string | null) => api.get<Menu[]>('/api/menus'),
  createMenu: (payload: MenuUpsertPayload, _token?: string | null) => api.post<Menu>('/api/menus', payload),
  updateMenu: (id: number, payload: MenuUpsertPayload, _token?: string | null) => api.put<Menu>(`/api/menus/${id}`, payload),
  deleteMenu: (id: number, _token?: string | null) => api.delete(`/api/menus/${id}`),
}

export const foodApi = {
  getAllFoods: (_token?: string | null) => api.get<FoodItem[]>('/api/foods'),
  createFood: (payload: FoodUpsertPayload, _token?: string | null) => api.post<FoodItem>('/api/foods', payload),
  updateFood: (id: number, payload: FoodUpsertPayload, _token?: string | null) => api.put<FoodItem>(`/api/foods/${id}`, payload),
  setFoodEnabled: (id: number, enabled: boolean, _token?: string | null) =>
    api.patch<FoodItem>(`/api/foods/${id}/enabled`, null, {
      params: { enabled },
    }),
  deleteFood: (id: number, _token?: string | null) => api.delete(`/api/foods/${id}`),
  uploadMenuImage: (file: File, _token?: string | null) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.post<MenuImageUploadResponse>('/api/uploads/menu-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export const orderApi = {
  createOrder: (payload: OrderRequestDTO, _token?: string | null) => api.post<OrderResponseDTO>('/api/orders', payload),
  getAllOrders: (_token?: string | null) => api.get<OrderResponseDTO[]>('/api/orders'),
  getMyOrders: (_token?: string | null) => api.get<OrderResponseDTO[]>('/api/orders/my'),
  getOrderById: (id: number, _token?: string | null) => api.get<OrderResponseDTO>(`/api/orders/${id}`),
  updateOrderStatus: (id: number, status: OrderStatus, _token?: string | null) =>
    api.put<OrderResponseDTO>(`/api/admin/orders/${id}/status`, { status } as OrderStatusUpdatePayload),
}

export const reclamationApi = {
  submitPublic: (payload: ReclamationCreateRequestDTO) =>
    api.post<ReclamationResponseDTO>('/api/reclamations/public', payload),
  getAllAdmin: (_token?: string | null) => api.get<ReclamationResponseDTO[]>('/api/reclamations/admin'),
  getByIdAdmin: (id: number, _token?: string | null) => api.get<ReclamationResponseDTO>(`/api/reclamations/admin/${id}`),
  markReadAdmin: (id: number, _token?: string | null) => api.patch<ReclamationResponseDTO>(`/api/reclamations/admin/${id}/read`, null),
}

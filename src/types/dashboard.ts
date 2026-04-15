export interface Menu {
  id: number
  name: string
  description: string
  enabled?: boolean
}

export interface FoodItem {
  id: number
  menuId: number
  name: string
  description: string
  price: number
  imageUrl?: string | null
  enabled?: boolean
}

export interface MenuUpsertPayload {
  name: string
  description: string
  enabled?: boolean
}

export interface FoodUpsertPayload {
  menuId: number
  name: string
  description: string
  price: number
  imageUrl?: string | null
  enabled?: boolean
}

export interface MenuImageUploadResponse {
  url: string
}

export interface OrderItemRequest {
  menuItemId: number
  quantity: number
}

export interface OrderRequestDTO {
  items: OrderItemRequest[]
  phone: string
  note?: string
  pickupTime: string
}

export interface OrderItemResponseDTO {
  menuItemId: number
  menuItemName: string
  quantity: number
  price: number
}

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED'

export interface OrderResponseDTO {
  id: number
  items: OrderItemResponseDTO[]
  fullName?: string
  totalPrice: number
  phone: string
  note?: string
  status: OrderStatus
  pickupTime: string
}

export interface OrderStatusUpdatePayload {
  status: OrderStatus
}

export interface OrderSocketEvent {
  orderId: number
  status: OrderStatus
  pickupTime: string
  totalPrice: number
}

export type ReclamationStatus = 'OPEN' | 'READ'

export interface ReclamationCreateRequestDTO {
  fullName: string
  email: string
  phone?: string
  subject: string
  message: string
}

export interface ReclamationResponseDTO {
  id: number
  fullName: string
  email: string
  phone?: string
  subject: string
  message: string
  status: ReclamationStatus
  createdAt: string
  updatedAt: string
}

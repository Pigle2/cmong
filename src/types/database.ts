export type UserType = 'BUYER' | 'SELLER'
export type SellerGrade = 'NEW' | 'GENERAL' | 'PRO' | 'MASTER'
export type ServiceStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DELETED'
export type PackageTier = 'STANDARD' | 'DELUXE' | 'PREMIUM'
export type OrderStatus =
  | 'PAID'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REVISION_REQUESTED'
export type ChatRoomType = 'INQUIRY' | 'ORDER'
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
export type NotificationType = 'ORDER' | 'CHAT' | 'REVIEW' | 'SYSTEM'

export interface Profile {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  user_type: UserType
  bio: string | null
  created_at: string
  updated_at: string
}

export interface SellerProfile {
  id: string
  user_id: string
  display_name: string
  introduction: string | null
  specialties: string[]
  grade: SellerGrade
  total_sales: number
  total_reviews: number
  avg_rating: number
  response_time: number | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  depth: number
  sort_order: number
  icon: string | null
  children?: Category[]
}

export interface Service {
  id: string
  seller_id: string
  category_id: number
  title: string
  description: string
  thumbnail_url: string | null
  status: ServiceStatus
  avg_rating: number
  review_count: number
  order_count: number
  view_count: number
  favorite_count: number
  created_at: string
  updated_at: string
  // Joined
  packages?: ServicePackage[]
  images?: ServiceImage[]
  tags?: ServiceTag[]
  seller?: Profile & { seller_profile?: SellerProfile }
  category?: Category
}

export interface ServicePackage {
  id: string
  service_id: string
  tier: PackageTier
  name: string
  description: string
  price: number
  work_days: number
  revision_count: number
  created_at: string
}

export interface ServiceImage {
  id: string
  service_id: string
  url: string
  sort_order: number
}

export interface ServiceTag {
  id: string
  service_id: string
  tag: string
}

export interface Order {
  id: string
  order_number: string
  buyer_id: string
  seller_id: string
  service_id: string
  package_id: string
  status: OrderStatus
  requirements: string | null
  total_amount: number
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joined
  service?: Service
  buyer?: Profile
  seller?: Profile
  package?: ServicePackage
  status_history?: OrderStatusHistory[]
  review?: Review
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  changed_by: string
  note: string | null
  created_at: string
}

export interface Review {
  id: string
  order_id: string
  service_id: string
  reviewer_id: string
  seller_id: string
  rating: number
  quality_rating: number
  communication_rating: number
  delivery_rating: number
  content: string
  seller_reply: string | null
  seller_replied_at: string | null
  created_at: string
  updated_at: string
  // Joined
  reviewer?: Profile
}

export interface ChatRoom {
  id: string
  room_type: ChatRoomType
  service_id: string | null
  order_id: string | null
  created_at: string
  updated_at: string
  // Joined
  participants?: ChatParticipant[]
  last_message?: ChatMessage
  other_user?: Profile
  unread_count?: number
}

export interface ChatParticipant {
  id: string
  room_id: string
  user_id: string
  is_active: boolean
  last_read_at: string | null
  left_at: string | null
  rejoined_at: string | null
  created_at: string
  // Joined
  user?: Profile
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string | null
  message_type: MessageType
  content: string
  file_url: string | null
  file_name: string | null
  created_at: string
  // Joined
  sender?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  service_id: string
  created_at: string
  // Joined
  service?: Service
}

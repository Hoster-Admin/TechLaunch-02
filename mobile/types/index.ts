export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  avatarColor?: string;
  bio?: string;
  headline?: string;
  country?: string;
  role?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  verified?: boolean;
  productsCount?: number;
  createdAt?: string;
}

export interface ActivityItem {
  id: string;
  commentId?: string;
  type: 'comment' | 'upvote' | 'post' | 'follow' | string;
  targetName?: string;
  targetId?: string;
  targetType?: string;
  body?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  tagline: string;
  description?: string;
  logo?: string;
  logoEmoji?: string;
  coverImage?: string;
  screenshots?: string[];
  website?: string;
  country?: string;
  industry?: string;
  tags?: string[];
  reasons?: string[];
  upvotes: number;
  upvoted?: boolean;
  bookmarked?: boolean;
  maker?: User;
  commentsCount?: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  body: string;
  user: User;
  createdAt: string;
  likesCount?: number;
  liked?: boolean;
  replies?: Comment[];
}

export interface Post {
  id: string;
  title?: string;
  body: string;
  image?: string;
  user: User;
  likesCount: number;
  liked?: boolean;
  commentsCount?: number;
  tags?: string[];
  postType?: string;
  createdAt: string;
}

export interface EcosystemEntity {
  id: string;
  slug?: string;
  name: string;
  type: 'company' | 'startup' | 'accelerator' | 'investor' | 'venture_studio' | string;
  logo?: string;
  description: string;
  website?: string;
  country?: string;
  focus?: string[];
  portfolio?: string[];
  stage?: string[];
  applicationUrl?: string;
  pitchUrl?: string;
  contactEmail?: string;
  twitter?: string;
  foundedYear?: number;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  body: string;
  senderHandle: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: string;
  read?: boolean;
  delivered?: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage?: { body: string; senderHandle: string; createdAt: string };
  unreadCount?: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

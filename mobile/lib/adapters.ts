import type { ActivityItem, Comment, Conversation, DirectMessage, EcosystemEntity, Notification, PaginatedResponse, Post, Product, User } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const BASE_URL = 'https://tlmena.com';

function rebaseUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BASE_URL}${url}`;
}

/**
 * Rebase an avatar/image URL. Returns the rebased URL, or undefined if the
 * input is empty. The onError fallback in each component handles any real
 * load failures.
 */
function rebaseAvatarUrl(url: string | undefined | null): string | undefined {
  return rebaseUrl(url) ?? undefined;
}

export function adaptUser(raw: Raw): User {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    username: raw.handle ?? raw.username ?? '',
    email: raw.email ?? '',
    avatar: rebaseAvatarUrl(raw.avatar_url ?? raw.avatar),
    avatarColor: raw.avatar_color ?? undefined,
    bio: raw.bio ?? undefined,
    headline: raw.headline ?? undefined,
    country: raw.country ?? undefined,
    role: raw.persona ?? raw.role ?? undefined,
    website: raw.website ?? undefined,
    linkedin: raw.linkedin ?? undefined,
    twitter: raw.twitter ?? undefined,
    followersCount: raw.followers_count ?? raw.followersCount ?? 0,
    followingCount: raw.following_count ?? raw.followingCount ?? 0,
    isFollowing: raw.is_following ?? raw.isFollowing ?? false,
    verified: raw.verified ?? raw.is_verified ?? false,
    productsCount: raw.products_count ?? raw.productsCount ?? undefined,
    createdAt: raw.created_at ?? raw.createdAt ?? undefined,
  };
}

export function adaptProduct(raw: Raw): Product {
  const countries: string[] = Array.isArray(raw.countries) ? raw.countries : [];
  const makers: Raw[] = Array.isArray(raw.makers) ? raw.makers : [];
  const logoUrl = rebaseAvatarUrl(raw.logo_url ?? raw.logo);
  const rawReasons =
    raw.reasons ?? raw.key_features ?? raw.why_use ?? raw.benefits ?? raw.highlights ?? [];
  const reasons: string[] = Array.isArray(rawReasons)
    ? rawReasons.map((r: unknown) =>
        typeof r === 'string' ? r : (r as Raw)?.text ?? (r as Raw)?.reason ?? String(r)
      ).filter(Boolean)
    : [];
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    tagline: raw.tagline ?? '',
    description: raw.description ?? undefined,
    logo: logoUrl,
    logoEmoji: raw.logo_emoji ?? undefined,
    website: raw.website ?? undefined,
    country: countries[0] ?? raw.country ?? undefined,
    industry: raw.industry ?? undefined,
    tags: raw.tags ?? undefined,
    reasons: reasons.length > 0 ? reasons : undefined,
    upvotes: raw.upvotes_count ?? raw.upvotes ?? 0,
    upvoted: raw.has_voted ?? raw.upvoted ?? false,
    bookmarked: raw.has_bookmarked ?? raw.bookmarked ?? false,
    commentsCount: raw.comments_count ?? raw.commentsCount ?? 0,
    maker: makers[0] ? adaptUser(makers[0]) : undefined,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  };
}

export function adaptPost(raw: Raw): Post {
  return {
    id: raw.id ?? '',
    title: raw.title ?? undefined,
    body: raw.content ?? raw.body ?? '',
    image: rebaseAvatarUrl(raw.image_url ?? raw.image),
    user: {
      id: raw.user_id ?? '',
      name: raw.author ?? raw.user?.name ?? '',
      username: raw.author_handle ?? raw.user?.username ?? raw.user?.handle ?? '',
      email: '',
      avatar: rebaseAvatarUrl(raw.avatar_url ?? raw.user?.avatar_url ?? raw.user?.avatar),
    },
    likesCount: raw.likes_count ?? raw.likesCount ?? 0,
    liked: raw.liked ?? false,
    commentsCount: raw.comments_count ?? raw.commentsCount ?? 0,
    postType: raw.type ?? raw.postType ?? undefined,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  };
}

export function adaptComment(raw: Raw): Comment {
  return {
    id: raw.id ?? '',
    body: raw.body ?? '',
    user: {
      id: raw.user_id ?? '',
      name: raw.author_name ?? raw.author ?? raw.user?.name ?? '',
      username: raw.author_handle ?? raw.user?.handle ?? raw.user?.username ?? '',
      email: '',
      avatar: rebaseAvatarUrl(raw.avatar_url ?? raw.user?.avatar_url ?? raw.user?.avatar),
    },
    likesCount: raw.likes_count ?? raw.likesCount ?? 0,
    liked: raw.liked ?? false,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    replies: Array.isArray(raw.replies) ? raw.replies.map(adaptComment) : undefined,
  };
}

export function adaptEntity(raw: Raw): EcosystemEntity {
  return {
    id: raw.id ?? '',
    slug: raw.slug ?? raw.id ?? '',
    name: raw.name ?? '',
    type: raw.type ?? 'accelerator',
    logo: rebaseUrl(raw.logo_url ?? raw.logo ?? undefined),
    description: raw.description ?? '',
    website: raw.website ?? undefined,
    country: raw.country ?? undefined,
    focus: Array.isArray(raw.focus) ? raw.focus : raw.focus ? [raw.focus] : undefined,
    stage: Array.isArray(raw.stages) ? raw.stages : Array.isArray(raw.stage) ? raw.stage : raw.stage ? [raw.stage] : undefined,
    applicationUrl: raw.application_url ?? raw.applicationUrl ?? undefined,
    contactEmail: raw.contact_email ?? raw.contactEmail ?? undefined,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  };
}

export function adaptThread(raw: Raw): Conversation {
  const nested = raw.participant ?? raw.other_user ?? raw.user ?? raw.sender ?? null;
  // If no nested user object (or it has no identifying info), treat the thread
  // row itself as the participant — some API shapes return user fields at root level
  const hasIdentity = (o: Raw | null) =>
    o && (o.name || o.username || o.handle || o.id);
  const participantRaw: Raw = hasIdentity(nested) ? (nested as Raw) : hasIdentity(raw) ? raw : {};
  const lastMsg = raw.last_message ?? raw.lastMessage ?? raw.latest_message ?? null;
  return {
    id: String(raw.id ?? raw.thread_id ?? participantRaw.handle ?? participantRaw.username ?? Math.random()),
    participant: adaptUser(participantRaw),
    lastMessage: lastMsg ? {
      body: lastMsg.body ?? lastMsg.content ?? lastMsg.message ?? '',
      senderHandle: lastMsg.sender_handle ?? lastMsg.senderHandle ?? lastMsg.sender?.handle ?? '',
      createdAt: lastMsg.created_at ?? lastMsg.createdAt ?? '',
    } : undefined,
    unreadCount: raw.unread_count ?? raw.unreadCount ?? raw.unread ?? 0,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? raw.last_message_at ?? raw.lastMessageAt ?? raw.created_at ?? '',
  };
}

export function adaptDirectMessage(raw: Raw): DirectMessage {
  return {
    id: raw.id ?? '',
    body: raw.body ?? '',
    senderHandle: raw.sender_handle ?? raw.senderHandle ?? '',
    senderName: raw.sender_name ?? raw.senderName ?? '',
    senderAvatar: rebaseAvatarUrl(raw.sender_avatar ?? raw.sender?.avatar_url ?? raw.sender?.avatar),
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    read: raw.read ?? raw.is_read ?? raw.seen ?? false,
    delivered: raw.delivered ?? raw.is_delivered ?? raw.received ?? true,
  };
}

export function adaptNotification(raw: Raw): Notification {
  return {
    id: raw.id ?? '',
    type: raw.type ?? '',
    message: raw.message ?? raw.body ?? raw.title ?? '',
    read: raw.read ?? raw.is_read ?? false,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    data: raw.data ?? undefined,
  };
}

export function adaptActivityItem(raw: Raw): ActivityItem {
  return {
    id: raw.id ?? String(Math.random()),
    commentId: raw.comment_id ?? raw.commentId ?? raw.id ?? undefined,
    type: raw.type ?? raw.action ?? 'comment',
    targetName: raw.product_name ?? raw.target_name ?? raw.targetName ?? undefined,
    targetId: raw.product_id ?? raw.target_id ?? raw.targetId ?? undefined,
    targetType: raw.target_type ?? raw.targetType ?? undefined,
    body: raw.body ?? raw.content ?? raw.comment ?? undefined,
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  };
}

export function adaptProductsPage(apiResponse: Raw): PaginatedResponse<Product> {
  const items = Array.isArray(apiResponse.data) ? apiResponse.data.map(adaptProduct) : [];
  const pag = apiResponse.pagination;
  return {
    items,
    total: pag?.total ?? items.length,
    page: pag?.page ?? 1,
    perPage: pag?.limit ?? 20,
    hasMore: pag ? pag.page < pag.pages : false,
  };
}

export function adaptPostsPage(apiResponse: Raw): PaginatedResponse<Post> {
  const items = Array.isArray(apiResponse.data) ? apiResponse.data.map(adaptPost) : [];
  return { items, total: items.length, page: 1, perPage: items.length, hasMore: false };
}

export function adaptUsersPage(apiResponse: Raw): PaginatedResponse<User> {
  const raw: unknown[] =
    Array.isArray(apiResponse) ? (apiResponse as unknown[]) :
    Array.isArray(apiResponse?.data) ? apiResponse.data :
    Array.isArray(apiResponse?.data?.data) ? apiResponse.data.data :
    Array.isArray(apiResponse?.users) ? apiResponse.users :
    Array.isArray(apiResponse?.data?.users) ? apiResponse.data.users :
    Array.isArray(apiResponse?.members) ? apiResponse.members :
    Array.isArray(apiResponse?.results) ? apiResponse.results :
    Array.isArray(apiResponse?.data?.results) ? apiResponse.data.results :
    [];
  const items = (raw as Raw[]).map(adaptUser);
  const pag =
    apiResponse?.pagination ??
    apiResponse?.meta ??
    apiResponse?.data?.pagination ??
    apiResponse?.data?.meta ??
    null;
  return {
    items,
    total: pag?.total ?? items.length,
    page: pag?.current_page ?? pag?.page ?? 1,
    perPage: pag?.per_page ?? pag?.limit ?? 20,
    hasMore: pag
      ? (pag.current_page ?? pag.page ?? 1) < (pag.last_page ?? pag.pages ?? 1)
      : false,
  };
}

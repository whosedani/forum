export interface User {
  id: string;
  username: string;
  avatar_url: string;
  join_date: string;
  post_count: number;
  is_admin: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  thread_count: number;
  post_count: number;
  last_post: LastPostInfo | null;
}

export interface LastPostInfo {
  thread_id: string;
  thread_title: string;
  author_id: string;
  author_name: string;
  date: string;
}

export interface Thread {
  id: string;
  title: string;
  category_id: string;
  author_id: string;
  author_name: string;
  created_at: string;
  last_reply_at: string;
  last_reply_by: string;
  replies_count: number;
  views_count: number;
  is_pinned: boolean;
  is_locked: boolean;
}

export interface Post {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
}

export interface ForumConfig {
  name: string;
  description: string;
  logo_url: string;
}

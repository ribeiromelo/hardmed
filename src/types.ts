// Environment bindings
export type Bindings = {
  DB: D1Database;
  // Local fixture only. Do not set this flag in production or preview deploys.
  ALLOW_DEMO_LOGIN?: string;
};

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'student' | 'admin';
  avatar_url?: string;
  created_at: string;
  last_access?: string;
  is_active: number;
}

export interface UserPublic {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar_url?: string;
  created_at: string;
}

// Specialty types
export interface Specialty {
  id: number;
  name: string;
  slug: string;
  description?: string;
  cover_image?: string;
  icon?: string;
  order_index: number;
  is_active: number;
  created_at: string;
}

// Track types
export interface Track {
  id: number;
  specialty_id: number;
  title: string;
  slug: string;
  description?: string;
  cover_image?: string;
  duration_minutes: number;
  total_lessons: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_active: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TrackWithSpecialty extends Track {
  specialty_name: string;
  specialty_slug: string;
}

export interface TrackWithProgress extends Track {
  user_progress?: number;
  completed_lessons?: number;
  last_lesson_id?: number;
}

// Season types
export interface Season {
  id: number;
  track_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_active: number;
  created_at: string;
}

export interface SeasonWithLessons extends Season {
  lessons: Lesson[];
}

// Lesson types
export interface Lesson {
  id: number;
  season_id: number;
  title: string;
  slug: string;
  description?: string;
  video_url: string;
  video_platform: 'youtube' | 'vimeo' | 'other';
  duration_minutes: number;
  pdf_url?: string;
  order_index: number;
  key_points?: string;
  is_active: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface LessonWithProgress extends Lesson {
  is_completed?: boolean;
  watch_time_seconds?: number;
  last_position_seconds?: number;
}

// Progress types
export interface UserTrackProgress {
  id: number;
  user_id: number;
  track_id: number;
  completed_lessons: number;
  total_lessons: number;
  progress_percentage: number;
  last_lesson_id?: number;
  started_at: string;
  updated_at: string;
}

export interface UserLessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  is_completed: number;
  watch_time_seconds: number;
  last_position_seconds: number;
  completed_at?: string;
  updated_at: string;
}

// API Request/Response types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserPublic;
}

export interface UpdateProgressRequest {
  lesson_id: number;
  watch_time_seconds: number;
  last_position_seconds: number;
  is_completed: boolean;
}

// Stats types
export interface AdminStats {
  total_users: number;
  total_tracks: number;
  total_lessons: number;
  daily_views: number;
}

export interface TrackViewStats {
  track_id: number;
  track_title: string;
  total_views: number;
}

// Notification types
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  icon?: string;
  link_url?: string;
  is_active: number;
  created_at: string;
  expires_at?: string;
}

export interface NotificationWithReadStatus extends Notification {
  is_read: boolean;
}

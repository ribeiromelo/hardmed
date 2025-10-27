-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'success', 'error')),
  icon TEXT,
  link_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- User notifications read status
CREATE TABLE IF NOT EXISTS user_notification_reads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  notification_id INTEGER NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, notification_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notification_reads ON user_notification_reads(user_id, notification_id);

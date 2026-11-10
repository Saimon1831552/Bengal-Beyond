CREATE TABLE support_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_reference VARCHAR(40) NOT NULL,
  user_id BIGINT UNSIGNED DEFAULT NULL,
  guest_name VARCHAR(160) DEFAULT NULL,
  guest_email VARCHAR(190) DEFAULT NULL,
  guest_phone VARCHAR(40) DEFAULT NULL,
  category ENUM('general','booking','payment','refund','tour','account','technical','other')
    NOT NULL DEFAULT 'general',
  subject VARCHAR(200) NOT NULL,
  status ENUM('open','in_progress','waiting_customer','resolved','closed') NOT NULL DEFAULT 'open',
  priority ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  assigned_to BIGINT UNSIGNED DEFAULT NULL,
  last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME DEFAULT NULL,
  closed_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_tickets_reference (ticket_reference),
  KEY idx_support_tickets_user_last_message (user_id, last_message_at),
  KEY idx_support_tickets_status_priority (status, priority, last_message_at),
  CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_support_tickets_assignee FOREIGN KEY (assigned_to)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE support_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('customer','staff') NOT NULL,
  sender_user_id BIGINT UNSIGNED DEFAULT NULL,
  message_text TEXT NOT NULL,
  is_internal TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_support_messages_ticket_created (ticket_id, created_at, id),
  CONSTRAINT fk_support_messages_ticket FOREIGN KEY (ticket_id)
    REFERENCES support_tickets (id) ON DELETE CASCADE,
  CONSTRAINT fk_support_messages_sender FOREIGN KEY (sender_user_id)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

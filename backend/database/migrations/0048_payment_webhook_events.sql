CREATE TABLE payment_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider VARCHAR(50) NOT NULL,
  event_key CHAR(64) NOT NULL,
  validation_id VARCHAR(100) NOT NULL,
  payload_json LONGTEXT NOT NULL,
  result_json LONGTEXT DEFAULT NULL,
  processing_status ENUM('received','processing','processed','failed') NOT NULL DEFAULT 'received',
  attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  last_error VARCHAR(1000) DEFAULT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_attempt_at DATETIME DEFAULT NULL,
  next_retry_at DATETIME DEFAULT NULL,
  processed_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_webhook_provider_event (provider, event_key),
  KEY idx_payment_webhook_retry (processing_status, next_retry_at, received_at),
  KEY idx_payment_webhook_validation (validation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

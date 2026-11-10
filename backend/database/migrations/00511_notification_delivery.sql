CREATE TABLE notification_templates_legacy LIKE notification_templates;

INSERT INTO notification_templates_legacy
SELECT * FROM notification_templates;

RENAME TABLE
  notification_outbox TO notification_outbox_legacy,
  notification_logs TO notification_logs_legacy;

ALTER TABLE notification_templates
  DROP INDEX uq_notification_templates_key,
  ADD COLUMN channel ENUM('email','sms') NOT NULL DEFAULT 'email' AFTER template_key,
  ADD COLUMN subject_template VARCHAR(255) DEFAULT NULL AFTER channel,
  ADD COLUMN body_template MEDIUMTEXT DEFAULT NULL AFTER subject_template;

UPDATE notification_templates
SET subject_template = subject,
    body_template = COALESCE(NULLIF(body_text, ''), body_html);

ALTER TABLE notification_templates
  MODIFY body_template MEDIUMTEXT NOT NULL,
  DROP COLUMN subject,
  DROP COLUMN body_html,
  DROP COLUMN body_text,
  ADD UNIQUE KEY uq_notification_templates_key_channel (template_key, channel);

CREATE TABLE notification_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED DEFAULT NULL,
  channel ENUM('email','sms') NOT NULL,
  recipient VARCHAR(254) NOT NULL,
  template_key VARCHAR(100) NOT NULL,
  payload_json LONGTEXT NOT NULL,
  idempotency_key VARCHAR(190) DEFAULT NULL,
  status ENUM('queued','processing','sent','failed','cancelled') NOT NULL DEFAULT 'queued',
  attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_at DATETIME DEFAULT NULL,
  sent_at DATETIME DEFAULT NULL,
  last_error VARCHAR(1000) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_jobs_idempotency (idempotency_key),
  KEY idx_notification_jobs_claim (status, available_at, id),
  KEY idx_notification_jobs_user_created (user_id, created_at),
  CONSTRAINT fk_notification_jobs_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  attempt_number SMALLINT UNSIGNED NOT NULL,
  outcome ENUM('sent','failed') NOT NULL,
  provider_message_id VARCHAR(190) DEFAULT NULL,
  error_message VARCHAR(1000) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_attempt_job_number (job_id, attempt_number),
  KEY idx_notification_attempts_outcome_created (outcome, created_at),
  CONSTRAINT fk_notification_attempts_job FOREIGN KEY (job_id)
    REFERENCES notification_jobs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

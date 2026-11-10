CREATE TABLE destinations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT DEFAULT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Bangladesh',
  region VARCHAR(120) DEFAULT NULL,
  featured_image_url VARCHAR(1024) DEFAULT NULL,
  meta_title VARCHAR(180) DEFAULT NULL,
  meta_description VARCHAR(320) DEFAULT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED DEFAULT NULL,
  updated_by BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_destinations_slug (slug),
  KEY idx_destinations_status_featured_name (status, is_featured, name),
  CONSTRAINT fk_destinations_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_destinations_updated_by FOREIGN KEY (updated_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE tours
  ADD COLUMN destination_id BIGINT UNSIGNED DEFAULT NULL AFTER destination,
  ADD KEY idx_tours_destination_id (destination_id),
  ADD CONSTRAINT fk_tours_destination FOREIGN KEY (destination_id)
    REFERENCES destinations (id) ON DELETE SET NULL;

INSERT INTO destinations (slug, name, status)
SELECT
  COALESCE(
    NULLIF(LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE(TRIM(destination), '[^[:alnum:]]+', '-'))), ''),
    CONCAT('destination-', MD5(LOWER(TRIM(destination))))
  ),
  MIN(TRIM(destination)),
  'published'
FROM tours
WHERE destination IS NOT NULL AND TRIM(destination) <> ''
GROUP BY LOWER(TRIM(destination))
ON DUPLICATE KEY UPDATE name = VALUES(name);

UPDATE tours t
JOIN destinations d
  ON LOWER(TRIM(d.name)) COLLATE utf8mb4_unicode_ci =
     LOWER(TRIM(t.destination)) COLLATE utf8mb4_unicode_ci
SET t.destination_id = d.id
WHERE t.destination_id IS NULL;

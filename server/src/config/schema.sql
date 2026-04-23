CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_otp VARCHAR(6) NULL,
  otp_expires_at TIMESTAMP NULL,
  reset_otp VARCHAR(6) NULL,
  reset_otp_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  code LONGTEXT NOT NULL,
  language VARCHAR(20) NOT NULL,
  dsa_pattern VARCHAR(50) NOT NULL,
  tags_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_saved_codes_user (user_id),
  CONSTRAINT fk_saved_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visualizations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  saved_code_id BIGINT NULL,
  pattern VARCHAR(50) NOT NULL,
  input_json JSON NOT NULL,
  steps_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visualizations_user (user_id),
  INDEX idx_visualizations_saved_code (saved_code_id),
  CONSTRAINT fk_visualizations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_visualizations_saved_code FOREIGN KEY (saved_code_id) REFERENCES saved_codes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS execution_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  saved_code_id BIGINT NULL,
  language VARCHAR(20) NOT NULL,
  pattern_detected VARCHAR(50) NOT NULL,
  input_json JSON NOT NULL,
  output_json JSON NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_execution_logs_user (user_id),
  INDEX idx_execution_logs_saved_code (saved_code_id),
  CONSTRAINT fk_execution_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_execution_logs_saved_code FOREIGN KEY (saved_code_id) REFERENCES saved_codes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS test_cases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  saved_code_id BIGINT NOT NULL,
  label VARCHAR(255) NOT NULL,
  input_json JSON NOT NULL,
  expected_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_test_cases_saved_code (saved_code_id),
  CONSTRAINT fk_test_cases_saved_code FOREIGN KEY (saved_code_id) REFERENCES saved_codes(id) ON DELETE CASCADE
);

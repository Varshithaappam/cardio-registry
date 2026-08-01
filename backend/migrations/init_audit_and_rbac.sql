-- Migration: RBAC, Audit Engine & hf_registry Schema Setup

-- 1. Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS care_registry.roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default roles
INSERT IGNORE INTO care_registry.roles (role_id, role_name) VALUES 
(1, 'ADMIN'),
(2, 'CLINICIAN'),
(3, 'DATA_ENTRY');

-- 2. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS care_registry.users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default users if empty (password is 'password' hashed with bcrypt)
INSERT IGNORE INTO care_registry.users (user_id, username, email, password_hash, role_id, is_active) VALUES
(1, 'admin', 'admin@cardio.org', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vj.3dJ8aG2', 1, 1),
(2, 'sarah', 'nurse@cardio.org', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vj.3dJ8aG2', 2, 1),
(3, 'david', 'david.miller@cardio.org', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vj.3dJ8aG2', 3, 1);

-- 3. Add created_by and updated_by columns to hf_registry if they don't exist
SET @dbname = DATABASE();
SET @tablename = "hf_registry";
SET @columnname1 = "created_by";
SET @columnname2 = "updated_by";

-- Add created_by column if not exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname1
  ) > 0,
  "SELECT 1",
  "ALTER TABLE hf_registry ADD COLUMN created_by INT NULL, ADD CONSTRAINT fk_hf_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add updated_by column if not exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname2
  ) > 0,
  "SELECT 1",
  "ALTER TABLE hf_registry ADD COLUMN updated_by INT NULL, ADD CONSTRAINT fk_hf_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Create hf_registry_audit table
CREATE TABLE IF NOT EXISTS care_registry.hf_registry_audit (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  hf_id INT NOT NULL,
  user_id INT NOT NULL,
  action_type ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
  previous_values TEXT NULL COMMENT 'Data snapshot prior to modification',
  new_values TEXT NULL COMMENT 'Data snapshot after modification',
  changed_fields TEXT NULL COMMENT 'JSON snapshot or textual summary of modified payload',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_audit_hf_registry 
    FOREIGN KEY (hf_id) REFERENCES hf_registry(hf_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
  CONSTRAINT fk_audit_users 
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ensure previous_values and new_values columns exist in hf_registry_audit if table was already created
SET @tablename_audit = "hf_registry_audit";
SET @columnname_prev = "previous_values";
SET @columnname_new = "new_values";

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename_audit
      AND COLUMN_NAME = @columnname_prev
  ) > 0,
  "SELECT 1",
  "ALTER TABLE hf_registry_audit ADD COLUMN previous_values TEXT NULL, ADD COLUMN new_values TEXT NULL;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

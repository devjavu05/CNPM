-- Initialize Library Management System Database

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS library;
USE library;

-- Create tables
CREATE TABLE IF NOT EXISTS user (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  failed_login_attempts INT DEFAULT 0,
  locked_until DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
);

-- Insert default users
INSERT INTO user (id, username, password, full_name, email, status) 
VALUES 
  (UUID(), 'admin', '$2a$10$slYQmyNdGzin7olVN3p5Be7DlH.PKZbv5H8KnzzVgXXbVxzy990qm', 'Administrator', 'admin@library.local', 'ACTIVE'),
  (UUID(), 'staff', '$2a$10$slYQmyNdGzin7olVN3p5Be7DlH.PKZbv5H8KnzzVgXXbVxzy990qm', 'Staff Member', 'staff@library.local', 'ACTIVE'),
  (UUID(), 'reader', '$2a$10$slYQmyNdGzin7olVN3p5Be7DlH.PKZbv5H8KnzzVgXXbVxzy990qm', 'Reader User', 'reader@library.local', 'ACTIVE');

-- Create indexes for performance
CREATE INDEX idx_created_at ON user(created_at);
CREATE INDEX idx_status ON user(status);

-- Grant privileges to library user
GRANT ALL PRIVILEGES ON library.* TO 'library_user'@'%' IDENTIFIED BY 'library_password';
FLUSH PRIVILEGES;

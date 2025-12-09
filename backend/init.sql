
-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS instagramproject CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE instagramproject;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 代理配置表
CREATE TABLE IF NOT EXISTS proxy_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    username VARCHAR(100),
    password_encrypted VARCHAR(255),
    proxy_type ENUM('http','https','socks4','socks5') DEFAULT 'http',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_host_port (host, port),
    INDEX idx_type (proxy_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Instagram账户表
CREATE TABLE IF NOT EXISTS instagram_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_encrypted TEXT NOT NULL,
    session_data JSON,
    proxy_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    login_status ENUM('logged_out','logged_in','challenge_required','banned') DEFAULT 'logged_out',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (proxy_id) REFERENCES proxy_configs(id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_status (login_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 定时发帖表
CREATE TABLE IF NOT EXISTS post_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instagram_account_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    media_files JSON,
    scheduled_time TIMESTAMP NOT NULL,
    status ENUM('pending','posted','failed','cancelled') DEFAULT 'pending',
    posted_at TIMESTAMP NULL,
    error_message TEXT,
    repeat_type ENUM('once','daily','weekly','monthly') DEFAULT 'once',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 消息记录表
CREATE TABLE IF NOT EXISTS message_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instagram_account_id INT NOT NULL,
    thread_id VARCHAR(100) NOT NULL,
    sender_username VARCHAR(100) NOT NULL,
    message_content TEXT NOT NULL,
    message_type ENUM('text','image','video','link') DEFAULT 'text',
    is_incoming BOOLEAN DEFAULT TRUE,
    is_auto_reply BOOLEAN DEFAULT FALSE,
    media_url TEXT,
    reply_to_message_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_message_id) REFERENCES message_logs(id) ON DELETE SET NULL,
    INDEX idx_thread_id (thread_id),
    INDEX idx_sender (sender_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 自动回复规则表
CREATE TABLE IF NOT EXISTS auto_reply_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instagram_account_id INT NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    keywords JSON NOT NULL,
    reply_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    match_type VARCHAR(20) DEFAULT 'contains',
    delay_seconds INT DEFAULT 0,
    max_replies_per_day INT,
    reply_count_today INT DEFAULT 0,
    last_reply_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    INDEX idx_active (is_active),
    INDEX idx_account (instagram_account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 搜索任务表
CREATE TABLE IF NOT EXISTS search_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instagram_account_id INT NOT NULL,
    task_name VARCHAR(100) NOT NULL,
    search_type ENUM('hashtag','location','username','keyword') NOT NULL,
    search_query VARCHAR(255) NOT NULL,
    search_params JSON,
    status ENUM('pending','running','completed','failed','cancelled') DEFAULT 'pending',
    results JSON,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT,
    progress_percentage INT DEFAULT 0,
    total_items INT DEFAULT 0,
    processed_items INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instagram_account_id) REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_type (search_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 收集的用户数据表
CREATE TABLE IF NOT EXISTS collected_user_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    search_task_id INT NOT NULL,
    instagram_username VARCHAR(100) NOT NULL,
    full_name VARCHAR(200),
    biography TEXT,
    follower_count INT,
    following_count INT,
    posts_count INT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    email VARCHAR(100),
    phone VARCHAR(50),
    profile_pic_url TEXT,
    external_url TEXT,
    business_category VARCHAR(100),
    contact_options JSON,
    collected_data JSON,
    data_quality_score INT DEFAULT 0,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_duplicate BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (search_task_id) REFERENCES search_tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_task (search_task_id, instagram_username),
    INDEX idx_username (instagram_username),
    INDEX idx_followers (follower_count),
    INDEX idx_collected (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建默认管理员用户（密码：admin123，实际使用时应该修改）
INSERT IGNORE INTO users (username, email, password_hash, full_name, is_superuser) VALUES 
('admin', 'admin@instagramproject.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO6', 'Administrator', TRUE);

-- 创建默认代理配置（示例）
INSERT IGNORE INTO proxy_configs (user_id, name, host, port, proxy_type, is_active) VALUES 
(1, 'default proxy', '127.0.0.1', 8080, 'http', TRUE);

-- 创建索引优化性能
CREATE INDEX IF NOT EXISTS idx_messages_thread_time ON message_logs(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_schedules_time_status ON post_schedules(scheduled_time, status);
CREATE INDEX IF NOT EXISTS idx_collected_user_task_username ON collected_user_data(search_task_id, instagram_username);

-- 设置外键约束
SET FOREIGN_KEY_CHECKS = 1;

-- 创建视图用于常用查询
CREATE OR REPLACE VIEW active_instagram_accounts AS
SELECT 
    id,
    username,
    login_status,
    last_login,
    created_at
FROM instagram_accounts 
WHERE is_active = TRUE;

CREATE OR REPLACE VIEW pending_search_tasks AS
SELECT 
    st.id,
    st.task_name,
    st.search_type,
    st.status,
    st.created_at,
    ia.username as account_username
FROM search_tasks st
LEFT JOIN instagram_accounts ia ON st.instagram_account_id = ia.id
WHERE st.status = 'pending';

-- 创建存储过程用于清理旧数据
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanupOldMessages(IN days_to_keep INT)
BEGIN
    DELETE FROM message_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
END //
DELIMITER ;

-- 创建触发器用于更新时间戳
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_user_update 
BEFORE UPDATE ON users 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

CREATE TRIGGER IF NOT EXISTS before_instagram_account_update 
BEFORE UPDATE ON instagram_accounts 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

CREATE TRIGGER IF NOT EXISTS before_proxy_update 
BEFORE UPDATE ON proxy_configs 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- 完成初始化
SELECT 'Database initialization completed successfully!' as status;

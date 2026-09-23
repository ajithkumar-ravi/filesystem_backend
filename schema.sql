CREATE DATABASE IF NOT EXISTS file_explorer;
USE file_explorer;

CREATE TABLE IF NOT EXISTS files (
    id INT PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(255) NOT NULL,

    type ENUM(
        'folder',
        'text',
        'docx',
        'json',
        'pdf'
    ) NOT NULL,

    parent_id INT NULL,

    content LONGTEXT NULL,

    owner VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_parent
        FOREIGN KEY (parent_id)
        REFERENCES files(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_parent_id ON files(parent_id);

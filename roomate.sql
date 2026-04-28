CREATE DATABASE roommate;
USE roommate;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
select * from users;
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    invite_code VARCHAR(20) UNIQUE,
    created_by INT,
    members_count INT DEFAULT 0,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
INSERT INTO rooms (name, address, invite_code, created_by, members_count, status)
VALUES 
('101', 'Phố vọng', 'A1XYZ', 1, 4, 'active')
select * from rooms;

CREATE TABLE room_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    room_id INT,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, room_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT,
    title VARCHAR(100),
    amount DECIMAL(10,2),
    paid_by INT, -- người ứng tiền
    created_at DATE,

    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (paid_by) REFERENCES users(id)
);
CREATE TABLE expense_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT,
    user_id INT,

    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT,
    month INT,
    year INT,
    total_amount DECIMAL(10,2),
    status ENUM('pending', 'processing', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
CREATE TABLE invoice_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT,
    user_id INT,
    amount DECIMAL(10,2),
    status ENUM('unpaid', 'paid') DEFAULT 'unpaid',

    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_detail_id INT,
    paid_amount DECIMAL(10,2),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_by INT,

    FOREIGN KEY (invoice_detail_id) REFERENCES invoice_details(id),
    FOREIGN KEY (confirmed_by) REFERENCES users(id)
);
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT,
    title VARCHAR(100),
    description TEXT,
    repeat_type ENUM('daily', 'weekly') DEFAULT 'weekly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
CREATE TABLE task_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    user_id INT,
    assigned_date DATE,
    status ENUM('pending', 'done') DEFAULT 'pending',
    note TEXT,

    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

📌 Hướng dẫn chạy dự án
1. Khởi động MySQL

Trước tiên, hãy đảm bảo MySQL đang chạy:

Mở XAMPP /MySQL Workbench

Start dịch vụ MySQL

- Chạy/execute roomate.sql trong sql workbench 
- Tải Xamp start mySQL


2. Cấu hình database

Kiểm tra file cấu hình kết nối database .env

DB_HOST=localhost

DB_USER=root

DB_PASSWORD=

DB_NAME=roommate

3. Cài dependencies
📌 Backend 

Di chuyển vào thư mục backend:

    **cd server**
    **npm install**

📌 Frontend (React)

Di chuyển vào thư mục frontend "src"

    **cd frontend** (cd ../frontend Nếu đang ở folder server)
    **npm install**


6. Chạy full project (chính)

Mở 2 terminal:

Terminal 1:

    **cd backend**

    **node index.js**
Terminal 2:

    **npm run dev**
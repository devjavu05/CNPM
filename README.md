# Hệ Thống Quản Lý Thư Viện

Một hệ thống quản lý thư viện toàn diện được xây dựng với Spring Boot và React, bao gồm quản lý sách, bán sách điện tử, quản lý mượn sách và quản lý người dùng.

## 📋 Tính Năng

### Tính Năng Cốt Lõi

- **Quản Lý Sách**: Tạo, cập nhật, xem và xóa sách khỏi catalog
- **Bán Sách Điện Tử**: Bán sách kỹ thuật số với kiểm soát truy cập và tính năng cao cấp
- **Hệ Thống Mượn Sách**: Quản lý mượn sách, trả sách và gia hạn
- **Đặt Trước Sách**: Đặt trước sách với hàng đợi quản lý
- **Quản Lý Phạt**: Theo dõi và quản lý phạt thư viện
- **Quản Lý Người Dùng**: Kiểm soát truy cập dựa trên vai trò (Admin, Nhân viên, Độc giả)
- **Bảng Điều Khiển**: Thống kê và phân tích thời gian thực

### Điểm Nổi Bật Kỹ Thuật

- Xác thực và phân quyền dựa trên JWT
- Kiểm soát truy cập dựa trên vai trò (RBAC)
- Tích hợp cơ sở dữ liệu MySQL với Hibernate ORM
- REST API với xử lý lỗi toàn diện
- Giao diện React đáp ứng
- Đóng gói Docker để dễ dàng triển khai

## 🏗️ Cấu Trúc Dự Án

```
standardProject/
├── frontEnd/                 # Giao diện React
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── standardProject/          # Backend Spring Boot
│   ├── src/
│   ├── pom.xml
│   └── mvnw
├── docker-compose.yml        # Cấu hình Docker Compose
├── Dockerfile               # Hình ảnh Docker cho Backend
├── .github/workflows/       # Quy trình CI/CD
└── README.md               # Tệp này
```

## 🚀 Bắt Đầu Nhanh

### Yêu Cầu Tiên Quyết

- Java 25+
- Node.js 18+
- Maven 3.8+
- Docker & Docker Compose (tùy chọn)
- MySQL 8.0+

### Thiết Lập Backend

1. **Chuyển đến thư mục backend**

```bash
cd standardProject
```

2. **Cấu hình cơ sở dữ liệu** (sửa `src/main/resources/application.properties`)

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/library
spring.datasource.username=root
spring.datasource.password=your_password
```

3. **Xây dựng và chạy**

```bash
# Sử dụng Maven
mvn clean install
mvn spring-boot:run

# Hoặc sử dụng JAR
mvn clean package -DskipTests
java -jar target/manageStudent-0.0.1-SNAPSHOT.jar
```

Server sẽ khởi động tại `http://localhost:8080`

### Thiết Lập Frontend

1. **Chuyển đến thư mục frontend**

```bash
cd frontEnd
```

2. **Cài đặt phụ thuộc**

```bash
npm install
```

3. **Khởi động máy chủ phát triển**

```bash
npm run dev
```

Frontend sẽ có sẵn tại `http://localhost:5173`

## 🐳 Triển Khai Docker

### Sử Dụng Docker Compose (Được Khuyến Nghị)

```bash
docker-compose up -d
```

Điều này sẽ khởi động:

- Cơ sở dữ liệu MySQL trên cổng 3306
- API Backend trên cổng 8080
- Frontend trên cổng 5173

### Xây Dựng Docker Thủ Công

**Backend:**

```bash
docker build -f Dockerfile -t library-backend .
docker run -p 8080:8080 library-backend
```

## 📚 Tài Liệu API

### Xác Thực

- **Endpoint**: `POST /auth/login`
- **Body**: `{ "username": "user", "password": "pass" }`
- **Response**: JWT token

### Các Endpoint Chính

#### Sách

- `GET /api/books` - Liệt kê tất cả sách
- `POST /api/books` - Tạo sách mới (Admin/Nhân viên)
- `GET /api/books/{id}` - Lấy chi tiết sách
- `PUT /api/books/{id}` - Cập nhật sách (Admin/Nhân viên)
- `DELETE /api/books/{id}` - Xóa sách (Admin)

#### Sách Điện Tử

- `GET /api/ebooks` - Liệt kê tất cả sách điện tử
- `POST /api/ebooks/buy` - Mua sách điện tử
- `GET /api/ebooks/my-books` - Lấy sách đã mua của người dùng

#### Mượn Sách

- `POST /api/borrows` - Mượn sách
- `POST /api/borrows/{id}/return` - Trả sách
- `POST /api/borrows/{id}/renew` - Gia hạn mượn

#### Đặt Trước

- `POST /api/reservations` - Tạo đặt trước
- `GET /api/reservations` - Liệt kê đặt trước
- `DELETE /api/reservations/{id}` - Hủy đặt trước

## 🔐 Người Dùng Mặc Định

Sau khi cài đặt ban đầu, các tài khoản mặc định:

| Vai Trò   | Tên Đăng Nhập | Mật Khẩu  |
| --------- | ------------- | --------- |
| Admin     | admin         | admin123  |
| Nhân viên | staff         | staff123  |
| Độc giả   | reader        | reader123 |

**Lưu ý**: Thay đổi các thông tin này trong môi trường sản xuất!

## 📊 Lược Đồ Cơ Sở Dữ Liệu

Các thực thể chính:

- `User` - Xác thực người dùng và thông tin cơ bản
- `DocGia` - Hồ sơ độc giả với chi tiết thẻ
- `NhanVien` - Thông tin nhân viên
- `DauSach` - Chi tiết xuất bản sách
- `CuonSach` - Bản sao sách vật lý
- `EBook` - Sản phẩm sách kỹ thuật số
- `PhieuMua` - Bản ghi mua sách điện tử
- `PhieuMuon` - Bản ghi mượn sách
- `PhieuDatTruoc` - Đặt trước sách
- `PhieuPhat` - Bản ghi phạt

## 🧪 Kiểm Thử

### Backend

```bash
cd standardProject
mvn test
```

### Frontend

```bash
cd frontEnd
npm run test
```

## 📦 Xây Dựng & Triển Khai

### Xây Dựng Sản Xuất

**Backend:**

```bash
mvn clean package -DskipTests -P production
```

**Frontend:**

```bash
npm run build
```

### Biến Môi Trường

Tạo tệp `.env` trong backend:

```
DB_URL=jdbc:mysql://localhost:3306/library
DB_USER=root
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
```

## 🛠️ Khắc Phục Sự Cố

### Cổng Đã Được Sử Dụng

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>
```

### Vấn Đề Kết Nối Cơ Sở Dữ Liệu

- Xác minh MySQL đang chạy
- Kiểm tra thông tin xác thực trong `application.properties`
- Đảm bảo cơ sở dữ liệu tồn tại: `CREATE DATABASE library;`

### Vấn Đề Xây Dựng Frontend

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 📝 Quy Trình Git

```bash
# Clone repository
git clone <repository-url>
cd standardProject

# Tạo nhánh tính năng
git checkout -b feature/your-feature

# Thực hiện thay đổi và commit
git add .
git commit -m "Add your feature"

# Push đến remote
git push origin feature/your-feature

# Tạo Pull Request
```

## 🤝 Đóng Góp

1. Fork repository
2. Tạo nhánh tính năng
3. Thực hiện thay đổi của bạn
4. Commit và push
5. Gửi pull request

## 📄 Giấy Phép

Dự án này được cấp phép theo Giấy phép MIT.

## 👥 Tác Giả

- **Nhóm Phát Triển** - Hệ Thống Quản Lý Thư Viện

## 📧 Hỗ Trợ

Để báo cáo sự cố và nhận hỗ trợ:

- GitHub Issues: [Tạo issue](https://github.com/your-repo/issues)
- Email: support@library.local

## 🔄 Lịch Sử Phiên Bản

- **v0.0.1** - Phát hành ban đầu
  - Hệ thống quản lý sách
  - Tính năng bán sách điện tử
  - Hệ thống mượn và đặt trước sách
  - Xác thực người dùng và phân quyền
  - Bảng điều khiển admin

---

**Cập nhật lần cuối**: 6 tháng 5 năm 2026

# System Architecture

## Overview

The Library Management System is built using a modern three-tier architecture with a React frontend, Spring Boot backend, and MySQL database.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
│                  (React Frontend)                             │
│                  Port: 5173                                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────────┐
│                 API Gateway Layer                             │
│              (Spring Boot Server)                             │
│                Port: 8080                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Spring Security                             │   │
│  │    (JWT Authentication & Authorization)               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              REST Controllers                          │   │
│  │  - BookController                                     │   │
│  │  - UserController                                     │   │
│  │  - BorrowController                                   │   │
│  │  - ReservationController                              │   │
│  │  - FineController                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Service Layer                             │   │
│  │  - BookService                                        │   │
│  │  - UserService                                        │   │
│  │  - BorrowService                                      │   │
│  │  - ReservationService                                 │   │
│  │  - FineService                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Data Access Layer (JPA)                     │   │
│  │  - BookRepository                                     │   │
│  │  - UserRepository                                     │   │
│  │  - BorrowRepository                                   │   │
│  │  - ReservationRepository                              │   │
│  │  - FineRepository                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ JDBC
┌────────────────────▼────────────────────────────────────────┐
│                 Data Layer                                    │
│              (MySQL Database)                                 │
│                Port: 3306                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  - user                                              │   │
│  │  - doc_gia (reader)                                  │   │
│  │  - nhan_vien (staff)                                 │   │
│  │  - dau_sach (book)                                   │   │
│  │  - cuon_sach (book copy)                             │   │
│  │  - ebook                                             │   │
│  │  - phieu_mua (purchase)                              │   │
│  │  - phieu_muon (borrow)                               │   │
│  │  - phieu_dat_truoc (reservation)                     │   │
│  │  - phieu_phat (fine)                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Framework**: React 18+ with Vite
- **Language**: JavaScript/JSX
- **Styling**: CSS3
- **State Management**: React Context API / Zustand
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Backend

- **Framework**: Spring Boot 4.0+
- **Language**: Java 25
- **ORM**: Hibernate/JPA
- **Authentication**: JWT (Spring Security)
- **Build Tool**: Maven
- **REST API Documentation**: Springdoc OpenAPI/Swagger UI

### Database

- **Type**: Relational (MySQL)
- **Version**: 8.0+
- **Connection Pooling**: HikariCP
- **Migration Tool**: Flyway (optional)

### Deployment

- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions

## Design Patterns

### 1. MVC Pattern

- **Model**: Entity classes representing database entities
- **View**: React components for UI
- **Controller**: Spring REST controllers handling HTTP requests

### 2. Service Pattern

- Business logic is separated into service layer
- Services are injected into controllers and other services
- Promotes testability and reusability

### 3. Repository Pattern

- Data access is abstracted through repository interfaces
- Spring Data JPA provides implementation automatically
- Reduces boilerplate code

### 4. Dependency Injection

- Spring Framework handles dependency injection
- Constructor injection for better testability
- Reduces coupling between components

### 5. JWT Authentication

- Stateless authentication
- Tokens contain user information and roles
- Verified on each protected request

## Folder Structure

```
standardProject/
├── frontEnd/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API clients and utilities
│   │   ├── styles/          # Global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── standardProject/
│   ├── src/main/java/com/devjavu/standardProject/
│   │   ├── controller/           # REST Controllers
│   │   ├── service/              # Business Logic
│   │   ├── repository/           # Data Access
│   │   ├── entity/               # Domain Models
│   │   ├── dto/                  # Data Transfer Objects
│   │   ├── mapper/               # Entity-DTO Mappers
│   │   ├── configuration/        # Spring Configurations
│   │   ├── exception/            # Custom Exceptions
│   │   ├── enums/                # Enumerations
│   │   └── StandardProjectApplication.java
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── application-prod.properties
│   │   ├── db/migration/         # Flyway migrations
│   │   └── templates/
│   ├── Dockerfile
│   └── pom.xml
│
├── .github/workflows/
│   └── ci.yml                # CI/CD Pipeline
│
├── docker-compose.yml        # Multi-container setup
├── Dockerfile                # Backend image
├── init.sql                  # Database initialization
├── README.md                 # Project documentation
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
├── ARCHITECTURE.md           # This file
└── .gitignore
```

## Data Flow

### Authentication Flow

```
User Login
    ↓
POST /auth/login (credentials)
    ↓
AuthService validates credentials
    ↓
Generate JWT Token
    ↓
Return token to client
    ↓
Client stores token in localStorage
    ↓
Include token in Authorization header for future requests
```

### E-Book Purchase Flow

```
Reader clicks "Buy E-Book"
    ↓
Frontend sends: POST /api/ebooks/buy
    ↓
BookController → BookService
    ↓
Validate reader eligibility
    ↓
Check daily purchase limit
    ↓
Check account balance
    ↓
Deduct amount from balance
    ↓
Create PhieuMua record
    ↓
Return purchase confirmation
    ↓
Frontend displays access link
```

### Book Borrowing Flow

```
Reader selects book to borrow
    ↓
POST /api/borrows
    ↓
BorrowService validates:
  - Book availability
  - Reader eligibility
  - Outstanding fines
    ↓
Create PhieuMuon record
    ↓
Update CuonSach availability
    ↓
Set due date (14 days default)
    ↓
Return borrow confirmation
```

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token

### Books

- `GET /api/books` - List all books
- `GET /api/books/{id}` - Get book details
- `POST /api/books` - Create book (Admin)
- `PUT /api/books/{id}` - Update book (Admin)
- `DELETE /api/books/{id}` - Delete book (Admin)

### E-Books

- `GET /api/ebooks` - List e-books
- `POST /api/ebooks/buy` - Purchase e-book
- `GET /api/ebooks/my-books` - User's purchases

### Borrowing

- `POST /api/borrows` - Create borrow
- `GET /api/borrows` - List user's borrows
- `POST /api/borrows/{id}/return` - Return book
- `POST /api/borrows/{id}/renew` - Renew borrow

### Reservations

- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - List reservations
- `DELETE /api/reservations/{id}` - Cancel reservation

## Database Schema

### Key Tables

**user**

- id: UUID
- username: VARCHAR(50) UNIQUE
- password: VARCHAR(255)
- status: ENUM('ACTIVE', 'INACTIVE')
- roles: Relationship

**dau_sach (Books)**

- id: UUID
- title: VARCHAR(255)
- author: VARCHAR(255)
- isbn: VARCHAR(20)
- quantity: INT

**cuon_sach (Book Copies)**

- id: UUID
- barcode: VARCHAR(50)
- dau_sach_id: FK
- available: BOOLEAN

**phieu_muon (Borrowing)**

- id: UUID
- doc_gia_id: FK
- cuon_sach_id: FK
- borrow_date: DATETIME
- due_date: DATETIME
- return_date: DATETIME

## Security Considerations

### Authentication

- Passwords hashed using BCrypt
- JWT tokens with 1-hour expiration
- Refresh tokens for extended sessions
- HTTPS enforced in production

### Authorization

- Role-based access control (RBAC)
- Fine-grained permissions
- Method-level security annotations

### Data Protection

- SQL injection prevention (JPA parameterized queries)
- Cross-Site Scripting (XSS) protection
- Cross-Site Request Forgery (CSRF) protection
- Secure HTTP headers

### Monitoring

- Request logging
- Error tracking
- Performance metrics
- Security audit logs

## Performance Optimization

### Backend

- Database query optimization with indexes
- Connection pooling (HikariCP)
- Caching strategy implementation
- API response compression

### Frontend

- Code splitting with dynamic imports
- Lazy loading of components
- Image optimization
- Build optimization (minification, bundling)

### Database

- Indexed frequently queried columns
- Query optimization
- Regular maintenance
- Backup strategy

## Deployment Architecture

### Development

- Local MySQL database
- Maven/npm development servers
- Hot reload for frontend

### Production

- Containerized services (Docker)
- Orchestrated with Docker Compose
- Nginx reverse proxy for SSL/TLS
- Automated backups
- Health monitoring

---

**Last Updated**: May 6, 2026

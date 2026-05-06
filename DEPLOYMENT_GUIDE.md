# Deployment Guide

Complete guide for deploying the Library Management System.

## Table of Contents

- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Monitoring & Troubleshooting](#monitoring--troubleshooting)

## Local Development

### System Requirements

- **Java**: OpenJDK 25 or later
- **Node.js**: v18 or later
- **Maven**: 3.8.1 or later
- **MySQL**: 8.0 or later
- **Git**: Latest version

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd standardProject
```

### Step 2: MySQL Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE library;"

# Import initial data (optional)
mysql -u root -p library < init.sql
```

Update database credentials in:

```
standardProject/src/main/resources/application.properties
```

### Step 3: Backend Setup

```bash
cd standardProject

# Build project
mvn clean install

# Run with Maven
mvn spring-boot:run

# Or run JAR directly
mvn package -DskipTests
java -jar target/manageStudent-0.0.1-SNAPSHOT.jar
```

Server runs on: `http://localhost:8080`

### Step 4: Frontend Setup

```bash
cd frontEnd

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Step 5: Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/swagger-ui.html

### Default Credentials

| Role   | Username | Password  |
| ------ | -------- | --------- |
| Admin  | admin    | admin123  |
| Staff  | staff    | staff123  |
| Reader | reader   | reader123 |

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove all data (including MySQL)
docker-compose down -v
```

### Accessing Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **MySQL**: localhost:3306 (user: `library_user`, password: `library_password`)

### Docker Compose Services

1. **MySQL (library-db)**
   - Port: 3306
   - Database: library
   - User: library_user
   - Password: library_password

2. **Backend (library-backend)**
   - Port: 8080
   - Container: library-backend
   - Image: Dockerfile

3. **Frontend (library-frontend)**
   - Port: 5173
   - Container: library-frontend
   - Image: frontEnd/Dockerfile

### Manual Docker Commands

**Build Backend Image**

```bash
docker build -f Dockerfile -t library-backend:latest .
```

**Run Backend Container**

```bash
docker run -d \
  --name library-backend \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/library \
  -e SPRING_DATASOURCE_USERNAME=library_user \
  -e SPRING_DATASOURCE_PASSWORD=library_password \
  library-backend:latest
```

**Build Frontend Image**

```bash
cd frontEnd
docker build -t library-frontend:latest .
```

**Run Frontend Container**

```bash
docker run -d \
  --name library-frontend \
  -p 5173:5173 \
  library-frontend:latest
```

## Production Deployment

### Environment Variables

Create `.env.production` file in root directory:

```env
# Database
DB_HOST=prod-db.example.com
DB_PORT=3306
DB_NAME=library_prod
DB_USER=prod_user
DB_PASSWORD=your_secure_password

# Application
APP_ENV=production
APP_DEBUG=false
JWT_SECRET=your_very_long_random_secret_key_here

# Frontend
VITE_API_URL=https://api.example.com

# Server
SERVER_PORT=8080
SERVER_SERVLET_CONTEXT_PATH=/api
```

### Using Environment Files with Docker Compose

```bash
# Create production docker-compose file
cp docker-compose.yml docker-compose.prod.yml

# Edit production configuration
nano docker-compose.prod.yml

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### SSL/TLS Setup

**Using Nginx as Reverse Proxy:**

```nginx
upstream backend {
    server library-backend:8080;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Backup

```bash
# Backup MySQL database
docker exec library-db mysqldump -u library_user -p library_password library > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i library-db mysql -u library_user -p library_password library < backup.sql
```

### Scaling

**Horizontal Scaling with Load Balancer:**

```yaml
version: "3.9"

services:
  backend:
    image: library-backend:latest
    deploy:
      replicas: 3
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/library
      # ... other vars
```

## Monitoring & Troubleshooting

### Health Checks

```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend availability
curl http://localhost:5173

# MySQL connectivity
mysql -u library_user -p library_password -h localhost -e "SELECT 1;"
```

### View Logs

```bash
# Docker Compose logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Specific service logs
docker logs -f library-backend
docker logs -f library-frontend

# Docker logs with timestamps
docker-compose logs -f --timestamps backend
```

### Common Issues

#### Port Already in Use

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>
```

#### MySQL Connection Error

```bash
# Check MySQL is running
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Verify credentials
docker exec library-db mysql -u library_user -p library_password -e "SELECT 1;"
```

#### Frontend Not Loading

```bash
# Clear browser cache
# Check frontend logs
docker-compose logs frontend

# Verify API connectivity from frontend console
curl http://localhost:8080/actuator/health
```

### Performance Optimization

**Backend Tuning:**

```env
JAVA_OPTS="-Xms1g -Xmx2g -XX:+UseG1GC"
```

**Database Optimization:**

```sql
-- Add indexes
CREATE INDEX idx_user_username ON user(username);
CREATE INDEX idx_book_title ON book(title);
```

### Security Checklist

- [ ] Change default credentials
- [ ] Enable HTTPS/SSL
- [ ] Set strong JWT secret
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for trusted domains
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Audit logging configured

## Support & Maintenance

### Regular Maintenance

- Database backups: Daily
- Security updates: Weekly
- Log rotation: Daily
- Performance monitoring: Real-time

### CI/CD Pipeline

GitHub Actions workflows are configured in `.github/workflows/`:

- `ci.yml` - Automated build and test

### Documentation

- API Documentation: http://localhost:8080/swagger-ui.html
- README: See [README.md](README.md)
- This guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

**Last Updated**: May 6, 2026

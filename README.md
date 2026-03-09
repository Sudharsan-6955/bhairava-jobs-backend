# Job Upload Platform - Backend

Production-level secure backend for a job upload platform built with MERN stack.

## 🔐 Security Features

### Authentication & Authorization
- ✅ JWT authentication with HTTP-only cookies
- ✅ Access token and refresh token system
- ✅ Secure password hashing using bcrypt (cost factor: 12)
- ✅ Role-based access control (Admin/Superadmin)
- ✅ Account locking after failed login attempts
- ✅ Token expiration and refresh mechanism

### API Security
- ✅ Protected routes using middleware
- ✅ Input validation and sanitization
- ✅ NoSQL injection prevention (express-mongo-sanitize)
- ✅ XSS attack prevention (xss-clean)
- ✅ HTTP Parameter Pollution prevention (hpp)
- ✅ Request rate limiting (express-rate-limit)

### Server Security
- ✅ Helmet for secure HTTP headers
- ✅ CORS with origin restriction
- ✅ Environment variable protection
- ✅ Secure error handling without internal details
- ✅ Graceful shutdown handling

### File Upload Security
- ✅ Secure image upload using Multer
- ✅ File type validation (images only)
- ✅ File size limits (5MB max)
- ✅ Cloudinary integration for secure storage
- ✅ Automatic image optimization

### Database Security
- ✅ Mongoose schema validation
- ✅ Soft delete functionality
- ✅ Indexed queries for performance
- ✅ Sensitive field protection

## 📁 Project Structure

```
server/
├── config/
│   ├── db.js                 # Database connection
│   └── cloudinary.js         # Cloudinary configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   └── jobController.js      # Job CRUD operations
├── middleware/
│   ├── authMiddleware.js     # JWT authentication
│   ├── adminMiddleware.js    # Admin authorization
│   ├── uploadMiddleware.js   # File upload handling
│   ├── validationMiddleware.js # Input validation
│   └── errorMiddleware.js    # Error handling
├── models/
│   ├── Admin.js              # Admin schema
│   └── Job.js                # Job schema
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   └── jobRoutes.js          # Job endpoints
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies
└── server.js                 # Main server file
```

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the server directory:

```bash
# Copy example file
cp .env.example .env
```

Edit `.env` with your actual values:

```env
NODE_ENV=development
PORT=5000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/job-platform
# Or MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secrets (generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_super_secure_refresh_token_secret_here

# Cloudinary (Get from https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### 3. Generate Secure JWT Secrets

```bash
# Run this command to generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will run on: `http://localhost:5000`

## 📡 API Endpoints

### Authentication Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Admin login |
| POST | `/api/auth/logout` | Private | Admin logout |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/auth/me` | Private | Get current admin |
| GET | `/api/auth/verify` | Private | Verify token |
| PUT | `/api/auth/password` | Private | Update password |
| POST | `/api/auth/register` | Superadmin | Register new admin |

### Job Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/jobs` | Public | Get all jobs (paginated) |
| GET | `/api/jobs/search` | Public | Search jobs |
| GET | `/api/jobs/category/:category` | Public | Get jobs by category |
| GET | `/api/jobs/:id` | Public | Get single job |
| POST | `/api/jobs/:id/share` | Public | Increment share count |
| POST | `/api/jobs` | Admin | Create new job |
| PUT | `/api/jobs/:id` | Admin | Update job |
| DELETE | `/api/jobs/:id` | Admin | Soft delete job |
| GET | `/api/jobs/stats/overview` | Admin | Get job statistics |
| DELETE | `/api/jobs/:id/permanent` | Superadmin | Permanently delete job |

## 🔑 First Admin Setup

### Option 1: Using API (Recommended for initial setup)

First, temporarily modify the register route to allow public access for creating the first admin:

```javascript
// In routes/authRoutes.js - temporarily comment out superAdminOnly
router.post('/register', validateAdminRegistration, registerAdmin);
```

Then make a POST request:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "role": "superadmin"
  }'
```

**Important:** After creating the first admin, restore the security:

```javascript
// In routes/authRoutes.js - uncomment this line
router.post('/register', superAdminOnly, validateAdminRegistration, registerAdmin);
```

### Option 2: Using MongoDB Shell

```javascript
// Connect to MongoDB
mongosh "your_connection_string"

// Switch to database
use job-platform

// Create admin manually
db.admins.insertOne({
  name: "Super Admin",
  email: "admin@example.com",
  password: "$2a$12$hash_password_here", // Use bcrypt to hash
  role: "superadmin",
  isActive: true,
  loginAttempts: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Option 3: Create Script

Create `scripts/createAdmin.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'SecurePassword123',
      role: 'superadmin'
    });
    
    console.log('Admin created:', admin);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
```

Run: `node scripts/createAdmin.js`

## 📝 Usage Examples

### Login

```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'SecurePassword123'
  })
});

const data = await response.json();
console.log(data.data.token); // Use this token for authenticated requests
```

### Create Job (Admin)

```javascript
const formData = new FormData();
formData.append('title', 'Senior Developer');
formData.append('company', 'Tech Corp');
formData.append('location', 'New York');
formData.append('jobType', 'Full-time');
formData.append('experience', '5+ years');
formData.append('description', 'Job description here...');
formData.append('category', 'Technology');
formData.append('posterImage', imageFile);

const response = await fetch('http://localhost:5000/api/jobs', {
  method: 'POST',
  credentials: 'include', // Include cookies
  headers: {
    'Authorization': `Bearer ${token}` // Or use token
  },
  body: formData
});
```

### Get All Jobs (Public)

```javascript
const response = await fetch('http://localhost:5000/api/jobs?page=1&limit=10&category=Technology');
const data = await response.json();
console.log(data.data); // Array of jobs
```

## 🛡️ Security Best Practices Implemented

1. **Never expose sensitive data** in API responses
2. **Use HTTP-only cookies** for authentication tokens
3. **Implement rate limiting** to prevent brute force attacks
4. **Validate and sanitize** all user inputs
5. **Use HTTPS** in production
6. **Keep dependencies updated** regularly
7. **Monitor logs** for suspicious activity
8. **Use environment variables** for sensitive data
9. **Implement CORS** properly
10. **Hash passwords** with strong algorithm (bcrypt with high cost)

## 🐛 Error Handling

All errors are caught and returned in a consistent format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

In development mode, stack traces are included for debugging.

## 📊 Database Models

### Admin Model
- Email (unique, validated)
- Password (hashed with bcrypt)
- Name
- Role (admin/superadmin)
- Account status tracking
- Login attempt tracking
- Auto-locking after failed attempts

### Job Model
- Title, Company, Location
- Job Type, Experience, Salary
- Description, Requirements, Responsibilities
- Poster Image (Cloudinary URL)
- Category, Status
- Application details
- View and share counters
- Soft delete support

## 🔄 Token System

- **Access Token**: Short-lived (1 hour), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens
- Both stored in HTTP-only cookies (most secure)
- Also available in response body for non-cookie clients

## 🌐 CORS Configuration

Configured to accept requests from:
- Development: `http://localhost:3000`
- Production: Set via `CLIENT_URL` environment variable

## 📦 Dependencies

### Production
- express - Web framework
- mongoose - MongoDB ODM
- bcryptjs - Password hashing
- jsonwebtoken - JWT implementation
- multer - File upload handling
- cloudinary - Image storage
- helmet - Security headers
- cors - Cross-origin resource sharing
- express-rate-limit - Rate limiting
- express-mongo-sanitize - NoSQL injection prevention
- xss-clean - XSS prevention
- hpp - HTTP parameter pollution prevention
- cookie-parser - Cookie parsing
- dotenv - Environment variables

### Development
- nodemon - Auto-restart server

## 🚨 Important Notes

1. **Change all default secrets** in production
2. **Use HTTPS** in production
3. **Set NODE_ENV=production** in production
4. **Keep .env file secure** and never commit it
5. **Regularly update dependencies** for security patches
6. **Monitor rate limit** logs for attacks
7. **Backup database** regularly
8. **Use MongoDB Atlas** for production database
9. **Configure Cloudinary** properly for image storage
10. **Test all endpoints** before deployment

## 📄 License

ISC

## 👨‍💻 Support

For issues or questions, please check the code comments or create an issue in the repository.

---

**Built with ❤️ for production-level security**

# 🔐 Production-Ready Authentication System

## Overview
This is a **production-grade, secure JWT-based authentication system** for Express.js v4 with MongoDB.

## ✅ Security Features Implemented

### 1. **JWT Authentication**
- ✅ Access Token (15 minutes) - Short-lived for security
- ✅ Refresh Token (7 days) - Long-lived with rotation
- ✅ Token rotation to prevent reuse attacks
- ✅ Tokens stored in database for validation

### 2. **HTTP-Only Secure Cookies**
- ✅ `httpOnly: true` - Prevents XSS attacks
- ✅ `secure: true` - HTTPS only in production
- ✅ `sameSite: 'strict'` - Prevents CSRF attacks
- ✅ Proper expiration times

### 3. **Password Security**
- ✅ bcrypt hashing with salt rounds: 12
- ✅ Password validation (min 8 chars, uppercase, lowercase, number)
- ✅ Never returns password in API responses
- ✅ Passwords only hashed on modification

### 4. **Brute Force Protection**
- ✅ Rate limiting: 100 requests per 15 min (general)
- ✅ Stricter rate limiting: 5 login attempts per 15 min
- ✅ Account lockout: 5 failed attempts = 30 min lock
- ✅ Login attempts tracking in database

### 5. **Input Sanitization**
- ✅ `express-mongo-sanitize` - NoSQL injection prevention
- ✅ `sanitize-html` - XSS protection
- ✅ Custom validation middleware
- ✅ Recursive object/array sanitization

### 6. **Security Headers**
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Cache-Control headers on logout
- ✅ Content Security Policy

### 7. **Additional Security**
- ✅ Role-based access control (admin, superadmin)
- ✅ Account status tracking (active/inactive)
- ✅ Last login timestamp
- ✅ Token verification endpoint

---

## 📁 Folder Structure

```
server/
├── controllers/
│   ├── authController.js       # Login, Logout, Register, Refresh Token
│   └── jobController.js         # Protected job routes
├── middleware/
│   ├── authMiddleware.js        # JWT verification, route protection
│   ├── adminMiddleware.js       # Role-based access control
│   ├── validationMiddleware.js  # Input validation & sanitization
│   ├── sanitizeMiddleware.js    # XSS protection (sanitize-html)
│   ├── errorMiddleware.js       # Global error handling
│   └── uploadMiddleware.js      # File upload security
├── models/
│   ├── Admin.js                 # Admin schema with bcrypt
│   └── Job.js                   # Job schema
├── routes/
│   ├── authRoutes.js            # Authentication routes
│   └── jobRoutes.js             # Protected job routes
├── utils/
│   └── generateToken.js         # JWT creation, cookie setting
├── config/
│   ├── db.js                    # MongoDB connection
│   └── cloudinary.js           # Cloudinary config
├── scripts/
│   ├── createAdmin.js           # Create first superadmin
│   └── quickCreateAdmin.js      # Quick admin setup
├── server.js                    # Main application entry
└── .env                         # Environment variables
```

---

## 🔑 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string

# JWT Secrets (MUST be long and secure)
JWT_ACCESS_SECRET=your_long_random_access_secret
JWT_REFRESH_SECRET=your_long_random_refresh_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
CLIENT_URL=http://localhost:3000
```

---

## 🚀 API Endpoints

### **Public Routes** (No Authentication)

#### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "...",
      "name": "Admin Name",
      "email": "admin@example.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGc..." // Also in HTTP-only cookie
  }
}
```

#### 2. Refresh Token
```http
POST /api/auth/refresh
Cookie: refreshToken=...

Response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_token_here"
  }
}
```

### **Protected Routes** (Require Authentication)

#### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer your_access_token
Cookie: accessToken=...

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

#### 4. Get Current User
```http
GET /api/auth/me
Authorization: Bearer your_access_token

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": "admin",
    "isActive": true
  }
}
```

#### 5. Create Admin (Superadmin only)
```http
POST /api/auth/register
Authorization: Bearer superadmin_token
Content-Type: application/json

{
  "name": "New Admin",
  "email": "newadmin@example.com",
  "password": "SecurePass123",
  "role": "admin"
}
```

---

## 🛡️ Middleware Usage

### 1. **Protect Routes**
```javascript
const { protect } = require('./middleware/authMiddleware');

// Apply to single route
router.get('/protected', protect, controller);

// Apply to all routes in router
router.use(protect);
```

### 2. **Role-Based Access**
```javascript
const { protect } = require('./middleware/authMiddleware');
const { adminOnly, superadminOnly } = require('./middleware/adminMiddleware');

// Only superadmins can access
router.post('/admin/create', protect, superadminOnly, createAdmin);
```

### 3. **Validation**
```javascript
const { validateLogin, validateJobCreation } = require('./middleware/validationMiddleware');

router.post('/auth/login', validateLogin, loginAdmin);
router.post('/jobs', protect, validateJobCreation, createJob);
```

---

## 💻 Frontend Integration

### **1. Login Example**
```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // IMPORTANT: Include cookies
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store in localStorage as backup
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('admin', JSON.stringify(data.data.admin));
      
      // Redirect to dashboard
      window.location.href = '/admin/dashboard';
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

### **2. Logout Example**
```javascript
const logout = async () => {
  const token = localStorage.getItem('accessToken');
  
  try {
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
  } catch (error) {
    // Continue with cleanup even if request fails
  } finally {
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('admin');
    
    // Redirect to login
    window.location.href = '/admin/login';
  }
};
```

### **3. Protected API Request**
```javascript
const fetchJobs = async () => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:5000/api/jobs', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  if (response.status === 401) {
    // Token expired, try refresh or redirect to login
    window.location.href = '/admin/login';
    return;
  }

  return await response.json();
};
```

### **4. Persist Authentication (Auto-login)**
```javascript
// In your Next.js layout or React useEffect
useEffect(() => {
  const verifyAuth = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      const data = await response.json();
      // User is authenticated, continue
    } catch (error) {
      // Remove invalid token
      localStorage.removeItem('accessToken');
      localStorage.removeItem('admin');
      router.push('/admin/login');
    }
  };

  verifyAuth();
}, []);
```

---

## 🔒 Security Best Practices Implemented

### ✅ **1. Token Management**
- Short-lived access tokens (15 min)
- Long-lived refresh tokens (7 days) with rotation
- Tokens invalidated on logout
- Refresh token stored in database

### ✅ **2. Cookie Security**
- HTTP-only cookies prevent XSS
- Secure flag for HTTPS
- SameSite strict prevents CSRF
- Proper expiration

### ✅ **3. Password Security**
- Bcrypt with high salt rounds
- Never exposed in responses
- Strong password requirements
- Compared securely

### ✅ **4. Input Validation**
- Sanitize all inputs
- Validate before processing
- NoSQL injection prevention
- XSS protection

### ✅ **5. Rate Limiting**
- General: 100 req/15min
- Auth: 5 req/15min
- Account lockout after 5 failed attempts

### ✅ **6. Error Handling**
- Never expose sensitive info in errors
- Generic error messages
- Proper HTTP status codes
- Logged for debugging

### ✅ **7. Back Button Prevention**
- Cache-Control headers on logout
- Client-side token validation
- Server-side token invalidation

---

## 🧪 Testing Authentication

### **1. Create First Admin**
```bash
cd server
node scripts/quickCreateAdmin.js
```

### **2. Test Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourPassword123"}'
```

### **3. Test Protected Route**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **4. Test Logout**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🐛 Common Issues & Solutions

### **Issue: "Token expired" errors**
**Solution:** Implement automatic token refresh using refresh token

### **Issue: CORS errors**
**Solution:** Ensure `credentials: 'include'` in fetch and CORS allows credentials

### **Issue: Cookies not being set**
**Solution:** Check domain, secure flag (use HTTP in dev), and sameSite settings

### **Issue: Can access dashboard after logout**
**Solution:** Check if client clears localStorage and validates token on mount

---

## 📊 Security Checklist

- [x] JWT with secure secrets
- [x] HTTP-only cookies
- [x] Password hashing (bcrypt)
- [x] Rate limiting
- [x] NoSQL injection prevention
- [x] XSS protection
- [x] CSRF protection
- [x] Helmet security headers
- [x] Input validation
- [x] Account lockout
- [x] Cache control headers
- [x] Token rotation
- [x] Role-based access
- [x] Environment variables
- [x] Error handling
- [x] HTTPS ready (production)

---

## 🎯 Next Steps

1. **Set NODE_ENV=production** before deploying
2. **Use HTTPS** in production (required for secure cookies)
3. **Rotate JWT secrets** periodically
4. **Monitor login attempts** for suspicious activity
5. **Implement 2FA** (optional, for extra security)
6. **Add IP whitelisting** for admin routes (optional)
7. **Set up logging** (Winston, Morgan)
8. **Implement session management** (optional)

---

## 📞 Support

Your authentication system is **production-ready** and follows industry best practices! 🎉

For questions or improvements, refer to:
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

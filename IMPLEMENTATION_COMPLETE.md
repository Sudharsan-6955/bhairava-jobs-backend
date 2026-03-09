# 🔐 Secure Backend - Production Ready

## ✅ What Has Been Implemented

Your job upload platform backend now includes **enterprise-level security** with:

### 1. Advanced JWT Authentication ✨
- ✅ Separate `JWT_ACCESS_SECRET` (15-minute tokens)
- ✅ Separate `JWT_REFRESH_SECRET` (7-day tokens)
- ✅ Refresh token rotation system
- ✅ Token reuse attack detection
- ✅ HTTP-only secure cookies (XSS protection)
- ✅ SameSite=strict (CSRF protection)

### 2. Secure File Upload 📤
- ✅ Memory storage only (no local files)
- ✅ Direct Cloudinary SDK upload  
- ✅ 2MB file size limit
- ✅ MIME type validation (jpeg, jpg, png, webp only)
- ✅ Extension validation
- ✅ Automatic image optimization

### 3. Complete API Security 🛡️
- ✅ Rate limiting (100/15min general, 5/15min auth)
- ✅ NoSQL injection prevention
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Parameter pollution prevention
- ✅ Input validation on all routes
- ✅ CORS restricted to CLIENT_URL

### 4. Database Protection 🔐
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Account locking (5 attempts, 30-minute lockout)
- ✅ Sensitive fields hidden from API
- ✅ Timestamps on all records

### 5. Authorization & Access Control 👮
- ✅ Role-based access (admin/superadmin)
- ✅ Admin-only job management
- ✅ Superadmin-only admin creation
- ✅ Admin can only modify own jobs
- ✅ Public job viewing
- ✅ Protected admin routes

---

## 📋 Required Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Create `.env` File
```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` with your actual values:

```env
NODE_ENV=development
PORT=5000

# MongoDB (recommend MongoDB Atlas)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/job-platform

# Generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=your_64_character_access_secret_here
JWT_REFRESH_SECRET=your_64_character_refresh_secret_here

# From Cloudinary Dashboard (https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Your frontend URL
CLIENT_URL=http://localhost:3000
```

### 4. Generate Strong JWT Secrets

```bash
# Run this command TWICE and paste results into .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Start Server
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected
🚀 Server running in DEVELOPMENT mode
📡 Port: 5000
🌐 URL: http://localhost:5000
```

### 6. Create First Admin

```bash
npm run create-admin
```

Follow the prompts to create your first superadmin account.

---

## 🧪 Testing the API

### Test 1: Login (Get Tokens)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourPassword123"
  }'
```

**Response includes:**
- Access token (in response + HTTP-only cookie)
- Refresh token (HTTP-only cookie)  
- Admin details

### Test 2: Upload Job with Image

```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "title=Senior Node.js Developer" \
  -F "company=Tech Corp Inc" \
  -F "location=New York, NY" \
  -F "jobType=Full-time" \
  -F "experience=5+ years" \
  -F "description=We are looking for an experienced Node.js developer to join our team. You should have strong skills in Express.js, MongoDB, and security best practices." \
  -F "category=Technology" \
  -F "posterImage=@/path/to/image.jpg"
```

**What happens:**
1. Multer validates file in memory
2. File uploaded to Cloudinary
3. Secure URL stored in MongoDB
4. Job created with Cloudinary image URL

### Test 3: Get Public Jobs (No Auth Needed)
```bash
curl http://localhost:5000/api/jobs
```

### Test 4: Refresh Token (Token Rotation)
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Cookie: refreshToken=YOUR_REFRESH_TOKEN"
```

**What happens:**
1. Old refresh token verified
2. Mismatch detected if token reused
3. New access token generated
4. New refresh token generated (rotated)
5. Old token invalidated

### Test 5: Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**What happens:**
1. Refresh token cleared from database
2. Access token cookie cleared
3. Refresh token cookie cleared
4. User logged out on all devices

---

## 🔍 Security Features in Action

### Feature 1: Account Locking (Brute Force Protection)
- After 5 wrong passwords → account locked
- Locked for 30 minutes
- Prevents automated attacks

### Feature 2: Token Rotation
- Each refresh generates NEW tokens
- Old tokens are invalidated
- Stolen tokens can't be reused
- Detects and blocks reuse attempts

### Feature 3: Rate Limiting
- Max 100 requests per 15 minutes (general)
- Max 5 login attempts per 15 minutes
- Prevents DDoS and brute force

### Feature 4: Memory-Only Uploads
- Files never written to disk
- No `/uploads` directory
- Direct Cloudinary upload
- No local storage vulnerabilities

### Feature 5: Secure Cookies
- HTTP-only (can't be accessed by JavaScript)
- Secure (HTTPS only in production)
- SameSite=strict (CSRF protection)
- Restricted paths

---

## 📁 Project Structure

```
server/
├── config/
│   ├── db.js                      # MongoDB connection
│   └── cloudinary.js              # Cloudinary SDK setup
├── controllers/
│   ├── authController.js          # Login, logout, refresh
│   └── jobController.js           # Job CRUD operations
├── middleware/
│   ├── authMiddleware.js          # JWT verification
│   ├── adminMiddleware.js         # Role checking
│   ├── uploadMiddleware.js        # File upload handling
│   ├── validationMiddleware.js    # Input validation
│   └── errorMiddleware.js         # Error handling
├── models/
│   ├── Admin.js                   # Admin schema
│   └── Job.js                     # Job schema
├── routes/
│   ├── authRoutes.js              # Auth endpoints
│   └── jobRoutes.js               # Job endpoints
├── scripts/
│   └── createAdmin.js             # Admin creation
├── utils/
│   └── generateToken.js           # Token utilities
├── server.js                      # Main entry point
├── package.json                   # Dependencies
├── .env.example                   # Environment template
└── SECURITY_VERIFICATION.md       # This document
```

---

## 🛡️ Security Checklist

Before Production:
- [ ] Generate new JWT secrets (not from examples)
- [ ] Configure MongoDB Atlas with credentials
- [ ] Configure Cloudinary with credentials
- [ ] Set CLIENT_URL to production frontend domain
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL on domain
- [ ] Test login with new credentials
- [ ] Test file upload
- [ ] Test token refresh
- [ ] Verify cookies in browser (DevTools)
- [ ] Test rate limiting
- [ ] Verify error messages don't leak info

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current admin
- `PUT /api/auth/password` - Change password
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/register` - Create admin (superadmin only)

### Public Jobs (No Auth)
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/search` - Search jobs
- `GET /api/jobs/:id` - Get job details  
- `GET /api/jobs/category/:category` - Jobs by category
- `POST /api/jobs/:id/share` - Count shares

### Admin Jobs (Auth Required)
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Soft delete
- `GET /api/jobs/stats/overview` - Statistics
- `DELETE /api/jobs/:id/permanent` - Permanent delete (superadmin)

---

## 🚀 Production Deployment

1. **Environment Setup**
   - Create `.env` with production values
   - Use strong, unique JWT secrets
   - Configure MongoDB Atlas
   - Configure Cloudinary

2. **Deploy Server**
   - Render, Railway, Heroku, or AWS
   - Enable HTTPS/SSL
   - Set NODE_ENV=production
   - Set CLIENT_URL to frontend domain

3. **Verify Security**
   - Test all endpoints
   - Check rate limiting
   - Verify token rotation
   - Test file uploads
   - Monitor error logs

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

---

## ✨ Implementation Summary

| Feature | Status | Notes |
|---------|--------|-------|
| JWT Access Tokens | ✅ | 15-minute expiry |
| JWT Refresh Tokens | ✅ | 7-day expiry |
| Token Rotation | ✅ | Prevents reuse attacks |
| HTTP-Only Cookies | ✅ | XSS protection |
| CSRF Protection | ✅ | SameSite=strict |
| Password Hashing | ✅ | Bcrypt (12 rounds) |
| Account Locking | ✅ | After 5 failures |
| Rate Limiting | ✅ | 100/15min, 5/15min auth |
| NoSQL Injection | ✅ | express-mongo-sanitize |
| XSS Prevention | ✅ | xss-clean |
| CORS Restricted | ✅ | CLIENT_URL only |
| Helmet Headers | ✅ | Security headers |
| Memory Uploads | ✅ | No local files |
| Cloudinary SDK | ✅ | Direct upload |
| File Validation | ✅ | MIME + extension |
| Size Limiting | ✅ | 2MB max |
| Input Validation | ✅ | All fields |
| Error Handling | ✅ | No info leakage |
| Role-Based Auth | ✅ | Admin/Superadmin |
| Database Security | ✅ | Mongoose validation |

---

## ❓ Frequently Asked Questions

**Q: Why 15-minute access tokens?**  
A: Shorter tokens reduce the damage window if compromised. Refresh tokens allow re-authentication without forcing users to log in.

**Q: Why token rotation on refresh?**  
A: If a refresh token is stolen, rotating it on every use means it can only be used once. The attacker's token becomes invalid immediately.

**Q: Why memory storage instead of local disk?**  
A: Avoids disk vulnerabilities and simplifies deployment (no need to manage file cleanup).

**Q: Why 2MB file size limit?**  
A: Balances quality and security. Larger files increase attack surface and bandwidth usage.

**Q: Why Bcrypt cost factor 12?**  
A: Intentionally slow to prevent brute-force attacks. Takes ~500ms to hash a password.

**Q: Why rate limiting?**  
A: Prevents brute-force attacks on login and DDoS attacks on the API.

---

## 📞 Support & Troubleshooting

**Port already in use:**
```bash
# Change PORT in .env to 5001
# Or kill existing process:
lsof -i :5000
kill -9 <PID>
```

**MongoDB connection fails:**
- Verify MONGO_URI connection string
- Whitelist IP in MongoDB Atlas
- Check database credentials

**Cloudinary errors:**
- Verify credentials in .env
- Check Cloudinary Dashboard
- Ensure API key and secret are correct

**JWT errors:**
- Verify JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env
- Ensure secrets are 64+ characters
- Regenerate if needed using provided command

---

## 🎉 You're All Set!

Your secure job upload platform backend is ready for:
- ✅ Development
- ✅ Testing
- ✅ Production deployment

**Status**: PRODUCTION GRADE SECURE ✨

Start the server and test it out!

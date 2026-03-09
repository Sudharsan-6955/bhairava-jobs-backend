# 🚀 Quick Start Guide

Get your secure Job Upload Platform backend running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd server
npm install
```

This installs all required packages including security middleware, authentication, and file upload handlers.

## Step 2: Configure Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with your values:**

   ```env
   NODE_ENV=development
   PORT=5000
   
   # MongoDB (Local or Atlas)
   MONGO_URI=mongodb://localhost:27017/job-platform
   # Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname
   
   # Generate these using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   JWT_SECRET=paste_generated_secret_here
   JWT_REFRESH_SECRET=paste_another_generated_secret_here
   
   # Get from https://cloudinary.com/console
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Your frontend URL
   CLIENT_URL=http://localhost:3000
   ```

3. **Generate secure JWT secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Run this command twice and paste each result into JWT_SECRET and JWT_REFRESH_SECRET.

## Step 3: Set Up MongoDB

### Option A: Local MongoDB
```bash
# Install MongoDB Community Edition
# Then start MongoDB service
mongod

# Create database (automatically created on first connection)
```

### Option B: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (512MB)
3. Create database user
4. Whitelist your IP (or 0.0.0.0/0 for all)
5. Get connection string
6. Paste in `.env` as MONGO_URI

## Step 4: Set Up Cloudinary

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account (25GB storage, 25GB bandwidth)
3. From Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
4. Paste in `.env` file

## Step 5: Start the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

You should see:
```
✅ MongoDB Connected
🚀 Server running in DEVELOPMENT mode
📡 Port: 5000
🌐 URL: http://localhost:5000
```

## Step 6: Create First Admin

### Method 1: Using Script (Recommended)
```bash
npm run create-admin
```

Follow the prompts:
- Enter name: `Super Admin`
- Enter email: `admin@example.com`
- Enter password: `SecurePassword123`
- Enter role: `superadmin` (press Enter for default)

### Method 2: Using API
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "role": "superadmin"
  }'
```

**Note:** For Method 2, temporarily modify `routes/authRoutes.js`:
```javascript
// Comment out the superAdminOnly middleware for first admin
router.post('/register', validateAdminRegistration, registerAdmin);
```

After creating first admin, restore it:
```javascript
router.post('/register', superAdminOnly, validateAdminRegistration, registerAdmin);
```

## Step 7: Test Your API

### Test Health Check
```bash
curl http://localhost:5000/api/health
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123"
  }'
```

Save the token from response for next requests.

### Test Create Job
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Senior Developer" \
  -F "company=Tech Corp" \
  -F "location=New York" \
  -F "jobType=Full-time" \
  -F "experience=5+ years" \
  -F "description=We are looking for an experienced developer..." \
  -F "category=Technology" \
  -F "posterImage=@/path/to/image.jpg"
```

### Test Get All Jobs (Public)
```bash
curl http://localhost:5000/api/jobs
```

## 🎉 You're All Set!

Your secure backend is now running with:
- ✅ JWT Authentication
- ✅ Role-based Access Control
- ✅ Secure File Uploads
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ XSS & NoSQL Injection Protection
- ✅ CORS Configuration
- ✅ HTTP-only Cookies

## 📚 Next Steps

1. **Read the Documentation**
   - [README.md](./README.md) - Complete documentation
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide

2. **Explore API Endpoints**
   - Authentication: `http://localhost:5000/api/auth/*`
   - Jobs: `http://localhost:5000/api/jobs/*`

3. **Connect Frontend**
   - Update API URL in your frontend
   - Enable credentials for cookie-based auth
   - Test file uploads

4. **Test Security Features**
   - Try invalid inputs (blocked by validation)
   - Test rate limiting (make 100+ requests)
   - Verify authentication protection

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in .env file
PORT=5001
```

### MongoDB Connection Failed
- Verify MongoDB is running
- Check connection string in .env
- For Atlas: verify IP whitelist and credentials

### Cloudinary Upload Fails
- Verify credentials in .env
- Check file size (max 5MB)
- Ensure valid image format (jpg, png, webp, gif)

### CORS Errors
- Update CLIENT_URL in .env
- Verify frontend is running on correct port

### Cannot Create Admin
- Check database connection
- Verify email format
- Ensure password is 8+ characters

## 📞 Support

For issues:
1. Check error logs in terminal
2. Review [README.md](./README.md) for detailed docs
3. Check environment variables are correct
4. Verify all dependencies are installed

## 🔐 Security Reminders

- ⚠️ Never commit `.env` file
- ⚠️ Use strong passwords (12+ characters)
- ⚠️ Generate unique JWT secrets for production
- ⚠️ Enable HTTPS in production
- ⚠️ Regularly update dependencies

---

**Happy Coding! 🚀**

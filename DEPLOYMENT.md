# Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB connection string (MongoDB Atlas recommended)
- [ ] Generate and set strong JWT secrets (64+ characters)
- [ ] Configure Cloudinary credentials
- [ ] Set production CLIENT_URL
- [ ] Remove any development/debug variables

### 2. Security
- [ ] Enable HTTPS/SSL certificate
- [ ] Review and adjust rate limits
- [ ] Verify CORS settings for production domain
- [ ] Ensure all secrets are secure and rotated
- [ ] Enable MongoDB authentication
- [ ] Review Cloudinary security settings

### 3. Database
- [ ] Backup database before deployment
- [ ] Create database indexes (automatically done via models)
- [ ] Verify connection string works
- [ ] Test database performance

### 4. Code
- [ ] Remove console.logs (optional)
- [ ] Test all API endpoints
- [ ] Verify error handling
- [ ] Check file upload limits
- [ ] Review authentication flow

## 🚀 Deployment Platforms

### Option 1: Render (Recommended for Free Tier)

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configuration**
   ```
   Name: job-platform-api
   Region: Choose closest to your users
   Branch: main
   Root Directory: server
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Environment Variables**
   Add all variables from `.env.example`:
   - NODE_ENV=production
   - PORT=5000
   - MONGO_URI=your_mongodb_atlas_uri
   - JWT_SECRET=your_secret
   - JWT_REFRESH_SECRET=your_refresh_secret
   - CLOUDINARY_CLOUD_NAME=your_cloud_name
   - CLOUDINARY_API_KEY=your_api_key
   - CLOUDINARY_API_SECRET=your_api_secret
   - CLIENT_URL=https://your-frontend-url.com

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your API will be live at: `https://your-app-name.onrender.com`

### Option 2: Railway

1. **Create Project**
   - Go to [Railway Dashboard](https://railway.app/)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configuration**
   - Railway auto-detects Node.js
   - Set root directory to `server` if needed
   - Add environment variables

3. **Deploy**
   - Automatic deployment on push
   - Get deployment URL from dashboard

### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create job-platform-api
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGO_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_secret
   heroku config:set JWT_REFRESH_SECRET=your_refresh_secret
   heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
   heroku config:set CLOUDINARY_API_KEY=your_api_key
   heroku config:set CLOUDINARY_API_SECRET=your_api_secret
   heroku config:set CLIENT_URL=your_frontend_url
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 4: DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean Dashboard
   - Click "Create" → "Apps"
   - Connect GitHub repository

2. **Configure**
   - Select Node.js environment
   - Set build command: `npm install`
   - Set run command: `npm start`
   - Add environment variables

3. **Deploy**
   - Click "Create Resources"
   - Wait for deployment

### Option 5: AWS EC2 (Advanced)

1. **Launch EC2 Instance**
   - Choose Ubuntu Server
   - Configure security groups (allow ports 22, 80, 443, 5000)
   - Create/download key pair

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update
   sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PM2
   sudo npm install -g pm2

   # Install Nginx
   sudo apt install -y nginx
   ```

4. **Clone and Setup**
   ```bash
   git clone your-repo-url
   cd your-repo/server
   npm install
   
   # Create .env file
   nano .env
   # Add your environment variables
   ```

5. **Start with PM2**
   ```bash
   pm2 start server.js --name job-api
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 🗄️ Database Setup (MongoDB Atlas)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free cluster
   - Choose cloud provider and region

2. **Database Access**
   - Create database user
   - Set username and strong password
   - Add read/write permissions

3. **Network Access**
   - Add IP address: `0.0.0.0/0` (allow from anywhere)
   - Or add specific deployment platform IPs

4. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with your database name

   Example:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/job-platform?retryWrites=true&w=majority
   ```

## ☁️ Cloudinary Setup

1. **Create Account**
   - Go to [Cloudinary](https://cloudinary.com/)
   - Sign up for free account

2. **Get Credentials**
   - Go to Dashboard
   - Copy:
     - Cloud Name
     - API Key
     - API Secret

3. **Configure Upload Presets** (Optional)
   - Go to Settings → Upload
   - Create preset for job posters
   - Set allowed file types and transformations

## 🔐 SSL/HTTPS Setup

### For Cloud Platforms (Render, Railway, Heroku)
- SSL is automatically provided
- No additional configuration needed

### For Custom Servers (EC2, VPS)
Use Let's Encrypt (Free):
```bash
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring & Logging

### 1. Application Monitoring
- Use PM2 for process management (server monitoring)
- Set up error tracking (Sentry, LogRocket)
- Monitor API response times

### 2. Database Monitoring
- MongoDB Atlas provides built-in monitoring
- Set up alerts for performance issues
- Monitor connection pool usage

### 3. Log Management
- Use Winston or Morgan for logging
- Send logs to centralized service (Loggly, Papertrail)
- Monitor error rates

## 🔄 CI/CD Setup (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd server
        npm install
    
    - name: Run tests
      run: |
        cd server
        npm test
    
    - name: Deploy to Render
      run: |
        curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

## 🧪 Post-Deployment Testing

1. **Health Check**
   ```bash
   curl https://your-api-url.com/api/health
   ```

2. **Test Authentication**
   ```bash
   # Login
   curl -X POST https://your-api-url.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"SecurePassword123"}'
   ```

3. **Test Job Creation**
   ```bash
   # Create job (with token)
   curl -X POST https://your-api-url.com/api/jobs \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "title=Test Job" \
     -F "company=Test Corp" \
     -F "posterImage=@image.jpg"
   ```

4. **Load Testing**
   - Use Apache Bench or Artillery
   - Test rate limiting
   - Monitor response times

## 🚨 Common Issues & Solutions

### Issue: Database Connection Timeout
**Solution:** 
- Verify MongoDB Atlas IP whitelist
- Check connection string format
- Ensure database user has correct permissions

### Issue: CORS Errors
**Solution:**
- Update CLIENT_URL in production .env
- Verify CORS configuration in server.js
- Check if SSL is enabled on both frontend and backend

### Issue: File Upload Fails
**Solution:**
- Verify Cloudinary credentials
- Check file size limits
- Ensure correct MIME types

### Issue: High Response Times
**Solution:**
- Enable database indexes
- Optimize queries
- Implement caching (Redis)
- Use CDN for images

## 🔧 Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review security logs weekly
- [ ] Backup database weekly
- [ ] Monitor error rates
- [ ] Check rate limit logs
- [ ] Review and rotate JWT secrets (every 6 months)

### Performance Optimization
- Enable compression (gzip)
- Implement caching
- Optimize database queries
- Use CDN for static assets
- Enable HTTP/2

## 📱 Frontend Integration

Update frontend API URL:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-url.com/api';
```

Enable credentials in fetch requests:
```javascript
fetch(API_URL + '/jobs', {
  credentials: 'include' // Important for cookies
})
```

## 🎉 Launch Checklist

- [ ] Domain configured and SSL enabled
- [ ] All environment variables set
- [ ] Database production-ready
- [ ] Cloudinary configured
- [ ] Create first admin user
- [ ] Test all API endpoints
- [ ] Monitor logs for errors
- [ ] Setup backups
- [ ] Document API for frontend team
- [ ] Performance testing completed
- [ ] Security audit passed

---

**Remember:** Always test thoroughly before launching to production!

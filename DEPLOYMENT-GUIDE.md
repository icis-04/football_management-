# Football Team Manager - Deployment Guide

## 🚀 Current Deployment Status

### Backend (Live ✅)
- **URL**: https://football-management.onrender.com
- **Platform**: Render
- **Database**: SQLite with persistent disk storage

### Frontend (To Deploy)
- **Platform**: Vercel (recommended)

## 📋 Frontend Deployment to Vercel

### Method 1: Deploy with Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Navigate to frontend directory**:
   ```bash
   cd football-app/frontend
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N` (first time)
   - Project name: `football-team-manager` (or your choice)
   - Directory: `./` (current directory)
   - Build settings: Accept defaults (it will detect Vite)

4. **Set environment variables** (after first deployment):
   ```bash
   vercel env add VITE_API_URL
   ```
   When prompted, enter: `https://football-management.onrender.com/api/v1`

### Method 2: Deploy via GitHub Integration

1. **Push your code to GitHub**
2. **Go to [vercel.com](https://vercel.com)**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure project**:
   - Framework Preset: Vite
   - Root Directory: `football-app/frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Add Environment Variables**:
   ```
   VITE_API_URL = https://football-management.onrender.com/api/v1
   ```
7. **Deploy**

## 🔧 Post-Deployment Configuration

### 1. Update Backend CORS Settings

Once your frontend is deployed, add its URL to the backend's allowed origins:

1. **Go to Render Dashboard**
2. **Navigate to Environment variables**
3. **Add/Update**:
   ```
   FRONTEND_URL = https://your-app-name.vercel.app
   ```

### 2. Test the Deployment

1. **Visit your frontend URL**
2. **Try to sign up** (remember to use an allowed email or one ending in @test.com)
3. **Log in with**:
   - Email: `c.iwuchukwu@yahoo.com`
   - Password: `iwuchukwu`

## 📱 Mobile App Deployment (Optional)

The frontend is already a Progressive Web App (PWA) and works great on mobile devices!

Users can:
1. Visit the site on their mobile browser
2. Click "Add to Home Screen" 
3. Use it like a native app

## 🔍 Troubleshooting

### Frontend Issues

**Build fails on Vercel:**
- Check the build logs for specific errors
- Ensure all dependencies are in `package.json`
- Try building locally first: `npm run build`

**API connection issues:**
- Check browser console for CORS errors
- Verify `VITE_API_URL` is set correctly
- Ensure backend `FRONTEND_URL` includes your Vercel URL

**White screen after deployment:**
- Check if the rewrites are working (vercel.json)
- Clear browser cache
- Check browser console for errors

### Backend Issues

**Database errors:**
- Ensure persistent disk is attached in Render
- Check `DATABASE_PATH` points to `/var/data/football.db`

**File upload issues:**
- Verify `UPLOAD_PATH` is set to `/var/data/uploads`
- Check disk space on Render

## 🎯 Next Steps

1. **Set up a custom domain** (optional):
   - In Vercel: Settings → Domains
   - In Render: Settings → Custom Domains

2. **Enable analytics** (optional):
   - Vercel Analytics for frontend
   - Consider adding backend monitoring

3. **Set up CI/CD** (optional):
   - Auto-deploy on git push
   - Add build checks

## 📞 Support

If you encounter issues:
1. Check the logs (Vercel/Render dashboards)
2. Ensure all environment variables are set
3. Test locally first
4. Check browser console for frontend errors

## 🎉 Success Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Admin can log in
- [ ] Users can sign up (with allowed emails)
- [ ] Teams can be generated and published
- [ ] File uploads work
- [ ] Mobile PWA installable 
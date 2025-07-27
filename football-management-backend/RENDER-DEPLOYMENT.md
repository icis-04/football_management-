# Deploying Football Backend to Render

Render is a much better choice for your Express.js backend with SQLite database. It provides persistent storage, scheduled jobs support, and a proper environment for traditional backends.

## Why Render is Perfect for This Project

✅ **Persistent SQLite Database** - Your data persists between deployments  
✅ **Scheduled Jobs Support** - Cron jobs for team generation work perfectly  
✅ **File Upload Storage** - Profile pictures are stored permanently  
✅ **Free Tier Available** - 750 hours/month (perfect for small teams)  
✅ **Zero Configuration** - Works out of the box with Node.js apps  
✅ **Automatic HTTPS** - SSL certificates included  

## Quick Deployment Steps

### 1. Prerequisites

- GitHub account (to connect your repository)
- Render account (sign up at https://render.com)

### 2. Deploy Using Render Dashboard

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `football-app/football-management-backend` directory
5. Configure:
   - **Name**: `football-backend` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free tier to start

### 3. Add Environment Variables

In the Render dashboard, add these environment variables:

```bash
NODE_ENV=production
DATABASE_PATH=/var/data/football.db
UPLOAD_PATH=/var/data/uploads
JWT_SECRET=<click-generate>
JWT_REFRESH_SECRET=<click-generate>
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 4. Add Persistent Disk

1. In your service settings, go to "Disks"
2. Add a disk:
   - **Name**: `football-data`
   - **Mount Path**: `/var/data`
   - **Size**: 1 GB (free tier)

### 5. Deploy

Click "Create Web Service" and Render will:
- Clone your repository
- Install dependencies
- Build your TypeScript code
- Start your server
- Provide you with a URL like `https://football-backend.onrender.com`

## Using render.yaml (Recommended)

The `render.yaml` file in your repository automates all the above steps:

```yaml
services:
  - type: web
    name: football-backend
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_PATH
        value: /var/data/football.db
      - key: UPLOAD_PATH
        value: /var/data/uploads
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
    disk:
      name: football-data
      mountPath: /var/data
      sizeGB: 1
```

Just push this file to your repository and Render will use it automatically.

## Post-Deployment Steps

### 1. Update Frontend

Update your frontend API URL to use the Render backend:

```javascript
// In frontend/src/api/client.ts
const API_BASE_URL = 'https://your-app.onrender.com/api/v1';
```

### 2. Set Up Scheduled Jobs

Render supports cron jobs natively. Your team generation jobs will run automatically at the scheduled times.

### 3. Monitor Your App

- Check logs: Dashboard → Logs
- Monitor metrics: Dashboard → Metrics
- Set up alerts: Dashboard → Settings → Notifications

## Troubleshooting

### Build Failures

If the build fails due to TypeScript errors:
1. The `tsconfig.json` has been updated to be less strict
2. You can further relax by adding `"skipLibCheck": true`
3. Or fix the type errors (recommended for production)

### Database Issues

- Database is stored at `/var/data/football.db`
- Make sure `DATABASE_PATH` environment variable is set correctly
- The disk must be mounted before the app starts

### File Upload Issues

- Files are stored at `/var/data/uploads`
- Make sure `UPLOAD_PATH` environment variable is set correctly
- The disk has enough space (monitor usage in dashboard)

## Free Tier Limitations

- 750 hours/month (sleeps after 15 min of inactivity)
- 1 GB persistent disk
- 512 MB RAM
- Spins down when inactive (cold starts)

## Upgrading

When you outgrow the free tier:
- **Starter**: $7/month - No sleep, 2 GB RAM
- **Standard**: $25/month - 4 GB RAM, better performance
- **Pro**: Custom pricing for high-traffic apps

## Alternative: One-Click Deploy

For even easier deployment, you can use Render's Blueprint:

1. Add a `render.yaml` to your repository (already done)
2. Click this button: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
3. Follow the prompts

## Support

- Render Documentation: https://render.com/docs
- Community Forum: https://community.render.com
- Status Page: https://status.render.com 
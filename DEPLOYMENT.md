# Quick Deployment Guide to Netlify

## Prerequisites
- A Netlify account (free) - Sign up at https://netlify.com
- Your project files ready

## Option 1: Drag & Drop (Easiest - 2 minutes)

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com/
   - Log in to your account

2. **Deploy Your Site**
   - Click "Add new site" → "Deploy manually"
   - Drag and drop the entire `budget-app` folder into the upload area
   - Wait for deployment to complete (usually 30-60 seconds)

3. **Your Site is Live!**
   - Netlify will give you a URL like: `https://random-name-123.netlify.app`
   - You can customize this URL in Site settings → Domain management

4. **Update Your Site**
   - To update: Just drag and drop the folder again
   - Netlify will create a new deployment

## Option 2: GitHub Integration (Best for Updates)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/budget-app.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select your repository
   - Build settings:
     - Build command: (leave empty)
     - Publish directory: `.`
   - Click "Deploy site"

3. **Automatic Updates**
   - Every time you push to GitHub, Netlify auto-deploys!
   - No need to manually upload files

## Option 3: Netlify CLI (For Developers)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```
   - This opens a browser window to authorize

3. **Initialize Site**
   ```bash
   cd budget-app
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Select your team
   - Give it a site name (or let Netlify generate one)

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```
   - Confirm the publish directory is `.` (current directory)
   - Your site is now live!

5. **Future Deployments**
   ```bash
   netlify deploy --prod
   ```

## Important Notes

### About JSON File Storage

⚠️ **Important:** Netlify Functions use `/tmp` storage which is **ephemeral**. This means:
- JSON files are stored temporarily during function execution
- Data may not persist between deployments
- For production use, consider integrating a database

### Recommended for Production

For persistent data storage, integrate one of these (all have free tiers):

1. **Netlify Blobs** (Recommended for Netlify)
   - Built-in to Netlify
   - Simple key-value storage
   - https://docs.netlify.com/blobs/overview/

2. **Firebase Firestore**
   - Real-time database
   - Free tier: 1GB storage
   - https://firebase.google.com/

3. **Supabase**
   - PostgreSQL database
   - Free tier: 500MB database
   - https://supabase.com/

4. **FaunaDB**
   - Serverless database
   - Free tier: 100MB
   - https://fauna.com/

### Current Setup Works For:
- ✅ Testing and development
- ✅ Personal use with localStorage
- ✅ Demo purposes
- ❌ Production with multiple users
- ❌ Long-term data persistence

## Testing Your Deployment

After deployment, test these features:
1. ✅ Set a budget
2. ✅ Add household members
3. ✅ Create transactions
4. ✅ View dashboard statistics
5. ✅ Export data to JSON
6. ✅ Delete transactions

## Custom Domain

Want a custom domain like `budget.yourdomain.com`?

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the DNS configuration instructions
4. SSL certificate is automatically provisioned (free!)

## Troubleshooting

### Site Not Working After Deployment
- Check the Deploy log in Netlify dashboard
- Ensure all files are uploaded
- Functions should be in `netlify/functions/` directory

### Functions Not Working
- Check Functions tab in Netlify dashboard
- View function logs for errors
- Remember: `/tmp` storage is temporary

### Need Help?
- Netlify Community: https://answers.netlify.com/
- Netlify Docs: https://docs.netlify.com/
- Check browser console for errors

## Next Steps

After deployment:
1. 📝 Bookmark your site URL
2. 🔒 Consider adding authentication
3. 💾 Plan for database integration
4. 📱 Test on mobile devices
5. 🎨 Customize the theme if desired

---

**Your budget app is now live on the internet! 🎉**

Share the URL with your household members to start tracking expenses together.

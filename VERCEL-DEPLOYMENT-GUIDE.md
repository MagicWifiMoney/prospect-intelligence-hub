# Vercel Deployment Guide - Prospect Intelligence Hub

## ⚠️ IMPORTANT: Separate from mncannabishub

This project is **completely separate** from mncannabishub and will deploy to its own unique domain.

---

## 🔒 Ensuring Separate Deployment

### 1. Clean Deployment (First Time)

```bash
# Remove any existing Vercel links
rm -rf .vercel

# Deploy as a NEW project
vercel --prod

# Vercel will ask:
# "Set up and deploy?" → YES
# "Which scope?" → Select your account
# "Link to existing project?" → NO (create new)
# "What's your project's name?" → prospect-intelligence-hub
# "In which directory is your code located?" → ./
# "Want to override settings?" → NO
```

**Key:** When asked "Link to existing project?" say **NO**

---

## 📋 Pre-Deployment Checklist

### ✅ Required (Must Complete)

- [ ] **Update NEXTAUTH_SECRET** (CRITICAL)
  ```bash
  openssl rand -base64 32
  # Copy to .env locally AND Vercel environment variables
  ```

- [ ] **Verify package.json name**
  ```json
  {
    "name": "prospect-intelligence-hub"  // ✅ Unique name
  }
  ```

- [ ] **Check no .vercel directory exists**
  ```bash
  ls -la .vercel  # Should show "No such file or directory"
  ```

### 📝 Recommended

- [ ] Update NEXTAUTH_URL to production URL (can do after first deploy)
- [ ] Verify DATABASE_URL points to production Neon database
- [ ] Test build locally: `npm run build`

---

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI if not already installed
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod

# 4. When prompted:
# - Project name: prospect-intelligence-hub
# - Link to existing: NO
# - Override settings: NO
```

### Option 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import from Git repository
3. **IMPORTANT:** Set project name to `prospect-intelligence-hub`
4. Set framework preset to **Next.js**
5. Configure environment variables (see below)
6. Click **Deploy**

---

## 🔐 Environment Variables to Set in Vercel

After project is created, add these in Vercel Dashboard → Settings → Environment Variables:

### Critical (Required for Production)

```
DATABASE_URL=postgresql://... (Your production Neon database)
NEXTAUTH_SECRET=<generate with openssl rand -base64 32>
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

### Optional (Can Add Later)

```
GEMINI_API_KEY=your-gemini-key
ABACUSAI_API_KEY=your-abacus-key
APIFY_API_TOKEN=your-apify-token
AWS_BUCKET_NAME=your-bucket
AWS_REGION=us-east-1
AWS_FOLDER_PREFIX=prospects
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## ✅ Verification After Deployment

### 1. Check Project Name
```bash
# In Vercel dashboard, verify:
# - Project name: prospect-intelligence-hub
# - URL: prospect-intelligence-hub.vercel.app (or similar)
# - NOT: mncannabishub.vercel.app
```

### 2. Test Authentication
```
1. Visit: https://your-app.vercel.app/auth/signup
2. Create test account
3. Verify login works
4. Check dashboard loads
```

### 3. Verify Database Connection
```
1. Create a test prospect
2. Verify it appears in database
3. Check filtering works
```

---

## 🔄 Updating Production

After initial deployment:

```bash
# Deploy updates
vercel --prod

# Or connect to Git and auto-deploy on push
# Vercel Dashboard → Settings → Git → Connect Repository
```

---

## 🚨 Troubleshooting

### Issue: Deploying to Wrong Project

**Symptoms:** Deployment goes to mncannabishub domain

**Fix:**
```bash
# 1. Remove Vercel link
rm -rf .vercel

# 2. Unlink from Vercel dashboard
vercel unlink

# 3. Deploy fresh
vercel --prod
# When asked "Link to existing?" → Say NO
```

### Issue: Environment Variables Not Working

**Fix:**
```bash
# 1. Check in Vercel Dashboard → Settings → Environment Variables
# 2. Verify production environment is selected
# 3. Redeploy after adding variables
vercel --prod --force
```

### Issue: Build Fails

**Common causes:**
- Missing DATABASE_URL
- Missing NEXTAUTH_SECRET
- TypeScript errors

**Fix:**
```bash
# Test build locally first
npm run build

# Check build logs in Vercel dashboard
```

---

## 🎯 Expected Results

After successful deployment:

✅ Project name: `prospect-intelligence-hub`
✅ URL: `prospect-intelligence-hub-xxx.vercel.app`
✅ Domain: **NOT** mncannabishub.vercel.app
✅ Independent from other projects
✅ Own environment variables
✅ Own deployment history

---

## 📞 Support

**Issue:** Still deploying to wrong project
**Solution:** Contact me - we'll force unlink and recreate

**Vercel Documentation:**
- https://vercel.com/docs/cli
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/projects/overview

---

## 🔗 Custom Domain (Optional)

After deployment, you can add a custom domain:

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `your-custom-domain.com`
3. Update DNS records as instructed
4. Update NEXTAUTH_URL environment variable

---

**Last Updated:** 2026-01-10
**Status:** Ready for deployment as separate project

# Database Scripts Guide

This directory contains various database management scripts. **Choose carefully** - some scripts delete data!

## 🟢 SAFE Scripts (Recommended)

### `npm run init-users`
**Purpose:** Create admin, guide, and test users if they don't exist  
**Safe:** ✅ Yes - Does NOT delete any existing data  
**When to use:** First-time setup or if you need to recreate login credentials  
**Creates:**
- Admin: `admin@example.com` / `adminpass`
- Guide: `guide1@example.com` / `guidepass`
- User: `user1@example.com` / `userpass`

### `npm run cleanup-seed`
**Purpose:** Seed diverse locations, hotels, and transport for recommendations  
**Safe:** ✅ Mostly - Only deletes TEST data and specific seeded items  
**When to use:** When you need sample data for testing recommendations  
**Creates:**
- 9 locations (historical, cultural, natural, adventure, beach, mountain)
- 5 hotels (₹800-₹12,000 range)
- 5 transport options (train, bus, taxi, rental-car)

## 🟡 CAUTION Scripts

### `npm run seed-test`
**Purpose:** Add test data for recommendation feature  
**Safe:** ⚠️ Caution - Marks data with `isTestData: true`  
**When to use:** Testing recommendations with disposable data  
**Note:** Can be removed with `npm run unseed-test`

### `npm run unseed-test`
**Purpose:** Remove test data created by `seed-test`  
**Safe:** ✅ Yes - Only removes items marked with `isTestData: true`  
**When to use:** Cleanup after testing

## 🔴 DANGEROUS Scripts (Use with Extreme Caution!)

### `npm run seed`
**Purpose:** Complete database initialization (original seed)  
**Danger:** ❌ **DELETES ALL DATA** - Users, Locations, Hotels, Transport, Itineraries!  
**When to use:** ONLY for initial setup on completely empty database  
**Warning:** 5-second countdown before deletion  
**DO NOT USE:** If you have any real data in the database!

## 📋 Recommended Workflow

### First-Time Setup
```bash
# 1. Create essential users
npm run init-users

# 2. Seed sample locations/hotels/transport
npm run cleanup-seed

# 3. Start the server
npm start
```

### If You Lost Admin Login
```bash
# This will recreate admin if it doesn't exist
npm run init-users
```

### If You Need Fresh Sample Data
```bash
# This removes old sample data and adds new ones
npm run cleanup-seed
```

### If You Accidentally Deleted Everything
```bash
# NUCLEAR OPTION - Only if database is completely empty
npm run seed

# Then add diverse data
npm run cleanup-seed
```

## 🔑 Default Credentials

After running `npm run init-users`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | adminpass |
| Guide | guide1@example.com | guidepass |
| User | user1@example.com | userpass |

## ⚠️ Important Notes

1. **Never run `npm run seed` on production database!**
2. **Always backup your database before running any script**
3. If you have real user data, only use `npm run cleanup-seed`
4. The `seed.js` script has a 5-second warning before deletion
5. Press `Ctrl+C` during countdown to cancel dangerous operations

## 🛠️ Script Details

### init-users.js
- Creates users only if they don't exist
- Safe to run multiple times
- No data deletion

### cleanup-and-seed-proper.js
- Deletes items with "TEST" in name
- Deletes specific seeded items by name
- Creates 9 locations, 5 hotels, 5 transport
- Safe for development

### seed.js
- **DANGER:** Deletes ALL collections
- Creates admin, guide, user
- Creates sample location, hotel, transport
- Should only be used once

### seed-recommendation-test.js
- Adds test data marked with `isTestData: true`
- Can be safely removed later

### unseed-recommendation-test.js
- Removes all items with `isTestData: true`
- Safe cleanup operation

## 🐛 Troubleshooting

**Problem:** Admin login stopped working  
**Solution:** Run `npm run init-users`

**Problem:** No locations showing in recommendations  
**Solution:** Run `npm run cleanup-seed`

**Problem:** Too many duplicate locations  
**Solution:** Run `npm run cleanup-seed` (removes duplicates first)

**Problem:** Everything is deleted!  
**Solution:** Run `npm run seed` then `npm run cleanup-seed`

## 📞 Support

If you accidentally deleted important data and don't have a backup, check MongoDB Atlas backups or restore from git history (if schemas are committed).

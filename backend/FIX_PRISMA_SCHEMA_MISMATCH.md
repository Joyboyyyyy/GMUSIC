# Fix Prisma Schema Mismatch - Reset Token Fields

## 🔴 **Problem**

Prisma throws errors:
```
Unknown argument `resetToken`
Unknown argument `resetTokenExpiry`
```

This means the database schema and Prisma client are out of sync.

---

## ✅ **Solution Steps**

### **Step 1: Verify Schema**

The schema file `backend/prisma/schema.prisma` already contains:
```prisma
model User {
  resetToken          String?
  resetTokenExpiry    DateTime?
}
```

✅ **Schema is correct** - fields are defined.

---

### **Step 2: Create and Apply Migration**

**From the backend directory, run:**

```bash
cd "Gretex music Room/backend"
npx prisma migrate dev --name add_reset_token_fields
```

**This will:**
- ✅ Create a new migration file
- ✅ Add `resetToken` and `resetTokenExpiry` columns to the database
- ✅ Apply the migration to your database
- ✅ Regenerate the Prisma client automatically

**Expected output:**
```
✔ Generated Prisma Client
✔ Applied migration `add_reset_token_fields`
```

---

### **Step 3: Verify Prisma Client Regenerated**

After migration, verify the client was regenerated:

```bash
npx prisma generate
```

**Expected output:**
```
✔ Generated Prisma Client
```

---

### **Step 4: Restart Backend Server**

**IMPORTANT:** Prisma client changes do NOT apply until server restart.

1. Stop the server: `CTRL + C`
2. Restart: `npm start` (or `nodemon src/server.js`)

---

### **Step 5: Test the Fix**

After restart, test the forgot-password flow:

```bash
# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/forgot-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"amitg.gretex@gmail.com"}'
```

**Expected logs:**
```
[Auth Service] Invalidating previous reset tokens for userId: ...
[Auth Service] Previous reset tokens invalidated successfully
[Auth Service] Saving new reset token to database
[Auth Service] Reset token saved to database
[Auth Service] Sending reset email
📨 RESET EMAIL SENT TO: amitg.gretex@gmail.com
```

**If you see these logs, the fix worked!** ✅

---

## 🔍 **Troubleshooting**

### **Error: "Migration failed"**

If migration fails, check:
1. Database connection is working (`DATABASE_URL` is correct)
2. You have write permissions on the database
3. No other migrations are pending

**Fix:**
```bash
# Check migration status
npx prisma migrate status

# If needed, reset (WARNING: This will drop all data)
npx prisma migrate reset
```

### **Error: "Column already exists"**

If you see "column already exists", the database already has the fields but Prisma client is out of sync.

**Fix:**
```bash
# Just regenerate the client
npx prisma generate

# Restart server
```

### **Error: "Unknown argument" still appears**

If errors persist after migration:

1. **Verify migration was applied:**
   ```bash
   npx prisma migrate status
   ```

2. **Force regenerate client:**
   ```bash
   npx prisma generate --force
   ```

3. **Restart server** (critical step!)

4. **Clear node_modules cache (if needed):**
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

---

## 📋 **Quick Checklist**

- [ ] Schema has `resetToken` and `resetTokenExpiry` fields
- [ ] Migration created: `npx prisma migrate dev --name add_reset_token_fields`
- [ ] Migration applied successfully
- [ ] Prisma client regenerated: `npx prisma generate`
- [ ] Backend server restarted
- [ ] Test forgot-password endpoint
- [ ] Logs show "Previous reset tokens invalidated successfully"
- [ ] Logs show "Reset token saved to database"
- [ ] Logs show "RESET EMAIL SENT TO"

---

## 🎯 **Expected Result**

After completing all steps:

1. ✅ Database has `resetToken` and `resetTokenExpiry` columns
2. ✅ Prisma client recognizes these fields
3. ✅ `prisma.user.update()` works without errors
4. ✅ Forgot-password email is sent successfully
5. ✅ No more "Unknown argument" errors

---

## 📝 **Files Modified**

- `backend/prisma/schema.prisma` - Already has fields (no change needed)
- `backend/prisma/migrations/` - New migration will be created
- `backend/node_modules/.prisma/` - Prisma client will be regenerated

---

## ⚠️ **Important Notes**

1. **Never skip the server restart** - Prisma client changes require restart
2. **Migration modifies database** - Ensure you have backups if needed
3. **Test in development first** - Don't run migrations on production without testing
4. **Keep error logging** - The try/catch blocks in `auth.service.js` will show if Prisma still fails

---

## 🚀 **After Fix**

Once the migration is applied and server is restarted:

- ✅ `prisma.user.update()` with `resetToken` will work
- ✅ `prisma.user.update()` with `resetTokenExpiry` will work
- ✅ Forgot-password flow will complete successfully
- ✅ Email will be sent

**The forgot-password email will now arrive!** 📧


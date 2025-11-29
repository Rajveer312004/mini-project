# Database Connection Setup Guide

## Step 1: Install and Start MongoDB

### Option A: MongoDB Community Edition (Local Installation)

1. **Download MongoDB:**
   - Visit: https://www.mongodb.com/try/download/community
   - Download MongoDB Community Server for Windows
   - Install it

2. **Start MongoDB Service:**
   ```powershell
   # Check if MongoDB service is running
   Get-Service MongoDB
   
   # If not running, start it
   Start-Service MongoDB
   ```

3. **Or start MongoDB manually:**
   ```powershell
   # Navigate to MongoDB bin directory (usually)
   cd "C:\Program Files\MongoDB\Server\7.0\bin"
   
   # Start MongoDB
   .\mongod.exe
   ```

### Option B: MongoDB Atlas (Cloud - Recommended)

1. **Create Free Account:**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Sign up for free account

2. **Create a Cluster:**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select a region close to you
   - Click "Create"

3. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `fundtracker` or your preferred database name

## Step 2: Configure Backend .env File

Create or update `backend/.env` file with the following:

### For Local MongoDB:
```env
# MongoDB Connection (Local)
MONGO_URI=mongodb://localhost:27017/fundtracker

# Blockchain Configuration
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_contract_address_here

# Server Port
PORT=5000
```

### For MongoDB Atlas (Cloud):
```env
# MongoDB Connection (Atlas)
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fundtracker?retryWrites=true&w=majority

# Blockchain Configuration
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_contract_address_here

# Server Port
PORT=5000
```

## Step 3: Verify MongoDB Connection

### Check if MongoDB is Running (Local):
```powershell
# Check MongoDB service status
Get-Service MongoDB

# Or test connection
mongosh "mongodb://localhost:27017"
```

### Test Connection from Backend:

1. **Start the backend server:**
   ```powershell
   cd backend
   node server.js
   ```

2. **Look for these messages:**
   - ✅ `MongoDB Connected Successfully` - Connection working!
   - ❌ `MongoDB Connection Error:` - Connection failed

## Step 4: Troubleshooting

### Problem: "MongoDB Connection Error"

**Solution 1: Check if MongoDB is running**
```powershell
# Windows - Check service
Get-Service MongoDB

# If not running, start it
Start-Service MongoDB
```

**Solution 2: Check MONGO_URI in .env**
- Make sure `MONGO_URI` is set correctly
- For local: `mongodb://localhost:27017/fundtracker`
- For Atlas: Use the connection string from Atlas dashboard

**Solution 3: Check MongoDB Port**
- Default MongoDB port is `27017`
- Make sure no firewall is blocking it

**Solution 4: Test MongoDB Connection Manually**
```powershell
# Install MongoDB Shell if not installed
# Then test connection
mongosh "mongodb://localhost:27017/fundtracker"
```

### Problem: Data Not Saving

**Check 1: Verify Connection Status**
- Look at backend console when starting server
- Should see: `✅ MongoDB Connected Successfully`

**Check 2: Verify Database Name**
- Make sure database name in MONGO_URI matches
- Default: `fundtracker`

**Check 3: Check MongoDB Logs**
- Look for any error messages in backend console
- Check MongoDB logs for connection issues

**Check 4: Verify Models are Correct**
- All models should be properly defined
- Check `backend/models/` folder

## Step 5: Verify Data is Saving

### Using MongoDB Compass (GUI Tool):

1. **Download MongoDB Compass:**
   - Visit: https://www.mongodb.com/try/download/compass
   - Install it

2. **Connect:**
   - For local: `mongodb://localhost:27017`
   - For Atlas: Use your Atlas connection string

3. **Check Collections:**
   - Look for collections: `funds`, `transactions`, `fundutilizationrequests`, etc.
   - Verify data is being saved

### Using MongoDB Shell:

```powershell
# Connect to MongoDB
mongosh "mongodb://localhost:27017/fundtracker"

# List databases
show dbs

# Use fundtracker database
use fundtracker

# List collections
show collections

# View documents in a collection
db.funds.find()
db.transactions.find()
```

## Quick Connection Test Script

Create `backend/test-db-connection.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });
```

Run it:
```powershell
cd backend
node test-db-connection.js
```

## Common Issues

### Issue: "ECONNREFUSED" Error
- **Cause:** MongoDB is not running
- **Solution:** Start MongoDB service

### Issue: "Authentication failed"
- **Cause:** Wrong username/password in connection string
- **Solution:** Check credentials in MONGO_URI

### Issue: "Network timeout"
- **Cause:** Firewall blocking or wrong IP address
- **Solution:** Check firewall settings and connection string

### Issue: Data saves but disappears
- **Cause:** Using in-memory database or wrong database
- **Solution:** Verify MONGO_URI points to persistent database


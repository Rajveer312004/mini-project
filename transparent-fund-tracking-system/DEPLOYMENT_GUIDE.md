# Deployment Guide for Transparent Fund Tracking System

## Prerequisites

1. Node.js installed
2. MongoDB running
3. Hardhat installed in blockchain folder

## Step-by-Step Deployment

### 1. Start Local Blockchain Node

```bash
cd blockchain
npx hardhat node
```

This will start a local blockchain node. Keep this terminal open.

**Important**: Note the first account address and private key shown in the output. You'll need this for the backend `.env` file.

### 2. Deploy the Contract

Open a new terminal and run:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**Copy the deployed contract address** from the output. It will look like:
```
✅ FundTracker deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3. Configure Backend Environment

Create or update `backend/.env` file:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/fundtracker
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/fundtracker

# Server Port
PORT=5000

# JWT Secret (Change this to a secure random string in production)
JWT_SECRET=your-secret-key-change-in-production

# Blockchain Configuration
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=<paste_the_first_account_private_key_from_hardhat_node>
CONTRACT_ADDRESS=<paste_the_deployed_contract_address>

# Frontend URL (for CORS - optional, defaults to http://localhost:3000)
FRONTEND_URL=http://localhost:3000
```

**Important**: 
- Use the first account's private key from Hardhat node (this account is the admin)
- Use the contract address from deployment step
- Change JWT_SECRET to a secure random string in production

### 4. Start Backend Server

```bash
cd backend
npm install
npm start
```

Or with nodemon for auto-reload:
```bash
npm install -g nodemon
nodemon server.js
```

### 5. Configure Frontend Environment

Create or update `frontend/.env` file:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000

# Smart Contract Address (same as CONTRACT_ADDRESS in backend/.env)
REACT_APP_CONTRACT_ADDRESS=<paste_the_deployed_contract_address>
```

### 6. Start Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will open at `http://localhost:3000`

## Troubleshooting

### Error: "could not decode result data (value="0x")"

This means the contract is not deployed or the address is wrong:

1. **Check blockchain node is running**: Make sure `npx hardhat node` is still running
2. **Verify contract address**: Check `CONTRACT_ADDRESS` in `backend/.env` matches the deployed address
3. **Redeploy contract**: If address is wrong, redeploy and update `.env`

### Error: "Contract not found at address"

1. Make sure you deployed the contract using the deploy script
2. Check that `CONTRACT_ADDRESS` in `.env` is correct
3. Verify the blockchain node is running and accessible

### Error: "Wallet not initialized"

1. Check `PRIVATE_KEY` is set in `backend/.env`
2. Make sure `RPC_URL` is correct (should be `http://127.0.0.1:8545` for local Hardhat)
3. Verify the private key is from the first account in Hardhat node

### Scheme Not Saving to Database

1. Check MongoDB is running: `mongod` or check your MongoDB service
2. Verify `MONGO_URI` in `backend/.env` is correct
3. Check backend console for MongoDB connection messages

## Quick Start Checklist

- [ ] Blockchain node running (`npx hardhat node`)
- [ ] Contract deployed (`npx hardhat run scripts/deploy.js --network localhost`)
- [ ] Backend `.env` configured with correct addresses and keys
- [ ] MongoDB running
- [ ] Backend server started
- [ ] Frontend started

## Testing

1. Login with password: `admin123`
2. Go to "Add Scheme"
3. Add a scheme - it should save to both blockchain and database
4. Check "View Schemes" to see your schemes
5. Use funds from a scheme
6. Check "Transaction History" to see transactions

## Production Deployment

For production, you'll need:

1. **Backend Environment Variables** (`backend/.env`):
   - Set `MONGO_URI` to your production MongoDB (Atlas recommended)
   - Set `JWT_SECRET` to a strong, random secret key
   - Set `RPC_URL` to your production blockchain RPC endpoint (e.g., Sepolia, Mumbai, Mainnet)
   - Set `PRIVATE_KEY` to your production wallet private key (keep secure!)
   - Set `CONTRACT_ADDRESS` to your production contract address
   - Set `FRONTEND_URL` to your production frontend URL (for CORS)
   - Set `PORT` to your production port (or let hosting platform set it)

2. **Frontend Environment Variables** (`frontend/.env`):
   - Set `REACT_APP_API_URL` to your production backend URL
   - Set `REACT_APP_CONTRACT_ADDRESS` to your production contract address

3. **Deploy Contract**:
   - Deploy contract to production network (Sepolia, Mumbai, etc.)
   - Update `CONTRACT_ADDRESS` in both backend and frontend `.env` files

4. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```
   Deploy the `build` folder to your hosting service (Vercel, Netlify, etc.)

5. **Deploy Backend**:
   - Deploy to hosting service (Heroku, Railway, Render, etc.)
   - Make sure to set all environment variables in your hosting platform
   - Ensure uploads directory has write permissions

6. **Security Notes**:
   - Never commit `.env` files to version control
   - Use environment variables in your hosting platform
   - Use a secure wallet for production (never expose private keys)
   - Use HTTPS in production
   - Set strong JWT_SECRET


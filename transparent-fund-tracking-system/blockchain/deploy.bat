@echo off
REM Deployment script for FundTracker contract (Windows)
REM This script helps deploy the contract to localhost

echo.
echo ==========================================
echo   FundTracker Contract Deployment
echo ==========================================
echo.

REM Check if Hardhat node is running
echo Checking if Hardhat node is running...
curl -s http://127.0.0.1:8545 >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Hardhat node is not running!
    echo Please start it first with: npx hardhat node
    echo.
    echo In a separate terminal, run:
    echo   cd blockchain
    echo   npx hardhat node
    echo.
    pause
    exit /b 1
)

echo Hardhat node is running
echo.

REM Deploy the contract
echo Deploying contract...
call npx hardhat run scripts/deploy.js --network localhost

if %errorlevel% equ 0 (
    echo.
    echo Deployment complete!
    echo.
) else (
    echo.
    echo Deployment failed. Check the error above.
    echo.
    pause
    exit /b 1
)

pause


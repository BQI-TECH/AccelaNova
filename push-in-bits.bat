@echo off
REM Run each block one at a time (push in bits) - open in CMD or PowerShell outside Cursor
cd /d "C:\xampp\htdocs\GEOTECH COMPANY PROJECTS\IN PROGRESS\ACCELANOVAI"

echo [1/3] Ensuring remote...
git remote add origin https://github.com/GeotechCompanybq/AccelaNova.git 2>nul
git remote set-url origin https://github.com/GeotechCompanybq/AccelaNova.git
git branch -M main

echo [2/3] Smaller chunks (5MB)...
git config http.postBuffer 5242880

echo [3/3] Pushing main...
git push -u origin main

echo Done.
pause

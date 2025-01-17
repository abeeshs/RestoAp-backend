echo "Kill all the running PM2 actions"
sudo pm2 kill

echo "Jump to app folder"
cd /home/ubuntu/restoap-customer-api

echo "Update app from Git"
git pull

echo "Install app dependencies"
sudo rm -rf node_modules package-lock.json
sudo npm install

echo "Run new PM2 action"
sudo cp /home/ubuntu/ecosystem.json ecosystem.json
sudo pm2 start ecosystem.json
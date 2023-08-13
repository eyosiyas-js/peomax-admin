#!/bin/bash

rm -rd /var/www/api &&
mkdir /var/www/api &&
cd /var/www/api &&
git clone https://github.com/Amieldev/peomax.git . &&
npm install &&
cd /var/www/ &&
pkg /var/www/api/index.js -t node16-linux-x64 -d --out-path /var/www/api &&
rm -rf /var/www/api/index.js &&
rm -rf /var/www/api/script.js &&
rm -rf /var/www/api/test.js &&
rm -rf /var/www/api/package-lock.json &&
rm -rf /var/www/api/package.json &&
rm -rf /var/www/api/.gitignore &&
rm -rf /var/www/api/.git &&
rm -rf /var/www/api/nginx.conf &&
rm -rd /var/www/api/controllers &&
rm -rd /var/www/api/utils &&
rm -rd /var/www/api/routes &&
rm -rd /var/www/api/middleware &&
rm -rd /var/www/api/models &&
rm -rf /var/www/api/deploy-api.sh &&
pm2 restart api
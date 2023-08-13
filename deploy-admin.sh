#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Please provide the GitHub URL as a command-line argument."
  echo "Usage: ./deploy-admin.sh <github_url>"
  exit 1
fi

github_url=$1

rm -rd /var/www/admin &&
mkdir /var/www/admin &&
cd /var/www/admin &&
git clone "$github_url" . &&
pm2 restart admin
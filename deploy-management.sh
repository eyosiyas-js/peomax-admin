#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Please provide the GitHub URL as a command-line argument."
  echo "Usage: ./deploy-management.sh <github_url>"
  exit 1
fi

github_url=$1

rm -rd /var/www/management &&
mkdir /var/www/management &&
cd /var/www/management &&
git clone "$github_url" . &&
pm2 restart management
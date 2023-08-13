#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Please provide the GitHub URL as a command-line argument."
  echo "Usage: ./deploy-client.sh <github_url>"
  exit 1
fi

github_url=$1

rm -rd /var/www/client &&
mkdir /var/www/client &&
cd /var/www/client &&
git clone "$github_url" . &&
pm2 restart client
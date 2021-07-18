#!/bin/sh

echo "Deploying..."
sudo rm -rf /tmp/remark42-site.git
cd /tmp && git clone git@github.com:umputun/remark-site.git --recurse-submodules remark42-site.git
cd /tmp/remark42-site.git 
docker rm -f remark42-site
docker-compose build && docker-compose up && docker-compose rm -f
rm -rf /srv/www/remark42.com/
mkdir -p /srv/www/remark42.com
cp -rf /tmp/remark42-site.git/public /srv/www/remark42.com 
sudo rm -rf /tmp/remark42-site.git

#!/bin/bash

sudo mkdir -p ./compose/patroni1
sudo mkdir -p ./compose/patroni2
sudo mkdir -p ./compose/patroni3
sudo chown 999:999 ./compose/patroni1
sudo chmod 700 ./compose/patroni1
sudo chown 999:999 ./compose/patroni2
sudo chmod 700 ./compose/patroni2
sudo chown 999:999 ./compose/patroni3
sudo chmod 700 ./compose/patroni3
cd compose
docker-compose build
docker-compose up -d
echo "waiting 1 min to setup"
sleep 50s
echo "Enter password 12345678 in following command"
psql --host localhost --port 5000 -U approle -d postgres -f createdb.txt

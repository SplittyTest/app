#!/bin/bash

docker run -d --rm --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
sleep 5
psql -h localhost -U postgres -c "CREATE DATABASE splittytest;"

npm run migrate:postgres

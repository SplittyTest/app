#!/bin/bash

docker run -d --rm -e CLICKHOUSE_PASSWORD=default -p 9000:9000 -p 8123:8123 --name clickhouse-server --ulimit nofile=262144:262144 clickhouse
sleep 5
clickhouse client --password default --query "CREATE DATABASE IF NOT EXISTS splittytest;"

npm run migrate:clickhouse
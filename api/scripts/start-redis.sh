#!/bin/bash

docker run -d --rm -p 6379:6379 --name redis redis/redis-stack:7.4.0-v8
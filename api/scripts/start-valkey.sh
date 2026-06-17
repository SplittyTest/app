#!/bin/bash

docker run -d --rm -p 6379:6379 --name valkey valkey/valkey-extension:8.1-bookworm
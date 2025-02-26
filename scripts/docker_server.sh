#!/bin/bash

cd ../build/renderer
docker build -t compute_tool_server -f ../../scripts/docker_server.Dockerfile .
read -p "Press enter to continue"
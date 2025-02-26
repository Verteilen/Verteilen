#!/bin/bash

cd ../build/node
docker build -t compute_tool_node -f ../../scripts/docker_node.Dockerfile .
read -p "Press enter to continue"
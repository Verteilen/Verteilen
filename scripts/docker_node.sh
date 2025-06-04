#!/bin/bash
docker build -t e87870823/compute_tool_node -f ./scripts/docker_node.Dockerfile .
read -p "Press enter to continue"
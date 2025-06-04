#!/bin/bash
docker build -t e87870823/compute_tool_server -f ./scripts/docker_server.Dockerfile .
read -p "Press enter to continue"
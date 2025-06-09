#!/bin/bash

if [[ "$1" == "--fast" ]];
then

echo "fast mode"

docker build -t e87870823/compute_tool_node -f ./scripts/docker_node_fast.Dockerfile . --progress=plain
read -p "Press enter to continue"

else

echo "full mode"

docker build -t e87870823/compute_tool_node -f ./scripts/docker_node.Dockerfile . --progress=plain
read -p "Press enter to continue"

fi
#!/bin/bash

if [ $1="--fast" ]
then

docker build -t e87870823/compute_tool_server -f ./scripts/docker_server_fast.Dockerfile . --progress=plain
read -p "Press enter to continue"

else 

docker build -t e87870823/compute_tool_server -f ./scripts/docker_server.Dockerfile . --progress=plain
read -p "Press enter to continue"

fi
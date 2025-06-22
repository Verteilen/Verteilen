#!/bin/bash

if [[ "$1" == "--fast" ]];
then

echo "fast mode"

docker build -t e87870823/verteilen_node -f ./scripts/docker_node_fast.Dockerfile . --progress=plain
read -p "Press enter to continue"

elif [[ "$1" == "--publish" ]];
then

echo "publish mode"
version=$(ts-node scripts/getversion.ts)
echo "version:" ${version}
docker tag e87870823/verteilen_node ghcr.io/verteilen/verteilen_node:${version}
docker push ghcr.io/verteilen/verteilen_node:${version}

else

echo "full mode"

docker build -t e87870823/verteilen_node -f ./scripts/docker_node.Dockerfile . --progress=plain
read -p "Press enter to continue"

fi
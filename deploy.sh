#!/bin/bash

# Configuration

# Arguments
CONFIG=$1

if [ "$CONFIG" == "production" ]; then
  BUILD_DIR="dist/smart-form/production/browser"
  TARGET_PATH="/home/telaorg/www/smart-form"
  SERVER="telaorg@sycomore"
  BASE_HREF="/appli:smart-form/"
elif [ "$CONFIG" == "beta" ]; then
  BUILD_DIR="dist/smart-form/beta/browser"
  TARGET_PATH="/home/beta/www/v2smartflore"
  SERVER="beta@aphyllanthe"
  BASE_HREF="/v2smartflore/"
else
  echo "Invalid configuration. Use 'production' or 'beta'."
  exit 1
fi

# Build and deploy
echo "Building with configuration: $CONFIG..."
ng build --configuration $CONFIG --base-href=$BASE_HREF

echo "Deploying to server: $SERVER, path: $TARGET_PATH..."
rsync -r $BUILD_DIR/* $SERVER:$TARGET_PATH

echo "Deployment completed."

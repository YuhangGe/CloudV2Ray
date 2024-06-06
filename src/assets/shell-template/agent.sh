#!/bin/bash

cd /home/ubuntu

export NODE_ENV=production

if [ ! -d "./v2ray-tencentcloud-server-agent" ] ; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install v20
  npm install -g pnpm
  export PNPM_HOME="/home/ubuntu/.local/share/pnpm"
  case ":$PATH:" in
    *":$PNPM_HOME:"*) ;;
    *) export PATH="$PNPM_HOME:$PATH" ;;
  esac
  pnpm setup
  pnpm install -g pm2
  git clone https://github.com/YuhangGe/v2ray-tencentcloud-server-agent
  cd v2ray-tencentcloud-server-agent
  pnpm install --prod --ignore-scripts
else
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  export PNPM_HOME="/home/ubuntu/.local/share/pnpm"
  case ":$PATH:" in
    *":$PNPM_HOME:"*) ;;
    *) export PATH="$PNPM_HOME:$PATH" ;;
  esac
  pm2 stop all
  cd v2ray-tencentcloud-server-agent
  git pull -r origin master
  pnpm install --prod --ignore-scripts
fi

export TOKEN=$token$
export SECRET_ID=$secretId$
export SECRET_KEY=$secretKey$
export REGION=$region$
export RESOURCE_NAME=$resourceName$

pm2 start dist/index.js
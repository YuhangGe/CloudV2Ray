#!/bin/bash

cd /home/ubuntu

export NODE_ENV=production

if [ ! -d "./v2ray-tencentcloud-server-agent" ] ; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion


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
  echo "TOKEN=$token$
SECRET_ID=$secretId$
SECRET_KEY=$secretKey$
REGION=$region$
RESOURCE_NAME=$resourceName$" >> .env

  pnpm install --prod --ignore-scripts
else
  pm2 stop all
  cd v2ray-tencentcloud-server-agent
  git pull -r origin master
  pnpm install --prod --ignore-scripts
fi

pm2 start dist/index.js
loadbundler () {
    osascript -e 'tell app "Terminal"
        do script "
        sleep 2
        cd $BUNDLER/packages/bundler/
        yarn hardhat-deploy --network goerli 
        yarn run bundler"
    end tell'
}

runbundler (){
    osascript -e 'tell app "Terminal"
        do script "
        cd $BUNDLER
        yarn && yarn preprocess 
        cd packages/bundler/
        loadbundler && yarn hardhat-node"
    end tell'
}

runbundler () {
        cd $BUNDLER/packages/bundler/
        yarn hardhat-deploy --network localhost 
        yarn run bundler
}

loadbundler (){
        cd $BUNDLER
        yarn && yarn preprocess 
        cd packages/bundler/
        yarn hardhat-node
}

runbundler () {
        cd $BUNDLER/packages/bundler/
        yarn hardhat-deploy --network localhost 
        yarn run bundler
}

loadbundler (){
        cd $BUNDLER
        
        cd packages/bundler/
        yarn hardhat-node
}

rungoerli(){
        cd $BUNDLER
        yarn && yarn preprocess 
        cd packages/bundler/
        yarn run bundler --network goerli
}


# TO RUN
## AWS
1. SSH into EC2 Server with authenticated credentials
```
ssh -i {authfile}.pem ec2-user@ec2-35-90-110-76.us-west-2.compute.amazonaws.com

```
2. Create a ***screen*** session
```
screen
```
3. Run:
```
chmod +x ./initssh.sh
./initssh.sh
source ~/.zshrc
loadbundler
```
4. Type these keys in order: _Ctrl a Shift {forward slash}_. This will create a white line in the center.
5. Then type these keys: _Ctrl Tab Ctrl a Ctrl c_.
6. Then run
```
runbundler
```

## MAC

1. Enter the project directory and run
```console
chmod +x ./initssh.sh
./init.sh
```
2. Close the terminal
3. Now whenever you want to run the bundler from anywhere run
```console
runbundler
```

# EIP4337 reference modules

## Bundler

A basic eip4337 "bundler"

- expose a node with a minimal RPC calls:
  - eth_sendUserOperation to send a user operation
  - eth_supportedEntryPoints to report the bundler's supported entry points
  - eth_chainId

### Usage: 
1. run `yarn && yarn preprocess`
2. start hardhat-node with `yarn hardhat-node` (or local `geth`)

In another Window:

3. deploy contracts with `yarn hardhat-deploy --network localhost`
4. run `yarn run bundler`
  so it will listen on port 3000


To run a simple test, do `yarn run runop --deployDeployer --network localhost`

   The runop script:
   - deploys a wallet deployer (if not already there)
   - creates a random signer (owner for wallet)
   - determines the wallet address, and funds it
   - sends a transaction (which also creates the wallet)
   - sends another transaction, on this existing wallet
   - (uses account[0] or mnemonic file for funding, and creating deployer if needed)


NOTE: if running on a testnet, you need to supply the bundler (and runop) the network and mnemonic file, e.g.

`yarn run bundler --network localhost --mnemonic file.txt` 

## sdk

SDK to create and send UserOperations
see [SDK Readme](./packages/sdk/README.md)

## utils

internal utility methods/test contracts, used by other packages.

## How to set up Fork Enviroment

Starting point: `/AA-Bundler`

#### Install packages

```
yarn && yarn preprocess
```
Ignore this error

```javascript
Error: test/Flow.test.ts(7,30): error TS2307: Cannot find module '../src/SimpleAccountABI' or its corresponding type declarations.
```

Start the hardhat fork:
```
cd localfork
yarn install 
npx hardhat node --fork "https://eth-mainnet.g.alchemy.com/v2/lcA7Kyqv42J1Qh-wLm__DdqSCJBtZyd1"
```

## `In a seperate terminal tab`


Starting point: `/AA-Bundler`


#### Run setup and deploy bundler

```
cd localfork
chmod +x setup.sh
./setup.sh
```

Expected output: 
Should show ```running on http://localhost:3000/rpc``` in terminal


import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'

import fs from 'fs'

import { HardhatUserConfig } from 'hardhat/config'
import { NetworkUserConfig } from 'hardhat/src/types/config'

const mnemonicFileName = null//process.env.MNEMONIC_FILE
let mnemonic = 'test '.repeat(11) + 'junk'
if (mnemonicFileName != null && fs.existsSync(mnemonicFileName)) {
  mnemonic = fs.readFileSync(mnemonicFileName, 'ascii').trim()
}
interface RPCStore {
  [network: string]: string
}

const rpcs: RPCStore = {
  goerli: "https://eth-goerli.public.blastapi.io",
  fuji: "https://api.avax-test.network/ext/bc/C/rpc"
}

const infuraUrl = (name: string): string => rpcs[name]

function getNetwork(url: string): NetworkUserConfig {
  return {
    url,
    accounts: {
      mnemonic
    }
  }
}

function getInfuraNetwork(name: string): NetworkUserConfig {
  return getNetwork(infuraUrl(name))
}

const config: HardhatUserConfig = {
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5'
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545/',
      saveDeployments: false
    },
    goerli: getInfuraNetwork('goerli'),
    fuji: getInfuraNetwork('fuji'),
  },
  solidity: {
    version: '0.8.15',
    settings: {
      optimizer: { enabled: true }
    }
  }
}

export default config

import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Express, Response, Request } from 'express'
import { Provider } from '@ethersproject/providers'
import { Wallet, utils } from 'ethers'
import { hexlify, parseEther } from 'ethers/lib/utils'

import { erc4337RuntimeVersion } from '@account-abstraction/utils'

import { BundlerConfig } from './BundlerConfig'
import { UserOpMethodHandler } from './UserOpMethodHandler'
import { Server } from 'http'
import { RpcError } from './utils'
const forkConfig = require('../../../localfork/forkConfig.json')
const { LOCALHOST_URL, HARDHAT_FORK_CHAIN_ID_STRING, HARDHAT_FORK_CHAIN_KEY } = require('../../../localfork/ForkUtils')

export class BundlerServer {
  app: Express
  private readonly httpServer: Server

  constructor(
    readonly methodHandler: UserOpMethodHandler,
    readonly config: BundlerConfig,
    readonly provider: Provider,
    readonly wallet: Wallet
  ) {
    this.app = express()
    this.app.use(cors())
    this.app.use(bodyParser.json())

    this.app.get('/', this.intro.bind(this))
    this.app.post('/', this.intro.bind(this))

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.app.post('/rpc', this.rpc.bind(this))

    // console.log('testconfig ', TestConfig)
    this.app.post('/get-chain-info', this.getChainInfo.bind(this))
    this.app.post('/get-module-info', this.getModuleInfo.bind(this))
    this.httpServer = this.app.listen(3000, "0.0.0.0", () => { console.log("listen") })
    this.startingPromise = this._preflightCheck()
  }

  startingPromise: Promise<void>

  async asyncStart(): Promise<void> {
    await this.startingPromise
  }

  async stop(): Promise<void> {
    this.httpServer.close()
  }

  async _preflightCheck(): Promise<void> {
    if (await this.provider.getCode(this.config.entryPoint) === '0x') {
      this.fatal(`entrypoint not deployed at ${this.config.entryPoint}`)
    }

    const bal = await this.provider.getBalance(this.wallet.address)
    console.log('signer', this.wallet.address, 'balance', utils.formatEther(bal))
    if (bal.eq(0)) {
      this.fatal('cannot run with zero balance')
    } else if (bal.lt(parseEther(this.config.minBalance))) {
      console.log('WARNING: initial balance below --minBalance ', this.config.minBalance)
    }
  }



  fatal(msg: string): never {
    console.error('FATAL:', msg)
    process.exit(1)
  }

  intro(req: Request, res: Response): void {
    res.send(`Account-Abstraction Bundler v.${erc4337RuntimeVersion}. please use "/rpc"`)
  }


  async getModuleInfo(req: Request, res: Response): Promise<any> {
    const {
      chain,
      module
    } = req.body
    try {
      if (chain === HARDHAT_FORK_CHAIN_ID_STRING) {
        if (module === "eoaAaveWithdraw") {
          res.send({
            eoaAaveWithdrawAddress: forkConfig.eoaAaveWithdrawAddress
          })
        }
        else if (module === "tokenSwap") {
          res.send({
            tokenSwapAddress: forkConfig.tokenSwapAddress,
            univ3router: forkConfig.uniswapV3RouterAddress,
            univ3quoter: forkConfig.quoterContractAddress,
            univ3factory: forkConfig.poolFactoryAddress
          })
        }
        else {
          throw "Module is not supported"
        }
      }
      else {
        throw "Only Hardhat Chain 31337 is supported"
      }
    } catch (err: any) {
      res.status(400).send(err.message)
    }
  }


  async getChainInfo(req: Request, res: Response): Promise<any> {
    const {
      chain
    } = req.body
    try {
      if (chain === HARDHAT_FORK_CHAIN_ID_STRING || chain == HARDHAT_FORK_CHAIN_KEY) {
        res.send({
          currency: 'ETH',
          rpcdata: { bundlerUrl: `${LOCALHOST_URL}rpc` },
          chain: 31337,
          aaData: {
            entryPointAddress: forkConfig.entryPointAddress,
            factoryAddress: forkConfig.factoryAddress,
            verificationAddress: forkConfig.verificationAddress
          },
          moduleAddresses: {
            eoaAaveWithdraw: {
              eoaAaveWithdrawAddress: forkConfig.eoaAaveWithdrawAddress,
            },
            paymaster: {
              paymasterAddress: forkConfig.paymasterAddress,
              oracle: forkConfig.tokenPriceOracleAddress
            },
            tokenSwap: {
              univ3factory: forkConfig.poolFactoryAddress,
              univ3quoter: forkConfig.quoterContractAddress,
              univ3router: forkConfig.uniswapV3RouterAddress,
              tokenSwapAddress: forkConfig.tokenSwapAddress,
            }
          },
          key: "ethereum-localfork",
        })
      }
      else {
        throw "Only Hardhat Chain 31337 is supported"
      }
    } catch (err: any) {
      res.status(400).send(err.message)
    }
  }

  async rpc(req: Request, res: Response): Promise<void> {
    const {
      method,
      params,
      jsonrpc,
      id
    } = req.body
    try {
      const result = await this.handleMethod(method, params)
      console.log('sent', method, '-', result)
      res.send({
        jsonrpc,
        id,
        result
      })
    } catch (err: any) {
      const error = {
        message: err.message,
        data: err.data,
        code: err.code
      }
      console.log('failed: ', method, 'error:', JSON.stringify(error))
      res.send({
        jsonrpc,
        id,
        error
      })
    }
  }

  async handleMethod(method: string, params: any[]): Promise<void> {
    let result: any
    switch (method) {
      case 'eth_chainId':
        // eslint-disable-next-line no-case-declarations
        const { chainId } = await this.provider.getNetwork()
        result = hexlify(chainId)
        break
      case 'eth_supportedEntryPoints':
        result = await this.methodHandler.getSupportedEntryPoints()
        break
      case 'eth_sendUserOperation':
        result = await this.methodHandler.sendUserOperation(params[0], params[1])
        break
      case 'eth_simulateUserOperation':
        result = await this.methodHandler.simulateUserOp(params[0], params[1])
        break
      case 'eth_getUserOperationReceipt':
        result = await this.methodHandler.getUserOperationReceipt(params[0])
        break
      case 'eth_getUserOperationTransactionByHash':
        result = await this.methodHandler.getUserOperationTransactionByHash(params[0])
        break
      default:
        throw new RpcError(`Method ${method} is not supported`, -32601)
    }
    return result
  }
}
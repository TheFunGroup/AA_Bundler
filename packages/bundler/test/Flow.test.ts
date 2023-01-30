import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre, { ethers } from 'hardhat'
import { parseEther } from 'ethers/lib/utils'

import sinon from 'sinon'
import simpleAccountABI from '../src/SimpleAccountABI'
import * as SampleRecipientArtifact
  from '@account-abstraction/utils/artifacts/contracts/test/SampleRecipient.sol/SampleRecipient.json'

import { BundlerConfig } from '../src/BundlerConfig'
import { ERC4337EthersProvider, ERC4337EthersSigner, ClientConfig, wrapProvider, HttpRpcClient, SimpleAccountAPI, DeterministicDeployer } from '@account-abstraction/sdk'
import { Contract, Signer, Wallet } from 'ethers'
import { runBundler } from '../src/runBundler'
import { BundlerServer } from '../src/BundlerServer'
import fs from 'fs'
import { SimpleAccountDeployer__factory } from '@account-abstraction/contracts'
const Web3 = require('web3')
let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
const { expect } = chai.use(chaiAsPromised)

export async function startBundler(options: BundlerConfig): Promise<BundlerServer> {
  const args: any[] = []
  args.push('--beneficiary', options.beneficiary)
  args.push('--entryPoint', options.entryPoint)
  args.push('--gasFactor', options.gasFactor)
  args.push('--helper', options.helper)
  args.push('--minBalance', options.minBalance)
  args.push('--mnemonic', options.mnemonic)
  args.push('--network', options.network)
  args.push('--port', options.port)

  return await runBundler(['node', 'cmd', ...args], true)
}

describe('Flow', function () {
  let bundlerServer: BundlerServer
  let entryPointAddress: string
  let sampleRecipientAddress: string
  let signer: Signer
  before(async function () {
    signer = await hre.ethers.provider.getSigner()
    const beneficiary = await signer.getAddress()

    const sampleRecipientFactory = await ethers.getContractFactory('SampleRecipient')
    const sampleRecipient = await sampleRecipientFactory.deploy()
    sampleRecipientAddress = sampleRecipient.address

    const EntryPointFactory = await ethers.getContractFactory('EntryPoint')
    const entryPoint = await EntryPointFactory.deploy()
    entryPointAddress = entryPoint.address

    const bundleHelperFactory = await ethers.getContractFactory('BundlerHelper')
    const bundleHelper = await bundleHelperFactory.deploy()
    await signer.sendTransaction({
      to: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
      value: 10e18.toString()
    })

    const mnemonic = 'myth like bonus scare over problem client lizard pioneer submit female collect'
    const mnemonicFile = '/tmp/mnemonic.tmp'
    fs.writeFileSync(mnemonicFile, mnemonic)
    bundlerServer = await startBundler({
      beneficiary,
      entryPoint: entryPoint.address,
      helper: bundleHelper.address,
      gasFactor: '0.2',
      minBalance: '0',
      mnemonic: mnemonicFile,
      network: 'http://localhost:8545/',
      port: '3000'
    })
  })

  after(async function () {
    await bundlerServer?.stop()
  })

  let erc4337Signer: ERC4337EthersSigner
  let erc4337Provider: ERC4337EthersProvider

  it('should send transaction and make profit', async function () {
    const config: ClientConfig = {
      entryPointAddress,
      bundlerUrl: 'http://localhost:3000/rpc'
    }

    // use this as signer (instead of node's first account)
    const ownerAccount = Wallet.createRandom()
    erc4337Provider = await wrapProvider(
      ethers.provider,
      // new JsonRpcProvider('http://localhost:8545/'),
      config,
      ownerAccount
    )
    erc4337Signer = erc4337Provider.getSigner()
    const simpleAccountPhantomAddress = await erc4337Signer.getAddress()

    await signer.sendTransaction({
      to: simpleAccountPhantomAddress,
      value: 10e18.toString()
    })

    const sampleRecipientContract =
      new ethers.Contract(sampleRecipientAddress, SampleRecipientArtifact.abi, erc4337Signer)
    // console.log(sampleRecipientContract.address)

    const result = await sampleRecipientContract.something('hello world')
    // console.log(result)
    const receipt = await result.wait()
    // console.log(receipt)
  })

  it('should send transaction and make profit', async function () {
    const config: ClientConfig = {
      entryPointAddress,
      bundlerUrl: 'http://localhost:3000/rpc'
    }

    // use this as signer (instead of node's first account)
    const ownerAccount = Wallet.createRandom()
    erc4337Provider = await wrapProvider(
      ethers.provider,
      // new JsonRpcProvider('http://localhost:8545/'),
      config,
      ownerAccount
    )
    // console.log(erc4337Provider)
    // erc4337Signer = erc4337Provider.getSigner()
    // const simpleAccountPhantomAddress = await erc4337Signer.getAddress()

    let addr = "0xB1d3BD3E33ec9A3A15C364C441D023a73f1729F6"
    let amount = parseEther('.01') //amount
    let accountOwner = new Wallet("0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897")
    const dep = new DeterministicDeployer(this.provider)
    const accountDeployer = await dep.getDeterministicDeployAddress(SimpleAccountDeployer__factory.bytecode)


    const net = await erc4337Provider.getNetwork()


    const rpcClient = new HttpRpcClient(config.bundlerUrl, config.entryPointAddress, net.chainId)

    const provider = ethers.provider

    const accountApi = new SimpleAccountAPI({
      provider: erc4337Provider,
      entryPointAddress: config.entryPointAddress,  //check this
      owner: accountOwner,
      factoryAddress: accountDeployer
    })

    // let contract = new web3.eth.Contract(simpleAccountABI);  //get from simpleaccount
    // let data = contract.methods.transfer(addr, amount).encodeABI();

    //   function transfer(address payable dest, uint256 amount) external onlyOwner {
    //     dest.transfer(amount);
    // }
    let data = web3.eth.abi.encodeFunctionCall({
      name: 'transfer',
      type: 'function',
      inputs: [
        {
          type: 'address',
          name: 'dest'
        }, {

          type: 'uint256',
          name: 'amount'
        }]
    }, [addr, amount]);

    const userOp = await accountApi.createSignedUserOp({
      target:addr,
      data
    })

    try {
      const userOpHash = await rpcClient.sendUserOpToBundler(userOp)
      const txid = await accountApi.getUserOpReceipt(userOpHash)
      console.log('reqId', userOpHash, 'txid=', txid)
    } catch (e: any) {
      console.log(e)
    }
    //bundler calls transfer


    // await signer.sendTransaction({
    //   to: simpleAccountPhantomAddress,
    //   value: 10e18.toString()
    // })

    // const sampleRecipientContract =
    //   new ethers.Contract(sampleRecipientAddress, SampleRecipientArtifact.abi, erc4337Signer)
    // console.log(sampleRecipientContract.address)

    // const result = await sampleRecipientContract.something('hello world')
    // console.log(result)
    // const receipt = await result.wait()
    // console.log(receipt)
  })

  it.skip('should refuse transaction that does not make profit', async function () {
    sinon.stub(erc4337Signer, 'signUserOperation').returns(Promise.resolve('0x' + '01'.repeat(65)))
    const sampleRecipientContract =
      new ethers.Contract(sampleRecipientAddress, SampleRecipientArtifact.abi, erc4337Signer)
    console.log(sampleRecipientContract.address)
    await expect(sampleRecipientContract.something('hello world')).to.be.eventually
      .rejectedWith(
        'The bundler has failed to include UserOperation in a batch:  "ECDSA: invalid signature \'v\' value"')
  })
})

const ethers = require("ethers")

const main = async () => {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const account = await provider.getSigner();

    await account.sendTransaction({ to: "0xB1d3BD3E33ec9A3A15C364C441D023a73f1729F6", value: ethers.utils.parseEther("10") })

}

main()
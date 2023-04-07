import { ethers } from 'hardhat';

async function main() {
    const contractName = 'Faucet',
        Faucet = await ethers.getContractFactory(contractName),
        faucet = await Faucet.deploy();

    await faucet.deployed();

    console.log(`${contractName} address: ${faucet.address}`);
}

main()
    .then(() => (process.exitCode = 0))
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });

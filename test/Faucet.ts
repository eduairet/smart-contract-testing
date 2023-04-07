import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import { expect, assert } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
const { getContractFactory, getSigners } = ethers;

const contractName = 'Faucet';

interface TestFixture {
    faucet: Contract;
    owner: SignerWithAddress;
    external: SignerWithAddress;
}

describe(contractName, (): void => {
    // Hardhat has the loadFixture function
    // that allows to set our test configuration
    // and re-use it across the whole test
    const deployContractFixture = async (): Promise<TestFixture> => {
        const Faucet: ContractFactory = await getContractFactory(contractName),
            faucet: Contract = await Faucet.deploy(),
            [owner, external] = await getSigners();
        return { faucet, owner, external };
    };

    describe('Deployment', async () => {
        it('The contract was deployed', async () => {
            const { faucet } = await loadFixture(deployContractFixture);
            expect(faucet, "Faucet doesn't have an address").to.haveOwnProperty(
                'address'
            );
        });
        it('The owner was set correctly', async () => {
            const { faucet, owner } = await loadFixture(deployContractFixture);
            const faucetOwner = await faucet.owner();
            assert.equal(
                owner.address,
                faucetOwner,
                'Faucet owner and deployer are not the same'
            );
        });
    });
});

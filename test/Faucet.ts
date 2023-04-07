import { ethers } from 'hardhat';
import {
    Contract,
    ContractFactory,
    BigNumber,
    ContractTransaction,
} from 'ethers';
import { solidity } from 'ethereum-waffle';
import chai, { expect, assert } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
const { getContractFactory, providers, getSigners, utils } = ethers,
    { JsonRpcProvider } = providers;
chai.use(solidity);

const contractName = 'Faucet';

interface TestFixture {
    faucet: Contract;
    owner: SignerWithAddress;
    external: SignerWithAddress;
    validAmount: BigNumber;
    wrongAmount: BigNumber;
}

describe(contractName, (): void => {
    // Hardhat has the loadFixture function
    // that allows to set our test configuration
    // and re-use it across the whole test
    const deployContractFixture = async (): Promise<TestFixture> => {
        const Faucet: ContractFactory = await getContractFactory(contractName),
            faucet: Contract = await Faucet.deploy({
                value: utils.parseEther('1'),
            }),
            [owner, external] = await getSigners(),
            validAmount: BigNumber = utils.parseEther('0.1'),
            wrongAmount: BigNumber = utils.parseEther('0.2');
        return {
            faucet,
            owner,
            external,
            validAmount,
            wrongAmount,
        };
    };

    const checkBalance = async (faucet: Contract, amount: string) => {
        const balance: BigNumber = await faucet.getBalance(),
            expected: BigNumber = utils.parseEther(amount);
        assert.equal(balance.toString(), expected.toString());
    };

    const withdraw = async (
        faucet: Contract,
        signer: SignerWithAddress,
        validAmount: BigNumber,
        wrongAmount: BigNumber
    ): Promise<void> => {
        await expect(faucet.connect(signer).withdraw(wrongAmount)).to.be
            .reverted;
        const tx: ContractTransaction = await faucet
            .connect(signer)
            .withdraw(validAmount);
        await tx.wait();
        await checkBalance(faucet, '0.9');
    };

    describe('Deployment', () => {
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
        it('The initial balance is 1 ETH', async () => {
            const { faucet } = await loadFixture(deployContractFixture);
            await checkBalance(faucet, '1');
        });
    });

    describe('Withdrawals', () => {
        it('Allows the owner to withdraw .1 ETH', async () => {
            const { faucet, owner, validAmount, wrongAmount } =
                await loadFixture(deployContractFixture);
            await withdraw(faucet, owner, validAmount, wrongAmount);
        });
        it('Allows a visitor to withdraw .1 ETH', async () => {
            const { faucet, external, validAmount, wrongAmount } =
                await loadFixture(deployContractFixture);
            await withdraw(faucet, external, validAmount, wrongAmount);
        });
        it('Prevents a visitor to withdraw all', async () => {
            const { faucet, external } = await loadFixture(
                deployContractFixture
            );
            await expect(faucet.connect(external).withdrawAll()).to.be.reverted;
            await checkBalance(faucet, '1');
        });
        it('Allows the owner to withdraw all', async () => {
            const { faucet, owner } = await loadFixture(deployContractFixture);
            await faucet.connect(owner).withdrawAll();
            await checkBalance(faucet, '0');
        });
    });
    describe('Destruct', () => {
        it('Prevents a visitor to destroy the contract', async () => {
            const { faucet, external } = await loadFixture(
                deployContractFixture
            );
            await expect(faucet.connect(external).destroyFaucet()).to.be
                .reverted;
        });
        it('Allows the owner to destroy the contract', async () => {
            const { faucet, owner } = await loadFixture(deployContractFixture);
            const destroy: ContractTransaction = await faucet
                .connect(owner)
                .destroyFaucet();
            await destroy.wait();
            await expect(faucet.connect(owner).getBalance()).to.be.reverted;
            expect(await owner.provider?.getCode(faucet.address)).be.equal(
                '0x'
            );
        });
    });
});

const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { ethers } = require("hardhat");


describe('Faucet', function () {

  async function deployContractAndSetVariables() {
    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy();

    const [owner, other_addr] = await ethers.getSigners();

    // give the faucet a starting balance of 1 Eth
    const faucet_balance = ethers.parseEther("1.0");
    await owner.sendTransaction({
      to: faucet.target,
      value: faucet_balance, // Sends exactly 1.0 ether
    });
    
    return { faucet, owner, other_addr, faucet_balance };
  }


  it('should deploy and set the owner correctly', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });


  it('should not allow withdrawals above .01 ETH at a time', async function () {
    const { faucet } = await loadFixture(
      deployContractAndSetVariables
    );
    let withdrawAmount = ethers.parseUnits('0.02', 'ether');

    await expect(faucet.withdraw(withdrawAmount)).to.be.revertedWith('Too much ether requested (max: 0.01 ETH)');
  });


  it('should allow withdrawals .01 ETH and under', async function () {
    const { faucet, other_addr } = await loadFixture(
      deployContractAndSetVariables
    );
    let withdrawAmount = ethers.parseUnits('0.01', 'ether');

    // check the user's balance increases when withdrawing
    await expect(
      faucet.connect(other_addr).withdraw(withdrawAmount)
    ).to.changeEtherBalance(other_addr, withdrawAmount);
  });


  it('should only allow owner to withdrawAll', async function () {
    const { faucet, owner, other_addr, faucet_balance } = await loadFixture(
      deployContractAndSetVariables
    );

    // check it reverts if other user tries to withdraw
    await expect(faucet.connect(other_addr).withdrawAll()).to.be.revertedWith("Not the owner");
    // check faucet balance didn't change
    expect(await ethers.provider.getBalance(faucet)).to.equal(faucet_balance);

    // check the owner can withdrawAll
    await expect(
      faucet.withdrawAll()
    ).to.changeEtherBalance(owner, faucet_balance);

    // check the faucet now has 0 balance
    expect(await ethers.provider.getBalance(faucet)).to.equal(0);
  });


  it('should only allow owner to destroyFaucet', async function () {
    const { faucet, other_addr } = await loadFixture(
      deployContractAndSetVariables
    );

    // check another user can't call destroyFaucet
    await expect(faucet.connect(other_addr).destroyFaucet()).to.be.revertedWith("Not the owner");
    // check the code is still deployed
    expect(await faucet.getDeployedCode()).to.not.equal(null);

    // check the owner can destroy the faucet
    await faucet.destroyFaucet();

    // check the code is gone
    expect(await faucet.getDeployedCode()).to.equal(null);
  });

});
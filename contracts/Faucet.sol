// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Faucet {
  address payable public owner;

  constructor() payable {
    owner = payable(msg.sender);
  }
  
  function withdraw(uint _amount) payable public {
    // users can only withdraw .01 ETH at a time, feel free to change this!
    require(_amount <= 10000000000000000, 'Too much ether requested (max: 0.01 ETH)');
    require(address(this).balance >= _amount, 'Faucet balance is too low');
    (bool sent, ) = payable(msg.sender).call{value: _amount}("");
    require(sent, "Failed to send Ether");
  }

  function withdrawAll() onlyOwner public {
    (bool sent, ) = owner.call{value: address(this).balance}("");
    require(sent, "Failed to send Ether");
  }

  function destroyFaucet() onlyOwner public {
    selfdestruct(owner);
  }

  receive() payable external {
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Not the owner");
    _;
  }
}

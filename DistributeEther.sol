// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract DistributeEther {
    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }

    receive() external payable {}

    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can perform this operation");
        _;
    }

    function distribute(address payable[] memory _recipients) public payable  {
           require(_recipients.length > 0, "No recipient addresses provided");
           
        uint amount = msg.value / _recipients.length;

        for (uint i = 0; i < _recipients.length; i++) {
            _recipients[i].transfer(amount);
        }
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

      function claim() public onlyOwner {
        require(address(this).balance > 0, "No funds to claim");

        payable(msg.sender).transfer(address(this).balance);
    }
}

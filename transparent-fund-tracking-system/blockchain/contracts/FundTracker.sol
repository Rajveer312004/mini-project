// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract FundTracker {
    address public admin;

    struct Scheme {
        uint id;
        string name;
        uint256 totalFunds;
        uint256 usedFunds;
    }

    mapping(uint => Scheme) public schemes;
    uint public schemeCount;

    event FundAdded(uint indexed id, string name, uint256 amount);
    event FundUsed(uint indexed id, uint256 amount);

    constructor() {
        admin = msg.sender;
    }

    function addScheme(string memory _name, uint256 _amount) public {
        require(msg.sender == admin, "Only admin can add scheme");
        schemeCount++;
        schemes[schemeCount] = Scheme(schemeCount, _name, _amount, 0);
        emit FundAdded(schemeCount, _name, _amount);
    }

    function useFund(uint _id, uint256 _amount) public {
        require(msg.sender == admin, "Only admin can use fund");
        Scheme storage scheme = schemes[_id];
        require(scheme.totalFunds >= scheme.usedFunds + _amount, "Not enough funds");
        scheme.usedFunds += _amount;
        emit FundUsed(_id, _amount);
    }

    function getScheme(uint _id) public view returns (Scheme memory) {
        return schemes[_id];
    }
}

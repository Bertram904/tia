// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract UserManagement {
    address public admin;
    mapping(address => bool) public managers;
    mapping(address => bool) public regularUsers;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyManager() {
        require(managers[msg.sender] || msg.sender == admin , "Only managers or admin can call this function");
        _;
    }

   
    function addManager(address _manager) public onlyAdmin {
        managers[_manager] = true;
    }
    function removeManager(address _manager) public onlyAdmin {
        managers[_manager] = false;
    }
    function addRegularUser(address _user) public onlyManager {
        regularUsers[_user] = true;
    }
    function removeRegularUser(address _user) public onlyManager {
        regularUsers[_user] = false;
    }
    function checkUserRole(address _user) public view returns (string memory) {
      if (admin == _user) {
          return "Admin";
      } else if (managers[_user]) {
          return "Manager";
      } else if (regularUsers[_user]) {
          return "User";
      } else {
          return "Unknown";
      }
  }
}

contract FinancialOperations is UserManagement {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        balances[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
    }
}

contract LoanSystem is FinancialOperations {
    struct LoanRequest {
        address borrower;
        uint256 amount;
        bool approved;
    }

    mapping(address => LoanRequest) public loanRequests;

    function requestLoan(uint256 _amount) public {
        loanRequests[msg.sender] = LoanRequest(msg.sender, _amount, false);
    }

    function approveLoan(address _borrower) public onlyManager {
        loanRequests[_borrower].approved = true;
        balances[_borrower] += loanRequests[_borrower].amount;
    }

    function repayLoan(uint256 _amount) public {
        require(loanRequests[msg.sender].approved, "Loan not approved");
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        balances[msg.sender] -= _amount;
    }
}
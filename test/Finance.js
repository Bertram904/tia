const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserManagement", function () {
  async function deployUserManagement() {
    const [admin, manager, regularUser, unknownUser] = await ethers.getSigners();
    const UserManagement = await ethers.getContractFactory("UserManagement");
    const userManagement = await UserManagement.deploy();

    return { userManagement, admin, manager, regularUser, unknownUser };
  }
  it("Should set the right admin", async function () {
    const { userManagement, admin } = await loadFixture(deployUserManagement);

    expect(await userManagement.admin()).to.equal(admin.address);
  })
  describe("Admin function", function () {
    it("Should not allow a non-admin to add a user", async function () {
      const { userManagement, manager, regularUser } = await loadFixture(deployUserManagement);

      await expect(userManagement.connect(regularUser).addManager(manager.address)
      ).to.be.revertedWith("Only admin can call this function");
      await expect(userManagement.connect(regularUser).removeManager(manager.address)
      ).to.be.revertedWith("Only admin can call this function");
    });

    it("Should add or remove a manager", async function () {
      const { userManagement, manager } = await loadFixture(deployUserManagement);
      await userManagement.addManager(manager.address);
      expect(await userManagement.managers(manager.address)).to.be.true;


      await userManagement.removeManager(manager.address);
      expect(await userManagement.managers(manager.address)).to.be.false;

    });

    it("Should add or remove a regularUser", async function () {
      const { userManagement, regularUser } = await loadFixture(deployUserManagement);
      await userManagement.addRegularUser(regularUser.address);
      expect(await userManagement.regularUsers(regularUser.address)).to.be.true;

      await userManagement.removeRegularUser(regularUser.address);
      expect(await userManagement.regularUsers(regularUser.address)).to.be.false;

    });

  });
  describe("Manager function", function () {

    it("Should add or remove RegularUser", async function () {
      const { userManagement, regularUser } = await loadFixture(deployUserManagement);

      await userManagement.addRegularUser(regularUser.address);
      expect(await userManagement.regularUsers(regularUser.address)).to.be.true;
      await userManagement.removeRegularUser(regularUser.address);
      expect(await userManagement.regularUsers(regularUser.address)).to.be.false;
    });

    it("Should allow manager to remove and add", async function () {
      const { userManagement, manager, regularUser } = await loadFixture(deployUserManagement);

      await expect(userManagement.connect(manager).addRegularUser(regularUser.address)
      ).to.be.revertedWith("Only managers or admin can call this function");

      await expect(userManagement.connect(manager).removeRegularUser(regularUser.address)
      ).to.be.revertedWith("Only managers or admin can call this function");
    });
    it("Should revert if non-manager tries to add a regular user", async function () {
      const { userManagement, regularUser } = await loadFixture(deployUserManagement);

      await expect(userManagement.connect(regularUser).addRegularUser(regularUser.address)).to.be.revertedWith("Only managers or admin can call this function");
    });
    it("Should correctly identify user role", async function () {
      const { userManagement, admin, manager, regularUser, unknownUser } = await loadFixture(deployUserManagement);
      expect(await userManagement.checkUserRole(admin.address)).to.equal("Admin");

      await userManagement.connect(admin).addManager(manager.address);
      expect(await userManagement.checkUserRole(manager.address)).to.equal("Manager");

      await userManagement.connect(manager).addRegularUser(regularUser.address);
      expect(await userManagement.checkUserRole(regularUser.address)).to.equal("User");

      expect(await userManagement.checkUserRole(unknownUser.address)).to.equal("Unknown");

    });
  });
});

describe("FinancialOperations", function () {
  async function deployFinancialOperations() {
    const [regularUser] = await ethers.getSigners();
    const FinancialOperations = await ethers.getContractFactory("FinancialOperations");
    const financialOperations = await FinancialOperations.deploy();
    return { regularUser, financialOperations };
  }
  it("Should allow deposit and update balance", async function () {
    const { financialOperations, regularUser } = await loadFixture(deployFinancialOperations);

    await financialOperations.connect(regularUser).deposit({ value: 1000 });
    expect(await financialOperations.balances(regularUser.address)).to.equal(1000);
  });

  it("Should allow withdrawal and update balance", async function () {
    const { financialOperations, regularUser } = await loadFixture(deployFinancialOperations);
    const depositAmount = 2000;
    const withdrawAmount = 1000;

    await financialOperations.connect(regularUser).deposit({ value: depositAmount });
    await financialOperations.connect(regularUser).withdraw(withdrawAmount);
    expect(await financialOperations.balances(regularUser.address)).to.equal(withdrawAmount);
  });
  it("Should revert withdrawal if balance is insufficient", async function () {
    const { financialOperations, regularUser } = await loadFixture(deployFinancialOperations);
    const withdrawAmount = 2000;

    await expect(
      financialOperations.connect(regularUser).withdraw(withdrawAmount)
    ).to.be.revertedWith("Insufficient balance");
  });
});

describe("LoanSystem", function () {
  async function deployLoanSystem() {
    const [admin, manager, borrower] = await ethers.getSigners();
    const LoanSystem = await ethers.getContractFactory("LoanSystem");
    const loanSystem = await LoanSystem.deploy();
    await loanSystem.connect(admin).addManager(manager.address);
    return { admin, manager, borrower, loanSystem };
  }
  it("Should allow borrower to request a loan ", async function () {
    const { loanSystem, borrower } = await loadFixture(deployLoanSystem);
    const loanAmount = 1000;

    await loanSystem.connect(borrower).requestLoan(loanAmount);
    const loanRequest = await loanSystem.loanRequests(borrower.address);

    expect(loanRequest.borrower).to.equal(borrower.address);
    expect(loanRequest.amount).to.equal(loanAmount);
    expect(loanRequest.approved).to.be.false;
  });
  it("Should allow manager to approve a loan", async function () {
    const { loanSystem, manager, borrower } = await loadFixture(deployLoanSystem);
    const loanAmount = 1000;
    await loanSystem.connect(borrower).requestLoan(loanAmount);
    await loanSystem.connect(manager).approveLoan(borrower.address);

    const loanRequest = await loanSystem.loanRequests(borrower.address);
    expect(loanRequest.approved).to.be.true;
    expect(await loanSystem.balances(borrower.address)).to.equal(loanAmount);
  });
})

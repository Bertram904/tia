const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("FinanceModule", (m) => {
    const user = m.contract("UserManagement", []);

    const operations = m.contract("FinancialOperations",[]);
    const loan = m.contract("LoanSystem ",[]);
    return(user, operations,loan);
});
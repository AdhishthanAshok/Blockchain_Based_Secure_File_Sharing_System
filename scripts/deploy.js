// Importing Hardhat Runtime Environment (HRE) to interact with the Hardhat environment
const hre = require("hardhat");

// Main deployment function
async function main() {
  // Get the contract factory for "Upload" smart contract
  // This allows us to deploy new instances of the contract
  const Upload = await hre.ethers.getContractFactory("Upload");

  // Deploy the contract and wait for it to be mined
  const upload = await Upload.deploy();

  // Wait until the contract is actually deployed and available on the blockchain
  await upload.deployed();

  // Output the deployed contract address to the console
  console.log("Upload contract deployed to:", upload.address);
}

// Execute the main function
// If there’s an error during deployment, log it and exit with failure code
main().catch((error) => {
  console.error("Error in deployment:", error);
  process.exitCode = 1;
});

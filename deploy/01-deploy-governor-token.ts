/* eslint-disable node/no-unpublished-import */
/* eslint-disable node/no-missing-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import verify from "../helper-hardhat-functions";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { ethers } from "hardhat";

const deployGovernanceToken: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("----------------------------------------------------");
  log("Deploying GovernanceToken and waiting for confirmations...");
  const governanceToken = await deploy("GovernanceToken", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  });
  log(`GovernanceToken at ${governanceToken.address}`);
  // Verification
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(governanceToken.address, []);
  }
  // Delegating to deployer
  log("----------------------------------------------------");
  log(`Delegating to ${deployer}`);
  await delegate(governanceToken.address, deployer);
  log("Delegated!");
};

const delegate = async (
  governanceTokenAddress: string,
  delegatedAccount: string
) => {
  const governanceToken = await ethers.getContractAt(
    "GovernanceToken",
    governanceTokenAddress
  );
  const transactionResponse = await governanceToken.delegate(delegatedAccount);
  await transactionResponse.wait(1);
  console.log(
    `Checkpoints: ${await governanceToken.numCheckpoints(delegatedAccount)}`
  );
};

export default deployGovernanceToken;
deployGovernanceToken.tags = ["all", "governor"];

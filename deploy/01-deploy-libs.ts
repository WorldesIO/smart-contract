import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { config } from "dotenv";
config({ path: "../.env" });

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  console.log("deployer: ", deployer);

  // ——————————————deploy lib-logic————————————————————
  console.log("start deploy lib-logic");
  
  // Deploy CloneFactory
  console.log("- Deployment of CloneFactory contract");
  await deploy("CloneFactory", {
    contract: "CloneFactory",
    from: deployer,
  }).then((res) => {
    console.log("CloneFactory deployed to: %s, %s", res.address, res.newlyDeployed);
  });

  // Deploy fee rate model template
  console.log("- Deployment of FeeRateModel template contract");
  await deploy("FeeRateModel", {
    contract: "FeeRateModel",
    from: deployer,
  }).then((res) => {
    console.log("FeeRateModelTemplate deployed to: %s, %s", res.address, res.newlyDeployed);
  });

  console.log("deploy lib-logic done!");
};
export default deployFunction;
deployFunction.tags = ["libs"];

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import hre from "hardhat";

import { config } from "dotenv";
import { getDeployedContractWithDefaultName } from "../scripts/utils/env-utils";
config({ path: "../.env" });

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  console.log("deployer: ", deployer);
  let tx;
  
  // ——————————————load deployed contacts————————————————————
  const CloneFactory = await deployments.get("CloneFactory");
  

  // ——————————————deploy asset————————————————————
  console.log("start deploy asset");

  //deploy WorldesRWAToken Template
  await deploy("WorldesRWAToken", {
    contract: "WorldesRWAToken",
    from: deployer,
  }).then((res) => {
    console.log("WorldesRWAToken deployed to: %s, %s", res.address, res.newlyDeployed);
  });
  const worldesTokenTemplate = await deployments.get("WorldesRWAToken");

  //deploy WorldesRWATokenFactory
  await deploy("WorldesRWATokenFactory", {
    contract: "WorldesRWATokenFactory",
    from: deployer,
    args: [deployer, CloneFactory.address, worldesTokenTemplate.address],
  }).then((res) => {
    console.log("WorldesRWATokenFactory deployed to: %s, %s", res.address, res.newlyDeployed);
  });
  const worldesTokenFactory = await getDeployedContractWithDefaultName("WorldesRWATokenFactory");

  //deploy WorldesPropertyRights
  await deploy("WorldesPropertyRights", {
    contract: "WorldesPropertyRights",
    from: deployer,
    args: [
      deployer,
      worldesTokenFactory.target,
    ],
  }).then((res) => {
    console.log("WorldesPropertyRights deployed to: %s, %s", res.address, res.newlyDeployed);
  });

  console.log("asset done");
}

//
export default deployFunction;
deployFunction.tags = ["asset"];


import { verifyContract } from "../utils/verify-helper";
import hre from "hardhat";
import { ethers } from "hardhat";
const func = async function () {
    const { getNamedAccounts, deployments } = hre;
    const { deployer } = await getNamedAccounts();

    // ——————————————verify mine————————————————————

    const TimelockController = await deployments.get("TimelockController");

    //verify WorldesAirdrop
    console.log("\n- Verifying TimelockController...\n");
    const TimelockControllerParams :[string, string[], string[], string] = ["300",[deployer],[deployer],deployer];
    await verifyContract(
        "TimelockController",
        TimelockController.address,
        "@openzeppelin/contracts/governance/TimelockController.sol:TimelockController",
        TimelockControllerParams
    );

};

func().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

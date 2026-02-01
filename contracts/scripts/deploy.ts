import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying Polyseal contracts to", network.name);
  console.log("================================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "MATIC\n");

  // ============ Deploy PolysealReceiptRules ============
  console.log("1️⃣  Deploying PolysealReceiptRules...");
  const ReceiptRules = await ethers.getContractFactory("PolysealReceiptRules");
  const receiptRules = await ReceiptRules.deploy();
  await receiptRules.waitForDeployment();
  const receiptRulesAddress = await receiptRules.getAddress();
  console.log("   ✅ PolysealReceiptRules deployed to:", receiptRulesAddress);

  // ============ Deploy PolysealRootBook ============
  console.log("\n2️⃣  Deploying PolysealRootBook...");
  const RootBook = await ethers.getContractFactory("PolysealRootBook");
  const rootBook = await RootBook.deploy();
  await rootBook.waitForDeployment();
  const rootBookAddress = await rootBook.getAddress();
  console.log("   ✅ PolysealRootBook deployed to:", rootBookAddress);

  // ============ Deploy PolysealFeeManager ============
  console.log("\n3️⃣  Deploying PolysealFeeManager...");
  const initialFeeBps = 50; // 0.5%
  const feeRecipient = deployer.address; // Protocol fee goes to deployer initially
  
  const FeeManager = await ethers.getContractFactory("PolysealFeeManager");
  const feeManager = await FeeManager.deploy(initialFeeBps, feeRecipient, deployer.address);
  await feeManager.waitForDeployment();
  const feeManagerAddress = await feeManager.getAddress();
  console.log("   ✅ PolysealFeeManager deployed to:", feeManagerAddress);
  console.log("   📊 Initial fee:", initialFeeBps, "bps (0.5%)");
  console.log("   📫 Fee recipient:", feeRecipient);

  // ============ Deploy PolysealEscrow ============
  console.log("\n4️⃣  Deploying PolysealEscrow...");
  const arbiter = deployer.address; // Deployer is initial arbiter
  
  const Escrow = await ethers.getContractFactory("PolysealEscrow");
  const escrow = await Escrow.deploy(feeManagerAddress, arbiter);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("   ✅ PolysealEscrow deployed to:", escrowAddress);
  console.log("   ⚖️  Initial arbiter:", arbiter);

  // ============ Summary ============
  console.log("\n================================================");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("================================================\n");

  const contracts = {
    network: network.name,
    chainId: network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      PolysealReceiptRules: receiptRulesAddress,
      PolysealRootBook: rootBookAddress,
      PolysealFeeManager: feeManagerAddress,
      PolysealEscrow: escrowAddress,
    },
    tokens: {
      USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      "USDC.e": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    },
  };

  console.log("📋 Contract Addresses:");
  console.log(JSON.stringify(contracts, null, 2));

  // ============ Write to frontend config ============
  const frontendConfigDir = path.join(__dirname, "../../frontend/src/config");
  const frontendConfigPath = path.join(frontendConfigDir, "contracts.polygon.json");

  // Create directory if it doesn't exist
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  fs.writeFileSync(frontendConfigPath, JSON.stringify(contracts, null, 2));
  console.log("\n📁 Contract addresses written to:", frontendConfigPath);

  // ============ Verification Commands ============
  console.log("\n================================================");
  console.log("📝 VERIFICATION COMMANDS:");
  console.log("================================================\n");
  console.log("Run these commands to verify contracts on Polygonscan:\n");
  console.log(`npx hardhat verify --network polygon ${receiptRulesAddress}`);
  console.log(`npx hardhat verify --network polygon ${rootBookAddress}`);
  console.log(`npx hardhat verify --network polygon ${feeManagerAddress} ${initialFeeBps} ${feeRecipient} ${deployer.address}`);
  console.log(`npx hardhat verify --network polygon ${escrowAddress} ${feeManagerAddress} ${arbiter}`);

  return contracts;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

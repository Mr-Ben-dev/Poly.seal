import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface ContractConfig {
  contracts: {
    PolysealReceiptRules: string;
    PolysealRootBook: string;
    PolysealFeeManager: string;
    PolysealEscrow: string;
  };
  deployer: string;
}

async function main() {
  console.log("🔍 Verifying Polyseal contracts on Polygonscan...\n");

  // Read deployed addresses
  const configPath = path.join(__dirname, "../../frontend/src/config/contracts.polygon.json");
  
  if (!fs.existsSync(configPath)) {
    throw new Error("Contract config not found. Run deploy script first.");
  }

  const config: ContractConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const { contracts, deployer } = config;

  // Verification parameters
  const initialFeeBps = 50;
  const feeRecipient = deployer;
  const arbiter = deployer;

  console.log("📋 Verifying contracts with addresses:");
  console.log(JSON.stringify(contracts, null, 2));
  console.log("");

  // Verify PolysealReceiptRules
  try {
    console.log("1️⃣  Verifying PolysealReceiptRules...");
    await run("verify:verify", {
      address: contracts.PolysealReceiptRules,
      constructorArguments: [],
    });
    console.log("   ✅ PolysealReceiptRules verified!\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   ⏭️  Already verified\n");
    } else {
      console.log("   ❌ Failed:", error.message, "\n");
    }
  }

  // Verify PolysealRootBook
  try {
    console.log("2️⃣  Verifying PolysealRootBook...");
    await run("verify:verify", {
      address: contracts.PolysealRootBook,
      constructorArguments: [],
    });
    console.log("   ✅ PolysealRootBook verified!\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   ⏭️  Already verified\n");
    } else {
      console.log("   ❌ Failed:", error.message, "\n");
    }
  }

  // Verify PolysealFeeManager
  try {
    console.log("3️⃣  Verifying PolysealFeeManager...");
    await run("verify:verify", {
      address: contracts.PolysealFeeManager,
      constructorArguments: [initialFeeBps, feeRecipient, deployer],
    });
    console.log("   ✅ PolysealFeeManager verified!\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   ⏭️  Already verified\n");
    } else {
      console.log("   ❌ Failed:", error.message, "\n");
    }
  }

  // Verify PolysealEscrow
  try {
    console.log("4️⃣  Verifying PolysealEscrow...");
    await run("verify:verify", {
      address: contracts.PolysealEscrow,
      constructorArguments: [contracts.PolysealFeeManager, arbiter],
    });
    console.log("   ✅ PolysealEscrow verified!\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   ⏭️  Already verified\n");
    } else {
      console.log("   ❌ Failed:", error.message, "\n");
    }
  }

  console.log("================================================");
  console.log("🎉 VERIFICATION COMPLETE!");
  console.log("================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });

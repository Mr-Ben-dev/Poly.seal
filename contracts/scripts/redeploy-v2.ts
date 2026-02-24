import { ethers, network } from "hardhat";

/**
 * Redeploy only PolysealEscrow, PolysealAgent, PolysealVault (v2)
 * - Escrow: adds agent authorization for approveRelease
 * - Agent: actually calls escrow.approveRelease() on settlement
 * - Vault: MIN_DEPOSIT lowered from 1 USDC to 0.1 USDC
 * 
 * Keeps existing: PolysealReceiptRules, PolysealRootBook, PolysealFeeManager
 */
async function main() {
  console.log("🔄 Redeploying Escrow + Agent + Vault (v2) to", network.name);
  console.log("================================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "POL\n");

  // Existing contracts (not redeployed)
  const EXISTING = {
    PolysealReceiptRules: "0xA983eCc82565213388D002282FedF8E0B66aAeA5",
    PolysealRootBook: "0x2b9fad6f859904D6F99f202CB6Dc4F004B59C421",
    PolysealFeeManager: "0x241791ab13a61da738bd817ee9Fa7cfba2c763c3",
  };

  const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

  // ============ Deploy PolysealEscrow v2 ============
  console.log("1️⃣  Deploying PolysealEscrow v2...");
  const Escrow = await ethers.getContractFactory("PolysealEscrow");
  const escrow = await Escrow.deploy(EXISTING.PolysealFeeManager, deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("   ✅ PolysealEscrow v2:", escrowAddress);

  // ============ Deploy PolysealAgent v2 ============
  console.log("\n2️⃣  Deploying PolysealAgent v2...");
  const Agent = await ethers.getContractFactory("PolysealAgent");
  const agent = await Agent.deploy(escrowAddress);
  await agent.waitForDeployment();
  const agentAddress = await agent.getAddress();
  console.log("   ✅ PolysealAgent v2:", agentAddress);

  // ============ Set Agent on Escrow ============
  console.log("\n3️⃣  Setting Agent authorization on Escrow...");
  const setAgentTx = await escrow.setAgent(agentAddress);
  await setAgentTx.wait();
  console.log("   ✅ Escrow.agent =", agentAddress);

  // ============ Deploy PolysealVault v2 ============
  console.log("\n4️⃣  Deploying PolysealVault v2 (min 0.1 USDC)...");
  const Vault = await ethers.getContractFactory("PolysealVault");
  const vault = await Vault.deploy(USDC_ADDRESS, deployer.address);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("   ✅ PolysealVault v2:", vaultAddress);

  // ============ Summary ============
  console.log("\n================================================");
  console.log("🎉 V2 REDEPLOYMENT COMPLETE");
  console.log("================================================\n");

  const allContracts = {
    PolysealReceiptRules: EXISTING.PolysealReceiptRules,
    PolysealRootBook: EXISTING.PolysealRootBook,
    PolysealFeeManager: EXISTING.PolysealFeeManager,
    PolysealEscrow: escrowAddress,
    PolysealAgent: agentAddress,
    PolysealVault: vaultAddress,
  };

  console.log("📋 All Contract Addresses:");
  for (const [name, addr] of Object.entries(allContracts)) {
    console.log(`   ${name}: ${addr}`);
  }

  console.log("\n📋 Copy to frontend/src/config/index.ts:");
  console.log(`PolysealEscrow: '${escrowAddress}' as \`0x\${string}\`,`);
  console.log(`PolysealAgent: '${agentAddress}' as \`0x\${string}\`,`);
  console.log(`PolysealVault: '${vaultAddress}' as \`0x\${string}\`,`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Redeployment failed:", error);
    process.exit(1);
  });

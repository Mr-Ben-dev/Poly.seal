// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PolysealTypes.sol";
import "./PolysealErrors.sol";

/**
 * @title PolysealVault
 * @notice Yield Vault for USDC — deposit, earn yield, withdraw with shares
 * @dev ERC4626-inspired share-based accounting. Share price increases as
 *      yield is distributed, meaning early depositors benefit from compounding.
 *
 * Flow:
 *   1. Users deposit USDC → receive shares proportional to current share price
 *   2. Owner (protocol) distributes yield → increases total assets
 *   3. Users withdraw shares → receive USDC based on current share price
 *
 * Security:
 *   - 1-hour withdrawal cooldown after deposit to prevent flash-loan attacks
 *   - Pausable by owner for emergency scenarios
 *   - ReentrancyGuard on all state-changing functions
 *   - Minimum deposit of 1 USDC (1e6 units)
 */
contract PolysealVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Minimum deposit: 0.1 USDC
    uint256 public constant MIN_DEPOSIT = 1e5;

    /// @notice Withdrawal cooldown: 1 hour after deposit
    uint256 public constant WITHDRAW_COOLDOWN = 1 hours;

    /// @notice Share precision (1 share = 1e18)
    uint256 public constant SHARE_DECIMALS = 1e18;

    // ============ State ============

    /// @notice The USDC token
    IERC20 public immutable usdc;

    /// @notice Vault owner (protocol admin)
    address public owner;

    /// @notice Whether the vault is paused
    bool public paused;

    /// @notice Total shares minted across all depositors
    uint256 public totalShares;

    /// @notice Total assets (USDC) managed by the vault
    uint256 public totalAssets;

    /// @notice Total yield distributed since inception
    uint256 public totalYieldDistributed;

    /// @notice Total deposits ever made
    uint256 public totalDepositsCount;

    /// @notice Total withdrawals ever made
    uint256 public totalWithdrawalsCount;

    /// @notice Per-depositor data
    mapping(address => VaultDepositor) public depositors;

    /// @notice All depositor addresses (for enumeration)
    address[] public depositorList;
    mapping(address => bool) private isDepositor;

    // ============ Events ============

    event Deposited(
        address indexed depositor,
        uint256 amount,
        uint256 sharesReceived,
        uint256 timestamp
    );

    event Withdrawn(
        address indexed depositor,
        uint256 sharesBurned,
        uint256 amountReceived,
        uint256 timestamp
    );

    event YieldDistributed(
        uint256 amount,
        uint256 newTotalAssets,
        uint256 timestamp
    );

    event VaultPausedEvent(bool paused, uint256 timestamp);

    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert VaultPaused();
        _;
    }

    // ============ Constructor ============

    /**
     * @param _usdc Address of the USDC token
     * @param _owner Vault owner / admin
     */
    constructor(address _usdc, address _owner) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_owner == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
        owner = _owner;
    }

    // ============ Core Functions ============

    /**
     * @notice Deposit USDC into the vault and receive shares
     * @param amount Amount of USDC to deposit (in USDC decimals, i.e. 6)
     * @return shares Number of shares received
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused returns (uint256 shares) {
        if (amount < MIN_DEPOSIT) revert DepositTooSmall(amount, MIN_DEPOSIT);

        // Calculate shares: if totalShares == 0, 1:1 ratio scaled to share decimals
        if (totalShares == 0 || totalAssets == 0) {
            shares = amount * SHARE_DECIMALS / 1e6; // normalize to 18 decimals
        } else {
            shares = (amount * totalShares) / totalAssets;
        }

        if (shares == 0) revert InvalidAmount();

        // Transfer USDC from user
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Update state
        totalShares += shares;
        totalAssets += amount;
        totalDepositsCount++;

        VaultDepositor storage dep = depositors[msg.sender];
        dep.shares += shares;
        dep.depositedAt = block.timestamp;
        dep.lastActionAt = block.timestamp;

        // Track depositor
        if (!isDepositor[msg.sender]) {
            isDepositor[msg.sender] = true;
            depositorList.push(msg.sender);
        }

        emit Deposited(msg.sender, amount, shares, block.timestamp);

        return shares;
    }

    /**
     * @notice Withdraw shares from the vault and receive USDC
     * @param sharesToBurn Number of shares to burn
     * @return amount USDC amount received
     */
    function withdraw(uint256 sharesToBurn) external nonReentrant whenNotPaused returns (uint256 amount) {
        VaultDepositor storage dep = depositors[msg.sender];

        if (sharesToBurn == 0) revert InvalidAmount();
        if (dep.shares < sharesToBurn) revert InsufficientShares(sharesToBurn, dep.shares);
        if (block.timestamp < dep.depositedAt + WITHDRAW_COOLDOWN) {
            revert WithdrawCooldown(dep.depositedAt + WITHDRAW_COOLDOWN);
        }
        if (totalShares == 0) revert VaultEmpty();

        // Calculate USDC amount based on share price
        amount = (sharesToBurn * totalAssets) / totalShares;

        if (amount == 0) revert InvalidAmount();

        // Update state
        dep.shares -= sharesToBurn;
        dep.lastActionAt = block.timestamp;
        totalShares -= sharesToBurn;
        totalAssets -= amount;
        totalWithdrawalsCount++;

        // Transfer USDC to user
        usdc.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, sharesToBurn, amount, block.timestamp);

        return amount;
    }

    /**
     * @notice Distribute yield to the vault (only owner)
     * @dev Yield is added to totalAssets, increasing the share price for all depositors
     * @param amount Amount of USDC yield to add
     */
    function distributeYield(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (totalShares == 0) revert VaultEmpty();

        // Transfer USDC yield into vault
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        totalAssets += amount;
        totalYieldDistributed += amount;

        emit YieldDistributed(amount, totalAssets, block.timestamp);
    }

    // ============ Admin Functions ============

    /**
     * @notice Pause or unpause the vault
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit VaultPausedEvent(_paused, block.timestamp);
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ============ View Functions ============

    /**
     * @notice Get the current price of 1 share in USDC (6 decimals)
     * @return price Price per share in USDC terms
     */
    function sharePrice() external view returns (uint256 price) {
        if (totalShares == 0) return 1e6; // 1 USDC if no shares minted
        return (totalAssets * SHARE_DECIMALS) / totalShares;
    }

    /**
     * @notice Preview how many shares a deposit would yield
     * @param amount USDC amount
     * @return shares Expected shares
     */
    function previewDeposit(uint256 amount) external view returns (uint256 shares) {
        if (totalShares == 0 || totalAssets == 0) {
            return amount * SHARE_DECIMALS / 1e6;
        }
        return (amount * totalShares) / totalAssets;
    }

    /**
     * @notice Preview how much USDC withdrawing shares would yield
     * @param sharesToBurn Shares to burn
     * @return amount Expected USDC amount
     */
    function previewWithdraw(uint256 sharesToBurn) external view returns (uint256 amount) {
        if (totalShares == 0) return 0;
        return (sharesToBurn * totalAssets) / totalShares;
    }

    /**
     * @notice Get depositor info
     * @param account Depositor address
     * @return shares Current shares held
     * @return usdcValue Current USDC value of shares
     * @return depositedAt When the last deposit was made
     */
    function getDepositorInfo(address account) external view returns (
        uint256 shares,
        uint256 usdcValue,
        uint256 depositedAt
    ) {
        VaultDepositor memory dep = depositors[account];
        shares = dep.shares;
        depositedAt = dep.depositedAt;
        if (totalShares > 0) {
            usdcValue = (dep.shares * totalAssets) / totalShares;
        }
    }

    /**
     * @notice Get total depositor count
     */
    function getDepositorCount() external view returns (uint256) {
        return depositorList.length;
    }

    /**
     * @notice Get vault stats
     */
    function getVaultStats() external view returns (
        uint256 _totalAssets,
        uint256 _totalShares,
        uint256 _totalYieldDistributed,
        uint256 _totalDepositsCount,
        uint256 _totalWithdrawalsCount,
        uint256 _depositorCount,
        bool _paused
    ) {
        return (
            totalAssets,
            totalShares,
            totalYieldDistributed,
            totalDepositsCount,
            totalWithdrawalsCount,
            depositorList.length,
            paused
        );
    }

    /**
     * @notice Get vault APY estimate based on yield distributed vs total assets
     * @dev This is a simple estimate, not a guaranteed rate
     * @return apyBps Estimated APY in basis points (e.g., 500 = 5%)
     */
    function estimatedAPY() external view returns (uint256 apyBps) {
        if (totalAssets == 0 || totalYieldDistributed == 0) return 0;
        // Simple: yield / (assets - yield) * 10000
        uint256 principal = totalAssets > totalYieldDistributed ? totalAssets - totalYieldDistributed : 1;
        return (totalYieldDistributed * 10000) / principal;
    }
}

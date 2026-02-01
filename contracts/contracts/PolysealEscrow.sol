// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PolysealTypes.sol";
import "./PolysealErrors.sol";
import "./PolysealFeeManager.sol";

/**
 * @title PolysealEscrow
 * @notice USDC escrow for secure commerce with dispute resolution
 * @dev Supports create -> fund -> release/claim flow with optional disputes
 * 
 * Flow:
 * 1. Buyer creates escrow (createEscrow)
 * 2. Buyer deposits tokens (deposit) - requires prior approve()
 * 3. After receiving goods/services:
 *    - Buyer can approveRelease() to release funds
 *    - Merchant can claim() if approved OR after delivery window
 * 4. If dispute:
 *    - Buyer can openDispute() before deadline
 *    - Arbiter resolves dispute (resolveDispute)
 */
contract PolysealEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State ============

    /// @notice Fee manager contract
    PolysealFeeManager public immutable feeManager;

    /// @notice Arbiter address for dispute resolution
    address public arbiter;

    /// @notice Escrow ID counter
    uint256 public nextEscrowId;

    /// @notice Mapping of escrow ID to record
    mapping(uint256 => EscrowRecord) public escrows;

    /// @notice Track escrows by buyer
    mapping(address => uint256[]) private _buyerEscrows;

    /// @notice Track escrows by merchant
    mapping(address => uint256[]) private _merchantEscrows;

    /// @notice Total volume processed
    uint256 public totalVolume;

    /// @notice Total fees collected
    uint256 public totalFeesCollected;

    // ============ Events ============

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 deliveryDeadline,
        bytes32 invoiceHash
    );

    event EscrowFunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );

    event ReleaseApproved(
        uint256 indexed escrowId,
        address indexed buyer
    );

    event EscrowClaimed(
        uint256 indexed escrowId,
        address indexed merchant,
        uint256 amount,
        uint256 fee
    );

    event DisputeOpened(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 timestamp
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed arbiter,
        address winner,
        uint256 amount
    );

    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );

    event ArbiterUpdated(address oldArbiter, address newArbiter);

    // ============ Constructor ============

    /**
     * @notice Initialize escrow contract
     * @param _feeManager Fee manager contract address
     * @param _arbiter Initial arbiter address
     */
    constructor(address _feeManager, address _arbiter) {
        if (_feeManager == address(0)) revert ZeroAddress();
        if (_arbiter == address(0)) revert ZeroAddress();
        
        feeManager = PolysealFeeManager(_feeManager);
        arbiter = _arbiter;
        nextEscrowId = 1;
    }

    // ============ Escrow Lifecycle ============

    /**
     * @notice Create a new escrow
     * @param merchant Merchant address
     * @param token ERC20 token address (USDC)
     * @param amount Amount to escrow
     * @param deliveryWindowSeconds Time window for delivery
     * @param invoiceHash Invoice identifier
     * @return escrowId The created escrow ID
     */
    function createEscrow(
        address merchant,
        address token,
        uint256 amount,
        uint256 deliveryWindowSeconds,
        bytes32 invoiceHash
    ) external nonReentrant returns (uint256 escrowId) {
        // Validations
        if (merchant == address(0)) revert InvalidAddress();
        if (merchant == msg.sender) revert InvalidAddress();
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (deliveryWindowSeconds == 0 || deliveryWindowSeconds > 365 days) {
            revert InvalidDeliveryWindow();
        }

        escrowId = nextEscrowId++;
        uint256 deadline = block.timestamp + deliveryWindowSeconds;

        escrows[escrowId] = EscrowRecord({
            buyer: msg.sender,
            merchant: merchant,
            token: token,
            amount: amount,
            createdAt: block.timestamp,
            deliveryDeadline: deadline,
            invoiceHash: invoiceHash,
            state: EscrowState.Created,
            buyerApproved: false
        });

        _buyerEscrows[msg.sender].push(escrowId);
        _merchantEscrows[merchant].push(escrowId);

        emit EscrowCreated(
            escrowId,
            msg.sender,
            merchant,
            token,
            amount,
            deadline,
            invoiceHash
        );
    }

    /**
     * @notice Deposit funds into escrow (buyer must approve first)
     * @param escrowId The escrow ID
     */
    function deposit(uint256 escrowId) external nonReentrant {
        EscrowRecord storage escrow = escrows[escrowId];
        
        if (escrow.state == EscrowState.None) revert EscrowNotFound(escrowId);
        if (escrow.state != EscrowState.Created) {
            revert InvalidEscrowState(escrowId, uint8(escrow.state), uint8(EscrowState.Created));
        }
        if (msg.sender != escrow.buyer) revert NotBuyer(escrowId, msg.sender);

        // Transfer tokens from buyer
        IERC20(escrow.token).safeTransferFrom(msg.sender, address(this), escrow.amount);
        
        escrow.state = EscrowState.Funded;

        emit EscrowFunded(escrowId, msg.sender, escrow.amount);
    }

    /**
     * @notice Buyer approves release of funds to merchant
     * @param escrowId The escrow ID
     */
    function approveRelease(uint256 escrowId) external nonReentrant {
        EscrowRecord storage escrow = escrows[escrowId];
        
        if (escrow.state == EscrowState.None) revert EscrowNotFound(escrowId);
        if (escrow.state != EscrowState.Funded) {
            revert InvalidEscrowState(escrowId, uint8(escrow.state), uint8(EscrowState.Funded));
        }
        if (msg.sender != escrow.buyer) revert NotBuyer(escrowId, msg.sender);

        escrow.buyerApproved = true;
        escrow.state = EscrowState.Released;

        emit ReleaseApproved(escrowId, msg.sender);
    }

    /**
     * @notice Merchant claims funds after approval or deadline
     * @param escrowId The escrow ID
     */
    function claim(uint256 escrowId) external nonReentrant {
        EscrowRecord storage escrow = escrows[escrowId];
        
        if (escrow.state == EscrowState.None) revert EscrowNotFound(escrowId);
        if (msg.sender != escrow.merchant) revert NotMerchant(escrowId, msg.sender);
        
        // Can claim if approved OR if delivery window expired (no dispute)
        bool canClaim = escrow.state == EscrowState.Released;
        
        if (!canClaim && escrow.state == EscrowState.Funded) {
            if (block.timestamp >= escrow.deliveryDeadline) {
                canClaim = true;
            }
        }
        
        if (!canClaim) {
            revert InvalidEscrowState(escrowId, uint8(escrow.state), uint8(EscrowState.Released));
        }

        // Calculate and deduct fee
        uint256 fee = feeManager.calculateFee(escrow.amount);
        uint256 merchantAmount = escrow.amount - fee;

        escrow.state = EscrowState.Claimed;

        // Transfer to merchant
        IERC20(escrow.token).safeTransfer(escrow.merchant, merchantAmount);
        
        // Transfer fee to protocol
        if (fee > 0) {
            IERC20(escrow.token).safeTransfer(feeManager.feeRecipient(), fee);
            totalFeesCollected += fee;
        }

        totalVolume += escrow.amount;

        emit EscrowClaimed(escrowId, msg.sender, merchantAmount, fee);
    }

    /**
     * @notice Buyer opens dispute before deadline
     * @param escrowId The escrow ID
     */
    function openDispute(uint256 escrowId) external nonReentrant {
        EscrowRecord storage escrow = escrows[escrowId];
        
        if (escrow.state == EscrowState.None) revert EscrowNotFound(escrowId);
        if (escrow.state != EscrowState.Funded) {
            revert InvalidEscrowState(escrowId, uint8(escrow.state), uint8(EscrowState.Funded));
        }
        if (msg.sender != escrow.buyer) revert NotBuyer(escrowId, msg.sender);
        if (block.timestamp >= escrow.deliveryDeadline) {
            revert DeliveryWindowExpired(escrowId, escrow.deliveryDeadline);
        }

        escrow.state = EscrowState.Disputed;

        emit DisputeOpened(escrowId, msg.sender, block.timestamp);
    }

    /**
     * @notice Arbiter resolves dispute
     * @param escrowId The escrow ID
     * @param winner Address to receive funds (buyer or merchant)
     */
    function resolveDispute(uint256 escrowId, address winner) external nonReentrant {
        if (msg.sender != arbiter) revert NotArbiter(msg.sender);
        
        EscrowRecord storage escrow = escrows[escrowId];
        
        if (escrow.state == EscrowState.None) revert EscrowNotFound(escrowId);
        if (escrow.state != EscrowState.Disputed) {
            revert InvalidEscrowState(escrowId, uint8(escrow.state), uint8(EscrowState.Disputed));
        }
        if (winner != escrow.buyer && winner != escrow.merchant) {
            revert InvalidAddress();
        }

        escrow.state = EscrowState.Resolved;

        uint256 amount = escrow.amount;
        
        // If merchant wins, take fee; if buyer wins, full refund
        if (winner == escrow.merchant) {
            uint256 fee = feeManager.calculateFee(amount);
            uint256 merchantAmount = amount - fee;
            
            IERC20(escrow.token).safeTransfer(escrow.merchant, merchantAmount);
            
            if (fee > 0) {
                IERC20(escrow.token).safeTransfer(feeManager.feeRecipient(), fee);
                totalFeesCollected += fee;
            }
            
            totalVolume += amount;
            amount = merchantAmount;
        } else {
            // Full refund to buyer
            IERC20(escrow.token).safeTransfer(escrow.buyer, amount);
        }

        emit DisputeResolved(escrowId, msg.sender, winner, amount);
    }

    /**
     * @notice Cancel unfunded escrow
     * @param escrowId The escrow ID
     */
    function cancelEscrow(uint256 escrowId) external nonReentrant {
        EscrowRecord storage escrow = escrows[escrowId];
        
        if (escrow.state == EscrowState.None) revert EscrowNotFound(escrowId);
        if (escrow.state != EscrowState.Created) {
            revert InvalidEscrowState(escrowId, uint8(escrow.state), uint8(EscrowState.Created));
        }
        if (msg.sender != escrow.buyer) revert NotBuyer(escrowId, msg.sender);

        escrow.state = EscrowState.Resolved; // Reuse resolved state for cancelled

        emit EscrowCancelled(escrowId, msg.sender, escrow.amount);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update arbiter address
     * @param newArbiter New arbiter address
     */
    function setArbiter(address newArbiter) external {
        if (msg.sender != arbiter) revert NotArbiter(msg.sender);
        if (newArbiter == address(0)) revert ZeroAddress();
        
        address oldArbiter = arbiter;
        arbiter = newArbiter;
        
        emit ArbiterUpdated(oldArbiter, newArbiter);
    }

    // ============ View Functions ============

    /**
     * @notice Get escrow details
     * @param escrowId The escrow ID
     * @return record The escrow record
     */
    function getEscrow(uint256 escrowId) external view returns (EscrowRecord memory record) {
        record = escrows[escrowId];
        if (record.state == EscrowState.None) revert EscrowNotFound(escrowId);
    }

    /**
     * @notice Get buyer's escrow IDs
     * @param buyer Buyer address
     * @return escrowIds Array of escrow IDs
     */
    function getBuyerEscrows(address buyer) external view returns (uint256[] memory) {
        return _buyerEscrows[buyer];
    }

    /**
     * @notice Get merchant's escrow IDs
     * @param merchant Merchant address
     * @return escrowIds Array of escrow IDs
     */
    function getMerchantEscrows(address merchant) external view returns (uint256[] memory) {
        return _merchantEscrows[merchant];
    }

    /**
     * @notice Check if escrow can be claimed
     * @param escrowId The escrow ID
     * @return canClaim True if merchant can claim
     */
    function canClaimEscrow(uint256 escrowId) external view returns (bool canClaim) {
        EscrowRecord storage escrow = escrows[escrowId];
        
        if (escrow.state == EscrowState.Released) return true;
        if (escrow.state == EscrowState.Funded && block.timestamp >= escrow.deliveryDeadline) {
            return true;
        }
        return false;
    }
}

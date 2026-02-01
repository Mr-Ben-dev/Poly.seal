// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PolysealErrors.sol";

/**
 * @title PolysealFeeManager
 * @notice Protocol fee management with timelocked updates
 * @dev Manages fees for escrow operations with 24h timelock for changes
 */
contract PolysealFeeManager is Ownable {
    // ============ Constants ============

    /// @notice Maximum fee in basis points (100 = 1%)
    uint256 public constant MAX_FEE_BPS = 100;

    /// @notice Timelock duration for fee changes (24 hours)
    uint256 public constant FEE_TIMELOCK = 24 hours;

    // ============ State ============

    /// @notice Current fee in basis points
    uint256 public feeBps;

    /// @notice Address receiving protocol fees
    address public feeRecipient;

    /// @notice Pending fee change (if any)
    uint256 public pendingFeeBps;

    /// @notice Timestamp when pending fee can be applied
    uint256 public pendingFeeUnlockTime;

    /// @notice Pending fee recipient change
    address public pendingFeeRecipient;

    /// @notice Timestamp when pending recipient can be applied
    uint256 public pendingRecipientUnlockTime;

    // ============ Events ============

    event FeeChangeProposed(uint256 currentBps, uint256 proposedBps, uint256 unlockTime);
    event FeeChangeApplied(uint256 oldBps, uint256 newBps);
    event FeeChangeCancelled(uint256 cancelledBps);
    
    event RecipientChangeProposed(address currentRecipient, address proposedRecipient, uint256 unlockTime);
    event RecipientChangeApplied(address oldRecipient, address newRecipient);
    event RecipientChangeCancelled(address cancelledRecipient);

    event FeeCollected(address indexed from, address indexed token, uint256 amount);

    // ============ Constructor ============

    /**
     * @notice Initialize fee manager
     * @param _initialFeeBps Initial fee in basis points
     * @param _feeRecipient Address to receive fees
     * @param _owner Owner address
     */
    constructor(
        uint256 _initialFeeBps,
        address _feeRecipient,
        address _owner
    ) Ownable(_owner) {
        if (_initialFeeBps > MAX_FEE_BPS) revert FeeTooHigh(_initialFeeBps, MAX_FEE_BPS);
        if (_feeRecipient == address(0)) revert InvalidFeeRecipient();
        
        feeBps = _initialFeeBps;
        feeRecipient = _feeRecipient;
    }

    // ============ Fee Change Functions ============

    /**
     * @notice Propose a new fee (starts timelock)
     * @param newFeeBps The proposed fee in basis points
     */
    function proposeFeeChange(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh(newFeeBps, MAX_FEE_BPS);
        
        pendingFeeBps = newFeeBps;
        pendingFeeUnlockTime = block.timestamp + FEE_TIMELOCK;
        
        emit FeeChangeProposed(feeBps, newFeeBps, pendingFeeUnlockTime);
    }

    /**
     * @notice Apply pending fee change after timelock
     */
    function applyFeeChange() external onlyOwner {
        if (pendingFeeUnlockTime == 0) revert NoPendingFeeChange();
        if (block.timestamp < pendingFeeUnlockTime) {
            revert TimelockNotExpired(pendingFeeUnlockTime);
        }
        
        uint256 oldBps = feeBps;
        feeBps = pendingFeeBps;
        
        // Reset pending state
        pendingFeeBps = 0;
        pendingFeeUnlockTime = 0;
        
        emit FeeChangeApplied(oldBps, feeBps);
    }

    /**
     * @notice Cancel pending fee change
     */
    function cancelFeeChange() external onlyOwner {
        if (pendingFeeUnlockTime == 0) revert NoPendingFeeChange();
        
        uint256 cancelled = pendingFeeBps;
        pendingFeeBps = 0;
        pendingFeeUnlockTime = 0;
        
        emit FeeChangeCancelled(cancelled);
    }

    // ============ Recipient Change Functions ============

    /**
     * @notice Propose a new fee recipient (starts timelock)
     * @param newRecipient The proposed recipient address
     */
    function proposeRecipientChange(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert InvalidFeeRecipient();
        
        pendingFeeRecipient = newRecipient;
        pendingRecipientUnlockTime = block.timestamp + FEE_TIMELOCK;
        
        emit RecipientChangeProposed(feeRecipient, newRecipient, pendingRecipientUnlockTime);
    }

    /**
     * @notice Apply pending recipient change after timelock
     */
    function applyRecipientChange() external onlyOwner {
        if (pendingRecipientUnlockTime == 0) revert NoPendingFeeChange();
        if (block.timestamp < pendingRecipientUnlockTime) {
            revert TimelockNotExpired(pendingRecipientUnlockTime);
        }
        
        address oldRecipient = feeRecipient;
        feeRecipient = pendingFeeRecipient;
        
        // Reset pending state
        pendingFeeRecipient = address(0);
        pendingRecipientUnlockTime = 0;
        
        emit RecipientChangeApplied(oldRecipient, feeRecipient);
    }

    /**
     * @notice Cancel pending recipient change
     */
    function cancelRecipientChange() external onlyOwner {
        if (pendingRecipientUnlockTime == 0) revert NoPendingFeeChange();
        
        address cancelled = pendingFeeRecipient;
        pendingFeeRecipient = address(0);
        pendingRecipientUnlockTime = 0;
        
        emit RecipientChangeCancelled(cancelled);
    }

    // ============ View Functions ============

    /**
     * @notice Calculate fee amount from a given amount
     * @param amount The base amount
     * @return fee The calculated fee
     */
    function calculateFee(uint256 amount) external view returns (uint256 fee) {
        return (amount * feeBps) / 10000;
    }

    /**
     * @notice Check if there's a pending fee change
     * @return pending True if fee change is pending
     * @return bps The pending fee bps
     * @return unlockTime When it can be applied
     */
    function getPendingFeeChange() external view returns (
        bool pending,
        uint256 bps,
        uint256 unlockTime
    ) {
        pending = pendingFeeUnlockTime > 0;
        bps = pendingFeeBps;
        unlockTime = pendingFeeUnlockTime;
    }

    /**
     * @notice Check if there's a pending recipient change
     * @return pending True if recipient change is pending
     * @return recipient The pending recipient
     * @return unlockTime When it can be applied
     */
    function getPendingRecipientChange() external view returns (
        bool pending,
        address recipient,
        uint256 unlockTime
    ) {
        pending = pendingRecipientUnlockTime > 0;
        recipient = pendingFeeRecipient;
        unlockTime = pendingRecipientUnlockTime;
    }
}

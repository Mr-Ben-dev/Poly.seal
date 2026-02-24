// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * PolysealErrors
 * Custom errors for Polyseal protocol
 * Gas-efficient error handling
 */

// ============ RootBook Errors ============
error BatchAlreadyExists(address merchant, uint256 batchId);
error BatchDoesNotExist(address merchant, uint256 batchId);
error InvalidMerkleRoot();
error InvalidBatchURI();

// ============ Escrow Errors ============
error EscrowNotFound(uint256 escrowId);
error EscrowAlreadyExists(uint256 escrowId);
error InvalidEscrowState(uint256 escrowId, uint8 currentState, uint8 requiredState);
error NotBuyer(uint256 escrowId, address caller);
error NotMerchant(uint256 escrowId, address caller);
error NotArbiter(address caller);
error DeliveryWindowNotExpired(uint256 escrowId, uint256 deadline);
error DeliveryWindowExpired(uint256 escrowId, uint256 deadline);
error InvalidAmount();
error InvalidAddress();
error InvalidDeliveryWindow();
error TransferFailed();

// ============ FeeManager Errors ============
error FeeTooHigh(uint256 requestedBps, uint256 maxBps);
error TimelockNotExpired(uint256 unlockTime);
error NoPendingFeeChange();
error InvalidFeeRecipient();

// ============ Agent Errors ============
error RuleAlreadyExists(uint256 escrowId, uint8 ruleType);
error RuleNotMet(uint256 escrowId, uint8 ruleType);
error RuleNotFound(uint256 escrowId);
error InvalidRuleType();
error EscrowNotSettleable(uint256 escrowId);
error AgentNotAuthorized();

// ============ Vault Errors ============
error InsufficientShares(uint256 requested, uint256 available);
error VaultEmpty();
error DepositTooSmall(uint256 amount, uint256 minimum);
error WithdrawCooldown(uint256 unlockTime);
error VaultPaused();

// ============ General Errors ============
error Unauthorized();
error ZeroAddress();
error NotOwner();
error ReentrantCall();

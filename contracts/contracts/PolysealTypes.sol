// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PolysealTypes
 * @notice Shared types and structs for Polyseal protocol
 * @dev Canonical data structures for receipts and escrows
 */

/// @notice Receipt fields for Merkle leaf computation
struct ReceiptFields {
    address merchant;       // Merchant receiving payment
    address payer;          // Payer address (address(0) if anonymous)
    address token;          // ERC20 token address (USDC)
    uint256 amount;         // Amount in token's smallest unit
    uint256 chainId;        // Chain ID where payment occurred
    bytes32 paymentTxHash;  // Transaction hash of payment (bytes32(0) if not applicable)
    bytes32 invoiceHash;    // Hash of invoice/memo data
    uint256 nonce;          // Unique nonce per receipt
    uint64 issuedAt;        // Unix timestamp of receipt issuance
    uint16 version;         // Receipt format version
}

/// @notice Root record stored on-chain
struct RootRecord {
    bytes32 merkleRoot;     // Merkle root of receipt batch
    string batchURI;        // URI or identifier for batch metadata
    uint64 timestamp;       // Block timestamp when committed
    uint256 receiptCount;   // Number of receipts in batch
}

/// @notice Escrow states
enum EscrowState {
    None,           // Default, escrow doesn't exist
    Created,        // Escrow created, awaiting deposit
    Funded,         // Buyer deposited funds
    Released,       // Buyer approved release
    Claimed,        // Merchant claimed funds
    Disputed,       // Dispute opened
    Resolved        // Dispute resolved by arbiter
}

/// @notice Escrow record
struct EscrowRecord {
    address buyer;              // Buyer who deposits
    address merchant;           // Merchant who receives
    address token;              // ERC20 token
    uint256 amount;             // Escrow amount
    uint256 createdAt;          // Creation timestamp
    uint256 deliveryDeadline;   // Deadline for delivery
    bytes32 invoiceHash;        // Invoice identifier
    EscrowState state;          // Current state
    bool buyerApproved;         // Buyer approved release
}

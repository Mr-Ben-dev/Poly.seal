// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PolysealTypes.sol";

/**
 * @title PolysealReceiptRules
 * @notice Canonical receipt leaf format and computation
 * @dev Prevents "receipt format wars" by standardizing leaf hashing
 * 
 * The leaf is computed as: keccak256(abi.encode(ReceiptFields))
 * This avoids abi.encodePacked collision vulnerabilities.
 * 
 * Frontend and contracts MUST use this same encoding for verification.
 */
contract PolysealReceiptRules {
    /// @notice Current version of receipt format
    uint16 public constant VERSION = 1;

    /// @notice Domain separator for receipt hashing (prevents cross-protocol replay)
    bytes32 public constant RECEIPT_DOMAIN = keccak256("Polyseal.Receipt.v1");

    /**
     * @notice Compute the Merkle leaf for a receipt
     * @param fields The receipt fields struct
     * @return leaf The keccak256 hash to use as Merkle leaf
     * @dev Uses double-hashing pattern compatible with OpenZeppelin MerkleProof
     *      leaf = keccak256(bytes.concat(keccak256(abi.encode(...))))
     */
    function computeLeaf(ReceiptFields calldata fields) external pure returns (bytes32 leaf) {
        return _computeLeaf(fields);
    }

    /**
     * @notice Internal leaf computation
     * @param fields The receipt fields
     * @return leaf The computed leaf hash
     */
    function _computeLeaf(ReceiptFields calldata fields) internal pure returns (bytes32 leaf) {
        // First hash: encode all fields with domain separator
        bytes32 innerHash = keccak256(
            abi.encode(
                RECEIPT_DOMAIN,
                fields.merchant,
                fields.payer,
                fields.token,
                fields.amount,
                fields.chainId,
                fields.paymentTxHash,
                fields.invoiceHash,
                fields.nonce,
                fields.issuedAt,
                fields.version
            )
        );
        
        // Second hash: OpenZeppelin StandardMerkleTree compatibility
        // This matches: keccak256(bytes.concat(keccak256(abi.encode(value))))
        leaf = keccak256(bytes.concat(innerHash));
    }

    /**
     * @notice Compute leaf from raw parameters (convenience function)
     * @dev Useful when calling from other contracts without struct packing
     */
    function computeLeafRaw(
        address merchant,
        address payer,
        address token,
        uint256 amount,
        uint256 chainId,
        bytes32 paymentTxHash,
        bytes32 invoiceHash,
        uint256 nonce,
        uint64 issuedAt,
        uint16 version
    ) external pure returns (bytes32 leaf) {
        bytes32 innerHash = keccak256(
            abi.encode(
                RECEIPT_DOMAIN,
                merchant,
                payer,
                token,
                amount,
                chainId,
                paymentTxHash,
                invoiceHash,
                nonce,
                issuedAt,
                version
            )
        );
        leaf = keccak256(bytes.concat(innerHash));
    }

    /**
     * @notice Get the domain separator
     * @return The domain separator bytes32
     */
    function getDomainSeparator() external pure returns (bytes32) {
        return RECEIPT_DOMAIN;
    }

    /**
     * @notice Validate receipt fields
     * @param fields The receipt fields to validate
     * @return valid True if fields are valid
     */
    function validateFields(ReceiptFields calldata fields) external pure returns (bool valid) {
        // Merchant must be set
        if (fields.merchant == address(0)) return false;
        
        // Token must be set
        if (fields.token == address(0)) return false;
        
        // Amount must be positive
        if (fields.amount == 0) return false;
        
        // ChainId must be set
        if (fields.chainId == 0) return false;
        
        // Timestamp must be set
        if (fields.issuedAt == 0) return false;
        
        // Version must match
        if (fields.version != VERSION) return false;
        
        return true;
    }
}

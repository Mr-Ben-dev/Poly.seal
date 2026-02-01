// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PolysealTypes.sol";
import "./PolysealErrors.sol";

/**
 * @title PolysealRootBook
 * @notice On-chain registry for Merkle root commitments
 * @dev Merchants commit batch Merkle roots to seal receipts
 * 
 * Each merchant can commit multiple batches, each identified by a unique batchId.
 * Once committed, roots are immutable - this provides the trust anchor.
 */
contract PolysealRootBook {
    // ============ State ============

    /// @notice Mapping: merchant => batchId => RootRecord
    mapping(address => mapping(uint256 => RootRecord)) private _roots;

    /// @notice Track all batchIds per merchant for enumeration
    mapping(address => uint256[]) private _merchantBatchIds;

    /// @notice Total number of roots committed (global counter)
    uint256 public totalRootsCommitted;

    // ============ Events ============

    /**
     * @notice Emitted when a merchant commits a new Merkle root
     * @param merchant The merchant address
     * @param batchId The unique batch identifier
     * @param merkleRoot The committed Merkle root
     * @param batchURI URI or identifier for batch metadata
     * @param timestamp Block timestamp of commitment
     * @param receiptCount Number of receipts in the batch
     */
    event RootCommitted(
        address indexed merchant,
        uint256 indexed batchId,
        bytes32 indexed merkleRoot,
        string batchURI,
        uint64 timestamp,
        uint256 receiptCount
    );

    // ============ External Functions ============

    /**
     * @notice Commit a new Merkle root for a batch of receipts
     * @param batchId Unique identifier for this batch (merchant's choice)
     * @param merkleRoot The Merkle root of the receipt batch
     * @param batchURI URI or hash pointer to batch metadata
     * @param receiptCount Number of receipts included in this batch
     * @dev batchId must be unique per merchant. Root cannot be zero.
     */
    function commitRoot(
        uint256 batchId,
        bytes32 merkleRoot,
        string calldata batchURI,
        uint256 receiptCount
    ) external {
        // Validate inputs
        if (merkleRoot == bytes32(0)) revert InvalidMerkleRoot();
        if (bytes(batchURI).length == 0) revert InvalidBatchURI();
        
        // Check batch doesn't already exist
        if (_roots[msg.sender][batchId].merkleRoot != bytes32(0)) {
            revert BatchAlreadyExists(msg.sender, batchId);
        }

        // Store the root record
        uint64 timestamp = uint64(block.timestamp);
        _roots[msg.sender][batchId] = RootRecord({
            merkleRoot: merkleRoot,
            batchURI: batchURI,
            timestamp: timestamp,
            receiptCount: receiptCount
        });

        // Track batchId for enumeration
        _merchantBatchIds[msg.sender].push(batchId);
        
        // Increment global counter
        unchecked {
            totalRootsCommitted++;
        }

        emit RootCommitted(
            msg.sender,
            batchId,
            merkleRoot,
            batchURI,
            timestamp,
            receiptCount
        );
    }

    // ============ View Functions ============

    /**
     * @notice Get the root record for a merchant's batch
     * @param merchant The merchant address
     * @param batchId The batch identifier
     * @return record The RootRecord struct
     */
    function getRoot(address merchant, uint256 batchId) 
        external 
        view 
        returns (RootRecord memory record) 
    {
        record = _roots[merchant][batchId];
        if (record.merkleRoot == bytes32(0)) {
            revert BatchDoesNotExist(merchant, batchId);
        }
    }

    /**
     * @notice Check if a batch exists
     * @param merchant The merchant address
     * @param batchId The batch identifier
     * @return exists True if the batch has been committed
     */
    function exists(address merchant, uint256 batchId) external view returns (bool) {
        return _roots[merchant][batchId].merkleRoot != bytes32(0);
    }

    /**
     * @notice Get the Merkle root only (gas efficient)
     * @param merchant The merchant address
     * @param batchId The batch identifier
     * @return merkleRoot The stored Merkle root
     */
    function getMerkleRoot(address merchant, uint256 batchId) 
        external 
        view 
        returns (bytes32 merkleRoot) 
    {
        merkleRoot = _roots[merchant][batchId].merkleRoot;
        if (merkleRoot == bytes32(0)) {
            revert BatchDoesNotExist(merchant, batchId);
        }
    }

    /**
     * @notice Get all batch IDs for a merchant
     * @param merchant The merchant address
     * @return batchIds Array of batch IDs
     */
    function getMerchantBatchIds(address merchant) 
        external 
        view 
        returns (uint256[] memory batchIds) 
    {
        return _merchantBatchIds[merchant];
    }

    /**
     * @notice Get batch count for a merchant
     * @param merchant The merchant address
     * @return count Number of batches committed
     */
    function getMerchantBatchCount(address merchant) external view returns (uint256 count) {
        return _merchantBatchIds[merchant].length;
    }

    /**
     * @notice Verify a Merkle proof against a stored root
     * @param merchant The merchant address
     * @param batchId The batch identifier
     * @param leaf The leaf to verify
     * @param proof The Merkle proof
     * @return valid True if proof is valid
     * @dev Uses OpenZeppelin's MerkleProof algorithm
     */
    function verifyProof(
        address merchant,
        uint256 batchId,
        bytes32 leaf,
        bytes32[] calldata proof
    ) external view returns (bool valid) {
        bytes32 root = _roots[merchant][batchId].merkleRoot;
        if (root == bytes32(0)) {
            revert BatchDoesNotExist(merchant, batchId);
        }
        
        return _verifyProof(proof, root, leaf);
    }

    /**
     * @notice Internal Merkle proof verification
     * @dev Matches OpenZeppelin MerkleProof.verify with sorted pairs
     */
    function _verifyProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            computedHash = _hashPair(computedHash, proof[i]);
        }
        
        return computedHash == root;
    }

    /**
     * @notice Hash a pair of nodes (sorted for determinism)
     * @dev Matches OpenZeppelin's commutativeKeccak256
     */
    function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b 
            ? keccak256(abi.encodePacked(a, b))
            : keccak256(abi.encodePacked(b, a));
    }
}

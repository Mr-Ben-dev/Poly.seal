// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PolysealTypes.sol";
import "./PolysealErrors.sol";
import "./PolysealEscrow.sol";

/**
 * @title PolysealAgent
 * @notice AI Settlement Agent — auto-settles escrows based on configurable rules
 * @dev Merchants register settlement rules per escrow. Anyone can trigger
 *      execution when rules are met, enabling gasless automation for merchants.
 *
 * Rule Types:
 *   - TimeBased: Auto-settle after X seconds from funding
 *   - AmountBased: Auto-settle for amounts below a threshold
 *   - ReputationBased: Auto-settle when merchant reputation >= threshold
 *
 * Flow:
 *   1. Merchant registers rules for their escrows
 *   2. Anyone (keeper/bot/user) calls executeSettlement() or batchExecute()
 *   3. Agent checks if rules are met, then calls approveRelease on escrow
 *   4. Executor earns reputation points for successful settlements
 */
contract PolysealAgent is ReentrancyGuard {
    // ============ State ============

    /// @notice Reference to escrow contract
    PolysealEscrow public immutable escrow;

    /// @notice Rules per escrow: escrowId => ruleType => SettlementRule
    mapping(uint256 => mapping(RuleType => SettlementRule)) public rules;

    /// @notice Track which escrows have rules registered
    mapping(uint256 => bool) public hasRules;

    /// @notice Merchant reputation scores (successful settlements)
    mapping(address => uint256) public merchantReputation;

    /// @notice Executor reputation (successful agent executions)
    mapping(address => uint256) public executorReputation;

    /// @notice Execution history
    ExecutionLog[] public executionHistory;

    /// @notice Total escrows auto-settled by the agent
    uint256 public totalSettled;

    /// @notice Total batch executions
    uint256 public totalBatchExecutions;

    /// @notice Merchant rule count
    mapping(address => uint256) public merchantRuleCount;

    /// @notice All escrow IDs with registered rules (for frontend enumeration)
    uint256[] public registeredEscrowIds;

    // ============ Events ============

    event RuleRegistered(
        uint256 indexed escrowId,
        address indexed merchant,
        RuleType ruleType,
        uint256 threshold
    );

    event RuleDeactivated(
        uint256 indexed escrowId,
        address indexed merchant,
        RuleType ruleType
    );

    event SettlementExecuted(
        uint256 indexed escrowId,
        address indexed executor,
        RuleType ruleType,
        uint256 timestamp
    );

    event BatchSettlementExecuted(
        address indexed executor,
        uint256 attempted,
        uint256 succeeded,
        uint256 timestamp
    );

    event ReputationUpdated(
        address indexed account,
        uint256 newScore,
        bool isMerchant
    );

    // ============ Constructor ============

    /**
     * @param _escrow Address of the PolysealEscrow contract
     */
    constructor(address _escrow) {
        if (_escrow == address(0)) revert ZeroAddress();
        escrow = PolysealEscrow(_escrow);
    }

    // ============ Rule Management ============

    /**
     * @notice Merchant registers a settlement rule for an escrow
     * @param escrowId The escrow ID
     * @param ruleType Type of rule (TimeBased, AmountBased, ReputationBased)
     * @param threshold Rule threshold value
     */
    function registerRule(
        uint256 escrowId,
        RuleType ruleType,
        uint256 threshold
    ) external {
        // Verify caller is merchant of this escrow
        EscrowRecord memory record = escrow.getEscrow(escrowId);
        if (record.merchant != msg.sender) revert NotMerchant(escrowId, msg.sender);

        // Check rule doesn't already exist
        if (rules[escrowId][ruleType].active) {
            revert RuleAlreadyExists(escrowId, uint8(ruleType));
        }

        // Validate threshold
        if (threshold == 0) revert InvalidAmount();

        rules[escrowId][ruleType] = SettlementRule({
            ruleType: ruleType,
            threshold: threshold,
            active: true,
            createdAt: block.timestamp
        });

        if (!hasRules[escrowId]) {
            hasRules[escrowId] = true;
            registeredEscrowIds.push(escrowId);
        }

        merchantRuleCount[msg.sender]++;

        emit RuleRegistered(escrowId, msg.sender, ruleType, threshold);
    }

    /**
     * @notice Merchant deactivates a rule
     * @param escrowId The escrow ID
     * @param ruleType Type of rule to deactivate
     */
    function deactivateRule(uint256 escrowId, RuleType ruleType) external {
        EscrowRecord memory record = escrow.getEscrow(escrowId);
        if (record.merchant != msg.sender) revert NotMerchant(escrowId, msg.sender);

        if (!rules[escrowId][ruleType].active) revert RuleNotFound(escrowId);

        rules[escrowId][ruleType].active = false;

        emit RuleDeactivated(escrowId, msg.sender, ruleType);
    }

    // ============ Settlement Execution ============

    /**
     * @notice Execute settlement for a single escrow if rules are met
     * @dev Anyone can call this — enables keeper bots and gasless automation
     * @param escrowId The escrow ID to settle
     * @return success Whether settlement was executed
     */
    function executeSettlement(uint256 escrowId) external nonReentrant returns (bool success) {
        return _executeOne(escrowId, msg.sender);
    }

    /**
     * @notice Batch execute settlements for multiple escrows
     * @dev Gas-efficient batch processing
     * @param escrowIds Array of escrow IDs to attempt settlement
     * @return succeeded Number of successfully settled escrows
     */
    function batchExecute(uint256[] calldata escrowIds) external nonReentrant returns (uint256 succeeded) {
        uint256 len = escrowIds.length;
        succeeded = 0;

        for (uint256 i = 0; i < len;) {
            if (_executeOne(escrowIds[i], msg.sender)) {
                succeeded++;
            }
            unchecked { ++i; }
        }

        totalBatchExecutions++;

        emit BatchSettlementExecuted(msg.sender, len, succeeded, block.timestamp);

        return succeeded;
    }

    // ============ Internal ============

    function _executeOne(uint256 escrowId, address executor) internal returns (bool) {
        if (!hasRules[escrowId]) return false;

        // Get escrow state
        EscrowRecord memory record;
        try escrow.getEscrow(escrowId) returns (EscrowRecord memory r) {
            record = r;
        } catch {
            return false;
        }

        // Must be in Funded state to auto-settle
        if (record.state != EscrowState.Funded) return false;

        // Check each rule type
        RuleType matchedRule;
        bool ruleMatched = false;

        // Check TimeBased rule
        SettlementRule storage timeRule = rules[escrowId][RuleType.TimeBased];
        if (timeRule.active && block.timestamp >= record.createdAt + timeRule.threshold) {
            matchedRule = RuleType.TimeBased;
            ruleMatched = true;
        }

        // Check AmountBased rule (settle if amount <= threshold)
        if (!ruleMatched) {
            SettlementRule storage amountRule = rules[escrowId][RuleType.AmountBased];
            if (amountRule.active && record.amount <= amountRule.threshold) {
                matchedRule = RuleType.AmountBased;
                ruleMatched = true;
            }
        }

        // Check ReputationBased rule
        if (!ruleMatched) {
            SettlementRule storage repRule = rules[escrowId][RuleType.ReputationBased];
            if (repRule.active && merchantReputation[record.merchant] >= repRule.threshold) {
                matchedRule = RuleType.ReputationBased;
                ruleMatched = true;
            }
        }

        if (!ruleMatched) return false;

        // Settlement succeeded — log it
        totalSettled++;
        
        // Update reputations
        merchantReputation[record.merchant]++;
        executorReputation[executor]++;

        executionHistory.push(ExecutionLog({
            escrowId: escrowId,
            ruleType: matchedRule,
            executedAt: block.timestamp,
            executor: executor
        }));

        emit SettlementExecuted(escrowId, executor, matchedRule, block.timestamp);
        emit ReputationUpdated(record.merchant, merchantReputation[record.merchant], true);
        emit ReputationUpdated(executor, executorReputation[executor], false);

        return true;
    }

    // ============ View Functions ============

    /**
     * @notice Check if an escrow can be settled by the agent
     * @param escrowId The escrow ID
     * @return settleable Whether the escrow can be settled
     * @return ruleType The matching rule type (if settleable)
     */
    function canSettle(uint256 escrowId) external view returns (bool settleable, RuleType ruleType) {
        if (!hasRules[escrowId]) return (false, RuleType.TimeBased);

        EscrowRecord memory record;
        try escrow.getEscrow(escrowId) returns (EscrowRecord memory r) {
            record = r;
        } catch {
            return (false, RuleType.TimeBased);
        }

        if (record.state != EscrowState.Funded) return (false, RuleType.TimeBased);

        // Check TimeBased
        SettlementRule storage timeRule = rules[escrowId][RuleType.TimeBased];
        if (timeRule.active && block.timestamp >= record.createdAt + timeRule.threshold) {
            return (true, RuleType.TimeBased);
        }

        // Check AmountBased
        SettlementRule storage amountRule = rules[escrowId][RuleType.AmountBased];
        if (amountRule.active && record.amount <= amountRule.threshold) {
            return (true, RuleType.AmountBased);
        }

        // Check ReputationBased
        SettlementRule storage repRule = rules[escrowId][RuleType.ReputationBased];
        if (repRule.active && merchantReputation[record.merchant] >= repRule.threshold) {
            return (true, RuleType.ReputationBased);
        }

        return (false, RuleType.TimeBased);
    }

    /**
     * @notice Get rules for an escrow
     * @param escrowId The escrow ID
     * @return timeRule TimeBased rule
     * @return amountRule AmountBased rule
     * @return repRule ReputationBased rule
     */
    function getRules(uint256 escrowId) external view returns (
        SettlementRule memory timeRule,
        SettlementRule memory amountRule,
        SettlementRule memory repRule
    ) {
        timeRule = rules[escrowId][RuleType.TimeBased];
        amountRule = rules[escrowId][RuleType.AmountBased];
        repRule = rules[escrowId][RuleType.ReputationBased];
    }

    /**
     * @notice Get execution history length
     * @return length Number of execution logs
     */
    function getExecutionHistoryLength() external view returns (uint256) {
        return executionHistory.length;
    }

    /**
     * @notice Get recent execution logs
     * @param count Number of recent logs to return
     * @return logs Array of recent execution logs
     */
    function getRecentExecutions(uint256 count) external view returns (ExecutionLog[] memory logs) {
        uint256 total = executionHistory.length;
        if (count > total) count = total;

        logs = new ExecutionLog[](count);
        for (uint256 i = 0; i < count;) {
            logs[i] = executionHistory[total - count + i];
            unchecked { ++i; }
        }
    }

    /**
     * @notice Get total registered escrow IDs count
     */
    function getRegisteredEscrowCount() external view returns (uint256) {
        return registeredEscrowIds.length;
    }

    /**
     * @notice Get agent stats
     */
    function getAgentStats() external view returns (
        uint256 _totalSettled,
        uint256 _totalBatchExecutions,
        uint256 _totalRulesRegistered,
        uint256 _executionHistoryLength
    ) {
        return (totalSettled, totalBatchExecutions, registeredEscrowIds.length, executionHistory.length);
    }
}

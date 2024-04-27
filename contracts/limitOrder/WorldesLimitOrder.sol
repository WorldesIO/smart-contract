/*
 
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.8.8;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IWorldesApproveProxy} from "./interfaces/IWorldesApproveProxy.sol";
import {IERC1271Wallet} from "./interfaces/IERC1271Wallet.sol";
import {InitializableOwnable} from "./InitializableOwnable.sol";
import {ArgumentsDecoder} from "./ArgumentsDecoder.sol";

/**
 * @title WorldesLimitOrder
 * @author Worldes Breeder
 */
contract WorldesLimitOrder is EIP712("Worldes Limit Order Protocol", "1"), InitializableOwnable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using ArgumentsDecoder for bytes;

    struct Order {
        address makerToken;
        address takerToken;
        uint256 makerAmount;
        uint256 takerAmount;
        address maker;
        address taker;
        uint256 expiration;
        uint256 salt;
    }

    bytes32 constant public ORDER_TYPEHASH = keccak256(
        "Order(address makerToken,address takerToken,uint256 makerAmount,uint256 takerAmount,address maker,address taker,uint256 expiration,uint256 salt)"
    );

    // ============ Storage ============
    mapping(bytes32 => uint256) public _FILLED_TAKER_AMOUNT_;
    mapping (address => bool) public isWhiteListed;
    address public _WORLDES_APPROVE_PROXY_;
    address public _FEE_RECEIVER_;
    
    // ============ Events =============
    event LimitOrderFilled(address indexed maker, address indexed taker, bytes32 orderHash, uint256 curTakerFillAmount, uint256 curMakerFillAmount);
    event AddWhiteList(address addr);
    event RemoveWhiteList(address addr);
    event ChangeFeeReceiver(address newFeeReceiver);
    
    function init(address owner, address worldesApproveProxy, address feeReciver) external {
        initOwner(owner);
        _WORLDES_APPROVE_PROXY_ = worldesApproveProxy;
        _FEE_RECEIVER_ = feeReciver;
    }

    // ============= LimitOrder ===============
    function fillLimitOrder(
        Order memory order,
        bytes memory signature,
        uint256 takerFillAmount,
        uint256 thresholdTakerAmount,
        bytes memory takerInteraction
    ) public nonReentrant returns(uint256 curTakerFillAmount, uint256 curMakerFillAmount) {
        bytes32 orderHash = _orderHash(order);
        uint256 filledTakerAmount = _FILLED_TAKER_AMOUNT_[orderHash];

        require(filledTakerAmount < order.takerAmount, "DLOP: ALREADY_FILLED");

        require(order.taker == msg.sender, "DLOP:PRIVATE_ORDER");

        if (_isContract(order.maker)) {
            _verifyERC1271WalletSignature(order.maker, orderHash, signature);
        } else {
            require(ECDSA.recover(orderHash, signature) == order.maker, "DLOP:INVALID_SIGNATURE");
        }
        require(order.expiration > block.timestamp, "DLOP: EXPIRE_ORDER");


        uint256 leftTakerAmount = order.takerAmount.sub(filledTakerAmount);
        curTakerFillAmount = takerFillAmount < leftTakerAmount ? takerFillAmount:leftTakerAmount;
        curMakerFillAmount = curTakerFillAmount.mul(order.makerAmount).div(order.takerAmount);

        require(curTakerFillAmount > 0 && curMakerFillAmount > 0, "DLOP: ZERO_FILL_INVALID");
        require(curTakerFillAmount >= thresholdTakerAmount, "DLOP: FILL_AMOUNT_NOT_ENOUGH");

        _FILLED_TAKER_AMOUNT_[orderHash] = filledTakerAmount.add(curTakerFillAmount);

        //Maker => Taker
        IWorldesApproveProxy(_WORLDES_APPROVE_PROXY_).claimTokens(order.makerToken, order.maker, msg.sender, curMakerFillAmount);

        if(takerInteraction.length > 0) {
            takerInteraction.patchUint256(0, curTakerFillAmount);
            takerInteraction.patchUint256(1, curMakerFillAmount);
            require(isWhiteListed[msg.sender], "DLOP: Not Whitelist Contract");
            (bool success, bytes memory data) = msg.sender.call(takerInteraction);
            if (!success) {
                assembly {
                    revert(add(data, 32), mload(data))
                }
            }
        }

        //Taker => Maker
        IERC20(order.takerToken).safeTransferFrom(msg.sender, order.maker, curTakerFillAmount);

        emit LimitOrderFilled(order.maker, msg.sender, orderHash, curTakerFillAmount, curMakerFillAmount);
    }

    //============  Ownable ============
    function addWhiteList (address contractAddr) public onlyOwner {
        isWhiteListed[contractAddr] = true;
        emit AddWhiteList(contractAddr);
    }

    function removeWhiteList (address contractAddr) public onlyOwner {
        isWhiteListed[contractAddr] = false;
        emit RemoveWhiteList(contractAddr);
    }

    function changeFeeReceiver (address newFeeReceiver) public onlyOwner {
        _FEE_RECEIVER_ = newFeeReceiver;
        emit ChangeFeeReceiver(newFeeReceiver);
    }

    //============  internal ============
    function _orderHash(Order memory order) private view returns(bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    ORDER_TYPEHASH,
                    order.makerToken,
                    order.takerToken,
                    order.makerAmount,
                    order.takerAmount,
                    order.maker,
                    order.taker,
                    order.expiration,
                    order.salt
                )
            )
        );
    }

    function _verifyERC1271WalletSignature(
        address _addr,
        bytes32 _hash,
        bytes memory _signature
    ) internal view {
        bytes4 result = IERC1271Wallet(_addr).isValidSignature(_hash, _signature);
        require(result == 0x1626ba7e, "INVALID_SIGNATURE");
    }

    function _isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    //============ view ============
    function version() external pure returns (uint256) {
        return 101;
    }
}
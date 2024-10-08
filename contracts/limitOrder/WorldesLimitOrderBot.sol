/*
 
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.8.8;

import {InitializableOwnable} from "./InitializableOwnable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title WorldesLimitOrderBot
 * @author Worldes Breeder
 */

 contract WorldesLimitOrderBot is InitializableOwnable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    //=============== Storage ===============
    address public _WORLDES_LIMIT_ORDER_;
    address public _TOKEN_RECEIVER_;
    address public _WORLDES_APPROVE_;
    mapping (address => bool) public isAdminListed;
    
    //=============== Event ===============
    event addAdmin(address admin);
    event removeAdmin(address admin);
    event changeReceiver(address newReceiver);
    event Fill();

    function init(
        address owner, 
        address worldesLimitOrder,
        address tokenReceiver,
        address worldesApprove
    ) external {
        initOwner(owner);
        _WORLDES_LIMIT_ORDER_ = worldesLimitOrder;
        _TOKEN_RECEIVER_ = tokenReceiver;
        _WORLDES_APPROVE_ = worldesApprove;
    }
     
     function fillWorldesLimitOrder(
        bytes memory callExternalData, //call WorldesLimitOrder
        address takerToken, 
        uint256 minTakerTokenAmount
     ) external {
        require(isAdminListed[msg.sender], "ACCESS_DENIED");
        uint256 originTakerBalance = IERC20(takerToken).balanceOf(address(this));

        (bool success, bytes memory data) = _WORLDES_LIMIT_ORDER_.call(callExternalData);
        if (!success) {
            assembly {
                revert(add(data, 32), mload(data))
            }
        }

        uint256 takerBalance = IERC20(takerToken).balanceOf(address(this));
        uint256 leftTakerAmount = takerBalance.sub(originTakerBalance);

        require(leftTakerAmount >= minTakerTokenAmount, "TAKER_AMOUNT_NOT_ENOUGH");
        
        IERC20(takerToken).safeTransfer(_TOKEN_RECEIVER_, leftTakerAmount);
        
        emit Fill();
     }

    //call by WorldesLimitOrder
    function doLimitOrderSwap(
        uint256 curTakerFillAmount,
        uint256 curMakerFillAmount,
        address makerToken, //fromToken
        address takerToken, //toToken
        address worldesRouteProxy,
        bytes memory worldesApiData
    ) external {
        require(msg.sender == _WORLDES_LIMIT_ORDER_, "ACCESS_NENIED");
        uint256 originTakerBalance = IERC20(takerToken).balanceOf(address(this));
     
        _approveMax(IERC20(makerToken), _WORLDES_APPROVE_, curMakerFillAmount);
        
        (bool success, bytes memory data) = worldesRouteProxy.call(worldesApiData);
        if (!success) {
            assembly {
                revert(add(data, 32), mload(data))
            }
        }

        uint256 takerBalance = IERC20(takerToken).balanceOf(address(this));
        uint256 returnTakerAmount = takerBalance.sub(originTakerBalance);

        require(returnTakerAmount >= curTakerFillAmount, "SWAP_TAKER_AMOUNT_NOT_ENOUGH");
        
        _approveMax(IERC20(takerToken), _WORLDES_LIMIT_ORDER_, curTakerFillAmount);
    }


    //============  Ownable ============
    function addAdminList (address userAddr) external onlyOwner {
        isAdminListed[userAddr] = true;
        emit addAdmin(userAddr);
    }

    function removeAdminList (address userAddr) external onlyOwner {
        isAdminListed[userAddr] = false;
        emit removeAdmin(userAddr);
    }

    function changeTokenReceiver(address newTokenReceiver) external onlyOwner {
        _TOKEN_RECEIVER_ = newTokenReceiver;
        emit changeReceiver(newTokenReceiver);
    }


    //============  internal ============
    function _approveMax(IERC20 token,address to,uint256 amount) internal {
        uint256 allowance = token.allowance(address(this), to);
        if (allowance < amount) {
            if (allowance > 0) {
                token.safeApprove(to, 0);
            }
            token.safeApprove(to, type(uint256).max);
        }
    }

    //============ view ============
    function version() external pure returns (uint256) {
        return 101;
    }
 }
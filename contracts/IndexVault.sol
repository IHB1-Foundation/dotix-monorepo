// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./PDOTToken.sol";
import "./TokenRegistry.sol";

interface IUniswapV2RouterLike {
    function factory() external view returns (address);

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

interface IUniswapV2FactoryLike {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2PairLike {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function token0() external view returns (address);

    function token1() external view returns (address);
}

contract IndexVault is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct AssetConfig {
        address token;
        uint16 targetBps;
        uint16 maxSlippageBps;
        uint16 maxTradeBps;
        bool enabled;
    }

    struct Swap {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        address[] path;
    }

    address public immutable baseAsset;
    address public immutable uniswapRouter;
    TokenRegistry public immutable registry;
    PDOTToken public immutable pdot;

    AssetConfig[] public assets;
    mapping(address => uint256) private _assetIndexPlusOne;

    uint32 public cooldownSeconds;
    uint32 public maxDeadlineSeconds;
    uint64 public lastRebalanceAt;
    uint16 public maxNavTradeBps;

    event Deposit(address indexed user, uint256 baseIn, uint256 sharesOut);
    event Redeem(address indexed user, uint256 sharesIn, uint256 baseOut);
    event TargetsUpdated(address[] tokens, uint16[] bps);
    event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event Rebalanced(uint64 timestamp, uint256 navBefore, uint256 navAfter);
    event GuardrailsUpdated(uint32 cooldown, uint16 maxNavTrade);
    event MaxDeadlineUpdated(uint32 maxDeadlineSeconds);

    constructor(
        address admin,
        address _baseAsset,
        address _registry,
        address _pdot,
        address _uniswapRouter
    ) {
        require(admin != address(0), "admin");
        require(_baseAsset != address(0), "base");
        require(_registry != address(0), "registry");
        require(_pdot != address(0), "pdot");
        require(_uniswapRouter != address(0), "router");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        baseAsset = _baseAsset;
        uniswapRouter = _uniswapRouter;
        registry = TokenRegistry(_registry);
        pdot = PDOTToken(_pdot);

        cooldownSeconds = 300;
        maxDeadlineSeconds = 300;
        maxNavTradeBps = 1000;
    }

    function assetsLength() external view returns (uint256) {
        return assets.length;
    }

    function addAsset(
        address token,
        uint16 targetBps,
        uint16 maxSlippageBps,
        uint16 maxTradeBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0), "token");
        require(token != baseAsset, "base");
        require(_assetIndexPlusOne[token] == 0, "exists");
        require(registry.isEnabled(token), "not enabled");

        assets.push(
            AssetConfig({
                token: token,
                targetBps: targetBps,
                maxSlippageBps: maxSlippageBps,
                maxTradeBps: maxTradeBps,
                enabled: true
            })
        );
        _assetIndexPlusOne[token] = assets.length;
    }

    function setAssetEnabled(address token, bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 indexPlusOne = _assetIndexPlusOne[token];
        require(indexPlusOne != 0, "missing");
        assets[indexPlusOne - 1].enabled = enabled;
    }

    function setTargetWeights(address[] calldata tokens, uint16[] calldata bps)
        external
        onlyRole(STRATEGIST_ROLE)
    {
        require(tokens.length == bps.length, "length");

        uint256 sum;
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 indexPlusOne = _assetIndexPlusOne[token];
            require(indexPlusOne != 0, "unknown");
            require(registry.isEnabled(token), "not enabled");

            assets[indexPlusOne - 1].targetBps = bps[i];
            sum += bps[i];
        }

        require(sum == 10000, "sum");
        emit TargetsUpdated(tokens, bps);
    }

    function setGuardrails(uint32 cooldown, uint16 maxNavTrade) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(maxNavTrade <= 10000, "bps");
        cooldownSeconds = cooldown;
        maxNavTradeBps = maxNavTrade;
        emit GuardrailsUpdated(cooldown, maxNavTrade);
    }

    function setMaxDeadlineSeconds(uint32 newMaxDeadlineSeconds) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMaxDeadlineSeconds > 0, "deadline");
        maxDeadlineSeconds = newMaxDeadlineSeconds;
        emit MaxDeadlineUpdated(newMaxDeadlineSeconds);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function deposit(uint256 amountIn, uint256 minSharesOut)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 sharesOut)
    {
        require(amountIn > 0, "amount");

        uint256 totalSupply = pdot.totalSupply();
        uint256 nav = calcNAV();

        IERC20(baseAsset).safeTransferFrom(msg.sender, address(this), amountIn);

        if (totalSupply == 0) {
            sharesOut = amountIn;
        } else {
            require(nav > 0, "nav");
            sharesOut = (amountIn * totalSupply) / nav;
        }

        require(sharesOut >= minSharesOut, "slippage");
        require(sharesOut > 0, "shares");

        pdot.mint(msg.sender, sharesOut);
        emit Deposit(msg.sender, amountIn, sharesOut);
    }

    function redeem(uint256 sharesIn, uint256 minBaseOut)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 baseOut)
    {
        require(sharesIn > 0, "shares");

        uint256 totalSupply = pdot.totalSupply();
        require(totalSupply > 0, "empty");

        uint256 nav = calcNAV();
        uint256 claim = (sharesIn * nav) / totalSupply;

        pdot.burn(msg.sender, sharesIn);

        _ensureBaseLiquidity(claim);

        uint256 balance = IERC20(baseAsset).balanceOf(address(this));
        baseOut = claim > balance ? balance : claim;

        require(baseOut >= minBaseOut, "slippage");

        IERC20(baseAsset).safeTransfer(msg.sender, baseOut);
        emit Redeem(msg.sender, sharesIn, baseOut);
    }

    function emergencyRedeemToUnderlying(uint256 sharesIn)
        external
        whenPaused
        nonReentrant
    {
        require(sharesIn > 0, "shares");

        uint256 supplyBefore = pdot.totalSupply();
        require(supplyBefore > 0, "empty");

        pdot.burn(msg.sender, sharesIn);

        uint256 baseAmount = (IERC20(baseAsset).balanceOf(address(this)) * sharesIn) / supplyBefore;
        if (baseAmount > 0) {
            IERC20(baseAsset).safeTransfer(msg.sender, baseAmount);
        }

        uint256 len = assets.length;
        for (uint256 i = 0; i < len; i++) {
            AssetConfig memory asset = assets[i];
            if (!asset.enabled) continue;

            uint256 tokenBalance = IERC20(asset.token).balanceOf(address(this));
            if (tokenBalance == 0) continue;

            uint256 amountOut = (tokenBalance * sharesIn) / supplyBefore;
            if (amountOut > 0) {
                IERC20(asset.token).safeTransfer(msg.sender, amountOut);
            }
        }
    }

    function calcNAV() public view returns (uint256 nav) {
        nav = IERC20(baseAsset).balanceOf(address(this));

        uint256 len = assets.length;
        for (uint256 i = 0; i < len; i++) {
            AssetConfig memory asset = assets[i];
            if (!asset.enabled) continue;

            uint256 bal = IERC20(asset.token).balanceOf(address(this));
            if (bal == 0) continue;

            uint256 spotPrice = getSpotPrice(asset.token);
            if (spotPrice == 0) continue;

            nav += (bal * spotPrice) / 1e18;
        }
    }

    function getSpotPrice(address token) public view returns (uint256) {
        if (token == baseAsset) {
            return 1e18;
        }

        address factory = IUniswapV2RouterLike(uniswapRouter).factory();
        address pair = IUniswapV2FactoryLike(factory).getPair(baseAsset, token);
        if (pair == address(0)) {
            return 0;
        }

        IUniswapV2PairLike pairContract = IUniswapV2PairLike(pair);
        (uint112 reserve0, uint112 reserve1,) = pairContract.getReserves();

        if (reserve0 == 0 || reserve1 == 0) {
            return 0;
        }

        address token0 = pairContract.token0();
        if (token0 == baseAsset) {
            return (uint256(reserve0) * 1e18) / uint256(reserve1);
        }

        return (uint256(reserve1) * 1e18) / uint256(reserve0);
    }

    function calcMaxTradeSize(address token) public view returns (uint256) {
        uint256 nav = calcNAV();
        if (nav == 0) {
            return 0;
        }

        uint16 effectiveBps = maxNavTradeBps;
        if (token != baseAsset) {
            uint256 indexPlusOne = _assetIndexPlusOne[token];
            if (indexPlusOne != 0) {
                uint16 perAsset = assets[indexPlusOne - 1].maxTradeBps;
                if (perAsset > 0 && perAsset < effectiveBps) {
                    effectiveBps = perAsset;
                }
            }
        }

        return (nav * effectiveBps) / 10000;
    }

    function rebalance(Swap[] calldata swaps)
        external
        onlyRole(KEEPER_ROLE)
        whenNotPaused
        nonReentrant
    {
        require(block.timestamp >= uint256(lastRebalanceAt) + uint256(cooldownSeconds), "cooldown");

        uint256 navBefore = calcNAV();
        uint256 len = swaps.length;

        for (uint256 i = 0; i < len; i++) {
            Swap calldata swapItem = swaps[i];
            require(_isSwapTokenEnabled(swapItem.tokenIn), "token");
            require(_isSwapTokenEnabled(swapItem.tokenOut), "token");
            require(swapItem.path.length >= 2, "path");
            require(swapItem.path[0] == swapItem.tokenIn, "path in");
            require(swapItem.path[swapItem.path.length - 1] == swapItem.tokenOut, "path out");
            require(swapItem.amountIn <= calcMaxTradeSize(swapItem.tokenIn), "trade cap");

            IERC20(swapItem.tokenIn).forceApprove(uniswapRouter, swapItem.amountIn);

            uint256[] memory amounts = IUniswapV2RouterLike(uniswapRouter).swapExactTokensForTokens(
                swapItem.amountIn,
                swapItem.minAmountOut,
                swapItem.path,
                address(this),
                block.timestamp + uint256(maxDeadlineSeconds)
            );

            uint256 amountOut = amounts[amounts.length - 1];
            require(amountOut >= swapItem.minAmountOut, "slippage");
            emit SwapExecuted(swapItem.tokenIn, swapItem.tokenOut, swapItem.amountIn, amountOut);
        }

        lastRebalanceAt = uint64(block.timestamp);
        emit Rebalanced(lastRebalanceAt, navBefore, calcNAV());
    }

    function _ensureBaseLiquidity(uint256 targetBase) internal {
        uint256 baseBalance = IERC20(baseAsset).balanceOf(address(this));
        if (baseBalance >= targetBase) {
            return;
        }

        uint256 len = assets.length;
        uint256 deadline = block.timestamp + uint256(maxDeadlineSeconds);

        for (uint256 i = 0; i < len; i++) {
            AssetConfig memory asset = assets[i];
            if (!asset.enabled || asset.token == baseAsset) {
                continue;
            }

            uint256 tokenBal = IERC20(asset.token).balanceOf(address(this));
            if (tokenBal == 0) {
                continue;
            }

            IERC20(asset.token).forceApprove(uniswapRouter, tokenBal);
            address[] memory path = new address[](2);
            path[0] = asset.token;
            path[1] = baseAsset;
            uint256 expectedOut = _quoteAmountOut(tokenBal, path);
            uint256 minOut = (expectedOut * (10000 - uint256(asset.maxSlippageBps))) / 10000;

            IUniswapV2RouterLike(uniswapRouter).swapExactTokensForTokens(
                tokenBal,
                minOut,
                path,
                address(this),
                deadline
            );

            baseBalance = IERC20(baseAsset).balanceOf(address(this));
            if (baseBalance >= targetBase) {
                break;
            }
        }
    }

    function _isSwapTokenEnabled(address token) internal view returns (bool) {
        if (token == baseAsset) {
            return true;
        }

        uint256 indexPlusOne = _assetIndexPlusOne[token];
        if (indexPlusOne == 0) {
            return false;
        }

        return assets[indexPlusOne - 1].enabled && registry.isEnabled(token);
    }

    function _quoteAmountOut(uint256 amountIn, address[] memory path) internal view returns (uint256) {
        uint256[] memory amounts = IUniswapV2RouterLike(uniswapRouter).getAmountsOut(amountIn, path);
        return amounts[amounts.length - 1];
    }
}

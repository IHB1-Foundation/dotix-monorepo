// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./DOTIXToken.sol";
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

/// @title IndexVault
/// @notice Holds the Dotix asset basket, issues PDOT shares, and executes guarded rebalances.
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
    DOTIXToken public immutable pdot;

    AssetConfig[] public assets;
    mapping(address => uint256) private _assetIndexPlusOne;

    uint64 public lastRebalanceAt;
    uint32 public cooldownSeconds;
    uint32 public maxDeadlineSeconds;
    uint16 public maxNavTradeBps;

    event Deposit(address indexed user, uint256 baseIn, uint256 sharesOut);
    event Redeem(address indexed user, uint256 sharesIn, uint256 baseOut);
    event TargetsUpdated(address[] tokens, uint16[] bps);
    event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event Rebalanced(uint64 timestamp, uint256 navBefore, uint256 navAfter);
    event GuardrailsUpdated(uint32 cooldown, uint16 maxNavTrade);
    event MaxDeadlineUpdated(uint32 maxDeadlineSeconds);

    /// @notice Deploys the vault and wires the core protocol contracts together.
    /// @param admin Address receiving the default admin and pauser roles.
    /// @param _baseAsset ERC-20 asset accepted for deposits and redemptions.
    /// @param _registry Token metadata registry used for allowlist checks.
    /// @param _pdot Share token minted and burned by this vault.
    /// @param _uniswapRouter Router used for rebalances and redeem liquidity.
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
        pdot = DOTIXToken(_pdot);

        cooldownSeconds = 300;
        maxDeadlineSeconds = 300;
        maxNavTradeBps = 1000;
    }

    /// @notice Returns the number of configured vault assets.
    /// @return Number of asset configs stored by the vault.
    function assetsLength() external view returns (uint256) {
        return assets.length;
    }

    /// @notice Adds a new asset configuration to the vault basket.
    /// @param token ERC-20 token address for the asset.
    /// @param targetBps Target allocation in basis points.
    /// @param maxSlippageBps Maximum allowed slippage in basis points.
    /// @param maxTradeBps Maximum trade size for the asset in basis points of NAV.
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

    /// @notice Enables or disables a configured asset.
    /// @param token Asset token to update.
    /// @param enabled Whether the asset should remain active.
    function setAssetEnabled(address token, bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 indexPlusOne = _assetIndexPlusOne[token];
        require(indexPlusOne != 0, "missing");
        assets[indexPlusOne - 1].enabled = enabled;
    }

    /// @notice Updates the vault target weights for each configured asset.
    /// @param tokens Asset tokens whose targets should be updated.
    /// @param bps New target weights expressed in basis points.
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

    /// @notice Updates the core rebalance guardrails.
    /// @param cooldown Minimum seconds between rebalances.
    /// @param maxNavTrade Maximum trade size in basis points of NAV.
    function setGuardrails(uint32 cooldown, uint16 maxNavTrade) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(maxNavTrade <= 10000, "bps");
        cooldownSeconds = cooldown;
        maxNavTradeBps = maxNavTrade;
        emit GuardrailsUpdated(cooldown, maxNavTrade);
    }

    /// @notice Updates the maximum router deadline window used for swaps.
    /// @param newMaxDeadlineSeconds Maximum number of seconds added to swap deadlines.
    function setMaxDeadlineSeconds(uint32 newMaxDeadlineSeconds) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMaxDeadlineSeconds > 0, "deadline");
        maxDeadlineSeconds = newMaxDeadlineSeconds;
        emit MaxDeadlineUpdated(newMaxDeadlineSeconds);
    }

    /// @notice Pauses deposit, redeem, and rebalance entry points.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Resumes normal vault operations after a pause.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// @notice Deposits base asset and mints PDOT shares pro-rata to vault NAV.
    /// @param amountIn Base asset amount supplied by the caller.
    /// @param minSharesOut Minimum acceptable PDOT shares to receive.
    /// @return sharesOut PDOT shares minted to the caller.
    function deposit(uint256 amountIn, uint256 minSharesOut)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 sharesOut)
    {
        require(amountIn > 0, "amount");

        uint256 totalSupply = pdot.totalSupply();
        uint256 nav = _calcNAV();

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

    /// @notice Redeems PDOT shares back into the base asset.
    /// @param sharesIn PDOT shares burned from the caller.
    /// @param minBaseOut Minimum acceptable base asset to receive.
    /// @return baseOut Base asset transferred to the caller.
    function redeem(uint256 sharesIn, uint256 minBaseOut)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 baseOut)
    {
        require(sharesIn > 0, "shares");

        uint256 supplyBefore = pdot.totalSupply();
        require(supplyBefore > 0, "empty");

        uint256 nav = _calcNAV();
        uint256 claim = (sharesIn * nav) / supplyBefore;

        pdot.burn(msg.sender, sharesIn);

        _ensureBaseLiquidity(claim);

        uint256 realizedNav = _calcNAV();
        uint256 realizedClaim = (sharesIn * realizedNav) / supplyBefore;
        uint256 balance = IERC20(baseAsset).balanceOf(address(this));
        baseOut = realizedClaim > balance ? balance : realizedClaim;

        require(baseOut >= minBaseOut, "slippage");

        IERC20(baseAsset).safeTransfer(msg.sender, baseOut);
        emit Redeem(msg.sender, sharesIn, baseOut);
    }

    /// @notice Redeems the caller into underlying assets while the vault is paused.
    /// @param sharesIn PDOT shares burned from the caller.
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

    /// @notice Returns the total vault NAV denominated in the base asset.
    /// @return nav Current vault NAV in base asset units.
    function calcNAV() public view returns (uint256 nav) {
        return _calcNAV();
    }

    /// @notice Returns the spot price of an asset denominated in the base asset.
    /// @param token Asset token to price.
    /// @return Spot price scaled by 1e18.
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

    /// @notice Returns the maximum trade size allowed for a token at current NAV.
    /// @param token Asset token to inspect.
    /// @return Maximum allowed trade size in raw token-in units of base NAV value.
    function calcMaxTradeSize(address token) public view returns (uint256) {
        return _calcMaxTradeSize(_calcNAV(), token);
    }

    /// @notice Executes a sequence of guarded swaps through the configured router.
    /// @param swaps Swap instructions prepared off-chain and enforced on-chain.
    function rebalance(Swap[] calldata swaps)
        external
        onlyRole(KEEPER_ROLE)
        whenNotPaused
        nonReentrant
    {
        require(block.timestamp >= uint256(lastRebalanceAt) + uint256(cooldownSeconds), "cooldown");

        uint256 navBefore = _calcNAV();
        uint256 len = swaps.length;

        for (uint256 i = 0; i < len; i++) {
            Swap calldata swapItem = swaps[i];
            require(_isSwapTokenEnabled(swapItem.tokenIn), "token");
            require(_isSwapTokenEnabled(swapItem.tokenOut), "token");
            require(swapItem.path.length >= 2, "path");
            require(swapItem.path[0] == swapItem.tokenIn, "path in");
            require(swapItem.path[swapItem.path.length - 1] == swapItem.tokenOut, "path out");
            require(swapItem.amountIn <= _calcMaxTradeSize(navBefore, swapItem.tokenIn), "trade cap");

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
        uint256 navAfter = _calcNAV();
        emit Rebalanced(lastRebalanceAt, navBefore, navAfter);
    }

    function _calcNAV() internal view returns (uint256 nav) {
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

    function _calcMaxTradeSize(uint256 nav, address token) internal view returns (uint256) {
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
}

import {
  PairDayData,
  PairHourData,
  TokenDayData,
  CrowdPoolingDayData,
  CrowdPooling,
  Token,
  Pair,
  LpToken,
  CrowdPoolingHourData,
  WorldesDayData,
  UserDayData,
} from "../../../generated/schema";
import { BigInt, ethereum, BigDecimal, log } from "@graphprotocol/graph-ts";
import {
  ONE_BI,
  ZERO_BD,
  ZERO_BI,
  convertTokenToDecimal,
  getWorldes,
} from "./helpers";
import { ADDRESS_ZERO } from "./constant";
import {
  TYPE_DVM_POOL,
  TYPE_DPP_POOL,
  TYPE_CLASSICAL_POOL,
  SOURCE_SMART_ROUTE,
  SOURCE_POOL_SWAP,
  DIP3_TIMESTAMP,
} from "./constant";

export function updatePairDayData(
  event: ethereum.Event,
  pair: Pair
): PairDayData {
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400;
  let dayStartTimestamp = dayID * 86400;

  let dayPairID = pair.id.concat("-").concat(BigInt.fromI32(dayID).toString());

  let baseToken = Token.load(pair.baseToken) as Token;
  let quoteToken = Token.load(pair.quoteToken) as Token;

  let pairDayData = PairDayData.load(dayPairID);
  if (pairDayData == null) {
    pairDayData = new PairDayData(dayPairID);
    pairDayData.date = dayStartTimestamp;
    pairDayData.baseToken = pair.baseToken;
    pairDayData.quoteToken = pair.quoteToken;
    pairDayData.pairAddress = event.address;

    pairDayData.untrackedBaseVolume = ZERO_BD;
    pairDayData.untrackedQuoteVolume = ZERO_BD;
    pairDayData.volumeQuote = ZERO_BD;
    pairDayData.volumeBase = ZERO_BD;
    pairDayData.txns = ZERO_BI;
    pairDayData.quoteTokenReserve = ZERO_BD;
    pairDayData.baseTokenReserve = ZERO_BD;
    pairDayData.baseLpTokenTotalSupply = ZERO_BD;
    pairDayData.quoteLpTokenTotalSupply = ZERO_BD;
    pairDayData.feeBase = ZERO_BD;
    pairDayData.feeQuote = ZERO_BD;
    pairDayData.traders = ZERO_BI;
    pairDayData.volumeUSD = ZERO_BD;
    pairDayData.pair = pair.id;
  }

  pairDayData.baseTokenReserve = pair.baseReserve;
  pairDayData.quoteTokenReserve = pair.quoteReserve;
  pairDayData.baseUsdPrice = baseToken.usdPrice;
  pairDayData.quoteUsdPrice = quoteToken.usdPrice;

  if (pair.type != TYPE_DPP_POOL) {
    if (pair.baseLpToken != null && pair.baseLpToken != ADDRESS_ZERO) {
      let baseLpToken = LpToken.load(pair.baseLpToken as string) as LpToken;
      pairDayData.baseLpTokenTotalSupply = convertTokenToDecimal(
        baseLpToken.totalSupply,
        baseLpToken.decimals
      );
    }

    if (pair.quoteLpToken != null && pair.quoteLpToken != ADDRESS_ZERO) {
      let quoteLpToken = LpToken.load(pair.quoteLpToken as string) as LpToken;
      pairDayData.quoteLpTokenTotalSupply = convertTokenToDecimal(
        quoteLpToken.totalSupply,
        quoteLpToken.decimals
      );
    }
  }
  pairDayData.lpFeeRate = pair.lpFeeRate;
  pairDayData.txns = pairDayData.txns.plus(ONE_BI);
  pairDayData.updatedAt = event.block.timestamp;
  pairDayData.save();
  return pairDayData as PairDayData;
}

export function updatePairHourData(
  event: ethereum.Event,
  pair: Pair
): PairHourData {
  log.warning("{},{},{}****", [
    pair.id,
    event.transaction.hash.toHexString(),
    pair.baseReserve.toString(),
  ]);
  let timestamp = event.block.timestamp.toI32();
  let hourID = timestamp / 3600;
  let hourStartTimestamp = hourID * 3600;

  let hourPairID = pair.id
    .concat("-")
    .concat(BigInt.fromI32(hourID).toString());

  let baseToken = Token.load(pair.baseToken) as Token;
  let quoteToken = Token.load(pair.quoteToken) as Token;

  let pairHourData = PairHourData.load(hourPairID);
  if (pairHourData == null) {
    pairHourData = new PairHourData(hourPairID);
    pairHourData.hour = hourStartTimestamp;
    pairHourData.baseToken = pair.baseToken;
    pairHourData.quoteToken = pair.quoteToken;
    pairHourData.pairAddress = event.address;

    pairHourData.untrackedBaseVolume = ZERO_BD;
    pairHourData.untrackedQuoteVolume = ZERO_BD;
    pairHourData.volumeQuote = ZERO_BD;
    pairHourData.volumeBase = ZERO_BD;
    pairHourData.txns = ZERO_BI;
    pairHourData.quoteTokenReserve = ZERO_BD;
    pairHourData.baseTokenReserve = ZERO_BD;
    pairHourData.baseLpTokenTotalSupply = ZERO_BD;
    pairHourData.quoteLpTokenTotalSupply = ZERO_BD;
    pairHourData.feeBase = ZERO_BD;
    pairHourData.feeQuote = ZERO_BD;
    pairHourData.traders = ZERO_BI;
    pairHourData.volumeUSD = ZERO_BD;
    pairHourData.pair;
  }

  pairHourData.baseTokenReserve = pair.baseReserve;
  pairHourData.quoteTokenReserve = pair.quoteReserve;
  pairHourData.baseUsdPrice = baseToken.usdPrice;
  pairHourData.quoteUsdPrice = quoteToken.usdPrice;

  if (pair.type != TYPE_DPP_POOL) {
    if (pair.baseLpToken != null && pair.baseLpToken != ADDRESS_ZERO) {
      let baseLpToken = LpToken.load(pair.baseLpToken as string) as LpToken;
      pairHourData.baseLpTokenTotalSupply = convertTokenToDecimal(
        baseLpToken.totalSupply,
        baseLpToken.decimals
      );
    }

    if (pair.quoteLpToken != null && pair.quoteLpToken != ADDRESS_ZERO) {
      let quoteLpToken = LpToken.load(pair.quoteLpToken as string) as LpToken;
      pairHourData.quoteLpTokenTotalSupply = convertTokenToDecimal(
        quoteLpToken.totalSupply,
        quoteLpToken.decimals
      );
    }
  }
  pairHourData.txns = pairHourData.txns.plus(ONE_BI);
  pairHourData.lpFeeRate = pair.lpFeeRate;
  pairHourData.updatedAt = event.block.timestamp;
  pairHourData.save();
  return pairHourData as PairHourData;
}

export function updateTokenDayData(
  token: Token,
  event: ethereum.Event
): TokenDayData {
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400;
  let dayStartTimestamp = dayID * 86400;
  let tokenDayID = token.id
    .toString()
    .concat("-")
    .concat(BigInt.fromI32(dayID).toString());

  let tokenDayData = TokenDayData.load(tokenDayID);
  if (tokenDayData == null) {
    tokenDayData = new TokenDayData(tokenDayID);
    tokenDayData.date = dayStartTimestamp;
    tokenDayData.token = token.id;
    tokenDayData.volume = ZERO_BD;
    tokenDayData.txns = ZERO_BI;
    tokenDayData.totalLiquidityToken = ZERO_BD;
    tokenDayData.untrackedVolume = ZERO_BD;
    tokenDayData.fee = ZERO_BD;
    tokenDayData.traders = ZERO_BI;
    tokenDayData.volumeBridge = ZERO_BD;
    tokenDayData.volumeUSD = ZERO_BD;
    tokenDayData.maintainerFee = ZERO_BD;
    tokenDayData.maintainerFeeUSD = ZERO_BD;
  }
  tokenDayData.usdPrice = token.usdPrice;
  tokenDayData.totalLiquidityToken = token.totalLiquidityOnWorldes;
  tokenDayData.txns = tokenDayData.txns.plus(ONE_BI);
  tokenDayData.updatedAt = event.block.timestamp;
  tokenDayData.save();

  return tokenDayData as TokenDayData;
}

export function trimTokenData(
  token: Token,
  volume: BigDecimal,
  bridge: BigDecimal,
  usdBridge: BigDecimal,
  event: ethereum.Event
): void {
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400;
  let dayStartTimestamp = dayID * 86400;
  let tokenDayID = token.id
    .toString()
    .concat("-")
    .concat(BigInt.fromI32(dayID).toString());

  let tokenDayData = TokenDayData.load(tokenDayID);
  if (tokenDayData == null) {
    tokenDayData = new TokenDayData(tokenDayID);
    tokenDayData.date = dayStartTimestamp;
    tokenDayData.token = token.id;
    tokenDayData.volume = ZERO_BD;
    tokenDayData.txns = ZERO_BI;
    tokenDayData.totalLiquidityToken = ZERO_BD;
    tokenDayData.untrackedVolume = ZERO_BD;
    tokenDayData.fee = ZERO_BD;
    tokenDayData.traders = ZERO_BI;
    tokenDayData.volumeBridge = ZERO_BD;
    tokenDayData.volumeUSD = ZERO_BD;
  } else {
    tokenDayData.totalLiquidityToken = token.totalLiquidityOnWorldes;
    tokenDayData.volume = tokenDayData.volume.minus(volume);
    tokenDayData.volumeBridge = tokenDayData.volumeBridge.plus(bridge);
    if (bridge.equals(ZERO_BD)) {
      tokenDayData.txns = tokenDayData.txns.minus(ONE_BI);
    }
  }
  tokenDayData.updatedAt = event.block.timestamp;
  tokenDayData.save();

  token.tradeVolume = token.tradeVolume.minus(volume);
  if (bridge.gt(ZERO_BD))
    token.tradeVolumeBridge = token.tradeVolume.plus(volume);
  token.volumeUSD = token.volumeUSD.minus(usdBridge);
  if (bridge.gt(ZERO_BD))
    token.volumeUSDBridge = token.volumeUSDBridge.plus(usdBridge);
  token.save();
}

export function updateCrowdPoolingDayData(
  cp: CrowdPooling,
  event: ethereum.Event
): CrowdPoolingDayData {
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400;
  let dayStartTimestamp = dayID * 86400;
  let cpDayDataID = cp.id
    .toString()
    .concat("-")
    .concat(BigInt.fromI32(dayID).toString());

  let cpDayData = CrowdPoolingDayData.load(cpDayDataID);
  if (cpDayData == null) {
    cpDayData = new CrowdPoolingDayData(cpDayDataID);
    cpDayData.date = dayStartTimestamp;
    cpDayData.investCount = ZERO_BI;
    cpDayData.investedQuote = ZERO_BD;
    cpDayData.canceledQuote = ZERO_BD;
    cpDayData.newcome = ZERO_BI;
    cpDayData.crowdPooling = cp.id;
    cpDayData.poolQuote = cp.poolQuote;
    cpDayData.investors = ZERO_BI;
    cpDayData.updatedAt = event.block.timestamp;
    cpDayData.save();
  }
  return cpDayData as CrowdPoolingDayData;
}

export function updateCrowdPoolingHourData(
  cp: CrowdPooling,
  event: ethereum.Event
): CrowdPoolingHourData {
  let timestamp = event.block.timestamp.toI32();
  let hourID = timestamp / 3600;
  let hourStartTimestamp = hourID * 3600;
  let cpHourDataID = cp.id
    .toString()
    .concat("-")
    .concat(BigInt.fromI32(hourID).toString());

  let cpHourData = CrowdPoolingHourData.load(cpHourDataID);
  if (cpHourData == null) {
    cpHourData = new CrowdPoolingHourData(cpHourDataID);
    cpHourData.hour = hourStartTimestamp;
    cpHourData.investCount = ZERO_BI;
    cpHourData.investedQuote = ZERO_BD;
    cpHourData.canceledQuote = ZERO_BD;
    cpHourData.newcome = ZERO_BI;
    cpHourData.crowdPooling = cp.id;
    cpHourData.poolQuote = cp.poolQuote;
    cpHourData.investors = ZERO_BI;
    cpHourData.updatedAt = event.block.timestamp;
    cpHourData.save();
  }
  return cpHourData as CrowdPoolingHourData;
}

export function getWorldesDayData(event: ethereum.Event): WorldesDayData {
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400;
  let dayStartTimestamp = dayID * 86400;
  let worldesDayDataID = BigInt.fromI32(dayID).toString();

  let worldesDayData = WorldesDayData.load(worldesDayDataID);

  if (worldesDayData == null) {
    worldesDayData = new WorldesDayData(worldesDayDataID);
    worldesDayData.date = dayStartTimestamp;
    worldesDayData.txCount = ZERO_BI;
    worldesDayData.uniqueUsersCount = ZERO_BI;
    worldesDayData.volumeUSD = ZERO_BD;
    worldesDayData.feeUSD = ZERO_BD;
    worldesDayData.maintainerFeeUSD = ZERO_BD;
    worldesDayData.updatedAt = event.block.timestamp;
    worldesDayData.save();
  }

  return worldesDayData as WorldesDayData;
}

export function increaseTxCount(event: ethereum.Event): WorldesDayData {
  let worldesDayData = getWorldesDayData(event);
  worldesDayData.txCount = worldesDayData.txCount.plus(ONE_BI);
  worldesDayData.updatedAt = event.block.timestamp;
  worldesDayData.save();
  return worldesDayData as WorldesDayData;
}

export function increaseVolumeAndFee(
  event: ethereum.Event,
  volumeUSD: BigDecimal,
  feeUSD: BigDecimal
): WorldesDayData {
  let worldesDayData = getWorldesDayData(event);
  worldesDayData.volumeUSD = worldesDayData.volumeUSD.plus(volumeUSD);
  worldesDayData.feeUSD = worldesDayData.feeUSD.plus(feeUSD);
  worldesDayData.updatedAt = event.block.timestamp;
  worldesDayData.save();
  return worldesDayData as WorldesDayData;
}

export function decreaseVolumeAndFee(
  event: ethereum.Event,
  volumeUSD: BigDecimal,
  feeUSD: BigDecimal
): WorldesDayData {
  let worldesDayData = getWorldesDayData(event);
  worldesDayData.volumeUSD = worldesDayData.volumeUSD.minus(volumeUSD);
  worldesDayData.feeUSD = worldesDayData.feeUSD.minus(feeUSD);
  worldesDayData.updatedAt = event.block.timestamp;
  worldesDayData.save();
  return worldesDayData as WorldesDayData;
}

export function increaseMaintainerFee(
  event: ethereum.Event,
  volumeUSD: BigDecimal
): WorldesDayData {
  let worldesDayData = getWorldesDayData(event);

  worldesDayData.maintainerFeeUSD = worldesDayData.maintainerFeeUSD.plus(volumeUSD);
  worldesDayData.updatedAt = event.block.timestamp;
  worldesDayData.save();
  let worldes = getWorldes();
  worldes.maintainerFeeUSD = worldes.maintainerFeeUSD.plus(volumeUSD);
  if (event.block.timestamp.ge(BigInt.fromI32(DIP3_TIMESTAMP))) {
    worldes.DIP3MaintainerFeeUSD = worldes.DIP3MaintainerFeeUSD.plus(volumeUSD);
  }
  worldes.updatedAt = event.block.timestamp;
  worldes.save();

  return worldesDayData as WorldesDayData;
}

export function updateUserDayData(event: ethereum.Event): UserDayData {
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400;
  let dayStartTimestamp = dayID * 86400;
  let userDayDataID = event.transaction.from
    .toHexString()
    .concat("-")
    .concat(BigInt.fromI32(dayID).toString());

  let userDayData = UserDayData.load(userDayDataID);
  if (userDayData == null) {
    let worldesDayData = getWorldesDayData(event);
    worldesDayData.uniqueUsersCount = worldesDayData.uniqueUsersCount.plus(ONE_BI);
    worldesDayData.save();
    userDayData = new UserDayData(userDayDataID);
    userDayData.date = dayStartTimestamp;
    userDayData.tradeCount = ZERO_BI;
    userDayData.addLPCount = ZERO_BI;
    userDayData.removeLPCount = ZERO_BI;
    userDayData.bidCount = ZERO_BI;
    userDayData.cancelCount = ZERO_BI;
    userDayData.claimCount = ZERO_BI;
  }
  userDayData.updatedAt = event.block.timestamp;
  userDayData.save();
  return userDayData as UserDayData;
}

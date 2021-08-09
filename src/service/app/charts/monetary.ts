import BigNumber from 'bignumber.js'
import { AppDispatch } from '../../../contexts/reducer'
import {
  fetchStatisticTotalSupply,
  fetchStatisticAnnualPercentageCompensation,
  fetchStatisticSecondaryIssuance,
  fetchStatisticInflationRate,
  fetchStatisticLiquidity,
} from '../../http/fetcher'
import { PageActions } from '../../../contexts/actions'
import { fetchCachedData, storeCachedData, fetchDateChartCache, storeDateChartCache } from '../../../utils/cache'
import { ChartCachedKeys } from '../../../constants/cache'
import {
  dispatchAPC,
  dispatchTotalSupply,
  dispatchSecondaryIssuance,
  dispatchInflationRate,
  dispatchLiquidity,
} from './action'

export const getStatisticTotalSupply = (dispatch: AppDispatch) => {
  const data = fetchDateChartCache(ChartCachedKeys.TotalSupply)
  if (data) {
    dispatchTotalSupply(dispatch, data)
    return
  }
  fetchStatisticTotalSupply()
    .then((response: Response.Wrapper<State.StatisticTotalSupply>[] | null) => {
      if (!response) return
      const statisticTotalSupplies = response.map(wrapper => ({
        createdAtUnixtimestamp: wrapper.attributes.createdAtUnixtimestamp,
        circulatingSupply: wrapper.attributes.circulatingSupply,
        burnt: wrapper.attributes.burnt,
        lockedCapacity: wrapper.attributes.lockedCapacity,
      }))
      dispatchTotalSupply(dispatch, statisticTotalSupplies)
      if (statisticTotalSupplies && statisticTotalSupplies.length > 0) {
        storeDateChartCache(ChartCachedKeys.TotalSupply, statisticTotalSupplies)
      }
    })
    .catch(() => {
      dispatch({
        type: PageActions.UpdateStatisticTotalSupplyFetchEnd,
        payload: {
          statisticTotalSuppliesFetchEnd: true,
        },
      })
    })
}

export const getStatisticAnnualPercentageCompensation = (dispatch: AppDispatch) => {
  const data = fetchCachedData(ChartCachedKeys.APC)
  if (data) {
    dispatchAPC(dispatch, data)
    return
  }
  fetchStatisticAnnualPercentageCompensation()
    .then((wrapper: Response.Wrapper<State.StatisticAnnualPercentageCompensations> | null) => {
      if (!wrapper) return
      const statisticAnnualPercentageCompensations = wrapper.attributes.nominalApc
        .filter((_apc, index) => index % 3 === 0 || index === wrapper.attributes.nominalApc.length - 1)
        .map((apc, index) => ({
          year: 0.25 * index,
          apc,
        }))
      dispatchAPC(dispatch, statisticAnnualPercentageCompensations)
      if (statisticAnnualPercentageCompensations && statisticAnnualPercentageCompensations.length > 0) {
        storeCachedData(ChartCachedKeys.APC, statisticAnnualPercentageCompensations)
      }
    })
    .catch(() => {
      dispatch({
        type: PageActions.UpdateStatisticAnnualPercentageCompensationFetchEnd,
        payload: {
          statisticAnnualPercentageCompensationsFetchEnd: true,
        },
      })
    })
}

export const getStatisticSecondaryIssuance = (dispatch: AppDispatch) => {
  const data = fetchDateChartCache(ChartCachedKeys.SecondaryIssuance)
  if (data) {
    dispatchSecondaryIssuance(dispatch, data)
    return
  }
  fetchStatisticSecondaryIssuance()
    .then((wrappers: Response.Wrapper<State.StatisticSecondaryIssuance>[] | null) => {
      if (!wrappers) return
      const statisticSecondaryIssuance = wrappers.map(wrapper => {
        const { depositCompensation, miningReward, treasuryAmount, createdAtUnixtimestamp } = wrapper.attributes
        const sum = Number(treasuryAmount) + Number(miningReward) + Number(depositCompensation)
        const treasuryAmountPercent = Number(((Number(treasuryAmount) / sum) * 100).toFixed(2))
        const miningRewardPercent = Number(((Number(miningReward) / sum) * 100).toFixed(2))
        const depositCompensationPercent = (100 - treasuryAmountPercent - miningRewardPercent).toFixed(2)
        return {
          createdAtUnixtimestamp,
          treasuryAmount: treasuryAmountPercent,
          miningReward: miningRewardPercent,
          depositCompensation: depositCompensationPercent,
        }
      })
      dispatchSecondaryIssuance(dispatch, statisticSecondaryIssuance)
      if (statisticSecondaryIssuance && statisticSecondaryIssuance.length > 0) {
        storeDateChartCache(ChartCachedKeys.SecondaryIssuance, statisticSecondaryIssuance)
      }
    })
    .catch(() => {
      dispatch({
        type: PageActions.UpdateStatisticSecondaryIssuanceFetchEnd,
        payload: {
          statisticSecondaryIssuanceFetchEnd: true,
        },
      })
    })
}

export const getStatisticInflationRate = (dispatch: AppDispatch) => {
  const data = fetchCachedData(ChartCachedKeys.InflationRate)
  if (data) {
    dispatchInflationRate(dispatch, data)
    return
  }
  fetchStatisticInflationRate()
    .then((wrapper: Response.Wrapper<State.StatisticInflationRates> | null) => {
      if (!wrapper) return
      const { nominalApc, nominalInflationRate, realInflationRate } = wrapper.attributes
      const statisticInflationRates = []
      for (let i = 0; i < nominalApc.length; i++) {
        if (i % 6 === 0 || i === nominalApc.length - 1) {
          statisticInflationRates.push({
            year: i % 6 === 0 ? Math.floor(i / 6) * 0.5 : 50,
            nominalApc: nominalApc[i],
            nominalInflationRate: nominalInflationRate[i],
            realInflationRate: realInflationRate[i],
          })
        }
      }
      dispatchInflationRate(dispatch, statisticInflationRates)
      if (statisticInflationRates && statisticInflationRates.length > 0) {
        storeCachedData(ChartCachedKeys.InflationRate, statisticInflationRates)
      }
    })
    .catch(() => {
      dispatch({
        type: PageActions.UpdateStatisticInflationRateFetchEnd,
        payload: {
          statisticInflationRatesFetchEnd: true,
        },
      })
    })
}

export const getStatisticLiquidity = (dispatch: AppDispatch) => {
  const data = fetchDateChartCache(ChartCachedKeys.Liquidity)
  if (data) {
    dispatchLiquidity(dispatch, data)
    return
  }
  fetchStatisticLiquidity()
    .then((wrapper: Response.Wrapper<State.StatisticLiquidity>[] | null) => {
      if (!wrapper) return
      const statisticLiquidity: State.StatisticLiquidity[] = wrapper.map(data => ({
        createdAtUnixtimestamp: data.attributes.createdAtUnixtimestamp,
        circulatingSupply: data.attributes.circulatingSupply,
        liquidity: data.attributes.liquidity,
        daoDeposit: new BigNumber(data.attributes.circulatingSupply)
          .minus(new BigNumber(data.attributes.liquidity))
          .toFixed(2),
      }))
      dispatchLiquidity(dispatch, statisticLiquidity)
      if (statisticLiquidity && statisticLiquidity.length > 0) {
        storeDateChartCache(ChartCachedKeys.Liquidity, statisticLiquidity)
      }
    })
    .catch(() => {
      dispatch({
        type: PageActions.UpdateStatisticLiquidityFetchEnd,
        payload: {
          statisticLiquidityFetchEnd: true,
        },
      })
    })
}

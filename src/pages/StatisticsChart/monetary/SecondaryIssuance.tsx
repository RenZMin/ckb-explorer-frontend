/* eslint-disable object-curly-newline */
import { useEffect } from 'react'
import i18n, { currentLanguage } from '../../../utils/i18n'
import { parseDateNoTime } from '../../../utils/date'
import { isMobile } from '../../../utils/screen'
import { useAppState, useDispatch } from '../../../contexts/providers'
import { ChartColors } from '../../../constants/common'
import { ChartLoading, ReactChartCore, ChartPage, tooltipColor, tooltipWidth } from '../common'
import { getStatisticSecondaryIssuance } from '../../../service/app/charts/monetary'

const gridThumbnail = {
  left: '4%',
  right: '10%',
  top: '8%',
  bottom: '6%',
  containLabel: true,
}
const grid = {
  left: '4%',
  right: '3%',
  top: '8%',
  bottom: '5%',
  containLabel: true,
}

const Colors = ['#74808E', '#049ECD', '#69C7D4']

const widthSpan = (value: string) => tooltipWidth(value, currentLanguage() === 'en' ? 155 : 70)

const parseTooltip = ({ seriesName, data }: { seriesName: string; data: string }): string => {
  if (seriesName === i18n.t('nervos_dao.deposit_compensation')) {
    return `<div>${tooltipColor(Colors[2])}${widthSpan(i18n.t('nervos_dao.deposit_compensation'))} ${data}%</div>`
  }
  if (seriesName === i18n.t('nervos_dao.mining_reward')) {
    return `<div>${tooltipColor(Colors[1])}${widthSpan(i18n.t('nervos_dao.mining_reward'))} ${data}%</div>`
  }
  if (seriesName === i18n.t('nervos_dao.burnt')) {
    return `<div>${tooltipColor(Colors[0])}${widthSpan(i18n.t('nervos_dao.burnt'))} ${data}%</div>`
  }
  return ''
}

const getOption = (
  statisticSecondaryIssuance: State.StatisticSecondaryIssuance[],
  isThumbnail = false,
): echarts.EChartOption => ({
  color: Colors,
  tooltip: !isThumbnail
    ? {
        trigger: 'axis',
        formatter: (dataList: any) => {
          const list = dataList as Array<{ seriesName: string; data: string; name: string }>
          let result = `<div>${tooltipColor('#333333')}${widthSpan(i18n.t('statistic.date'))} ${parseDateNoTime(
            list[0].name,
          )}</div>`
          list.forEach(data => {
            result += parseTooltip(data)
          })
          return result
        },
      }
    : undefined,
  legend: {
    data: isThumbnail
      ? []
      : [
          {
            name: i18n.t('nervos_dao.burnt'),
          },
          {
            name: i18n.t('nervos_dao.mining_reward'),
          },
          {
            name: i18n.t('nervos_dao.deposit_compensation'),
          },
        ],
  },
  grid: isThumbnail ? gridThumbnail : grid,
  xAxis: [
    {
      name: isMobile() || isThumbnail ? '' : i18n.t('statistic.date'),
      nameLocation: 'middle',
      nameGap: 30,
      type: 'category',
      boundaryGap: false,
      data: statisticSecondaryIssuance.map(data => data.createdAtUnixtimestamp),
      axisLabel: {
        formatter: (value: string) => parseDateNoTime(value),
      },
    },
  ],
  yAxis: [
    {
      position: 'left',
      type: 'value',
      axisLine: {
        lineStyle: {
          color: ChartColors[0],
        },
      },
      axisLabel: {
        formatter: (value: string) => `${value}%`,
      },
    },
  ],
  series: [
    {
      name: i18n.t('nervos_dao.burnt'),
      type: 'line',
      yAxisIndex: 0,
      symbol: isThumbnail ? 'none' : 'circle',
      symbolSize: 3,
      stack: 'sum',
      areaStyle: {},
      data: statisticSecondaryIssuance.map(data => data.treasuryAmount),
    },
    {
      name: i18n.t('nervos_dao.mining_reward'),
      type: 'line',
      yAxisIndex: 0,
      symbol: isThumbnail ? 'none' : 'circle',
      symbolSize: 3,
      stack: 'sum',
      areaStyle: {},
      data: statisticSecondaryIssuance.map(data => data.miningReward),
    },
    {
      name: i18n.t('nervos_dao.deposit_compensation'),
      type: 'line',
      yAxisIndex: 0,
      symbol: isThumbnail ? 'none' : 'circle',
      symbolSize: 3,
      stack: 'sum',
      areaStyle: {},
      data: statisticSecondaryIssuance.map(data => data.depositCompensation),
    },
  ],
})

export const SecondaryIssuanceChart = ({ isThumbnail = false }: { isThumbnail?: boolean }) => {
  const { statisticSecondaryIssuance, statisticSecondaryIssuanceFetchEnd } = useAppState()
  if (!statisticSecondaryIssuanceFetchEnd || statisticSecondaryIssuance.length === 0) {
    return <ChartLoading show={!statisticSecondaryIssuanceFetchEnd} isThumbnail={isThumbnail} />
  }
  return <ReactChartCore option={getOption(statisticSecondaryIssuance, isThumbnail)} isThumbnail={isThumbnail} />
}

const toCSV = (statisticSecondaryIssuance: State.StatisticSecondaryIssuance[]) =>
  statisticSecondaryIssuance
    ? statisticSecondaryIssuance.map(data => [
        data.createdAtUnixtimestamp,
        data.treasuryAmount,
        data.miningReward,
        data.depositCompensation,
      ])
    : []

export default () => {
  const dispatch = useDispatch()
  const { statisticSecondaryIssuance } = useAppState()

  useEffect(() => {
    getStatisticSecondaryIssuance(dispatch)
  }, [dispatch])

  return (
    <ChartPage
      title={i18n.t('nervos_dao.secondary_issuance')}
      description={i18n.t('statistic.secondary_issuance_description')}
      data={toCSV(statisticSecondaryIssuance)}
    >
      <SecondaryIssuanceChart />
    </ChartPage>
  )
}

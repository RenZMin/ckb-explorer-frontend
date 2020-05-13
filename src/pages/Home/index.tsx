import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  HomeHeaderPanel,
  HomeHeaderItemPanel,
  BlockPanel,
  TableMorePanel,
  TableHeaderPanel,
  HomeTablePanel,
  TransactionPanel,
  HomeHeaderTopPanel,
  HomeHeaderBottomPanel,
} from './styled'
import Content from '../../components/Content'
import { parseTime, parseTimeNoSecond } from '../../utils/date'
import { BLOCK_POLLING_TIME, BLOCKCHAIN_ALERT_POLLING_TIME } from '../../utils/const'
import { localeNumberString, handleHashRate, handleDifficulty, parseEpochNumber } from '../../utils/number'
import { handleBigNumber } from '../../utils/string'
import { isMobile } from '../../utils/screen'
import browserHistory from '../../routes/history'
import { useAppState, useDispatch } from '../../contexts/providers'
import { getLatestBlocks } from '../../service/app/block'
import getStatistics from '../../service/app/statistics'
import i18n from '../../utils/i18n'
import LatestBlocksIcon from '../../assets/latest_blocks.png'
import LatestTransactionsIcon from '../../assets/latest_transactions.png'
import HomeHeaderBackground from '../../assets/home_background.svg'
import { BlockCardItem, TransactionCardItem } from './TableCard'
import { getLatestTransactions } from '../../service/app/transaction'
import { getTipBlockNumber } from '../../service/app/address'
import Loading from '../../components/Loading/SmallLoading'
import { useInterval } from '../../utils/hook'
import { handleBlockchainAlert } from '../../service/app/blockchain'
import Search from '../../components/Search'

const BlockchainItem = ({ blockchain }: { blockchain: BlockchainData }) => {
  return (
    <HomeHeaderItemPanel>
      <div className="blockchain__item__content">
        <div className="blockchain__item__name">{blockchain.name}</div>
        <div className="blockchain__item__value">
          <div className="blockchain__item__left__value">{blockchain.value}</div>
          {blockchain.rightValue && <div className="blockchain__item__right__value">{blockchain.rightValue}</div>}
        </div>
      </div>
      {blockchain.showSeparate && <div className="blockchain__item__between_separate" />}
    </HomeHeaderItemPanel>
  )
}

interface BlockchainData {
  name: string
  value: string
  rightValue?: string
  showSeparate: boolean
}

const parseHashRate = (hashRate: string | undefined) => {
  return hashRate ? handleHashRate(Number(hashRate) * 1000) : '- -'
}

const parseBlockTime = (blockTime: string | undefined) => {
  return blockTime ? parseTime(Number(blockTime)) : '- -'
}

const blockchainTopList = (statistics: State.Statistics): BlockchainData[] => {
  return [
    {
      name: i18n.t('blockchain.latest_block'),
      value: localeNumberString(statistics.tipBlockNumber),
      showSeparate: true,
    },
    {
      name: i18n.t('blockchain.average_block_time'),
      value: parseBlockTime(statistics.averageBlockTime),
      showSeparate: !isMobile(),
    },
    {
      name: i18n.t('blockchain.hash_rate'),
      value: parseHashRate(statistics.hashRate),
      showSeparate: true,
    },
    {
      name: i18n.t('blockchain.difficulty'),
      value: handleDifficulty(statistics.currentEpochDifficulty),
      showSeparate: true,
    },
  ]
}

const blockchainBottomList = (statistics: State.Statistics): BlockchainData[] => {
  return [
    {
      name: i18n.t('blockchain.epoch'),
      value: parseEpochNumber(statistics.epochInfo.epochNumber),
      rightValue: `${statistics.epochInfo.index}/${statistics.epochInfo.epochLength}`,
      showSeparate: true,
    },
    {
      name: i18n.t('blockchain.estimated_epoch_time'),
      value: parseTimeNoSecond(Number(statistics.estimatedEpochTime)),
      showSeparate: !isMobile(),
    },
    {
      name: i18n.t('blockchain.transactions_per_minute'),
      value: handleBigNumber(statistics.transactionsCountPerMinute, 2),
      showSeparate: true,
    },
    {
      name: i18n.t('blockchain.transactions_last_24hrs'),
      value: handleBigNumber(statistics.transactionsLast24Hrs, 2),
      showSeparate: false,
    },
  ]
}

export default () => {
  const dispatch = useDispatch()
  const {
    homeBlocks = [],
    transactionsState: { transactions = [] },
    statistics,
    app: { tipBlockNumber },
  } = useAppState()
  const [t] = useTranslation()

  useEffect(() => {
    getLatestBlocks(dispatch)
    getLatestTransactions(dispatch)
    getTipBlockNumber(dispatch)
    getStatistics(dispatch)
    const listener = setInterval(() => {
      getTipBlockNumber(dispatch)
      getLatestBlocks(dispatch)
      getLatestTransactions(dispatch)
      getStatistics(dispatch)
    }, BLOCK_POLLING_TIME)
    return () => {
      if (listener) {
        clearInterval(listener)
      }
    }
  }, [dispatch])

  useInterval(() => {
    handleBlockchainAlert(dispatch)
    blockchainTopList(statistics)
  }, BLOCKCHAIN_ALERT_POLLING_TIME)

  return (
    <Content>
      <HomeHeaderPanel className="container">
        <HomeHeaderTopPanel style={{ backgroundImage: `url(${HomeHeaderBackground})` }}>
          <div className="home__top__title">{i18n.t('common.ckb_explorer')}</div>
          <div className="home__top__search">
            <Search hasButton={true} />
          </div>
        </HomeHeaderTopPanel>
        <HomeHeaderBottomPanel>
          {!isMobile() &&
            blockchainBottomList(statistics).map((data: BlockchainData) => {
              return <BlockchainItem blockchain={data} key={data.name} />
            })}
          {isMobile() && (
            <>
              <div className="blockchain__item__mobile">
                {blockchainBottomList(statistics)
                  .slice(0, 2)
                  .map((data: BlockchainData) => {
                    return <BlockchainItem blockchain={data} key={data.name} />
                  })}
              </div>
              <div className="blockchain__item__mobile_separate" />
              <div className="blockchain__item__mobile">
                {blockchainBottomList(statistics)
                  .slice(2)
                  .map((data: BlockchainData) => {
                    return <BlockchainItem blockchain={data} key={data.name} />
                  })}
              </div>
            </>
          )}
        </HomeHeaderBottomPanel>
      </HomeHeaderPanel>
      <HomeTablePanel className="container">
        <BlockPanel>
          <TableHeaderPanel>
            <img src={LatestBlocksIcon} alt="latest blocks" />
            <span>{i18n.t('home.latest_blocks')}</span>
          </TableHeaderPanel>
          {homeBlocks.length > 0 ? (
            <>
              {homeBlocks.map((block, index) => {
                return (
                  <div key={block.number}>
                    <BlockCardItem block={block} index={index} />
                    {homeBlocks.length - 1 !== index && <div className="block__card__separate" />}
                  </div>
                )
              })}
            </>
          ) : (
            <Loading />
          )}
          <TableMorePanel
            onClick={() => {
              browserHistory.push(`/block/list`)
            }}
          >
            <span>{t('home.more')}</span>
          </TableMorePanel>
        </BlockPanel>
        <TransactionPanel>
          <TableHeaderPanel>
            <img src={LatestTransactionsIcon} alt="latest transactions" />
            <span>{i18n.t('home.latest_transactions')}</span>
          </TableHeaderPanel>
          {transactions.length > 0 ? (
            <>
              {transactions.map((transaction, index) => {
                return (
                  <div key={transaction.transactionHash}>
                    <TransactionCardItem transaction={transaction} tipBlockNumber={tipBlockNumber} />
                    {transactions.length - 1 !== index && <div className="transaction__card__separate" />}
                  </div>
                )
              })}
            </>
          ) : (
            <Loading />
          )}

          <TableMorePanel
            onClick={() => {
              browserHistory.push(`/transaction/list`)
            }}
          >
            <span>{t('home.more')}</span>
          </TableMorePanel>
        </TransactionPanel>
      </HomeTablePanel>
    </Content>
  )
}

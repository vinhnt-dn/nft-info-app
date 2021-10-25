import { Fragment } from 'react'
import { useSelector } from 'react-redux'
import { account, utils } from '@senswap/sen-js'
import numbro from 'numbro'

import { Space, Typography, Tooltip, Divider } from 'antd'
import IonIcon from 'shared/ionicon'

import { explorer, shortenAddress } from 'shared/util'
import { RootState } from 'os/store'

const WalletIntro = () => {
  const { address, lamports } = useSelector((state: RootState) => state.wallet)

  const balance = numbro(utils.undecimalize(lamports, 9)).format('0.[00]')

  if (!account.isAddress(address)) return <Fragment />
  return (
    <Space size={10}>
      <Typography.Link
        style={{ color: 'inherit', fontSize: 12 }}
        href={explorer(address)}
        target="_blank"
      >
        {shortenAddress(address, 3, '...')} <IonIcon name="open-outline" />
      </Typography.Link>
      <Divider type="vertical" style={{ margin: 0 }} />
      <Tooltip title={`${utils.undecimalize(lamports, 9)} SOL`}>
        <Typography.Text style={{ fontSize: 12 }}>
          {balance} <span style={{ color: '#03E1FF' }}>◎</span>
        </Typography.Text>
      </Tooltip>
    </Space>
  )
}

export default WalletIntro
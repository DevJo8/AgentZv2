import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'ZoraGPT',
  projectId: '00000000000000000000000000000000', // Temporary placeholder
  chains: [base],
  ssr: true,
}) 
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'ZoraGPT',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Ganti dengan project ID Anda
  chains: [base],
  ssr: true,
}) 
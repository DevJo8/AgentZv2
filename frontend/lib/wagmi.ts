import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'ZoraGPT',
  projectId: '124aec3293fea72f332c238fcc985c34', // Your WalletConnect Project ID
  chains: [base],
  ssr: true,
}) 
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle, Copy, Check } from "lucide-react"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useState } from 'react'

export default function Navbar() {
  const { address, isConnected } = useAccount()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.1] bg-slate-950/50 backdrop-blur-xl transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-r from-violet-600 to-blue-600 p-2 rounded-xl shadow-[0_0_20px_2px_rgba(139,92,246,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_4px_rgba(139,92,246,0.4)]">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 to-blue-200">
              ZoraGPT
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/documentation" className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200">
              Documentation
            </Link>
            <Link href="/community" className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200">
              Community
            </Link>
            
            {isConnected && address && (
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                <div className="text-xs text-gray-300">Contract:</div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-blue-300">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(address)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Copy contract address"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <ConnectButton />
          </div>

          <div className="md:hidden flex items-center gap-2">
            {isConnected && address && (
              <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded px-2 py-1 border border-white/10">
                <span className="text-xs font-mono text-blue-300">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
                <button
                  onClick={() => copyToClipboard(address)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {copied ? (
                    <Check className="h-2 w-2 text-green-400" />
                  ) : (
                    <Copy className="h-2 w-2 text-gray-400" />
                  )}
                </button>
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  )
}


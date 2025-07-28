"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle, Copy, Check } from "lucide-react"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useState } from 'react'

export default function Navbar() {
  const { address, isConnected } = useAccount()
  const [caCopied, setCaCopied] = useState(false)

  const copyCA = async () => {
    try {
      await navigator.clipboard.writeText("19YEUWUWUUWUWU")
      setCaCopied(true)
      setTimeout(() => setCaCopied(false), 2000)
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
            
            {/* CA Display */}
            <div className="bg-black/30 hover:bg-black/40 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 flex items-center gap-1.5 md:gap-2 shadow-glow-sm text-sm md:text-base">
              <span className="text-indigo-100">CA :</span>
              <span className="text-indigo-100 font-mono">19YEUWUWUUWUWU</span>
              <button
                onClick={copyCA}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Copy CA"
              >
                {caCopied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-indigo-300" />
                )}
              </button>
            </div>
            
            <ConnectButton />
          </div>

          <div className="md:hidden flex items-center gap-2">
            {/* CA Display Mobile */}
            <div className="bg-black/30 hover:bg-black/40 text-white font-medium py-1.5 px-2 rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 flex items-center gap-1 shadow-glow-sm text-xs">
              <span className="text-indigo-100">CA:</span>
              <span className="text-indigo-100 font-mono">19YEUWUWUUWUWU</span>
              <button
                onClick={copyCA}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                {caCopied ? (
                  <Check className="h-2 w-2 text-green-400" />
                ) : (
                  <Copy className="h-2 w-2 text-indigo-300" />
                )}
              </button>
            </div>
            
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  )
}


"use client"

import { motion } from "framer-motion"

interface PromptSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
}

export default function PromptSuggestions({ onSuggestionClick }: PromptSuggestionsProps) {
  const suggestions = [
    {
      title: "Get my wallet balance",
      description: "Get the balance of your wallet",
      prompt: "Get my wallet balance",
    },
    {
      title: "Transfer ETH to another wallet",
      description: "Transfer ETH to another wallet",
      prompt: "transfer 0.1 eth to wallet address ",
    },
    {
      title: "Should I buy ZoraGPT today?",
      description: "Get comprehensive analysis on ZoraGPT - Revolutionary AI on Base Network",
      prompt: "Should I buy ZoraGPT today?",
    },
    {
      title: "What is the price of Ethereum today?",
      description: "Get the latest price of Ethereum",
      prompt: "What is the price of Ethereum today?",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto"
    >
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={index}
          variants={item}
          onClick={() => onSuggestionClick(suggestion.prompt)}
          className="group relative p-4 md:p-6 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all duration-300 text-left"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-white mb-2">{suggestion.title}</h3>
            <p className="text-indigo-200/70 text-sm">{suggestion.description}</p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  )
}


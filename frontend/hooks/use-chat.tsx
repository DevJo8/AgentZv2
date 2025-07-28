"use client"

import type React from "react"

import { useState } from "react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const clearChat = () => {
    setMessages([])
    setInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response with a more realistic delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(input),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  // Enhanced mock AI response function
  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes("hello") || input.includes("hi")) {
      return "Hello! I'm ZoraGPT, your AI assistant. How can I help you today? I can provide information, answer questions, or assist with various tasks."
    } else if (input.includes("help")) {
      return "I'm here to help! You can ask me questions, request information, or get assistance with various tasks. Just let me know what you need, and I'll do my best to assist you."
    } else if (input.includes("feature") || input.includes("do")) {
      return "I have several features to assist you. I can provide information, answer questions, help with tasks, analyze data, and offer insights. Is there something specific you'd like to explore?"
    } else if (input.includes("thank")) {
      return "You're welcome! I'm always here to help. Feel free to reach out anytime you need assistance."
    } else if (input.includes("how are you")) {
      return "I'm functioning well, thank you for asking! I'm ready to assist you with whatever you need. How can I help you today?"
    } else {
      return "Thanks for your message. I'm analyzing your request and will provide the most helpful response. Is there anything specific you'd like me to focus on?"
    }
  }

  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    clearChat,
    setInput,
  }
}


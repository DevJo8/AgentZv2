"use client"

import { ReactNode } from 'react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { MessageCircle, User } from "lucide-react"
import { motion } from "framer-motion"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string | ReactNode
  isLast?: boolean
  actionAnalysis?: string
}

export default function ChatMessage({ role, content, isLast = false }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        type: "spring",
        bounce: 0.3,
        delay: isLast ? 0.1 : 0,
      }}
      className={cn("flex gap-4 max-w-4xl mx-auto", role === "user" ? "justify-end" : "justify-start")}
    >
      {role === "assistant" && (
        <Avatar className="h-10 w-10 rounded-full border border-white/10 shadow-glow-sm bg-gradient-to-br from-violet-600 to-blue-600">
          <AvatarFallback className="rounded-full text-white">
            <MessageCircle className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "relative p-5 rounded-2xl backdrop-blur-md max-w-[80%] shadow-glow-sm",
          role === "user"
            ? "bg-gradient-to-r from-blue-600/20 to-blue-600/10 border border-blue-500/20 rounded-tr-sm"
            : "bg-black/20 border border-white/10 rounded-tl-sm",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-2xl opacity-10",
            role === "user"
              ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/20"
              : "bg-gradient-to-r from-violet-600/20 to-indigo-600/10",
          )}
        />

        <div className="relative z-10">
          <div className={cn("font-medium mb-1 text-sm", role === "assistant" ? "text-violet-200" : "text-blue-200")}>
            {role === "assistant" ? "ZoraGPT" : "You"}
          </div>
          <div className="prose prose-invert max-w-none text-white/90 leading-relaxed">
            {typeof content === 'string' ? content : content}
          </div>
        </div>
      </div>

      {role === "user" && (
        <Avatar className="h-10 w-10 rounded-full border border-white/10 shadow-glow-sm bg-gradient-to-br from-blue-600 to-indigo-600">
          <AvatarFallback className="rounded-full text-white">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  )
}

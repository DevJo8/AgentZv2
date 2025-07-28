"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import {
  MessageCircle,
  Home,
  PlusCircle,
  Sparkles,
  Send,
  ExternalLink,
} from "lucide-react"
import { RiTwitterXFill } from "react-icons/ri"
import ChatMessage from "@/components/chat-message"
import { ConversationSummaryMemory } from "langchain/memory";
import { useChat } from "@/hooks/use-chat"
import { useRouter } from "next/navigation"
import PromptSuggestions from "@/components/prompt-suggestions"
import { AnimatedTooltip } from "@/components/ui/aceternity/animated-tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { WavyBackground } from "@/components/ui/aceternity/wavy-background"
import { cn } from "@/lib/utils"
import axios from 'axios'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Copy, Check } from 'lucide-react'
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicTool, tool } from "@langchain/core/tools";
import { OpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea"
import { clear } from "console"
import ReactMarkdown from 'react-markdown'
import { VideoBackground } from "@/components/ui/video-background"


interface ChatMessageType {
  id: number;
  role: string;
  content: string;
  actionAnalysis?: string;
}

const LoadingText = () => {
  const keywords = [
   "Processing your request with AI-powered automation...",
   "Communicating with Base blockchain for real-time data...",
    "Retrieving and analyzing the required information...",
   "Ensuring accuracy and security while handling your request...",
   "Optimizing data retrieval for a seamless experience...",
   "Executing necessary operations on the blockchain...",
   "Fetching relevant details while maintaining efficiency...",
   "Applying smart algorithms to streamline your request...",
   "Verifying and structuring the response for clarity...",
"Finalizing the results—almost there!"
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % keywords.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-indigo-400 text-sm animate-fade-in-out">
      {keywords[currentIndex]}
    </span>
  );
};

export default function ChatPage() {
  const router = useRouter()
  const { isLoading, clearChat } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInputState] = useState('') 
  const [isLoading2, setIsLoading] = useState(false) 
  const [caCopied, setCaCopied] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('chatMessages');
      return savedMessages ? JSON.parse(savedMessages) : [];
    }
    return [];
  });
  
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // Function to clear chat history
  const handleClearChat = () => {
    setChatMessages([]);
    localStorage.removeItem('chatMessages');
  };

  const copyCA = async () => {
    try {
      await navigator.clipboard.writeText("19YEUWUWUUWUWU")
      setCaCopied(true)
      setTimeout(() => setCaCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  async function getEtherPriceFunc() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
    const res = await fetch(url);
    const data = await res.json();
    const etherPrice = data.ethereum.usd;
    return etherPrice;
  }

  // Check wallet connection on page load
  useEffect(() => {
    if (!isConnected) {
      console.error("No wallet connected");
      router.push("/");
    }
  }, [isConnected]);

  // tools for ai agent
  const tools = [
    new DynamicTool({
      name: "getBalance",
      description: "Gets the ETH balance of a wallet. It doesn't require any input.",
      func: async (input:string) => {
        try {
          if(!address){
            return "No wallet connected";
          }
          const balanceData = await publicClient.getBalance({ address });
          return `Balance: ${formatEther(balanceData)} ETH`;
        } catch (error: any) {
          return `Error: ${error.message}`;
        }
      },
    }),
    new DynamicTool({
      name: "transferETH",
      description: "Transfers ETH to receiver's wallet. Input format: receiverAddress,amount",
      func: async (input: string) => {
        try {
          if (!address || !walletClient) return "No wallet connected";
          const [receiver, amount] = input.split(',');
          const amountWei = parseEther(amount);

          const hash = await walletClient.sendTransaction({
            to: receiver as `0x${string}`,
            value: amountWei,
          });
          
          return `Transfer successful: ${hash}`;
        } catch (error: any) {
          return `Error: ${error.message}`;
        }
      },
    }),
    new DynamicTool({
      name: "getTransactionCost",
      description: "Estimates the transaction cost for an ETH transfer. This tool doesn't require any input.",
      func: async (input: string) => {
        try {
          if (!address) return "No wallet connected";
          const gasPrice = await publicClient.getGasPrice();
          const estimatedGas = 21000n; // Standard ETH transfer gas
          const estimatedCost = gasPrice * estimatedGas;
          return `Estimated transaction cost: ${formatEther(estimatedCost)} ETH`;
        } catch (error: any) {
          return `Error: ${error.message}`;
        }
      },
    }),
    new DynamicTool({
      name: "getAccountInfo",
      description: "Gets detailed account information for a wallet. This function does not require any input.",
      func: async (input:string) => {
        try {
          if (!address) return "No wallet connected";
          
          const balanceData = await publicClient.getBalance({ address });
          const nonce = await publicClient.getTransactionCount({ address });
          
          return JSON.stringify({
            address: address,
            balance: formatEther(balanceData),
            nonce: nonce,
            chainId: await publicClient.getChainId()
          }, null, 2);
        } catch (error: any) {
          return `Error: ${error.message}`;
        }
      },
    }),
    new DynamicTool({
      name: "getFinancialAdvice",
      description: "Provides financial advice about a crypto coin based on the user's query. The query should be about only one coin at a time. For example: 'Should I buy ethereum today', 'Give me information and advice about BTC'.  Input format: query.",
      func: async (input: string) => {
        try {
          const response = await axios.post('https://solbot-production-82ef.up.railway.app/analyze', {
            user_query: input
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000 // 30 second timeout
          });
          
          if (response.data && response.data.final_response) {
            return JSON.stringify(response.data);
          } else {
            return JSON.stringify({
              error: "No valid response from financial advisor",
              final_response: "I apologize, but I couldn't get a proper response from the financial advisor. Please try again later."
            });
          }
        } catch (error: any) {
          console.error("Financial advice error:", error);
          
          // Handle CORS error specifically
          if (error.message && error.message.includes('CORS')) {
            return JSON.stringify({
              error: "CORS error - backend not accessible",
              final_response: "I apologize, but there's a configuration issue with the financial advisor service. The backend is not properly configured to accept requests from this domain. Please contact support."
            });
          }
          
          if (error.code === 'ECONNABORTED') {
            return JSON.stringify({
              error: "Request timeout",
              final_response: "I apologize, but the financial advisor is taking too long to respond. Please try again later."
            });
          }
          
          if (error.response?.status === 500) {
            return JSON.stringify({
              error: "Server error",
              final_response: "I apologize, but there's a server error with the financial advisor. Please try again later."
            });
          }
          
          if (error.message && error.message.includes('Network Error')) {
            return JSON.stringify({
              error: "Network error",
              final_response: "I apologize, but I'm having trouble connecting to the financial advisor. This might be due to a CORS configuration issue or the service being temporarily unavailable. Please try again later."
            });
          }
          
          return JSON.stringify({
            error: "Unknown error",
            final_response: "I apologize, but I encountered an unexpected error while trying to get financial advice. Please try again later."
          });
        }
      },
    }),
     new DynamicTool({
      name: "getEtherPrice",
      description: "Fetches current price of Ethereum. This function does not requires any input.",
      func: async (input: string) => {
        return getEtherPriceFunc();
      }
    }),
    new DynamicTool({
        name: "DirectAnswer",
        description: "Use this tool when you can answer the question directly without any other tools.",
        func: async (input) => {
            return input;
        },
    }),
  ];

function print(input: any) {
  console.log(input)
}

const llm = new ChatOpenAI({
  temperature: 0,
  model: "gpt-4o",
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// ai agent
async function aiAgent(input: string) {
  console.clear()
  
  var chat_history = ""
        if (chatMessages.length > 0) {
            chat_history = "Previous conversation history:\n"
        }
        for (const chat_msg of chatMessages) { chat_history += `${chat_msg.role}: ${chat_msg.content}\n`; }
  console.log("Chat History yo yo: ", chat_history);
  try {
    const customPrompt = PromptTemplate.fromTemplate(`
You are an intelligent Base blockchain assistant that helps users perform operations and provide relevant information about Base blockchain. You have access to the following tools:

{tools}

Important Instructions:
- If you find yourself repeating the same actions without progress, inform the user that their query cannot be processed in its current form
- If any required information is missing from the user's query, politely explain what's missing and ask them to provide the necessary details
- Always verify wallet connection status before attempting operations
- Present blockchain data in a clear, readable format
- For transfers, confirm amount and recipient before proceeding

## Important Instructions for "getFinancialAdvice" tool:
!!! This tool can have query about a single coin at a time. For example: 'Should I buy ethereum today', 'Give me information and advice about BTC'. 
!!! If user asks for financial advice about multiple coins, First call this tool querying about first coin then second coin and so on.
!!! Dont call this tool multiple times. If output is already available about a coin then don't call this tool again for that coin.
!!! if user asks about price of ethereum please call getEtherPrice tool.
!!! IMPORTANT: For questions like "Should I buy Ethereum today?", use getFinancialAdvice tool with the exact question.

## Most important:
!!! Dont call any tool multiple times. or keep calling it continuosly. If a tool is called once learn its output or move to the next step. 
!!! Please dont call any tool if it does not exist. you have only these tools: {tool_names}
!!! Calculating transaction cost is not necessary for transferring. So if you want to trasnfer directly use transferETH function.
!!! You dont need to confirm anything from user. Keep the execution going. 
!!! Dont use any tool if you dont need it. 
!!! Keep the input format same as user's query. Don't include any thing extra. There should be only input parameters of function separated by comma and nothing extra.
!!! This one is most important of all. Do not break the following format. Whatever happens, dont break output format even if the error occurs or something went wrong or something is incomplete.
!!! If you feel you have the direct answer without using any tools, don't break the thought action format - use DirectAnswer tool so that error does not occur.

## MOST MOST IMPORTANT 
!!! This is the most important one... Do not break the output format at any cost even if something unexpected occured you need to notify it in the form of Final Answer but never break the output format.
!!! If you feel you have the direct answer without using any tools dont break the thought action format use DirectAnswer tool so that error does not occurs.
!!! Please understand the context of chat properly from previous conversation history (maybe given below). You will be given user message there is a chance it is a followup to previous request so you have to resolve that request intelligently.

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [getBalance, transferETH, getTransactionCost, getAccountInfo, getFinancialAdvice, getEtherPrice, DirectAnswer]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Previous conversation history:
{chat_history}

Question: {input}

{agent_scratchpad}
`);

    const agent = await createReactAgent({
      llm,
      tools,
      prompt: customPrompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      maxIterations: 5,
      returnIntermediateSteps: true,
    });

    const result = await agentExecutor.invoke({
      input: input,
      chat_history: chat_history,
    });

    console.log("Final Result:", result.output);
    console.log("Action Analysis:", result.intermediateSteps);

    // Check if agent stopped due to max iterations
    if (result.output === "Agent stopped due to max iterations.") {
      return {
        final_result: "I apologize, but I'm having trouble processing your request. This might be due to the complexity of the query or a temporary issue. Please try rephrasing your question or ask something simpler.",
        action_analysis: ["Agent stopped due to max iterations - request too complex"]
      };
    }

    return {
      final_result: result.output,
      action_analysis: result.intermediateSteps ? result.intermediateSteps.map((step: any) => {
        return `Action: ${step.action.tool}\nInput: ${step.action.toolInput}\nOutput: ${step.observation}`;
      }) : []
    };

  } catch (error: any) {
    console.error("Error in aiAgent:", error);
    
    // Check if it's an API key error
    if (error?.message && error.message.includes('API key')) {
      return {
        final_result: "I apologize, but there's an issue with the API configuration. Please check your OpenAI API key.",
        action_analysis: ["API key configuration error"]
      };
    }
    
    // Check if it's a network error
    if (error?.message && error.message.includes('fetch')) {
      return {
        final_result: "I apologize, but there's a network connection issue. Please check your internet connection and try again.",
        action_analysis: ["Network connection error"]
      };
    }
    
    return {
      final_result: `I apologize, but I encountered an error while processing your request: ${error?.message || 'Unknown error'}. Please try again or rephrase your question.`,
      action_analysis: [`Error: ${error?.message || 'Unknown error'}`]
    };
  }
}

  const handleNewChat = () => {
    setChatMessages([]);
    localStorage.removeItem('chatMessages');
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputState(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const generateUniqueId = () => {
    return Date.now() + Math.random();
  };

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (input.trim() === '') return;
    if (!isConnected) {
      console.error("No wallet connected");
      router.push("/")
      return;
    } 
    
    const userMessage: ChatMessageType = { id: Date.now(), role: 'user', content: input };
    setChatMessages((prev) => [...prev, userMessage]);
    setInputState('');
    setIsLoading(true);

     try {
      const response = await aiAgent(userMessage.content);
      
      if (!response || !response.final_result || !response.action_analysis) {
        throw new Error("Invalid response from AI agent");
      }
      
      const robotMessage: ChatMessageType = { 
        id: Date.now() + 1,
        role: 'assistant',
        content: response.final_result,
        actionAnalysis: response.action_analysis && response.action_analysis.length > 0 ? response.action_analysis.join('\n') : undefined
      };
      setChatMessages((prev) => [...prev, robotMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessageType = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.",
        actionAnalysis: "An error occurred during processing"
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <VideoBackground />
      
      <main className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-4 md:p-6 border-b border-white/[0.1] bg-slate-950/50 backdrop-blur-xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-gradient-to-r from-[#2596be]/80 to-[#2596be] rounded-full shadow-glow-sm flex items-center justify-center overflow-hidden w-8 h-8 md:w-10 md:h-10">
              <img src="/zoragpt-icon.png" alt="ZoraGPT" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2596be]/90 to-[#2596be]">
            ZoraGPT
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* CA Display */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="bg-black/30 hover:bg-black/40 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 flex items-center gap-1.5 md:gap-2 shadow-glow-sm text-sm md:text-base"
            >
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
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open('https://github.com/your-repo/issues', '_blank')}
              className="bg-black/30 hover:bg-black/40 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 flex items-center gap-1.5 md:gap-2 shadow-glow-sm text-sm md:text-base"
            >
              <span className="text-indigo-100">Report Bug</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearChat}
              className="bg-black/30 hover:bg-black/40 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 flex items-center gap-1.5 md:gap-2 shadow-glow-sm text-sm md:text-base"
            >
              <span className="text-indigo-100">Clear Chat</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNewChat}
              className="bg-black/30 hover:bg-black/40 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 flex items-center gap-1.5 md:gap-2 shadow-glow-sm text-sm md:text-base"
            >
              <PlusCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-300" />
              <span className="text-indigo-100">New Chat</span>
            </motion.button>
            <ConnectButton />
          </div>
        </header>

        {/* Main content */}
        <div className="relative flex-1 overflow-auto p-2 md:p-4 scrollbar-thin scrollbar-thumb-indigo-600/30 scrollbar-track-transparent">
          <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6 mb-4 px-1 md:px-2 max-w-4xl mx-auto">
            {chatMessages.length === 0 ? (
              <div className="space-y-6 md:space-y-10 py-6 md:py-10">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                    className="relative w-24 h-24 md:w-32 md:h-32 mx-auto"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gradient-to-r from-[#2596be]/80 to-[#2596bf] rounded-full shadow-glow-lg animate-pulse-slow flex items-center justify-center overflow-hidden w-20 h-20 md:w-24 md:h-24">
                        <img src="/zoragpt-chat-icon.png" alt="ZoraGPT Chat" className="w-full h-full object-cover rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-2xl md:text-4xl font-bold mt-4 md:mt-6 text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-indigo-200 to-blue-200"
                  >
                    How can I assist you today?
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-indigo-200/80 mt-2 md:mt-3 max-w-md mx-auto text-sm md:text-base"
                  >
                    Ask me anything or select a suggestion below
                  </motion.p>
                </div>
                <PromptSuggestions onSuggestionClick={handleSuggestionClick} />
              </div>
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {chatMessages.map((message, index) => (
                    <div key={message.id}>
                      <ChatMessage
                        role={message.role as "user" | "assistant"}
                        content={
                          message.role === 'assistant' ? (
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          ) : message.content
                        }
                        isLast={index === chatMessages.length - 1}
                      />
                      {message.actionAnalysis && (
                        <div className="mt-1 md:mt-2">
                          <button
                            className="text-blue-500 text-sm md:text-base"
                            onClick={() => {
                              const actionAnalysisElement = document.getElementById(`action-analysis-${message.id}`);
                              if (actionAnalysisElement) {
                                actionAnalysisElement.classList.toggle('hidden');
                              }
                            }}
                          >
                            {message.actionAnalysis ? 'Show Action Analysis' : 'Hide Action Analysis'}
                          </button>
                          <div id={`action-analysis-${message.id}`} className="hidden text-sm md:text-base">
                            <ReactMarkdown>
                              {message.actionAnalysis}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </AnimatePresence>

                {isLoading2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center py-8"
                  >
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                      <LoadingText />
                    </div>
                  </motion.div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <div className="border-t border-white/[0.1] bg-slate-950/50 backdrop-blur-xl p-4 md:p-6">
          <form onSubmit={handleSubmitForm} className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3 md:gap-4">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInputState(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ask me anything about Base blockchain, transfers, or get financial advice..."
                  className={cn(
                    "min-h-[60px] max-h-[200px] resize-none border border-white/10 bg-black/20 backdrop-blur-sm text-white placeholder:text-white/50 rounded-2xl px-4 py-3 pr-12 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300",
                    isFocused && "border-indigo-500/50 ring-2 ring-indigo-500/20"
                  )}
                  style={{
                    boxShadow: isFocused 
                      ? '0 0 20px rgba(99, 102, 241, 0.3)' 
                      : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading2}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-3 md:p-4 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-glow-sm",
                  (!input.trim() || isLoading2) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLoading2 ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Social Media Icons */}
        <div className="fixed bottom-4 md:bottom-6 right-4 md:right-6 flex flex-row gap-3 md:gap-4 z-20">
          <a 
            href="https://twitter.com/your_twitter" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-[#2596be] hover:text-white transition-all duration-300"
          >
            <RiTwitterXFill className="h-5 w-5" />
          </a>
          <a 
            href="https://dexscreener.com/your_dex" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-[#2596be] hover:text-white transition-all duration-300"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>

      </main>
    </div>
  )
}

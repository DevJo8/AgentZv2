import Link from "next/link"
import { MessageCircle, Github, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.1] bg-slate-950/80 backdrop-blur-sm py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-violet-500" />
              <span className="text-xl font-bold text-white">ZoraGPT</span>
            </Link>
            <p className="mt-4 text-blue-100/70">Your AI assistant for insights and productivity.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/documentation"
                  className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200">
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200">
                  API
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/community" className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200">
                  Community
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com"
                  className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200 flex items-center gap-2"
                >
                  <Github className="h-4 w-4" /> GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="https://twitter.com"
                  className="text-blue-100/70 hover:text-blue-100 transition-colors duration-200 flex items-center gap-2"
                >
                  <Twitter className="h-4 w-4" /> Twitter
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.1] text-center text-blue-100/70">
          <p>© {new Date().getFullYear()} ZoraGPT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


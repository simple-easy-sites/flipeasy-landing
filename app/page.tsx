"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Check, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Inter } from "next/font/google"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

// Enhanced 3D Icons with better design
const Camera3D = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="cameraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <linearGradient id="cameraLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
        </linearGradient>
        <filter id="cameraShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0891b2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Main camera body */}
      <rect x="25" y="40" width="70" height="50" rx="12" fill="url(#cameraGrad)" filter="url(#cameraShadow)" />
      <rect x="25" y="40" width="70" height="25" rx="12" fill="url(#cameraLight)" opacity="0.3" />

      {/* Lens */}
      <circle cx="60" cy="65" r="18" fill="#ffffff" opacity="0.9" />
      <circle cx="60" cy="65" r="14" fill="url(#cameraGrad)" />
      <circle cx="60" cy="65" r="8" fill="#ffffff" opacity="0.4" />

      {/* Flash */}
      <rect x="35" y="30" width="12" height="8" rx="4" fill="url(#cameraGrad)" />

      {/* Floating elements */}
      <circle cx="100" cy="30" r="3" fill="#67e8f9" opacity="0.6" />
      <circle cx="20" cy="35" r="2" fill="#06b6d4" opacity="0.8" />
    </svg>
  </div>
)

const Microphone3D = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="micGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#fed7aa" />
        </linearGradient>
        <linearGradient id="micLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
        </linearGradient>
        <filter id="micShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#f97316" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Microphone body */}
      <ellipse cx="60" cy="45" rx="18" ry="25" fill="url(#micGrad)" filter="url(#micShadow)" />
      <ellipse cx="60" cy="40" rx="18" ry="12" fill="url(#micLight)" opacity="0.4" />

      {/* Stand */}
      <rect x="57" y="70" width="6" height="25" fill="url(#micGrad)" />
      <rect x="45" y="92" width="30" height="6" rx="3" fill="url(#micGrad)" />

      {/* Sound waves */}
      <path d="M 30 40 Q 20 45 30 50" stroke="#fb923c" strokeWidth="3" fill="none" opacity="0.7" />
      <path d="M 90 40 Q 100 45 90 50" stroke="#fb923c" strokeWidth="3" fill="none" opacity="0.7" />
      <path d="M 25 35 Q 10 45 25 55" stroke="#fed7aa" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M 95 35 Q 110 45 95 55" stroke="#fed7aa" strokeWidth="2" fill="none" opacity="0.5" />

      {/* Floating elements */}
      <circle cx="105" cy="25" r="2.5" fill="#fed7aa" opacity="0.8" />
      <circle cx="15" cy="30" r="2" fill="#fb923c" opacity="0.6" />
    </svg>
  </div>
)

const Document3D = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
      <defs>
        <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
        <linearGradient id="docLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
        </linearGradient>
        <filter id="docShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#059669" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Document */}
      <rect x="30" y="20" width="55" height="70" rx="8" fill="url(#docGrad)" filter="url(#docShadow)" />
      <rect x="30" y="20" width="55" height="35" rx="8" fill="url(#docLight)" opacity="0.4" />

      {/* Text lines */}
      <rect x="38" y="35" width="35" height="3" rx="1.5" fill="#ffffff" opacity="0.9" />
      <rect x="38" y="45" width="40" height="3" rx="1.5" fill="#ffffff" opacity="0.8" />
      <rect x="38" y="55" width="30" height="3" rx="1.5" fill="#ffffff" opacity="0.7" />
      <rect x="38" y="65" width="38" height="3" rx="1.5" fill="#ffffff" opacity="0.6" />

      {/* Sparkles */}
      <g>
        <circle cx="95" cy="30" r="3" fill="#fbbf24" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="45" r="2" fill="#f59e0b" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="40" r="2.5" fill="#fbbf24" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="15" cy="60" r="2" fill="#f59e0b" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  </div>
)

// Floating background elements
const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-200/20 to-cyan-400/20 rounded-full blur-xl"
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-orange-200/20 to-orange-400/20 rounded-2xl blur-lg"
      animate={{
        y: [0, 20, 0],
        rotate: [0, 15, 0],
        scale: [1, 0.9, 1],
      }}
      transition={{
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute bottom-40 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-200/20 to-emerald-400/20 rounded-full blur-lg"
      animate={{
        y: [0, -25, 0],
        x: [0, -10, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 7,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    />
  </div>
)

export default function FlipEasyLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [0.8, 0.95])

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 relative overflow-hidden ${inter.className}`}
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-orange-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.1),transparent_50%)]" />

      <FloatingElements />

      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
        style={{ backdropFilter: "blur(20px)", opacity: headerOpacity }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 px-6 py-3 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-cyan-700 to-slate-900 bg-clip-text text-transparent">
                  FlipEasy
                </span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#how-it-works" className="text-slate-700 hover:text-slate-900 transition-colors font-medium">
                  How it Works
                </a>
                <a href="#benefits" className="text-slate-700 hover:text-slate-900 transition-colors font-medium">
                  Benefits
                </a>
              </nav>

              {/* CTA Button */}
              <div className="hidden md:block">
                <Link href="/create">
                  <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                    Try Demo
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Mobile menu button */}
              <button className="md:hidden text-slate-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="md:hidden mt-4 mx-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-xl">
              <nav className="flex flex-col space-y-4">
                <a href="#how-it-works" className="text-slate-700 hover:text-slate-900 transition-colors font-medium">
                  How it Works
                </a>
                <a href="#benefits" className="text-slate-700 hover:text-slate-900 transition-colors font-medium">
                  Benefits
                </a>
                <Link href="/create" className="w-full">
                  <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full font-medium">
                    Try Demo
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </nav>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Hero Section */}
      <section className="relative px-4 pt-28 pb-16 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Badge className="mb-8 bg-white/60 text-slate-700 border-white/40 hover:bg-white/80 backdrop-blur-sm px-4 py-2 shadow-lg font-medium">
                  <Check className="w-4 h-4 mr-2" />
                  No Signup Required
                </Badge>
              </motion.div>

              <motion.h1
                className="text-5xl lg:text-7xl font-light text-slate-900 mb-8 leading-tight tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Turn clutter into cash in{" "}
                <span className="font-semibold bg-gradient-to-r from-cyan-600 via-cyan-500 to-orange-500 bg-clip-text text-transparent">
                  60 seconds
                </span>
              </motion.h1>

              <motion.p
                className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl font-normal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                AI-powered listings that actually sell. No stress, no guesswork, just results.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <Link href="/create">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white px-10 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 font-semibold"
                  >
                    Try Demo → No Signup Required
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Enhanced Phone Mockup */}
            <motion.div
              className="relative flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <motion.div
                className="relative"
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-300/30 to-orange-300/30 rounded-3xl blur-3xl transform scale-110" />

                {/* Phone container */}
                <Card className="relative w-80 h-[600px] bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl overflow-hidden">
                  {/* Phone header */}
                  <div className="p-6 border-b border-slate-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-700 border-blue-200/50 font-medium">
                        Facebook Marketplace
                      </Badge>
                    </div>
                  </div>

                  {/* Split screen content */}
                  <div className="p-6 h-full">
                    <div className="grid grid-cols-2 gap-4 h-full">
                      {/* Before side */}
                      <div className="space-y-4">
                        <h3 className="text-slate-500 text-sm font-semibold">Before</h3>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                          <div className="space-y-3">
                            <div className="h-3 bg-slate-200 rounded animate-pulse"></div>
                            <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                            <div className="h-20 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                              <span className="text-slate-400 text-xs font-medium">Add photo</span>
                            </div>
                            <div className="space-y-2">
                              <div className="h-2 bg-slate-200 rounded animate-pulse"></div>
                              <div className="h-2 bg-slate-200 rounded w-2/3 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* After side */}
                      <div className="space-y-4">
                        <h3 className="text-emerald-600 text-sm font-semibold">After</h3>
                        <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-4 border border-emerald-200/50">
                          <div className="space-y-3">
                            <div className="text-slate-900 text-xs font-semibold">Vintage Leather Armchair</div>
                            <div className="text-emerald-600 text-lg font-bold">$450</div>
                            <div className="h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-sm"></div>
                            <div className="text-slate-600 text-xs leading-relaxed">
                              "Beautiful vintage leather armchair in excellent condition. Rich brown leather with
                              minimal wear..."
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                              <span className="text-emerald-600 text-xs font-medium">Live</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Floating elements around phone */}
                <motion.div
                  className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-lg"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute -bottom-6 -left-6 w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-lg"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, -90, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-6 tracking-tight">
              Three simple steps to
              <span className="block font-semibold bg-gradient-to-r from-cyan-600 to-orange-500 bg-clip-text text-transparent">
                transform your clutter
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-normal">
              From photo to professional listing in under a minute
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera3D,
                title: "Snap a photo",
                description: "Just point and shoot. Our AI works with any photo quality.",
                gradient: "from-cyan-500 to-cyan-600",
                delay: 0,
              },
              {
                icon: Microphone3D,
                title: "Speak naturally",
                description: "Tell us about your item in your own words. No scripts needed.",
                gradient: "from-orange-500 to-orange-600",
                delay: 0.2,
              },
              {
                icon: Document3D,
                title: "Get perfect listings",
                description: "Professional copy, optimal pricing, ready for any platform.",
                gradient: "from-emerald-500 to-emerald-600",
                delay: 0.4,
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: step.delay }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
              >
                <Card className="p-8 text-center bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl relative overflow-hidden group">
                  <motion.div
                    className="w-20 h-20 mx-auto mb-6 relative"
                    whileHover={{
                      scale: 1.1,
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <step.icon className="w-full h-full" />
                  </motion.div>

                  <h3 className="text-xl font-semibold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-normal">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section id="benefits" className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-6 tracking-tight">
              Why FlipEasy
              <span className="block font-semibold bg-gradient-to-r from-cyan-600 to-orange-500 bg-clip-text text-transparent">
                actually works
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-normal">
              We know selling feels overwhelming. That's why we built something different.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Save 30+ minutes per listing",
                description: "No more staring at blank forms or researching prices",
                stat: "28 min",
                statLabel: "Average time saved",
                gradient: "from-cyan-500 to-cyan-600",
              },
              {
                title: "Professional listings instantly",
                description: "AI-optimized copy that buyers actually read and respond to",
                stat: "3x",
                statLabel: "Better engagement",
                gradient: "from-orange-500 to-orange-600",
              },
              {
                title: "Smart pricing, no guesswork",
                description: "Market-based pricing that maximizes your profit",
                stat: "94%",
                statLabel: "Accuracy rate",
                gradient: "from-emerald-500 to-emerald-600",
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="p-8 bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl relative overflow-hidden group">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`text-right bg-gradient-to-r ${benefit.gradient} bg-clip-text text-transparent`}>
                      <div className="text-3xl font-bold">{benefit.stat}</div>
                      <div className="text-sm text-slate-500 font-medium">{benefit.statLabel}</div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mb-4">{benefit.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-normal">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-6 tracking-tight">
              The FlipEasy
              <span className="block font-semibold bg-gradient-to-r from-cyan-600 to-orange-500 bg-clip-text text-transparent">
                difference
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-normal">
              See how we transform the selling experience
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="p-10 bg-gradient-to-br from-red-50 to-red-100/50 backdrop-blur-xl border border-red-200/50 rounded-3xl shadow-xl">
                <h3 className="text-2xl font-semibold text-red-700 mb-6">The Old Way</h3>
                <div className="space-y-4 text-red-600">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-lg font-medium">30+ minutes per listing</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-lg font-medium">Guessing at prices</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-lg font-medium">Writer's block on descriptions</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-lg font-medium">Stress and overwhelm</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="p-10 bg-gradient-to-br from-emerald-50 to-emerald-100/50 backdrop-blur-xl border border-emerald-200/50 rounded-3xl shadow-xl">
                <h3 className="text-2xl font-semibold text-emerald-700 mb-6">The FlipEasy Way</h3>
                <div className="space-y-4 text-emerald-600">
                  <div className="flex items-center space-x-4">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg font-medium">60 seconds to perfect listing</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg font-medium">AI-powered smart pricing</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg font-medium">Professional copy automatically</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg font-medium">Calm, confident selling</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-orange-500/10" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-6xl font-light text-slate-900 mb-8 tracking-tight">
              Ready to turn your
              <span className="block font-semibold bg-gradient-to-r from-cyan-600 to-orange-500 bg-clip-text text-transparent">
                clutter into cash?
              </span>
            </h2>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-normal">
              Experience the stress-free way to sell. No commitments, no hassle.
            </p>
            <Link href="/create">
              <Button
                size="lg"
                className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white px-12 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 font-semibold"
              >
                Start Demo Now
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
            <p className="text-slate-500 mt-6 text-lg font-normal">No signup required • Try it completely free</p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

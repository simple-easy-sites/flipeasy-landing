"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Camera, Upload, Mic, Play, Pause, RotateCcw, Copy, Check, Share2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useRef, useCallback } from "react"
import { Inter } from "next/font/google"
import Link from "next/link"
import { compressImage } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

// Types
type Step = "upload" | "record" | "processing" | "results" | "success"
type Platform = "facebook" | "craigslist" | "offerup"

interface Recording {
  blob: Blob
  url: string
  duration: number
  transcript?: string
}

interface GeneratedListing {
  title: string
  description: string
  price: string
  tags: string[]
}

// Real AI processing function
const generateListings = async (photo: File, userDescription: string): Promise<Record<Platform, GeneratedListing>> => {
  const formData = new FormData();
  formData.append('image', photo);
  formData.append('description', userDescription);

  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze item');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Analysis failed');
  }

  // Transform API response to match our component interface
  const apiData = result.data;
  
  return {
    facebook: {
      title: apiData.listings.facebook.title,
      description: apiData.listings.facebook.description,
      price: apiData.listings.facebook.price,
      tags: apiData.listings.facebook.tags,
    },
    craigslist: {
      title: apiData.listings.craigslist.title,
      description: apiData.listings.craigslist.description,
      price: apiData.listings.craigslist.price,
      tags: apiData.listings.craigslist.tags,
    },
    offerup: {
      title: apiData.listings.offerup.title,
      description: apiData.listings.offerup.description,
      price: apiData.listings.offerup.price,
      tags: apiData.listings.offerup.tags,
    },
  };
}

// Components
const ProgressIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex items-center justify-center space-x-2 mb-8">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div
        key={i}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          i < currentStep
            ? "bg-gradient-to-r from-cyan-500 to-cyan-600"
            : i === currentStep
              ? "bg-gradient-to-r from-cyan-400 to-cyan-500 scale-125"
              : "bg-slate-200"
        }`}
      />
    ))}
  </div>
)

const SoundWaves = ({ isActive }: { isActive: boolean }) => (
  <div className="flex items-center justify-center space-x-1">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1 bg-white rounded-full"
        animate={
          isActive
            ? {
                height: [8, 24, 8],
                opacity: [0.5, 1, 0.5],
              }
            : { height: 8, opacity: 0.5 }
        }
        transition={{
          duration: 0.8,
          repeat: isActive ? Number.POSITIVE_INFINITY : 0,
          delay: i * 0.1,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
)

const PlatformTab = ({
  platform,
  isActive,
  onClick,
}: {
  platform: Platform
  isActive: boolean
  onClick: () => void
}) => {
  const platformConfig = {
    facebook: { name: "Facebook", color: "bg-blue-500", icon: "📘" },
    craigslist: { name: "Craigslist", color: "bg-purple-500", icon: "📋" },
    offerup: { name: "OfferUp", color: "bg-green-500", icon: "🛒" },
  }

  const config = platformConfig[platform]

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
        isActive ? `${config.color} text-white shadow-lg scale-105` : "bg-white/60 text-slate-700 hover:bg-white/80"
      }`}
    >
      <span className="text-lg">{config.icon}</span>
      <span>{config.name}</span>
    </button>
  )
}

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState<Step>("upload")
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [recording, setRecording] = useState<Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [useTextInput, setUseTextInput] = useState(false)
  const [listings, setListings] = useState<Record<Platform, GeneratedListing> | null>(null)
  const [activePlatform, setActivePlatform] = useState<Platform>("facebook")
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null)
  const [processingStatus, setProcessingStatus] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stepNumber = {
    upload: 1,
    record: 2,
    processing: 3,
    results: 3,
    success: 3,
  }[currentStep]

  // Photo upload handlers
  const handleFileSelect = useCallback(async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      try {
        // Compress image for better upload performance
        const compressedFile = await compressImage(file, 1024, 0.8);
        setUploadedPhoto(compressedFile);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback to original file
        setUploadedPhoto(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      // Set capture attribute for mobile camera access
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.setAttribute("accept", "image/*");
      fileInputRef.current.click();
    }
  }

  // Recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        const url = URL.createObjectURL(blob)
        
        // For now, we'll use a placeholder transcript
        // In the future, we could add speech-to-text here
        const placeholderTranscript = "[Voice recording captured - will be processed with image]";
        
        setRecording({
          blob,
          url,
          duration: recordingTime,
          transcript: placeholderTranscript,
        })
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setUseTextInput(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const playRecording = () => {
    if (recording && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.src = recording.url
        audioRef.current.play()
        setIsPlaying(true)
        audioRef.current.onended = () => setIsPlaying(false)
      }
    }
  }

  // Processing and results
  const processListing = async () => {
    if (!uploadedPhoto || (!recording && !textInput)) return

    setCurrentStep("processing")

    const statuses = [
      "Analyzing your photo...",
      "Identifying item details...",
      "Researching market prices...",
      "Generating platform-optimized copy...",
      "Almost ready!",
    ]

    // Show status updates while processing
    const statusInterval = setInterval(() => {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setProcessingStatus(randomStatus);
    }, 1000);

    try {
      // Get user description from recording transcript or text input
      const userDescription = recording?.transcript || textInput || "No description provided";
      
      const generatedListings = await generateListings(uploadedPhoto, userDescription);
      setListings(generatedListings);
      setCurrentStep("results");
    } catch (error) {
      console.error('Error generating listings:', error);
      setProcessingStatus('Sorry, something went wrong. Please try again.');
      // Reset to previous step after error
      setTimeout(() => {
        setCurrentStep("record");
      }, 2000);
    } finally {
      clearInterval(statusInterval);
    }
  }

  const copyListing = async (platform: Platform) => {
    if (!listings) return

    const listing = listings[platform]
    const fullText = `${listing.title}\n\nPrice: ${listing.price}\n\n${listing.description}`

    try {
      await navigator.clipboard.writeText(fullText)
      setCopiedPlatform(platform)
      setTimeout(() => setCopiedPlatform(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 ${inter.className}`}>
      {/* Dynamic background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      {/* Header */}
      <header className="px-4 py-4 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>

          <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-cyan-700 to-slate-900 bg-clip-text text-transparent">
            FlipEasy
          </span>

          <div className="text-sm text-slate-600 font-medium">Step {stepNumber} of 3</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 py-8 z-10">
        <ProgressIndicator currentStep={stepNumber - 1} totalSteps={3} />

        <AnimatePresence mode="wait">
          {/* Step 1: Photo Upload */}
          {currentStep === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">Take a photo of your item</h1>
                <p className="text-lg text-slate-600">Any photo works - our AI will make it look professional</p>
              </div>

              {!uploadedPhoto ? (
                <Card
                  className="p-12 border-2 border-dashed border-slate-300 hover:border-cyan-400 transition-colors cursor-pointer bg-gradient-to-br from-slate-50 to-white"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center space-y-6">
                    <motion.div
                      className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-full flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Camera className="w-12 h-12 text-cyan-600" />
                    </motion.div>

                    <div className="space-y-4">
                      <Button
                        size="lg"
                        onClick={handleCameraCapture}
                        className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        📸 Take Photo
                      </Button>

                      <div className="text-slate-500">or</div>

                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose from Gallery
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <Card className="p-6 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-green-700 font-medium">Looks great!</span>
                    </div>

                    <div className="relative">
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Uploaded item"
                        className="w-full max-w-md mx-auto rounded-xl shadow-lg"
                      />
                    </div>
                  </Card>

                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadedPhoto(null)
                        setPhotoPreview("")
                      }}
                      className="border-slate-300 text-slate-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>

                    <Button
                      onClick={() => setCurrentStep("record")}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Step 2: Voice Recording */}
          {currentStep === "record" && (
            <motion.div
              key="record"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">Tell us about your item</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Where did you get it? Why are you selling it? Any details that might help it sell faster?
                </p>
              </div>

              {!useTextInput ? (
                <div className="space-y-8">
                  {/* Recording Interface */}
                  <Card className="p-8 bg-white/80 backdrop-blur-sm text-center">
                    {!recording ? (
                      <div className="space-y-6">
                        <motion.button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-2xl transition-all duration-300 ${
                            isRecording
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105"
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isRecording ? (
                            <div className="space-y-2">
                              <div className="w-6 h-6 bg-white rounded"></div>
                              <SoundWaves isActive={isRecording} />
                            </div>
                          ) : (
                            <Mic className="w-12 h-12" />
                          )}
                        </motion.button>

                        {isRecording && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <div className="text-2xl font-mono text-red-600">{formatTime(recordingTime)}</div>
                            <div className="text-sm text-slate-600">Tap to stop recording</div>
                          </motion.div>
                        )}

                        {!isRecording && (
                          <div className="space-y-4">
                            <div className="text-lg font-medium text-slate-900">🎤 Start Recording</div>
                            <div className="text-sm text-slate-600">Max 60 seconds</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex items-center justify-center space-x-4">
                          <Button onClick={playRecording} variant="outline" className="border-slate-300 bg-transparent">
                            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                            {isPlaying ? "Pause" : "Listen"}
                          </Button>

                          <span className="text-slate-600">{formatTime(recording.duration)}</span>

                          <Button
                            onClick={() => {
                              setRecording(null)
                              setRecordingTime(0)
                            }}
                            variant="outline"
                            className="border-slate-300"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Record Again
                          </Button>
                        </div>

                        {recording.transcript && (
                          <div className="bg-slate-50 rounded-lg p-4 text-left">
                            <div className="text-sm text-slate-600 mb-2">What you said:</div>
                            <div className="text-slate-800 italic">"{recording.transcript}"</div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </Card>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => setUseTextInput(true)}
                      className="text-slate-600 hover:text-slate-800"
                    >
                      ⌨️ Type instead
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="p-6 bg-white/80 backdrop-blur-sm">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Describe your item</label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Tell us about your item... Where did you get it? Why are you selling it?"
                      className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    />
                  </div>
                </Card>
              )}

              {(recording || textInput.trim()) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={processListing}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Generate Listings ✨
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              <audio ref={audioRef} className="hidden" />
            </motion.div>
          )}

          {/* Step 3: AI Processing */}
          {currentStep === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-8"
            >
              <div>
                <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">Creating your listings</h1>
                <p className="text-lg text-slate-600">Our AI is crafting professional listings for each platform</p>
              </div>

              <div className="space-y-6">
                <motion.div
                  className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-100 to-orange-100 rounded-full flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-orange-500 rounded-full"></div>
                </motion.div>

                <motion.div
                  key={processingStatus}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg text-slate-700 font-medium"
                >
                  {processingStatus}
                </motion.div>

                <div className="text-sm text-slate-500">This usually takes 10-15 seconds</div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Results */}
          {currentStep === "results" && listings && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">🎉 Your listings are ready!</h1>
                <p className="text-lg text-slate-600">Professional copy optimized for each platform</p>
              </div>

              {/* Platform Tabs */}
              <div className="flex justify-center space-x-4">
                <PlatformTab
                  platform="facebook"
                  isActive={activePlatform === "facebook"}
                  onClick={() => setActivePlatform("facebook")}
                />
                <PlatformTab
                  platform="craigslist"
                  isActive={activePlatform === "craigslist"}
                  onClick={() => setActivePlatform("craigslist")}
                />
                <PlatformTab
                  platform="offerup"
                  isActive={activePlatform === "offerup"}
                  onClick={() => setActivePlatform("offerup")}
                />
              </div>

              {/* Listing Preview */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePlatform}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="p-6 bg-white/80 backdrop-blur-sm">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Photo */}
                      <div>
                        <img
                          src={photoPreview || "/placeholder.svg"}
                          alt="Item"
                          className="w-full rounded-lg shadow-lg"
                        />
                      </div>

                      {/* Listing Content */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            {listings[activePlatform].title}
                          </h3>
                          <div className="text-2xl font-bold text-green-600">{listings[activePlatform].price}</div>
                        </div>

                        <div className="text-slate-700 leading-relaxed">{listings[activePlatform].description}</div>

                        <div className="flex flex-wrap gap-2">
                          {listings[activePlatform].tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="pt-4">
                          <Button
                            onClick={() => copyListing(activePlatform)}
                            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            {copiedPlatform === activePlatform ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Listing
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Quality Indicators */}
              <div className="flex justify-center space-x-6 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Professional tone</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>SEO optimized</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Priced competitively</span>
                </div>
              </div>

              {/* Next Steps */}
              <div className="text-center space-y-4">
                <div className="text-lg font-medium text-slate-900">
                  💡 Pro tip: Post during peak hours (6-8 PM) for best results
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => {
                      setCurrentStep("upload")
                      setUploadedPhoto(null)
                      setPhotoPreview("")
                      setRecording(null)
                      setTextInput("")
                      setListings(null)
                      setUseTextInput(false)
                    }}
                    variant="outline"
                    className="border-slate-300 text-slate-700"
                  >
                    Try Another Item
                  </Button>

                  <Button variant="outline" className="border-slate-300 text-slate-700 bg-transparent">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share FlipEasy
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

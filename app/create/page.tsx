"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Camera, Upload, Mic, Play, Pause, RotateCcw, Copy, Check, Share2, ArrowRight, DollarSign, TrendingUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useRef, useCallback } from "react"
import { Inter } from "next/font/google"
import Link from "next/link"
import { compressImage } from "@/lib/utils"
import { CopyButton, ListingSection, PricingInsights, ProTips } from "@/components/enhanced-results"

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
const generateListings = async (photo: File, userDescription: string, guidedAnswers?: Record<string, string>): Promise<any> => {
  const formData = new FormData();
  formData.append('image', photo);
  formData.append('description', userDescription);
  
  // Add guided answers if provided
  if (guidedAnswers) {
    const guidedText = Object.entries(guidedAnswers)
      .map(([question, answer]) => `${question}: ${answer}`)
      .join('\n');
    formData.append('guidedAnswers', guidedText);
  }

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

  return result.data;
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
    facebook: { name: "Facebook", color: "bg-blue-600", icon: "📘", textColor: "text-blue-600" },
    craigslist: { name: "Craigslist", color: "bg-purple-600", icon: "📋", textColor: "text-purple-600" },
    offerup: { name: "OfferUp", color: "bg-green-600", icon: "🛒", textColor: "text-green-600" },
  }

  const config = platformConfig[platform]

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
        isActive 
          ? `${config.color} text-white shadow-xl scale-105 border-2 border-white/20` 
          : `bg-white/90 ${config.textColor} hover:bg-white shadow-md hover:shadow-lg border border-slate-200/50`
      }`}
    >
      <span className="text-xl">{config.icon}</span>
      <span className="font-medium">{config.name}</span>
    </button>
  )
}

// Guided Questions Component
const GuidedQuestions = ({ 
  answers, 
  onAnswerChange, 
  onComplete 
}: { 
  answers: Record<string, string>
  onAnswerChange: (question: string, answer: string) => void
  onComplete: () => void 
}) => {
  const questions = [
    {
      id: 'condition',
      question: 'What condition is your item in?',
      placeholder: 'e.g., Excellent, very good, good, fair, or poor',
      required: true
    },
    {
      id: 'purchase_time',
      question: 'When did you buy this item?',
      placeholder: 'e.g., 2 years ago, last month, brand new',
      required: false
    },
    {
      id: 'original_price',
      question: 'What did you originally pay for it?',
      placeholder: 'e.g., $200, around $150, not sure',
      required: false
    },
    {
      id: 'selling_reason',
      question: 'Why are you selling it?',
      placeholder: 'e.g., Moving, upgrading, no longer need it',
      required: true
    },
    {
      id: 'desired_price',
      question: 'What price are you hoping to get?',
      placeholder: 'e.g., $100, around $75, open to offers',
      required: false
    },
    {
      id: 'additional_info',
      question: 'Any other important details?',
      placeholder: 'e.g., Smoke-free home, pet-free, includes accessories',
      required: false
    }
  ];

  const handleInputChange = (questionId: string, value: string) => {
    onAnswerChange(questionId, value);
  };

  const requiredAnswered = questions
    .filter(q => q.required)
    .every(q => answers[q.id]?.trim());

  return (
    <Card className="p-8 bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-slate-900 mb-2">Tell us more about your item</h3>
          <p className="text-slate-600">Answer these questions to create the perfect listing</p>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-3"
            >
              <label className="block text-sm font-semibold text-slate-700">
                {q.question}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={answers[q.id] || ''}
                onChange={(e) => handleInputChange(q.id, e.target.value)}
                placeholder={q.placeholder}
                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200"
              />
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center pt-6">
          <Button
            onClick={onComplete}
            disabled={!requiredAnswered}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Generate Professional Listings ✨
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

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
  const [guidedAnswers, setGuidedAnswers] = useState<Record<string, string>>({})
  const [showGuidedQuestions, setShowGuidedQuestions] = useState(false)
  const [aiResponse, setAiResponse] = useState<any>(null)
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
      console.log('File selected:', file.name, file.size);
      
      // Set the file immediately
      setUploadedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('FileReader loaded successfully');
        setPhotoPreview(e.target?.result as string);
      };
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
      };
      reader.readAsDataURL(file);
    } else {
      console.error('Invalid file type:', file?.type);
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

  const handleCameraCapture = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      console.log('Camera capture clicked');
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
    if (!uploadedPhoto) return

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
      
      const generatedData = await generateListings(uploadedPhoto, userDescription, guidedAnswers);
      setAiResponse(generatedData);
      
      // Transform for backward compatibility
      const transformedListings = {
        facebook: {
          title: generatedData.listings.facebook.title,
          description: typeof generatedData.listings.facebook.description === 'string' 
            ? generatedData.listings.facebook.description 
            : Object.values(generatedData.listings.facebook.description).join('\n\n'),
          price: generatedData.listings.facebook.price,
          tags: generatedData.listings.facebook.tags,
        },
        craigslist: {
          title: generatedData.listings.craigslist.title,
          description: typeof generatedData.listings.craigslist.description === 'string'
            ? generatedData.listings.craigslist.description
            : Object.values(generatedData.listings.craigslist.description).join('\n\n'),
          price: generatedData.listings.craigslist.price,
          tags: generatedData.listings.craigslist.tags,
        },
        offerup: {
          title: generatedData.listings.offerup.title,
          description: typeof generatedData.listings.offerup.description === 'string'
            ? generatedData.listings.offerup.description
            : Object.values(generatedData.listings.offerup.description).join('\n\n'),
          price: generatedData.listings.offerup.price,
          tags: generatedData.listings.offerup.tags,
        },
      };
      
      setListings(transformedListings);
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
                  className="p-12 border-2 border-dashed border-slate-300 hover:border-cyan-400 transition-colors bg-gradient-to-br from-slate-50 to-white"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
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
                        className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                      >
                        📸 Take Photo
                      </Button>

                      <div className="text-slate-500">or</div>

                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
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

          {/* Step 2: Voice Recording OR Guided Questions */}
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
                  Choose how you'd like to provide details about your item
                </p>
              </div>

              {/* Method Selection */}
              {!showGuidedQuestions && !useTextInput && !recording && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Guided Questions Option */}
                  <Card className="p-8 bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-200/50 hover:border-cyan-300 transition-all duration-300 cursor-pointer group" 
                        onClick={() => setShowGuidedQuestions(true)}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl text-white">📝</span>
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900">Guided Questions</h3>
                      <p className="text-slate-600">Answer simple questions for the best results</p>
                      <div className="text-sm text-cyan-600 font-medium">✨ Recommended</div>
                    </div>
                  </Card>

                  {/* Voice Recording Option */}
                  <Card className="p-8 bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50 hover:border-orange-300 transition-all duration-300 cursor-pointer group" 
                        onClick={() => {/* Will trigger voice recording */}}>
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Mic className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900">Voice Recording</h3>
                      <p className="text-slate-600">Speak naturally about your item</p>
                      <div className="text-sm text-orange-600 font-medium">Quick & Easy</div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Guided Questions */}
              {showGuidedQuestions && (
                <GuidedQuestions 
                  answers={guidedAnswers}
                  onAnswerChange={(question, answer) => {
                    setGuidedAnswers(prev => ({ ...prev, [question]: answer }));
                  }}
                  onComplete={processListing}
                />
              )}

              {/* Voice Recording Interface */}
              {!showGuidedQuestions && !useTextInput && (
                <div className="space-y-8">
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

                  <div className="text-center space-y-4">
                    <Button
                      variant="ghost"
                      onClick={() => setUseTextInput(true)}
                      className="text-slate-600 hover:text-slate-800"
                    >
                      ⌨️ Type instead
                    </Button>
                    
                    <div className="text-sm text-slate-500">or</div>
                    
                    <Button
                      variant="ghost"
                      onClick={() => setShowGuidedQuestions(true)}
                      className="text-cyan-600 hover:text-cyan-800 font-medium"
                    >
                      📝 Use guided questions
                    </Button>
                  </div>
                </div>
              )}

              {/* Text Input */}
              {useTextInput && !showGuidedQuestions && (
                <Card className="p-6 bg-white/80 backdrop-blur-sm">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Describe your item</label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Tell us about your item... Where did you get it? Why are you selling it?"
                      className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    />
                    
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUseTextInput(false);
                          setTextInput('');
                        }}
                        className="border-slate-300 text-slate-700"
                      >
                        Cancel
                      </Button>
                      
                      <Button
                        onClick={() => setShowGuidedQuestions(true)}
                        variant="outline"
                        className="border-cyan-300 text-cyan-700"
                      >
                        📝 Use guided questions instead
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Continue Button for Voice/Text */}
              {(recording || textInput.trim()) && !showGuidedQuestions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={processListing}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
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

          {/* Step 4: Enhanced Results */}
          {currentStep === "results" && aiResponse && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">🎉 Your professional listings are ready!</h1>
                <p className="text-lg text-slate-600">AI-optimized copy for maximum selling success</p>
              </div>

              {/* Item Analysis Summary */}
              <Card className="p-6 bg-gradient-to-br from-slate-50 to-white border border-slate-200/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{aiResponse.item_analysis?.name}</h2>
                    {aiResponse.item_analysis?.brand !== 'Unknown' && (
                      <p className="text-slate-600 font-medium">{aiResponse.item_analysis.brand} {aiResponse.item_analysis.model !== 'N/A' ? `- ${aiResponse.item_analysis.model}` : ''}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {aiResponse.item_analysis?.condition}
                      </Badge>
                      {aiResponse.item_analysis?.estimated_retail_price !== 'Research needed' && (
                        <span className="text-sm text-slate-600">
                          Retail: {aiResponse.item_analysis.estimated_retail_price}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{aiResponse.pricing_strategy?.market_price}</div>
                    <div className="text-sm text-slate-600">Recommended Price</div>
                  </div>
                </div>
                
                {aiResponse.item_analysis?.key_features && (
                  <div className="flex flex-wrap gap-2">
                    {aiResponse.item_analysis.key_features.map((feature: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-white/60">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>

              {/* Pricing Strategy */}
              {aiResponse.pricing_strategy && (
                <PricingInsights pricingData={aiResponse.pricing_strategy} />
              )}

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

              {/* Enhanced Listing Preview */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePlatform}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="p-6 bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Photo */}
                      <div>
                        <img
                          src={photoPreview || "/placeholder.svg"}
                          alt="Item"
                          className="w-full rounded-lg shadow-lg"
                        />
                        {aiResponse.photo_enhancement && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 text-sm mb-2">📷 Photo Enhancement Tips</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              {aiResponse.photo_enhancement.suggestions?.map((tip: string, index: number) => (
                                <li key={index} className="flex items-start space-x-1">
                                  <span className="text-blue-600">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Listing Content with Copyable Sections */}
                      <div className="space-y-4">
                        {/* Title Section */}
                        <ListingSection
                          title="Title"
                          content={aiResponse.listings[activePlatform]?.title || ''}
                          copyLabel="Title"
                          icon={<Copy className="w-4 h-4" />}
                          className="border-blue-200 bg-blue-50/50"
                        />

                        {/* Price Section */}
                        <ListingSection
                          title="Price"
                          content={aiResponse.listings[activePlatform]?.price || ''}
                          copyLabel="Price"
                          icon={<DollarSign className="w-4 h-4" />}
                          className="border-green-200 bg-green-50/50"
                        />

                        {/* Description Sections */}
                        {typeof aiResponse.listings[activePlatform]?.description === 'object' ? (
                          Object.entries(aiResponse.listings[activePlatform].description).map(([key, value]) => (
                            <ListingSection
                              key={key}
                              title={key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                              content={value as string}
                              copyLabel={key.replace('_', ' ')}
                              className="border-slate-200 bg-slate-50/50"
                            />
                          ))
                        ) : (
                          <ListingSection
                            title="Description"
                            content={aiResponse.listings[activePlatform]?.description || ''}
                            copyLabel="Description"
                            className="border-slate-200 bg-slate-50/50"
                          />
                        )}

                        {/* Tags Section */}
                        {aiResponse.listings[activePlatform]?.tags && (
                          <div className="border border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-slate-900 text-sm">Tags</h4>
                              <CopyButton 
                                text={aiResponse.listings[activePlatform].tags.join(', ')} 
                                label="Tags" 
                                size="sm" 
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {aiResponse.listings[activePlatform].tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Complete Listing Copy */}
                        <div className="pt-4">
                          <Button
                            onClick={() => {
                              const listing = aiResponse.listings[activePlatform];
                              let fullText = `${listing.title}\n\nPrice: ${listing.price}\n\n`;
                              
                              if (typeof listing.description === 'object') {
                                fullText += Object.values(listing.description).join('\n\n');
                              } else {
                                fullText += listing.description;
                              }
                              
                              navigator.clipboard.writeText(fullText);
                              setCopiedPlatform(activePlatform);
                              setTimeout(() => setCopiedPlatform(null), 2000);
                            }}
                            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg"
                          >
                            {copiedPlatform === activePlatform ? (
                              <>
                                <Check className="w-5 h-5 mr-2" />
                                Complete Listing Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-5 h-5 mr-2" />
                                Copy Complete Listing
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Pro Tips */}
              {(aiResponse.pro_tips || aiResponse.selling_optimization) && (
                <ProTips 
                  proTips={aiResponse.pro_tips || {}} 
                  optimization={aiResponse.selling_optimization || {}} 
                />
              )}

              {/* Common Questions */}
              {aiResponse.selling_optimization?.common_questions && (
                <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/50">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-amber-600">🤔</span>
                    <h3 className="text-lg font-semibold text-slate-900">Expect These Questions</h3>
                  </div>
                  <div className="space-y-2">
                    {aiResponse.selling_optimization.common_questions.map((question: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-white/60 rounded-lg">
                        <div className="text-amber-600 mt-0.5">•</div>
                        <div className="text-sm text-slate-700">{question}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Success Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center bg-white/60 border border-slate-200/50">
                  <div className="text-2xl font-bold text-green-600">3x</div>
                  <div className="text-sm text-slate-600">Better Engagement</div>
                </Card>
                <Card className="p-4 text-center bg-white/60 border border-slate-200/50">
                  <div className="text-2xl font-bold text-blue-600">SEO</div>
                  <div className="text-sm text-slate-600">Optimized</div>
                </Card>
                <Card className="p-4 text-center bg-white/60 border border-slate-200/50">
                  <div className="text-2xl font-bold text-purple-600">Pro</div>
                  <div className="text-sm text-slate-600">Quality</div>
                </Card>
              </div>

              {/* Next Steps */}
              <div className="text-center space-y-6">
                <div className="text-lg font-medium text-slate-900">
                  💡 Ready to post? Copy your sections and start selling!
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => {
                      setCurrentStep("upload")
                      setUploadedPhoto(null)
                      setPhotoPreview("")
                      setRecording(null)
                      setTextInput("")
                      setGuidedAnswers({})
                      setShowGuidedQuestions(false)
                      setUseTextInput(false)
                      setAiResponse(null)
                      setListings(null)
                    }}
                    variant="outline"
                    className="border-slate-300 text-slate-700 px-6 py-3 font-medium"
                  >
                    📷 Try Another Item
                  </Button>

                  <Button 
                    variant="outline" 
                    className="border-slate-300 text-slate-700 bg-transparent px-6 py-3 font-medium"
                  >
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

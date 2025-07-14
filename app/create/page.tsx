"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Upload, Mic, MicOff, Camera, Copy, Check, Share2 } from "lucide-react"
import Link from "next/link"

interface PriceAnalysis {
  suggested_price: string;
  reasoning: string;
}

interface Listing {
  category: string;
  confidence: string;
  brand: string;
  model: string;
  title: string;
  condition: string;
  description: string;
  features: string[];
  dimensions: {
    inches: string;
    cm: string;
  };
  usage: string;
  price_analysis: PriceAnalysis;
}

interface AIResponse {
  success?: boolean
  web_search_used?: boolean
  fallback_mode?: boolean
  search_queries?: string[]
  listing: Listing;
}

export default function CreateListing() {
  const [currentStep, setCurrentStep] = useState<"upload" | "recording" | "processing" | "results">("upload")
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [recording, setRecording] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [description, setDescription] = useState("")
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState("Creating your listing...")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handlePhotoUpload = (file: File) => {
    setUploadedPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setCurrentStep("recording")
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handlePhotoUpload(file)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const audioChunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        setRecording(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }
      mediaRecorder.onstart = () => {
        setIsRecording(true)
        setRecordingDuration(0)
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1)
        }, 1000)
      }
      mediaRecorder.start()
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Recording failed. Please try using the text input instead.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }

  const processWithAI = async () => {
    if (!uploadedPhoto) return
    setCurrentStep("processing")
    const statuses = [
      "🔍 Analyzing your photo and description...",
      "💰 Researching local market prices...",
      "✍️ Writing your professional listing...",
      "✨ Almost ready...",
    ]
    let statusIndex = 0
    const statusInterval = setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length
      setProcessingStatus(statuses[statusIndex])
    }, 3000)

    try {
      const formData = new FormData()
      formData.append("image", uploadedPhoto)
      formData.append("description", description)
      if (recording) {
        formData.append("audio", recording, "audio.wav")
      }
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        throw new Error("Failed to analyze image")
      }
      const result = await response.json()
      setAiResponse(result)
      setCurrentStep("results")
    } catch (error) {
      console.error("Error processing with AI:", error)
      setCurrentStep("results") // Go to results even on error to show fallback
    } finally {
      clearInterval(statusInterval)
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  const renderListingField = (label: string, value: string | string[]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null
    const displayValue = Array.isArray(value) ? value.join("\n") : value

    return (
      <div className="grid grid-cols-3 gap-4 items-start">
        <span className="text-sm font-semibold text-slate-600 pt-2">{label}</span>
        <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap">
          {displayValue}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopy(displayValue, label)}
          className="col-start-3 justify-self-end"
        >
          {copiedField === label ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      <header className="px-4 py-6 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 text-slate-700 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-cyan-700 to-slate-900 bg-clip-text text-transparent">
            FlipEasy
          </span>
        </div>
      </header>

      <main className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {currentStep === "upload" && (
              <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-8">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">Take a photo of your item</h1>
                  <p className="text-lg text-slate-600">Any angle works - our AI will enhance it automatically</p>
                </div>
                <Card className="p-12 border-2 border-dashed border-slate-300 hover:border-cyan-400 transition-colors bg-white/60 backdrop-blur-xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="space-y-6">
                    <Camera className="w-16 h-16 mx-auto text-slate-400" />
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload Photo</h3>
                      <p className="text-slate-600">Click here or drag and drop your image</p>
                    </div>
                    <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-3 font-medium">
                      <Upload className="w-5 h-5 mr-2" />
                      Choose Photo
                    </Button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                </Card>
                <div className="text-sm text-slate-500">
                  📱 On mobile? Tap to use your camera directly
                </div>
              </motion.div>
            )}

            {currentStep === "recording" && (
              <motion.div key="recording" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="text-center">
                  <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">Tell us about your item</h1>
                  <p className="text-lg text-slate-600">Speak naturally or type a description</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <img src={photoPreview} alt="Item" className="w-full rounded-lg shadow-lg" />
                  </div>
                  <div className="space-y-6">
                    <Card className="p-6 bg-white/80 backdrop-blur-xl">
                      <h3 className="text-lg font-semibold mb-4">🎤 Voice Description (Recommended)</h3>
                      {!isRecording && !recording && (
                        <Button onClick={startRecording} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 font-medium">
                          <Mic className="w-5 h-5 mr-2" />
                          Start Recording
                        </Button>
                      )}
                      {isRecording && (
                        <div className="text-center space-y-4">
                          <motion.div className="w-20 h-20 mx-auto bg-red-500 rounded-full flex items-center justify-center" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}>
                            <MicOff className="w-8 h-8 text-white" />
                          </motion.div>
                          <div className="text-lg font-medium">Recording... {formatRecordingTime(recordingDuration)}</div>
                          <Button onClick={stopRecording} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                            Stop Recording
                          </Button>
                        </div>
                      )}
                      {recording && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-green-600 font-medium mb-4">✅ Recording saved ({formatRecordingTime(recordingDuration)})</div>
                            <Button onClick={() => { setRecording(null); setRecordingDuration(0); }} variant="outline" size="sm">
                              Record Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                    <Card className="p-6 bg-white/80 backdrop-blur-xl">
                      <h3 className="text-lg font-semibold mb-4">✏️ Or type a description</h3>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us about your item: condition, where you got it, why you're selling..." className="w-full h-32 p-4 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
                    </Card>
                    <Button onClick={processWithAI} disabled={!recording && !description.trim()} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 font-semibold text-lg">
                      Create My Listing ✨
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">Creating your listing</h1>
                  <p className="text-lg text-slate-600">This usually takes 1-3 minutes - we're building you a perfect marketplace listing!</p>
                </div>
                <div className="space-y-6">
                  <motion.div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-100 to-orange-100 rounded-full flex items-center justify-center" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-orange-500 rounded-full"></div>
                  </motion.div>
                  <motion.div key={processingStatus} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-lg text-slate-700 font-medium">
                    {processingStatus}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {currentStep === "results" && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="text-center">
                  <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">🎉 Your listing is ready!</h1>
                  <p className="text-lg text-slate-600">Copy the fields below and paste them into any marketplace.</p>
                </div>

                <Card className="p-8 bg-white shadow-xl max-w-4xl mx-auto">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div>
                      <img src={photoPreview || "/placeholder.svg"} alt="Item" className="w-full rounded-lg shadow-lg" />
                      {aiResponse?.listing?.price_analysis?.reasoning && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-blue-900 text-sm mb-2">The FlipEasy Expert's Analysis</h4>
                          <p className="text-sm text-blue-800 whitespace-pre-wrap">{aiResponse.listing.price_analysis.reasoning}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {aiResponse?.listing ? (
                        <>
                          {renderListingField("Title", aiResponse.listing.title)}
                          {aiResponse.listing.price_analysis?.suggested_price && renderListingField("Price", aiResponse.listing.price_analysis.suggested_price)}
                          {renderListingField("Category", aiResponse.listing.category)}
                          {renderListingField("Confidence", aiResponse.listing.confidence)}
                          {renderListingField("Condition", aiResponse.listing.condition)}
                          {renderListingField("Brand", aiResponse.listing.brand)}
                          {renderListingField("Model", aiResponse.listing.model)}
                          {renderListingField("Dimensions (in)", aiResponse.listing.dimensions.inches)}
                          {renderListingField("Dimensions (cm)", aiResponse.listing.dimensions.cm)}
                          {renderListingField("Usage", aiResponse.listing.usage)}
                          
                          <div>
                            <span className="text-sm font-semibold text-slate-600">Description</span>
                            <div className="mt-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap">
                              {aiResponse.listing.description.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n')}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(aiResponse.listing.description.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n'), "Description")}
                              className="mt-2"
                            >
                              {copiedField === "Description" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                              <span className="ml-2">Copy Description</span>
                            </Button>
                          </div>
                          
                          <div>
                            <span className="text-sm font-semibold text-slate-600">Features</span>
                            <div className="mt-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap">
                              {aiResponse.listing.features.map(feature => `• ${feature}`).join('\n')}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(aiResponse.listing.features.map(feature => `• ${feature}`).join('\n'), "Features")}
                              className="mt-2"
                            >
                              {copiedField === "Features" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                              <span className="ml-2">Copy Features</span>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-red-600">
                          <p>Sorry, we couldn't generate a listing at this time.</p>
                          <p>Please try again or write a more detailed description.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="flex justify-center space-x-4">
                  <Button onClick={() => { setCurrentStep("upload"); setAiResponse(null); }} variant="outline" className="border-slate-300 text-slate-700 px-6 py-3 font-medium">
                    📷 Try Another Item
                  </Button>
                  <Button variant="outline" className="border-slate-300 text-slate-700 bg-transparent px-6 py-3 font-medium">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share FlipEasy
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

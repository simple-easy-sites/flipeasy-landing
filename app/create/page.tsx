"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Upload, Mic, MicOff, Camera, Copy, Check, Share2, RefreshCw } from "lucide-react"
import Link from "next/link"

interface ListingOption {
  persona: string;
  title: string;
  description: string;
  price: string;
  reasoning: string;
}

interface AIResponse {
  success?: boolean
  web_search_used?: boolean
  fallback_mode?: boolean
  search_queries?: string[]
  listings: ListingOption[];
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
  const [editableListing, setEditableListing] = useState<ListingOption | null>(null)
  const [copied, setCopied] = useState(false)
  const [processingStatus, setProcessingStatus] = useState("Creating your listing...")
  const [copyFeedback, setCopyFeedback] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (aiResponse?.listings?.[0]) {
      setEditableListing(aiResponse.listings[0]);
    }
  }, [aiResponse]);

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

  const processWithAI = async (refinement?: string) => {
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
      formData.append("description", refinement || description)
      if (recording && !refinement) {
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

  const handleCopy = () => {
    if (!editableListing) return
    const { title, price, description } = editableListing
    const fullListing = `Title: ${title}\n\nPrice: ${price}\n\nDescription:\n${description.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n')}`
    navigator.clipboard.writeText(fullListing).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback('Copied!')
      setTimeout(() => setCopyFeedback(''), 2000)
    })
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
                  <p className="text-lg text-slate-600">The more details you provide, the better your listing will be</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <img src={photoPreview} alt="Item" className="w-full rounded-lg shadow-lg border border-slate-200" />
                    <Button onClick={() => setCurrentStep("upload")} variant="outline" size="sm" className="w-full text-slate-600 border-slate-300">
                      Change Photo
                    </Button>
                  </div>
                  <div className="space-y-6">
                    <Card className="p-6 bg-slate-50/50 backdrop-blur-xl border-slate-200">
                      <h3 className="text-lg font-semibold mb-4 text-slate-900">What to include in your description</h3>
                      <div className="grid gap-3 text-sm text-slate-700">
                        <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div><span>What is this item and where did you get it?</span></div>
                        <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div><span>How long have you owned it?</span></div>
                        <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div><span>What condition is it in? Any wear or damage?</span></div>
                        <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div><span>What material is it made of?</span></div>
                        <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div><span>What size or dimensions?</span></div>
                        <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div><span>Why are you selling it?</span></div>
                        <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div><span>What did you love most about it?</span></div>
                        <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div><span>Does it come with anything extra?</span></div>
                        <div className="flex items-start space-x-3"><div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div><span>Any special features or details buyers should know?</span></div>
                      </div>
                    </Card>
                    <Card className="p-6 bg-white/80 backdrop-blur-xl border-slate-200">
                      <h3 className="text-lg font-semibold mb-4 text-slate-900">Voice Description (Recommended)</h3>
                      {!isRecording && !recording && (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600 mb-4">Speak naturally about your item. Our AI works best with conversational descriptions.</p>
                          <Button onClick={startRecording} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-4 font-medium transition-all duration-200">
                            <Mic className="w-5 h-5 mr-2" />
                            Start Recording
                          </Button>
                          <p className="text-xs text-slate-500 text-center">Maximum 2 minutes • Tap when ready to speak</p>
                        </div>
                      )}
                      {isRecording && (
                        <div className="text-center space-y-6">
                          <motion.div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}>
                            <Mic className="w-8 h-8 text-white" />
                          </motion.div>
                          <div className="space-y-2">
                            <div className="text-lg font-medium text-slate-900">Recording in progress</div>
                            <div className="text-2xl font-mono font-bold text-red-600">{formatRecordingTime(recordingDuration)}</div>
                          </div>
                          <div className="flex justify-center space-x-4">
                            <Button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2">
                              <MicOff className="w-4 h-4 mr-2" />
                              Stop Recording
                            </Button>
                          </div>
                          <p className="text-sm text-slate-600">Speak clearly and naturally. Include as many details as possible.</p>
                        </div>
                      )}
                      {recording && (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-green-900">Recording saved successfully</div>
                                <div className="text-sm text-green-700">Duration: {formatRecordingTime(recordingDuration)}</div>
                              </div>
                            </div>
                          </div>
                          <Button onClick={() => { setRecording(null); setRecordingDuration(0); }} variant="outline" size="sm" className="w-full border-slate-300 text-slate-700">
                            Record Again
                          </Button>
                        </div>
                      )}
                    </Card>
                    <Card className="p-6 bg-white/80 backdrop-blur-xl border-slate-200">
                      <h3 className="text-lg font-semibold mb-4 text-slate-900">Or type your description</h3>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your item in detail. Include condition, where you got it, how long you've had it, why you're selling, and any special features..." className="w-full h-32 p-4 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm leading-relaxed" maxLength={1000} />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-500">{description.length}/1000 characters</span>
                        {description.length > 0 && (<span className="text-xs text-green-600">Great! This will help create a better listing</span>)}
                      </div>
                    </Card>
                    <div className="space-y-3">
                      <Button onClick={() => processWithAI()} disabled={!recording && !description.trim()} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 font-semibold text-lg transition-all duration-200">
                        {!recording && !description.trim() ? "Record or type a description to continue" : "Create My Professional Listing"}
                      </Button>
                      {(recording || description.trim()) && (<p className="text-xs text-center text-slate-600">This usually takes 1-2 minutes. We're analyzing your item and creating optimized listings for different platforms.</p>)}
                    </div>
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
                  <p className="text-lg text-slate-600">Review your listing and make any edits. Then, copy and paste to any marketplace.</p>
                </div>

                <Card className="p-8 bg-white shadow-xl max-w-4xl mx-auto">
                  <div className="space-y-6">
                    <img src={photoPreview || "/placeholder.svg"} alt="Item" className="w-full rounded-lg shadow-lg" />
                    {editableListing ? (
                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-semibold text-slate-600">Title</label>
                          <input
                            type="text"
                            value={editableListing.title}
                            onChange={(e) => setEditableListing({ ...editableListing, title: e.target.value })}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-600">Price</label>
                          <input
                            type="text"
                            value={editableListing.price}
                            onChange={(e) => setEditableListing({ ...editableListing, price: e.target.value })}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-600">Description</label>
                          <textarea
                            value={editableListing.description.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n')}
                            onChange={(e) => setEditableListing({ ...editableListing, description: e.target.value })}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-md h-48"
                          />
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-blue-900 text-sm mb-2">Expert's Reasoning</h4>
                          <p className="text-sm text-blue-800 whitespace-pre-wrap">{editableListing.reasoning}</p>
                        </div>
                        <Button onClick={() => processWithAI("refine")} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refine with Voice
                        </Button>
                        <Button onClick={handleCopy} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-4 font-semibold text-lg">
                          {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                          {copied ? "Copied!" : "Copy Listing"}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center text-red-600">
                        <p>Sorry, we couldn't generate a listing at this time.</p>
                        <p>Please try again or write a more detailed description.</p>
                      </div>
                    )}
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

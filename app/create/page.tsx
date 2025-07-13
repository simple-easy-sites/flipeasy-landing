"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, Mic, MicOff, Camera, Copy, Check, Share2, DollarSign } from "lucide-react"
import Link from "next/link"

interface AIResponse {
  listings: {
    facebook: { title: string; price: string; description: any; tags?: string[] }
    craigslist: { title: string; price: string; description: any; tags?: string[] }
    offerup: { title: string; price: string; description: any; tags?: string[] }
  }
  item_analysis?: {
    name: string
    brand: string
    model: string
    condition: string
    estimated_retail_price: string
    key_features: string[]
  }
  pricing_strategy?: {
    market_price: string
    quick_sale_price: string
    best_value_price: string
    rationale: string
  }
  photo_enhancement?: {
    suggestions: string[]
  }
  selling_optimization?: {
    common_questions: string[]
    best_time_to_post?: string
    safety_tips?: string[]
  }
}

// Copy Button Component
const CopyButton = ({ text, label, size = "default" }: { text: string; label: string; size?: "sm" | "default" }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size={size}
      className="bg-white/60 border-slate-300 hover:bg-slate-50"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          Copy {label}
        </>
      )}
    </Button>
  )
}

// Listing Section Component
const ListingSection = ({ 
  title, 
  content, 
  copyLabel, 
  icon, 
  className = "border-slate-200 bg-slate-50/50" 
}: { 
  title: string
  content: string
  copyLabel: string
  icon?: React.ReactNode
  className?: string
}) => (
  <div className={`border rounded-xl p-4 backdrop-blur-sm ${className}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        {icon}
        <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
      </div>
      <CopyButton text={content} label={copyLabel} size="sm" />
    </div>
    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
      {content}
    </div>
  </div>
)

// Platform Tab Component
const PlatformTab = ({ 
  platform, 
  isActive, 
  onClick 
}: { 
  platform: string
  isActive: boolean
  onClick: () => void
}) => {
  const platformData = {
    facebook: { name: "Facebook", color: "bg-blue-500" },
    craigslist: { name: "Craigslist", color: "bg-purple-500" },
    offerup: { name: "OfferUp", color: "bg-green-500" },
  }

  return (
    <Button
      onClick={onClick}
      variant={isActive ? "default" : "outline"}
      className={`${
        isActive 
          ? `${platformData[platform as keyof typeof platformData].color} text-white` 
          : "bg-white/60 text-slate-700 border-slate-300"
      } px-6 py-3 font-medium transition-all`}
    >
      {platformData[platform as keyof typeof platformData].name}
    </Button>
  )
}

export default function CreateListing() {
  const [currentStep, setCurrentStep] = useState<"upload" | "recording" | "processing" | "results">("upload")
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [recording, setRecording] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [description, setDescription] = useState("")
  const [transcription, setTranscription] = useState("")
  const [activePlatform, setActivePlatform] = useState<"facebook" | "craigslist" | "offerup">("facebook")
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState("Analyzing your photo...")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        const maxWidth = 1024
        const maxHeight = 1024
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        }, 'image/jpeg', 0.8)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handlePhotoUpload = async (file: File) => {
    try {
      const compressedFile = await compressImage(file)
      setUploadedPhoto(compressedFile)
      setPhotoPreview(URL.createObjectURL(compressedFile))
      setCurrentStep("recording")
    } catch (error) {
      console.error('Error processing image:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handlePhotoUpload(file)
    }
  }

  const startRecording = async () => {
    try {
      console.log('Starting recording...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('Got media stream:', stream)
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const audioChunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size)
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, audio chunks:', audioChunks.length)
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
          console.log('Created audio blob:', audioBlob.size)
          setRecording(audioBlob)
          
          // Convert speech to text
          await convertSpeechToText(audioBlob)
        }
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started')
        setIsRecording(true)
        setRecordingDuration(0)
        
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1)
        }, 1000)
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
      }
      
      console.log('Starting MediaRecorder...')
      mediaRecorder.start(1000) // Record in 1-second chunks
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Recording failed: ' + error.message)
    }
  }

  const stopRecording = () => {
    console.log('Stopping recording...')
    if (mediaRecorderRef.current && isRecording) {
      console.log('MediaRecorder state:', mediaRecorderRef.current.state)
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
      "Analyzing your photo...",
      "Identifying item details...",
      "Researching market prices...",
      "Crafting professional descriptions...",
      "Optimizing for each platform...",
      "Finalizing your listings..."
    ]
    
    let statusIndex = 0
    const statusInterval = setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length
      setProcessingStatus(statuses[statusIndex])
    }, 2000)

    try {
      const formData = new FormData()
      formData.append('image', uploadedPhoto)
      formData.append('description', description)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze image')
      }

      const result = await response.json()
      setAiResponse(result)
      setCurrentStep("results")
      
    } catch (error) {
      console.error('Error processing with AI:', error)
      // Show error state or fallback
    } finally {
      clearInterval(statusInterval)
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const convertSpeechToText = async (audioBlob: Blob) => {
    try {
      // Simple placeholder transcription for now
      // You can replace this with actual speech-to-text API later
      setTranscription("Your voice recording has been saved. You can add details in the text box below or re-record if needed.")
      
      // TODO: Implement actual speech-to-text conversion
      // For now, we'll just show the recording was successful
    } catch (error) {
      console.error('Speech to text conversion failed:', error)
      setTranscription("Recording saved successfully. Please add details in the text box below.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      {/* Header */}
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

      {/* Main Content */}
      <main className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Photo Upload */}
            {currentStep === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-8"
              >
                <div>
                  <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">Take a photo of your item</h1>
                  <p className="text-lg text-slate-600">Any angle works - our AI will enhance it automatically</p>
                </div>

                <Card 
                  className="p-12 border-2 border-dashed border-slate-300 hover:border-cyan-400 transition-colors bg-white/60 backdrop-blur-xl cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </Card>

                <div className="text-sm text-slate-500">
                  📱 On mobile? Tap to use your camera directly
                </div>
              </motion.div>
            )}

            {/* Step 2: Voice Recording */}
            {currentStep === "recording" && (
              <motion.div
                key="recording"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">Tell us about your item</h1>
                  <p className="text-lg text-slate-600">Speak naturally or type a description</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Photo Preview */}
                  <div>
                    <img src={photoPreview} alt="Item" className="w-full rounded-lg shadow-lg" />
                  </div>

                  {/* Voice/Text Input */}
                  <div className="space-y-6">
                    {/* Voice Recording */}
                    <Card className="p-6 bg-white/80 backdrop-blur-xl">
                      <h3 className="text-lg font-semibold mb-4">🎤 Voice Description (Recommended)</h3>
                      
                      {!isRecording && !recording && (
                        <Button
                          onClick={startRecording}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 font-medium"
                        >
                          <Mic className="w-5 h-5 mr-2" />
                          Start Recording
                        </Button>
                      )}

                      {isRecording && (
                        <div className="text-center space-y-4">
                          <motion.div
                            className="w-20 h-20 mx-auto bg-red-500 rounded-full flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                          >
                            <MicOff className="w-8 h-8 text-white" />
                          </motion.div>
                          <div className="text-lg font-medium">Recording... {formatRecordingTime(recordingDuration)}</div>
                          <Button
                            onClick={stopRecording}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Stop Recording
                          </Button>
                        </div>
                      )}

                      {recording && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-green-600 font-medium mb-4">✅ Recording saved ({formatRecordingTime(recordingDuration)})</div>
                            <Button
                              onClick={() => {
                                setRecording(null)
                                setRecordingDuration(0)
                                setTranscription("")
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Record Again
                            </Button>
                          </div>
                          
                          {/* Transcription Display */}
                          {transcription && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                              <h4 className="font-semibold text-slate-900 text-sm mb-2">What you said:</h4>
                              <div className="text-sm text-slate-700 leading-relaxed">
                                {transcription.split('.').filter(sentence => sentence.trim()).map((sentence, index) => (
                                  <p key={index} className="mb-2">• {sentence.trim()}.</p>
                                ))}
                              </div>
                              <Button
                                onClick={() => setDescription(transcription)}
                                size="sm"
                                variant="outline"
                                className="mt-2"
                              >
                                Copy to Text Box
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>

                    {/* Text Alternative */}
                    <Card className="p-6 bg-white/80 backdrop-blur-xl">
                      <h3 className="text-lg font-semibold mb-4">✏️ Or type a description</h3>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell us about your item: condition, where you got it, why you're selling..."
                        className="w-full h-32 p-4 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </Card>

                    {/* Continue Button */}
                    <Button
                      onClick={processWithAI}
                      disabled={!recording && !description.trim()}
                      className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 font-semibold text-lg"
                    >
                      Create My Listings ✨
                    </Button>
                    
                    {(recording || description.trim()) && (
                      <div className="text-center text-sm text-slate-600">
                        {recording && "Voice recording ready"}
                        {recording && description.trim() && " + "}
                        {description.trim() && "Text description added"}
                      </div>
                    )}
                  </div>
                </div>
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
                      <h2 className="text-2xl font-bold text-slate-900">{aiResponse.item_analysis?.name || 'Your Item'}</h2>
                      {aiResponse.item_analysis?.brand !== 'Unknown' && (
                        <p className="text-slate-600 font-medium">{aiResponse.item_analysis.brand} {aiResponse.item_analysis.model !== 'N/A' ? `- ${aiResponse.item_analysis.model}` : ''}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {aiResponse.item_analysis?.condition || 'Good Condition'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">{aiResponse.pricing_strategy?.market_price || '$0'}</div>
                      <div className="text-sm text-slate-600">Recommended Price</div>
                    </div>
                  </div>
                </Card>

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
                    <Card className="p-6 bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
                      <div className="grid lg:grid-cols-2 gap-8">
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
                          <ListingSection
                            title="Title"
                            content={aiResponse.listings[activePlatform]?.title || 'Professional listing title'}
                            copyLabel="Title"
                            icon={<Copy className="w-4 h-4" />}
                            className="border-blue-200 bg-blue-50/50"
                          />

                          <ListingSection
                            title="Price"
                            content={aiResponse.listings[activePlatform]?.price || '$0'}
                            copyLabel="Price"
                            icon={<DollarSign className="w-4 h-4" />}
                            className="border-green-200 bg-green-50/50"
                          />

                          <ListingSection
                            title="Description"
                            content={typeof aiResponse.listings[activePlatform]?.description === 'string' 
                              ? aiResponse.listings[activePlatform].description 
                              : 'Professional description for your item'}
                            copyLabel="Description"
                            className="border-slate-200 bg-slate-50/50"
                          />

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
                        setDescription("")
                        setAiResponse(null)
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
        </div>
      </main>
    </div>
  )
}
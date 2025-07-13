"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, Mic, MicOff, Camera, Copy, Check, Share2 } from "lucide-react"
import Link from "next/link"

interface AIResponse {
  item_analysis?: {
    name: string
    brand: string
    condition: string
    key_features: string[]
  }
  pricing_strategy?: {
    market_price: string
    quick_sale_price: string
    best_value_price: string
    rationale: string
  }
  comprehensive_listing?: {
    title: string
    price: string
    description: string
    condition: string
    category: string
    tags: string[]
  }
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
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState("Creating your listing...")

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
      
      // Initialize speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        let finalTranscript = ''
        
        recognition.onresult = (event: any) => {
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }
          
          setTranscription(finalTranscript + interimTranscript)
        }
        
        recognition.start()
      }
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const audioChunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        setRecording(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.onstart = () => {
        setIsRecording(true)
        setRecordingDuration(0)
        
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1)
        }, 1000)
      }
      
      mediaRecorder.start()
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Recording failed. Please try using the text input instead.')
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
      "Creating your listing... (1-3 minutes)",
      "🔍 Analyzing your photo and description...",
      "💰 Researching local market prices...",
      "✍️ Writing your professional listing...",
      "✨ Almost ready..."
    ]
    
    let statusIndex = 0
    const statusInterval = setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length
      setProcessingStatus(statuses[statusIndex])
    }, 3000)

    try {
      console.log('Starting AI processing...')
      
      const formData = new FormData()
      formData.append('image', uploadedPhoto)
      formData.append('description', description)
      formData.append('transcription', transcription)
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze image')
      }

      const result = await response.json()
      console.log('Received AI response:', result)
      
      // Ensure we have the required structure
      if (!result.comprehensive_listing) {
        result.comprehensive_listing = {
          title: (result.item_analysis?.name || 'Item') + ' - Good Condition',
          price: result.pricing_strategy?.market_price || '$75',
          description: `Great ${result.item_analysis?.name || 'item'} in good condition!

• Well-maintained from clean, smoke-free home
• Ready for immediate pickup
• Cash preferred
• Serious inquiries only

Moving sale - priced to sell quickly!`,
          condition: result.item_analysis?.condition || 'Good',
          category: 'General',
          tags: ['item', 'sale', 'good-condition']
        }
      }
      
      setAiResponse(result)
      setCurrentStep("results")
      
    } catch (error) {
      console.error('Error processing with AI:', error)
      
      // Create fallback listing
      const fallbackListing = {
        item_analysis: {
          name: description.split(' ').slice(0, 3).join(' ') || 'Household Item',
          brand: 'Unknown',
          condition: 'Good',
          key_features: ['Well-maintained', 'Good condition']
        },
        pricing_strategy: {
          market_price: '$75',
          quick_sale_price: '$60',
          best_value_price: '$90',
          rationale: 'Competitive pricing for quick sale'
        },
        comprehensive_listing: {
          title: (description.split(' ').slice(0, 4).join(' ') || 'Item') + ' - Good Condition',
          price: '$75',
          description: `${description || 'Great item in good condition!'}

• Well-maintained from clean, smoke-free home
• Ready for immediate pickup
• Cash preferred
• Serious inquiries only

Moving sale - priced to sell quickly!`,
          condition: 'Good',
          category: 'General',
          tags: ['item', 'sale', 'good-condition', 'moving', 'local']
        }
      }
      
      setAiResponse(fallbackListing)
      setCurrentStep("results")
    } finally {
      clearInterval(statusInterval)
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
                          
                          {transcription && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="text-sm text-green-800">
                                <strong>Live transcription:</strong>
                                <div className="mt-1 italic">"{transcription}"</div>
                              </div>
                            </div>
                          )}
                          
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
                      Create My Listing ✨
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
                  <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">Creating your listing</h1>
                  <p className="text-lg text-slate-600">This usually takes 1-3 minutes - we're building you a perfect marketplace listing!</p>
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

                  <div className="text-sm text-slate-500 space-y-2">
                    <div>Professional AI analysis takes 1-3 minutes ⏱️</div>
                    <div className="text-xs text-slate-400">We're researching prices, writing descriptions, and optimizing for marketplaces</div>
                  </div>
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
                  <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">🎉 Your listing is ready!</h1>
                  <p className="text-lg text-slate-600">Copy and paste into any marketplace</p>
                </div>

                {/* Simple Listing Card */}
                <Card className="p-8 bg-white shadow-xl max-w-4xl mx-auto">
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
                    <div className="space-y-6">
                      {/* Title and Price */}
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          {aiResponse.comprehensive_listing?.title || 'Professional Listing'}
                        </h2>
                        <div className="text-3xl font-bold text-green-600 mb-4">
                          {aiResponse.comprehensive_listing?.price || '$75'}
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          {aiResponse.comprehensive_listing?.condition || 'Good Condition'}
                        </Badge>
                      </div>

                      {/* Description Box */}
                      <div className="bg-slate-50 rounded-lg p-4 border">
                        <h4 className="font-semibold text-slate-900 mb-3">Complete Description:</h4>
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {aiResponse.comprehensive_listing?.description || 'Great item in good condition!'}
                        </div>
                      </div>

                      {/* Copy Buttons */}
                      <div className="space-y-3">
                        {/* Quick Copy Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={() => {
                              const title = aiResponse.comprehensive_listing?.title || 'Professional Listing'
                              navigator.clipboard.writeText(title)
                              setCopiedPlatform('title')
                              setTimeout(() => setCopiedPlatform(null), 1500)
                            }}
                            variant="outline"
                            className="h-12"
                          >
                            {copiedPlatform === 'title' ? (
                              <><Check className="w-4 h-4 mr-2 text-green-600" />Copied!</>
                            ) : (
                              <><Copy className="w-4 h-4 mr-2" />Copy Title</>
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => {
                              const price = aiResponse.comprehensive_listing?.price || '$75'
                              navigator.clipboard.writeText(price)
                              setCopiedPlatform('price')
                              setTimeout(() => setCopiedPlatform(null), 1500)
                            }}
                            variant="outline"
                            className="h-12"
                          >
                            {copiedPlatform === 'price' ? (
                              <><Check className="w-4 h-4 mr-2 text-green-600" />Copied!</>
                            ) : (
                              <><Copy className="w-4 h-4 mr-2" />Copy Price</>
                            )}
                          </Button>
                        </div>
                        
                        {/* Copy Description */}
                        <Button
                          onClick={() => {
                            const description = aiResponse.comprehensive_listing?.description || 'Great item in good condition!'
                            navigator.clipboard.writeText(description)
                            setCopiedPlatform('description')
                            setTimeout(() => setCopiedPlatform(null), 1500)
                          }}
                          variant="outline"
                          className="w-full h-12"
                        >
                          {copiedPlatform === 'description' ? (
                            <><Check className="w-4 h-4 mr-2 text-green-600" />Description Copied!</>
                          ) : (
                            <><Copy className="w-4 h-4 mr-2" />Copy Description</>
                          )}
                        </Button>
                        
                        {/* Copy Everything */}
                        <Button
                          onClick={() => {
                            const title = aiResponse.comprehensive_listing?.title || 'Professional Listing'
                            const price = aiResponse.comprehensive_listing?.price || '$75'
                            const description = aiResponse.comprehensive_listing?.description || 'Great item in good condition!'
                            
                            const fullListing = `TITLE: ${title}\n\nPRICE: ${price}\n\nDESCRIPTION:\n${description}`
                            
                            navigator.clipboard.writeText(fullListing)
                            setCopiedPlatform('full')
                            setTimeout(() => setCopiedPlatform(null), 2000)
                          }}
                          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg"
                        >
                          {copiedPlatform === 'full' ? (
                            <><Check className="w-5 h-5 mr-2" />Complete Listing Copied!</>
                          ) : (
                            <><Copy className="w-5 h-5 mr-2" />Copy Complete Listing</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Instructions */}
                <div className="text-center space-y-4">
                  <div className="text-lg font-medium text-slate-900">
                    📱 Ready to post? Use the buttons above to copy your listing!
                  </div>
                  <div className="text-sm text-slate-600 max-w-2xl mx-auto">
                    <strong>Quick tip:</strong> Go to Facebook Marketplace, Craigslist, or OfferUp, 
                    click "Create Listing", upload your photo, then paste our professional content. 
                    Your listing will look amazing!
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => {
                      setCurrentStep("upload")
                      setUploadedPhoto(null)
                      setPhotoPreview("")
                      setRecording(null)
                      setDescription("")
                      setAiResponse(null)
                      setCopiedPlatform(null)
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
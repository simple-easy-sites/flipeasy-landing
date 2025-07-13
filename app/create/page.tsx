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

// Pricing Insights Component
const PricingInsights = ({ pricingData }: { pricingData: any }) => (
  <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50">
    <div className="flex items-center space-x-2 mb-4">
      <DollarSign className="w-5 h-5 text-green-600" />
      <h3 className="text-lg font-semibold text-slate-900">Smart Pricing Strategy</h3>
    </div>
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="text-center p-3 bg-white/60 rounded-lg">
        <div className="text-lg font-bold text-green-600">{pricingData.quick_sale_price}</div>
        <div className="text-xs text-slate-600">Quick Sale</div>
      </div>
      <div className="text-center p-3 bg-green-100/60 rounded-lg border-2 border-green-300">
        <div className="text-lg font-bold text-green-700">{pricingData.market_price}</div>
        <div className="text-xs text-green-700 font-medium">Recommended</div>
      </div>
      <div className="text-center p-3 bg-white/60 rounded-lg">
        <div className="text-lg font-bold text-green-600">{pricingData.best_value_price}</div>
        <div className="text-xs text-slate-600">Best Value</div>
      </div>
    </div>
    {pricingData.rationale && (
      <div className="text-sm text-slate-700 bg-white/40 p-3 rounded-lg">
        <strong>Why this price?</strong> {pricingData.rationale}
      </div>
    )}
  </Card>
)

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
  const [speechRecognition, setSpeechRecognition] = useState<any>(null)
  const [isListening, setIsListening] = useState(false)
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
      
      // Initialize speech recognition for live transcription
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
          
          // Update transcription in real-time
          setTranscription(finalTranscript + interimTranscript)
        }
        
        recognition.onstart = () => {
          console.log('Speech recognition started')
          setIsListening(true)
        }
        
        recognition.onend = () => {
          console.log('Speech recognition ended')
          setIsListening(false)
        }
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
        
        setSpeechRecognition(recognition)
        recognition.start()
      }
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Recording not supported in this browser')
      }
      
      // Safari-specific audio constraints (much simpler for compatibility)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      
      let constraints
      if (isSafari) {
        // Safari works better with minimal constraints
        constraints = {
          audio: true  // Keep it simple for Safari
        }
      } else {
        // More advanced constraints for other browsers
        constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 44100
          }
        }
      }
      
      console.log('Browser detected:', isSafari ? 'Safari' : 'Other', 'Using constraints:', constraints)
      
      console.log('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Got media stream:', stream)
      
      // Safari-compatible MIME type detection
      let mimeType = ''
      
      if (isSafari) {
        // Safari prefers these formats
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav'
        } else {
          mimeType = '' // Let Safari choose the default
        }
      } else {
        // Other browsers
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else {
          mimeType = ''
        }
      }
      
      console.log('Selected MIME type:', mimeType || 'default')
      
      // Create MediaRecorder with Safari-friendly options
      const mediaRecorderOptions = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions)
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
          const finalMimeType = mimeType || mediaRecorder.mimeType || 'audio/wav'
          const audioBlob = new Blob(audioChunks, { type: finalMimeType })
          console.log('Created audio blob:', audioBlob.size, 'type:', finalMimeType)
          setRecording(audioBlob)
        }
        stream.getTracks().forEach(track => track.stop())
        
        // Stop speech recognition
        if (speechRecognition) {
          speechRecognition.stop()
        }
      }
      
      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully')
        setIsRecording(true)
        setRecordingDuration(0)
        
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1)
        }, 1000)
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setIsRecording(false)
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
        }
        stream.getTracks().forEach(track => track.stop())
        
        // Stop speech recognition on error
        if (speechRecognition) {
          speechRecognition.stop()
        }
      }
      
      console.log('Starting MediaRecorder...')
      
      // Safari sometimes needs a delay before starting
      if (isSafari) {
        setTimeout(() => {
          mediaRecorder.start(1000)
        }, 100)
      } else {
        mediaRecorder.start(1000)
      }
      
    } catch (error) {
      console.error('Error starting recording:', error)
      setIsRecording(false)
      setIsListening(false)
      
      // Show user-friendly error message
      let errorMessage = 'Recording failed. '
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access in your browser settings and refresh the page.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone and try again.'
      } else if (error.message.includes('CoreAudioCaptureSource')) {
        errorMessage += 'Safari microphone issue detected. Please try: 1) Refresh the page 2) Check Safari microphone permissions in System Preferences 3) Try typing your description instead.'
      } else {
        errorMessage += 'Please try refreshing the page or use the text input below instead.'
      }
      
      alert(errorMessage)
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
      "Creating your listing... (this takes 1-3 minutes)",
      "🔍 Analyzing your photo and description...",
      "💰 Researching local market prices...",
      "✍️ Writing your professional listings...",
      "📱 Optimizing for each platform...",
      "✨ Almost ready..."
    ]
    
    let statusIndex = 0
    const statusInterval = setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length
      setProcessingStatus(statuses[statusIndex])
    }, 3000) // Slower status changes
    
    // Add timeout protection (2 minutes max)
    let timeoutId: NodeJS.Timeout;
    timeoutId = setTimeout(() => {
      clearInterval(statusInterval);
      console.warn('AI processing timeout - providing fallback');
      
      // Create timeout fallback
      const timeoutListing = {
        item_analysis: {
          name: description.split(' ').slice(0, 3).join(' ') || 'Household Item',
          brand: 'Unknown',
          condition: 'Good',
          category: 'General',
          key_features: ['Well-maintained', 'Good condition']
        },
        pricing_strategy: {
          market_price: '$75',
          quick_sale_price: '$60',
          best_value_price: '$90'
        },
        comprehensive_listing: {
          title: (description.split(' ').slice(0, 4).join(' ') || 'Item') + ' - Good Condition',
          price: '$75',
          description: `${description || 'Great item in good condition!'}

• Well-maintained item
• Ready for pickup
• Cash preferred

Moving sale - need gone ASAP!`,
          category: 'General',
          condition: 'Good',
          tags: ['item', 'sale', 'local'],
          specifications: { brand: 'TBD', condition: 'Good' }
        }
      };
      
      setAiResponse(timeoutListing);
      setCurrentStep("results");
      alert('⏰ Processing took longer than expected. We\'ve created a basic listing you can customize!');
    }, 120000); // 2 minute timeout

    try {
      const formData = new FormData()
      formData.append('image', uploadedPhoto)
      formData.append('description', description)
      formData.append('transcription', transcription) // Add live transcription

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to analyze image: ${errorData.error || response.statusText}`);
      }

      const result = await response.json()
      console.log('Received AI response:', result)
      
      // Handle API response format
      let finalResult = result;
      
      // Ensure required structure exists
      if (!finalResult.comprehensive_listing) {
        console.warn('No comprehensive_listing in response, creating fallback');
        finalResult.comprehensive_listing = {
          title: finalResult.item_analysis?.name + ' - Good Condition' || 'Item for Sale',
          price: finalResult.pricing_strategy?.recommended_price || '$75',
          description: 'Great item in good condition! Well-maintained from smoke-free home.',
          category: finalResult.item_analysis?.category || 'General',
          condition: finalResult.item_analysis?.condition || 'Good',
          tags: ['item', 'sale', 'good-condition'],
          specifications: {
            brand: finalResult.item_analysis?.brand || 'Unknown',
            condition: finalResult.item_analysis?.condition || 'Good',
            material: finalResult.item_analysis?.materials || 'Mixed'
          }
        };
      }
      
      setAiResponse(finalResult)
      setCurrentStep("results")
      
    } catch (error) {
      console.error('Error processing with AI:', error);
      
      // Show user-friendly error and provide fallback
      alert('⚠️ Processing took longer than expected. We\'ve created a basic listing for you to customize!');
      
      // Create fallback listing based on user input
      const fallbackListing = {
        item_analysis: {
          name: description.split(' ').slice(0, 3).join(' ') || 'Household Item',
          brand: 'Unknown',
          condition: 'Good',
          category: 'General',
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
          category: 'General',
          condition: 'Good',
          tags: ['item', 'sale', 'good-condition', 'moving', 'local'],
          specifications: {
            brand: 'To be determined',
            condition: 'Good',
            material: 'Mixed materials'
          }
        }
      };
      
      setAiResponse(fallbackListing);
      setCurrentStep("results");
    } finally {
      clearInterval(statusInterval);
      clearTimeout(timeoutId); // Clear timeout when done
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
                    {/* Guided Questions Panel */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Helpful Questions to Answer While Recording</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="font-medium text-blue-800">About the Item:</div>
                          <ul className="space-y-1 text-blue-700">
                            <li>• What is it exactly? (brand, model, type)</li>
                            <li>• What condition is it in?</li>
                            <li>• What are the dimensions/size?</li>
                            <li>• What material is it made of?</li>
                            <li>• What color is it?</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <div className="font-medium text-blue-800">Your Story:</div>
                          <ul className="space-y-1 text-blue-700">
                            <li>• Where did you buy it from?</li>
                            <li>• How much did you originally pay?</li>
                            <li>• How long have you owned it?</li>
                            <li>• Why are you selling it?</li>
                            <li>• Any flaws or wear to mention?</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-blue-100/50 rounded-lg">
                        <div className="text-xs text-blue-800">
                          <strong>💡 Tip:</strong> The more details you provide, the better your listing will be! 
                          Don't worry if you don't know everything - just share what you can.
                        </div>
                      </div>
                    </Card>

                    {/* Voice Recording */}
                    <Card className="p-6 bg-white/80 backdrop-blur-xl">
                      <h3 className="text-lg font-semibold mb-4">🎤 Voice Description (Recommended)</h3>
                      
                      {/* Safari-specific note */}
                      {/^((?!chrome|android).)*safari/i.test(navigator.userAgent) && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm text-blue-800">
                            <strong>Safari Users:</strong> If recording doesn't work, try refreshing the page or use the text box below. 
                            Make sure Safari has microphone permission in System Preferences → Security & Privacy → Microphone.
                          </div>
                        </div>
                      )}
                      
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
                          
                          {/* Live transcription display */}
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
                  <p className="text-lg text-slate-600">This usually takes 1-3 minutes - we're building you perfect marketplace listings!</p>
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
                    <div className="text-xs text-slate-400">We're researching prices, writing descriptions, and optimizing for multiple platforms</div>
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
                  <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">🎉 Your professional listings are ready!</h1>
                  <p className="text-lg text-slate-600">AI-optimized copy for maximum selling success</p>
                </div>

                {/* Item Analysis Summary */}
                <Card className="p-6 bg-gradient-to-br from-slate-50 to-white border border-slate-200/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{aiResponse.item_analysis?.name || 'Your Item'}</h2>
                      {aiResponse.item_analysis?.brand && aiResponse.item_analysis.brand !== 'Unknown' && (
                        <p className="text-slate-600 font-medium">
                          {aiResponse.item_analysis.brand} 
                          {aiResponse.item_analysis.model && aiResponse.item_analysis.model !== 'N/A' ? ` - ${aiResponse.item_analysis.model}` : ''}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {aiResponse.item_analysis?.condition || 'Good Condition'}
                        </Badge>
                        {aiResponse.item_analysis?.estimated_retail_price && 
                         aiResponse.item_analysis.estimated_retail_price !== 'Research needed' && (
                          <span className="text-sm text-slate-600">
                            Retail: {aiResponse.item_analysis.estimated_retail_price}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">
                        {aiResponse.pricing_strategy?.market_price || '$0'}
                      </div>
                      <div className="text-sm text-slate-600">Recommended Price</div>
                    </div>
                  </div>
                  
                  {aiResponse.item_analysis?.key_features && aiResponse.item_analysis.key_features.length > 0 && (
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

                {/* Comprehensive Listing Display */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">📝 Your Professional Marketplace Listing</h3>
                  <p className="text-slate-600">Ready to copy and paste into any marketplace</p>
                </div>

                {/* Listing Preview */}
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

                        {/* Comprehensive Listing Content */}
                        <div className="space-y-6">
                          {/* Main Listing Information */}
                          <div className="grid grid-cols-2 gap-4">
                            <ListingSection
                              title="Title"
                              content={aiResponse.comprehensive_listing?.title || 'Professional listing title'}
                              copyLabel="Title"
                              icon={<Copy className="w-4 h-4" />}
                              className="border-blue-200 bg-blue-50/50"
                            />
                            <ListingSection
                              title="Price"
                              content={aiResponse.comprehensive_listing?.price || '$0'}
                              copyLabel="Price"
                              icon={<DollarSign className="w-4 h-4" />}
                              className="border-green-200 bg-green-50/50"
                            />
                          </div>

                          {/* Category and Condition */}
                          <div className="grid grid-cols-2 gap-4">
                            <ListingSection
                              title="Category"
                              content={`${aiResponse.comprehensive_listing?.category || 'General'} > ${aiResponse.comprehensive_listing?.subcategory || 'Other'}`}
                              copyLabel="Category"
                              className="border-purple-200 bg-purple-50/50"
                            />
                            <ListingSection
                              title="Condition"
                              content={aiResponse.comprehensive_listing?.condition || 'Good'}
                              copyLabel="Condition"
                              className="border-yellow-200 bg-yellow-50/50"
                            />
                          </div>

                          {/* Specifications */}
                          {aiResponse.comprehensive_listing?.specifications && (
                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-slate-900 text-sm">Specifications</h4>
                                <CopyButton 
                                  text={Object.entries(aiResponse.comprehensive_listing.specifications)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join('\n')}
                                  label="Specs" 
                                  size="sm" 
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                                {Object.entries(aiResponse.comprehensive_listing.specifications).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium capitalize">{key}:</span>
                                    <span>{value as string}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Main Description */}
                          <ListingSection
                            title="Complete Description"
                            content={aiResponse.comprehensive_listing?.description || 'Professional description for your item'}
                            copyLabel="Description"
                            className="border-slate-200 bg-slate-50/50"
                          />

                          {/* Tags */}
                          {aiResponse.comprehensive_listing?.tags && (
                            <div className="border border-slate-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-slate-900 text-sm">Search Tags</h4>
                                <CopyButton 
                                  text={aiResponse.comprehensive_listing.tags.join(', ')} 
                                  label="Tags" 
                                  size="sm" 
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {aiResponse.comprehensive_listing.tags.map((tag: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* All-in-One Copy Button */}
                          <div className="pt-4">
                            <Button
                              onClick={() => {
                                const listing = aiResponse.comprehensive_listing
                                if (listing) {
                                  let fullText = `TITLE: ${listing.title}\n\n`
                                  fullText += `PRICE: ${listing.price}\n\n`
                                  fullText += `CATEGORY: ${listing.category}\n`
                                  fullText += `CONDITION: ${listing.condition}\n\n`
                                  fullText += `DESCRIPTION:\n${listing.description}\n\n`
                                  
                                  if (listing.specifications) {
                                    fullText += `SPECIFICATIONS:\n`
                                    Object.entries(listing.specifications).forEach(([key, value]) => {
                                      fullText += `${key}: ${value}\n`
                                    })
                                    fullText += `\n`
                                  }
                                  
                                  if (listing.tags) {
                                    fullText += `TAGS: ${listing.tags.join(', ')}`
                                  }
                                  
                                  navigator.clipboard.writeText(fullText);
                                  setCopiedPlatform('comprehensive');
                                  setTimeout(() => setCopiedPlatform(null), 2000);
                                } else {
                                  alert('No listing data available to copy');
                                }
                              }}
                              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg"
                            >
                              {copiedPlatform === 'comprehensive' ? (
                                <>
                                  <Check className="w-5 h-5 mr-2" />
                                  Complete Listing Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-5 h-5 mr-2" />
                                  Copy Complete Professional Listing
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>

                {/* How to Use Your Listings */}
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">📝 How to Use Your Professional Listings</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-medium text-blue-800">📱 Facebook Marketplace:</div>
                      <ol className="space-y-1 text-blue-700 text-xs">
                        <li>1. Open Facebook app/website</li>
                        <li>2. Go to Marketplace → "Create Listing"</li>
                        <li>3. Upload your photo</li>
                        <li>4. Copy/paste our title, price, description</li>
                        <li>5. Select category we suggested</li>
                        <li>6. Post!</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-blue-800">📋 Craigslist:</div>
                      <ol className="space-y-1 text-blue-700 text-xs">
                        <li>1. Go to your city's Craigslist</li>
                        <li>2. Click "Post to Classifieds"</li>
                        <li>3. Choose "For Sale" category</li>
                        <li>4. Copy our title & description</li>
                        <li>5. Upload photo</li>
                        <li>6. Add your contact info</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-blue-800">🚚 OfferUp:</div>
                      <ol className="space-y-1 text-blue-700 text-xs">
                        <li>1. Open OfferUp app</li>
                        <li>2. Tap "+" to create listing</li>
                        <li>3. Add your photo</li>
                        <li>4. Paste our title & price</li>
                        <li>5. Copy description</li>
                        <li>6. Set location & post</li>
                      </ol>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100/50 rounded-lg">
                    <div className="text-xs text-blue-800">
                      <strong>💡 Pro Tip:</strong> Post on multiple platforms for maximum visibility! 
                      Our listings are optimized for each platform's audience and search algorithms.
                    </div>
                  </div>
                </Card>

                {/* Next Steps */}
                <div className="text-center space-y-6">
                  <div className="text-lg font-medium text-slate-900">
                    🎉 Your professional listings are ready - time to start selling!
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
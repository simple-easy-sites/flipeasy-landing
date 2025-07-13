 professional</p>
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
                      {deviceIsMobile ? (
                        <>
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
                            onClick={handleUploadFile}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose from Gallery
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="lg"
                          onClick={handleUploadFile}
                          className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                        >
                          💼 Upload Photo
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-500">
                      {deviceIsMobile ? "Use your camera for best results" : "Drag & drop or click to upload"}
                    </p>
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
                onChange={handleFileInputChange}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Step 2: Voice Recording with Guided Questions */}
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
                  Speak naturally about your item, or use our guided questions for best results
                </p>
              </div>

              {/* Guided Questions (Always Visible as Option) */}
              <GuidedQuestions 
                isOpen={showGuidedQuestions}
                onToggle={() => setShowGuidedQuestions(!showGuidedQuestions)}
                answers={guidedAnswers}
                onAnswerChange={(question, answer) => {
                  setGuidedAnswers(prev => ({ ...prev, [question]: answer }));
                }}
              />

              {/* Voice Recording Interface */}
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
                        <div className="text-sm text-slate-600">Max 60 seconds • Optional but recommended</div>
                        <div className="text-xs text-slate-500">
                          Example: "This is a baby stroller we used for 2 years, it's in great condition..."
                        </div>
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

              {/* Instructions */}
              <div className="text-center space-y-4">
                <div className="text-sm text-slate-600 max-w-lg mx-auto">
                  💡 <strong>Pro tip:</strong> Combine voice recording with guided questions above for the best AI-generated listings
                </div>
              </div>

              {/* Continue Button */}
              {canProceed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={processListing}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg"
                  >
                    Generate Professional Listings ✨
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
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.85)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Photo upload handlers
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const compressedFile = await compressImage(file)
      setUploadedPhoto(compressedFile)
      const previewUrl = URL.createObjectURL(compressedFile)
      setPhotoPreview(previewUrl)
    }
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment')
      fileInputRef.current.click()
    }
  }

  const handleUploadFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture')
      fileInputRef.current.click()
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const compressedFile = await compressImage(file)
      setUploadedPhoto(compressedFile)
      const previewUrl = URL.createObjectURL(compressedFile)
      setPhotoPreview(previewUrl)
    }
  }

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setRecording({
          blob,
          duration: recordingTime,
          transcript: "Voice recording captured successfully"
        })
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopRecording()
            return 60
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. You can still proceed without voice recording.')
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
        const audioUrl = URL.createObjectURL(recording.blob)
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setIsPlaying(true)
        audioRef.current.onended = () => setIsPlaying(false)
      }
    }
  }

  // Check if user can proceed to next step
  const canProceed = uploadedPhoto && (recording || Object.keys(guidedAnswers).length > 0)

  // Process listing with AI
  const processListing = async () => {
    if (!uploadedPhoto) return

    setCurrentStep('processing')
    
    const statuses = [
      'Analyzing your photo...',
      'Identifying item details...',
      'Researching market prices...',
      'Crafting compelling descriptions...',
      'Optimizing for each platform...',
      'Almost ready!'
    ]

    for (let i = 0; i < statuses.length; i++) {
      setProcessingStatus(statuses[i])
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    try {
      const formData = new FormData()
      formData.append('image', uploadedPhoto)
      
      let description = ''
      if (recording) {
        description += 'Voice recording: ' + recording.transcript + '. '
      }
      if (Object.keys(guidedAnswers).length > 0) {
        description += Object.entries(guidedAnswers)
          .filter(([_, value]) => value.trim())
          .map(([key, value]) => `${key}: ${value}`)
          .join('. ')
      }
      
      formData.append('description', description)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to analyze image')
      }

      const result = await response.json()
      setAiResponse(result)
      setCurrentStep('results')
    } catch (error) {
      console.error('Error processing listing:', error)
      alert('Sorry, there was an error processing your listing. Please try again.')
      setCurrentStep('record')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {/* Step 1: Photo Upload */}
          {currentStep === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Camera className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-3xl lg:text-4xl font-light text-slate-900 mb-4">
                  Let&apos;s start with a photo
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Take a clear photo of your item. Our AI works best with good lighting and the full item visible.
                  No need to be perfect - we&apos;ll help you look professional.
                </p>
              </div>

              {!uploadedPhoto ? (
                <Card
                  className="p-12 border-2 border-dashed border-slate-300 hover:border-cyan-400 transition-colors bg-gradient-to-br from-slate-50 to-white cursor-pointer"
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
                      {deviceIsMobile ? (
                        <>
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
                            onClick={handleUploadFile}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose from Gallery
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="lg"
                          onClick={handleUploadFile}
                          className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                        >
                          💼 Upload Photo
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-500">
                      {deviceIsMobile ? "Use your camera for best results" : "Drag & drop or click to upload"}
                    </p>
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
                onChange={handleFileInputChange}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Step 2: Voice Recording with Guided Questions */}
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
                  Speak naturally about your item, or use our guided questions for best results
                </p>
              </div>

              {/* Guided Questions (Always Visible as Option) */}
              <GuidedQuestions 
                isOpen={showGuidedQuestions}
                onToggle={() => setShowGuidedQuestions(!showGuidedQuestions)}
                answers={guidedAnswers}
                onAnswerChange={(question, answer) => {
                  setGuidedAnswers(prev => ({ ...prev, [question]: answer }));
                }}
              />

              {/* Voice Recording Interface */}
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
                        <div className="text-sm text-slate-600">Max 60 seconds • Optional but recommended</div>
                        <div className="text-xs text-slate-500">
                          Example: "This is a baby stroller we used for 2 years, it's in great condition..."
                        </div>
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

              {/* Instructions */}
              <div className="text-center space-y-4">
                <div className="text-sm text-slate-600 max-w-lg mx-auto">
                  💡 <strong>Pro tip:</strong> Combine voice recording with guided questions above for the best AI-generated listings
                </div>
              </div>

              {/* Continue Button */}
              {canProceed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={processListing}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg"
                  >
                    Generate Professional Listings ✨
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              <audio ref={audioRef} className="hidden" />
            </motion.div>
          )} (typeof listing.description === 'object') {
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
                      setGuidedAnswers({})
                      setShowGuidedQuestions(false)
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
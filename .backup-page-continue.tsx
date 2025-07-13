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
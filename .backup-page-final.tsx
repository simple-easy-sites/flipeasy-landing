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
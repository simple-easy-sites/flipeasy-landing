                    {listings.item_analysis.condition && ` • ${listings.item_analysis.condition} condition`}
                  </div>
                )}
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
                            {listings.listings[activePlatform].title}
                          </h3>
                          <div className="text-2xl font-bold text-green-600">{listings.listings[activePlatform].price}</div>
                        </div>

                        <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {listings.listings[activePlatform].description}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {listings.listings[activePlatform].tags.map((tag, index) => (
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

              {/* Enhanced AI Insights */}
              {listings.item_analysis && (
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">🤖 AI Analysis Results</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div><span className="font-medium">Brand:</span> {listings.item_analysis.brand}</div>
                      <div><span className="font-medium">Category:</span> {listings.item_analysis.category}</div>
                      <div><span className="font-medium">Condition:</span> {listings.item_analysis.condition}</div>
                      {listings.item_analysis.materials && (
                        <div><span className="font-medium">Materials:</span> {listings.item_analysis.materials}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div><span className="font-medium">Estimated Value:</span> {listings.item_analysis.estimated_used_value_range}</div>
                      {listings.item_analysis.dimensions && (
                        <div><span className="font-medium">Dimensions:</span> {listings.item_analysis.dimensions}</div>
                      )}
                      {listings.pricing_strategy && (
                        <div><span className="font-medium">Quick Sale Price:</span> {listings.pricing_strategy.quick_sale_price}</div>
                      )}
                    </div>
                  </div>
                  {listings.item_analysis.key_features && listings.item_analysis.key_features.length > 0 && (
                    <div className="mt-4">
                      <span className="font-medium">Key Features: </span>
                      {listings.item_analysis.key_features.join(', ')}
                    </div>
                  )}
                </Card>
              )}

              {/* Quality Indicators */}
              <div className="flex justify-center space-x-6 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>AI-generated descriptions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Market-researched pricing</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Platform-optimized</span>
                </div>
              </div>

              {/* Selling Tips */}
              {listings.selling_optimization && (
                <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">💡 Pro Selling Tips</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {listings.selling_optimization.best_posting_times && (
                      <div>
                        <span className="font-medium text-orange-700">Best posting times:</span>
                        <ul className="list-disc list-inside mt-1 text-slate-700">
                          {listings.selling_optimization.best_posting_times.map((time: string, index: number) => (
                            <li key={index}>{time}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {listings.selling_optimization.photo_suggestions && (
                      <div>
                        <span className="font-medium text-orange-700">Photo tips:</span>
                        <ul className="list-disc list-inside mt-1 text-slate-700">
                          {listings.selling_optimization.photo_suggestions.map((tip: string, index: number) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {listings.selling_optimization.safety_tips && (
                    <div className="mt-4">
                      <span className="font-medium text-orange-700">Safety reminders:</span>
                      <ul className="list-disc list-inside mt-1 text-slate-700">
                        {listings.selling_optimization.safety_tips.map((tip: string, index: number) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              )}

              {/* Next Steps */}
              <div className="text-center space-y-4">
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

                <div className="text-sm text-slate-600">
                  💡 Tip: Copy listings to multiple platforms for faster sales!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

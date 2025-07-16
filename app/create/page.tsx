'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Mic, Copy, RefreshCw, CheckCircle } from 'lucide-react';

interface ListingData {
  title: string;
  description: string;
  condition: string;
  category: string;
  pricing: {
    quick_sale: string;
    market_value: string;
    optimistic: string;
  };
  selling_tips: string[];
}

export default function CreateListing() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [listing, setListing] = useState<ListingData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const recordingPrompts = [
    "Tell me about this item...",
    "What material is it made of?",
    "Where did you buy it?",
    "How long have you had it?",
    "What condition is it in?",
    "Why are you selling it?",
    "What did you love about it?",
    "What size or dimensions?",
    "Any flaws or wear to mention?"
  ];

  const [currentPrompt, setCurrentPrompt] = useState(0);

  // Rotate prompts every 3 seconds
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      setCurrentPrompt((prev) => (prev + 1) % recordingPrompts.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setListing(null); // Reset results when new image uploaded
    }
  };

  const handleVoiceRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      setCurrentPrompt(0);
      setDescription("🎤 Recording your description...");
      
      // Simulate 10-second recording (replace with actual speech-to-text later)
      setTimeout(() => {
        setIsRecording(false);
        setDescription("Great! I got your description. Click 'Generate My Listing' to create your professional listing.");
      }, 10000);
    } else {
      setIsRecording(false);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('description', description);
      formData.append('location', 'United States');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setListing(data);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateFullListing = () => {
    if (!listing) return '';
    
    return `${listing.title}

${listing.description}

Condition: ${listing.condition}
Category: ${listing.category}

Pricing Options:
💵 Quick Sale: ${listing.pricing.quick_sale}
💎 Market Value: ${listing.pricing.market_value}
🏆 Optimistic: ${listing.pricing.optimistic}

Selling Tips:
${listing.selling_tips.map(tip => `• ${tip}`).join('\n')}

Generated with FlipEasy - Turn clutter into cash in 60 seconds!`;
  };

  const copyToClipboard = async () => {
    const fullListing = generateFullListing();
    try {
      await navigator.clipboard.writeText(fullListing);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold text-gray-900">FlipEasy</h1>
          <p className="text-gray-600">Turn clutter into cash in 60 seconds</p>
        </div>
        
        {/* Photo Upload */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              📸 <span className="ml-2">1. Take a Photo</span>
            </h2>
            {imagePreview ? (
              <div className="space-y-4">
                <img src={imagePreview} alt="Item" className="w-full h-48 object-cover rounded-lg border-2 border-gray-200" />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setImagePreview('');
                    setImage(null);
                    setListing(null);
                  }}
                  className="w-full"
                >
                  Take New Photo
                </Button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">Tap to take photo</p>
                  <p className="text-sm text-gray-500 mt-1">Works best with good lighting</p>
                </div>
              </label>
            )}
          </CardContent>
        </Card>

        {/* Voice Recording */}
        {imagePreview && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                🎤 <span className="ml-2">2. Tell Me About It</span>
              </h2>
              
              <div className="text-center space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
                  <p className="text-blue-800 font-medium">
                    {recordingPrompts[currentPrompt]}
                  </p>
                </div>
                
                <Button
                  onClick={handleVoiceRecording}
                  disabled={isAnalyzing}
                  className={`w-24 h-24 rounded-full transition-all ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  <Mic className="h-8 w-8 text-white" />
                </Button>
                
                <p className="text-sm text-gray-600">
                  {isRecording 
                    ? 'Recording... speak naturally (60 sec max)' 
                    : 'Tap to record your description'
                  }
                </p>
              </div>

              {/* Manual input option */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Or type your description:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Tell me about this item - where you got it, how long you've had it, why you're selling..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Listing */}
        {imagePreview && description && !isRecording && (
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="animate-spin mr-2 h-5 w-5" />
                    Creating Your Listing...
                  </>
                ) : (
                  <>
                    ✨ Generate My Listing
                  </>
                )}
              </Button>
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {listing && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-green-800 flex items-center">
                🎉 <span className="ml-2">Your Listing is Ready!</span>
              </h2>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">📝 Title</h3>
                  <p className="text-gray-700 font-medium">{listing.title}</p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">📄 Description</h3>
                  <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                    {listing.description}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">💰 Suggested Pricing</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm font-medium">💵 Quick Sale</span>
                      <span className="font-bold text-blue-600">{listing.pricing.quick_sale}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium">💎 Market Value</span>
                      <span className="font-bold text-green-600">{listing.pricing.market_value}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                      <span className="text-sm font-medium">🏆 Optimistic</span>
                      <span className="font-bold text-purple-600">{listing.pricing.optimistic}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">✅ Selling Tips</h3>
                  <ul className="space-y-2">
                    {listing.selling_tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button
                  onClick={copyToClipboard}
                  className={`w-full py-4 text-lg font-semibold transition-all ${
                    copied 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-5 w-5" />
                      Copy Complete Listing
                    </>
                  )}
                </Button>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Now paste this into Facebook Marketplace, Craigslist, or OfferUp!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

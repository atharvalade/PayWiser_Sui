"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UserData {
  name: string;
  walletAddress: string;
  luxandUuid: string;
  isRecognized: boolean;
}

interface PaymentState {
  step: 'idle' | 'detecting' | 'recognized' | 'amount' | 'authorizing' | 'ble' | 'security' | 'biometric' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
}

interface TransactionResult {
  success: boolean;
  transactionId?: string;
  blockExplorerUrl?: string;
  error?: string;
  payWiserTokensEarned?: number;
  customerName?: string;
}

export default function MerchantPage() {
  // Core state
  const [userData, setUserData] = useState<UserData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentState, setPaymentState] = useState<PaymentState>({
    step: 'idle',
    progress: 0,
    message: 'Ready to scan customer'
  });
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [merchantBalance, setMerchantBalance] = useState<{sui: string, usdc: string} | null>(null);
  
  // PayWiser Token Configuration
  const PAYWISER_TOKEN_CONFIG = {
    packageId: "0x5ee7df19f113857e35fc001127a84d56d705a4ea8b0fc1d7cfff677e5d9076a4",
    treasuryCapId: "0x9bc3314168499a1b8cf0be9a00b33a55aff9c27aaafb6d74f2f9d4fcf60d72c4",
    tokenName: "PayWiser Token",
    tokenSymbol: "PWSR",
    rewardRate: 1 // 1 PWSR per 1 USDC spent
  };

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Animation state
  const [animationStep, setAnimationStep] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [biometricCountdown, setBiometricCountdown] = useState(5);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Merchant wallet (hardcoded for demo)
  const MERCHANT_WALLET = "0x8c4215b1b404e1ad2949459c7eff154a2087d2b884334617645a75f96220c836"; // Wallet C

  // Helper function to get private key for wallet address
  const getPrivateKeyForWallet = (walletAddress: string | null) => {
    const walletMap: { [key: string]: string } = {
      "0xcb3fced2337776c984f220f27e97428f426f80e5b771a3e467b2d6f14597929c": "3GInch4KuXu922aU4qCs9PmXgE59c/4S73OtzDStYVM=", // Wallet A
      "0x41fe7d24482047fac1cb08d5e2591eaee7941bc00fdb4d0edb9e0ff81c7f0cd4": "VhjC/jLSrvo1rMtZrY7+5uwlhJX8tki5+mk3gM3jlCw=", // Wallet B
      "0x8c4215b1b404e1ad2949459c7eff154a2087d2b884334617645a75f96220c836": "tHxcgy/yPNHdgVz8BzmQs0P1NfVDKnGwiQqfUTpRnzo=", // Wallet C
    };
    return walletMap[walletAddress || ''] || '';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [stream]);

  // Fetch merchant balance on load
  useEffect(() => {
    fetchMerchantBalance();
  }, []);

  // Handle biometric countdown - simple and proven approach
  useEffect(() => {
    if (biometricCountdown > 0 && paymentState.step === 'biometric') {
      console.log('⏰ Countdown effect triggered, current value:', biometricCountdown);
      
      const timer = setTimeout(() => {
        const newCount = biometricCountdown - 1;
        console.log('⏰ Decrementing countdown:', biometricCountdown, '→', newCount);
        
        if (newCount <= 0) {
          console.log('✅ Countdown completed via useEffect');
          setBiometricCountdown(0);
          completeBiometricVerification();
        } else {
          setBiometricCountdown(newCount);
        }
      }, 1000);

      return () => {
        console.log('🧹 Cleaning up countdown timer');
        clearTimeout(timer);
      };
    }
  }, [biometricCountdown, paymentState.step]);

  const fetchMerchantBalance = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/wallet/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: MERCHANT_WALLET }),
      });
      const data = await response.json();
      if (data.success) {
        setMerchantBalance({
          sui: data.data.balances.sui.formatted,
          usdc: data.data.balances.usdc.formatted
        });
      }
    } catch (error) {
      console.error('Failed to fetch merchant balance:', error);
    }
  };

  const startCamera = async () => {
    try {
      console.log('📹 Starting camera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front-facing camera
        }
      });
      
      console.log('✅ Media stream obtained');
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      // Set video element source with proper event handling
      setTimeout(() => {
        const videoElement = document.getElementById('merchantCameraVideo') as HTMLVideoElement;
        if (videoElement) {
          console.log('📺 Setting video source...');
          videoElement.srcObject = mediaStream;
          
          // Add event listeners to ensure video is loaded
          videoElement.onloadedmetadata = () => {
            console.log('📺 Video metadata loaded, dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
            setIsVideoReady(true);
          };
          
          videoElement.oncanplay = () => {
            console.log('📺 Video can play');
            setIsVideoReady(true);
          };
          
          videoElement.onerror = (error) => {
            console.error('📺 Video error:', error);
            setPaymentState({
              step: 'error',
              progress: 0,
              message: 'Video playback error'
            });
          };
          
        } else {
          console.error('❌ Video element not found during camera start');
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera access error:', error);
      setPaymentState({
        step: 'error',
        progress: 0,
        message: 'Camera access denied. Please allow camera permissions and try again.'
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setIsDetecting(false);
    setIsVideoReady(false);
  };

  const startBiometricCamera = async () => {
    try {
      console.log('📹 Starting biometric camera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ Biometric media stream obtained');
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      // Set biometric video element source
      setTimeout(() => {
        const videoElement = document.getElementById('biometricCameraVideo') as HTMLVideoElement;
        if (videoElement) {
          console.log('📺 Setting biometric video source...');
          videoElement.srcObject = mediaStream;
        } else {
          console.error('❌ Biometric video element not found');
        }
      }, 100);
      
    } catch (error) {
      console.error('Biometric camera access error:', error);
      setPaymentState({
        step: 'error',
        progress: 0,
        message: 'Biometric camera access denied'
      });
    }
  };

  const captureAndRecognize = async () => {
    console.log('📸 Capture photo clicked');
    
    const videoElement = document.getElementById('merchantCameraVideo') as HTMLVideoElement;
    const canvasElement = document.getElementById('merchantCaptureCanvas') as HTMLCanvasElement;
    
    console.log('Video element:', videoElement);
    console.log('Canvas element:', canvasElement);
    
    if (!videoElement) {
      console.error('❌ Video element not found');
      setPaymentState({
        step: 'error',
        progress: 0,
        message: 'Video element not found'
      });
      return;
    }
    
    if (!canvasElement) {
      console.error('❌ Canvas element not found');
      setPaymentState({
        step: 'error',
        progress: 0,
        message: 'Canvas element not found'
      });
      return;
    }
    
    // Check if video is ready
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.error('❌ Video not ready, dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      setPaymentState({
        step: 'error',
        progress: 0,
        message: 'Camera not ready, please wait a moment and try again'
      });
      return;
    }
    
    console.log('📹 Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
    
    const context = canvasElement.getContext('2d');
    if (context) {
      try {
        setIsDetecting(true);
        setPaymentState({
          step: 'detecting',
          progress: 30,
          message: 'Scanning for registered user...'
        });

        // Set canvas dimensions to match video
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        console.log('🎨 Canvas dimensions set to:', canvasElement.width, 'x', canvasElement.height);
        
        // Draw video frame to canvas
        context.drawImage(videoElement, 0, 0);
        
        // Get image data as base64
        const imageDataUrl = canvasElement.toDataURL('image/jpeg', 0.8);
        console.log('📷 Image captured, data URL length:', imageDataUrl.length);
        console.log('📷 Image data URL preview:', imageDataUrl.substring(0, 100) + '...');
        
        setCapturedImage(imageDataUrl);
        console.log('📱 Setting captured image state:', !!imageDataUrl);

        // Convert base64 image to blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        console.log('📦 Blob created:', blob.type, blob.size, 'bytes');
        
        // Debug: Create a download link to inspect the captured image
        const downloadLink = document.createElement('a');
        downloadLink.href = imageDataUrl;
        downloadLink.download = `merchant-capture-${Date.now()}.jpg`;
        console.log('🖼️ Image download link created for debugging:', downloadLink.download);
        // Uncomment the next line to auto-download for inspection:
        // downloadLink.click();
        
        const formData = new FormData();
        formData.append('photo', blob, 'captured_photo.jpg');

        console.log('🚀 Sending recognition request...');
        const recognizeResponse = await fetch('http://localhost:3000/api/face/recognize', {
          method: 'POST',
          body: formData,
        });

        console.log('📡 Recognition response status:', recognizeResponse.status);
        const data = await recognizeResponse.json();
        console.log('🎯 Recognition result:', data);

        if (data.success && data.data.recognized && data.data.walletAddress) {
          // Parse name from luxand person name (walletAddress|userName)
          const userName = data.data.userName || 'Unknown User';
          
          console.log('✅ User recognized:', userName, 'Wallet:', data.data.walletAddress);
          
          setUserData({
            name: userName,
            walletAddress: data.data.walletAddress,
            luxandUuid: data.data.luxandUuid,
            isRecognized: true
          });

          setPaymentState({
            step: 'recognized',
            progress: 100,
            message: `Welcome ${userName}!`
          });

          stopCamera();
          setShowParticles(true);
          setTimeout(() => setShowParticles(false), 3000);
        } else {
          console.log('❌ Recognition failed:', {
            success: data.success,
            recognized: data.data?.recognized,
            walletAddress: data.data?.walletAddress,
            error: data.error
          });
          
          setPaymentState({
            step: 'error',
            progress: 0,
            message: data.error || 'User not recognized. Please ensure you are registered and try again.'
          });
        }
      } catch (error) {
        console.error('❌ Error during photo capture:', error);
        setPaymentState({
          step: 'error',
          progress: 0,
          message: `Photo capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } finally {
        setIsDetecting(false);
      }
    } else {
      console.error('❌ Could not get 2D context from canvas');
      setPaymentState({
        step: 'error',
        progress: 0,
        message: 'Could not initialize canvas for photo capture'
      });
    }
  };

  const handleAmountSubmit = () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0) {
      setPaymentState({
        step: 'amount',
        progress: 0,
        message: `Payment amount: $${amount} USDC`
      });
    }
  };

  const startPaymentFlow = async () => {
    setPaymentState({
      step: 'authorizing',
      progress: 10,
      message: 'Initializing payment...'
    });

    // Step 1: BLE Proximity Check
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPaymentState({
      step: 'ble',
      progress: 25,
      message: 'Checking BLE proximity (within 10m)...'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    setPaymentState({
      step: 'ble',
      progress: 40,
      message: '✅ BLE proximity confirmed'
    });

    // Step 2: Security Checks
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPaymentState({
      step: 'security',
      progress: 55,
      message: 'Running security checks...'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    setPaymentState({
      step: 'security',
      progress: 70,
      message: '✅ Security checks passed'
    });

    // Step 3: Biometric Verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPaymentState({
      step: 'biometric',
      progress: 75,
      message: 'Starting biometric verification...'
    });

    // Open camera for biometric verification
    await startBiometricCamera();
    startBiometricCountdown();
  };

  const startBiometricCountdown = () => {
    console.log('🔢 Starting biometric countdown...');
    
    setBiometricCountdown(5);
    setPaymentState({
      step: 'biometric',
      progress: 80,
      message: 'Look into camera with your emote (password) for 5 seconds'
    });
    
    console.log('⏰ Countdown initialized to 5');
  };

  const completeBiometricVerification = async () => {
    console.log('🎯 Completing biometric verification...');
    stopCamera();
    
    setPaymentState({
      step: 'processing',
      progress: 90,
      message: 'Processing transaction...'
    });

    // Execute sponsored transaction
    try {
      const transferResponse = await fetch('http://localhost:3000/api/sponsor/transfer-usdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPrivateKey: getPrivateKeyForWallet(userData?.walletAddress || null),
          toAddress: MERCHANT_WALLET,
          amount: parseFloat(paymentAmount)
        }),
      });

      const transferData = await transferResponse.json();
      console.log('Transfer result:', transferData);

      if (transferData.success) {
        // Calculate PayWiser tokens to be rewarded (1 PWSR per 1 USDC)
        const tokensEarned = Math.floor(parseFloat(paymentAmount) * PAYWISER_TOKEN_CONFIG.rewardRate);
        
        setTransactionResult({
          success: true,
          transactionId: transferData.data.transactionDigest,
          blockExplorerUrl: `https://suiexplorer.com/txblock/${transferData.data.transactionDigest}?network=testnet`,
          payWiserTokensEarned: tokensEarned,
          customerName: userData?.name || 'Customer'
        });

        setPaymentState({
          step: 'success',
          progress: 100,
          message: '🎉 Payment completed successfully!'
        });

        // Refresh merchant balance
        setTimeout(() => {
          fetchMerchantBalance();
        }, 2000);

        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 5000);
      } else {
        throw new Error(transferData.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setTransactionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      setPaymentState({
        step: 'error',
        progress: 0,
        message: 'Transaction failed. Please try again.'
      });
    }
  };

  const resetFlow = () => {
    setUserData(null);
    setPaymentAmount('');
    setCapturedImage(null);
    setTransactionResult(null);
    setPaymentState({
      step: 'idle',
      progress: 0,
      message: 'Ready to scan customer'
    });
    stopCamera();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl"
        ></motion.div>
        
        <motion.div 
          animate={{ 
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute -top-20 -right-40 w-80 h-80 bg-gradient-to-l from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl"
        ></motion.div>
        
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ 
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
          className="absolute -bottom-40 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-gradient-to-t from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"
        ></motion.div>

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      {/* Particles Animation */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight,
                  opacity: 1,
                  scale: 0
                }}
                animate={{
                  y: -100,
                  opacity: 0,
                  scale: 1,
                  x: Math.random() * window.innerWidth
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Modern Header */}
      <motion.header 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-20 bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30"
              >
                <span className="text-white font-bold text-2xl">₽</span>
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                  PayWiser Merchant
                </h1>
                <p className="text-slate-400 font-medium">Biometric Payment Terminal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {merchantBalance && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl px-6 py-4 border border-white/20 shadow-xl"
                >
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-blue-300 font-semibold text-xs uppercase tracking-wider mb-1">SUI</div>
                      <div className="text-white font-bold text-lg">{merchantBalance.sui}</div>
                    </div>
                    <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                    <div className="text-center">
                      <div className="text-emerald-300 font-semibold text-xs uppercase tracking-wider mb-1">USDC</div>
                      <div className="text-white font-bold text-lg">{merchantBalance.usdc}</div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchMerchantBalance}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all duration-300"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">

        {/* Merchant Balance */}
        {merchantBalance && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20"
          >
            <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Merchant Balance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/20 rounded-xl p-4">
                <p className="text-blue-300 text-sm">SUI Balance</p>
                <p className="text-white text-2xl font-bold">{merchantBalance.sui}</p>
              </div>
              <div className="bg-green-500/20 rounded-xl p-4">
                <p className="text-green-300 text-sm">USDC Balance</p>
                <p className="text-white text-2xl font-bold">{merchantBalance.usdc}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Payment Flow Steps */}
          <AnimatePresence mode="wait">
            {paymentState.step === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white/8 backdrop-blur-2xl rounded-3xl p-12 border border-white/10 shadow-2xl"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="w-36 h-36 mx-auto mb-8 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/30"
                  >
                    <motion.svg
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="w-18 h-18 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </motion.svg>
                  </motion.div>
                  
                  <motion.h2 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-100 bg-clip-text text-transparent mb-6"
                  >
                    Ready to Scan
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-300 text-xl mb-12 max-w-lg mx-auto leading-relaxed"
                  >
                    Start by scanning customer's face for secure biometric recognition
                  </motion.p>
                  
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: "0 25px 50px rgba(139, 92, 246, 0.4)" 
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startCamera}
                    className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white px-12 py-5 rounded-2xl font-semibold text-xl shadow-2xl transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span>Start Customer Scan</span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Camera Detection View */}
            {(paymentState.step === 'detecting' || isCameraOpen) && !userData && (
              <motion.div
                key="detecting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
              >
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <h2 className="text-3xl font-bold text-white">Customer Recognition</h2>
                    
                    {/* Seal Security Info Tooltip */}
                    <div className="relative ml-3 group">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center cursor-help"
                      >
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                        <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl max-w-sm">
                          <div className="flex items-center mb-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h4 className="text-white font-bold text-sm">Seal Protocol</h4>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed mb-3">
                            Your biometric data is encrypted using <span className="font-semibold text-blue-300">Seal Protocol</span> before storage.
                          </p>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center text-slate-400">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                              <span>Face embeddings encrypted off-chain</span>
                            </div>
                            <div className="flex items-center text-slate-400">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                              <span>On-chain policy controls access</span>
                            </div>
                            <div className="flex items-center text-slate-400">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                              <span>Decrypt only with fresh nonce</span>
                            </div>
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-2 h-2 bg-slate-900/95 rotate-45 border-r border-b border-white/20"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300">{paymentState.message}</p>
                </div>

                <div className="relative max-w-md mx-auto">
                  <div className="bg-black rounded-2xl p-4 relative overflow-hidden">
                    <video
                      id="merchantCameraVideo"
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-auto rounded-xl"
                    />
                    
                    {/* Scanning Animation Overlay */}
                    {isDetecting && (
                      <div className="absolute inset-4 border-2 border-cyan-400 rounded-xl">
                        <motion.div
                          animate={{ y: [0, 300, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                        />
                      </div>
                    )}

                    {/* Corner Brackets */}
                    <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-cyan-400"></div>
                    <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-cyan-400"></div>
                    <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-cyan-400"></div>
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-cyan-400"></div>
                  </div>

                  <div className="mt-6 flex gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={captureAndRecognize}
                      disabled={isDetecting || !isVideoReady}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isDetecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Scanning...
                        </>
                      ) : !isVideoReady ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading Video...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                          Capture & Recognize
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetFlow}
                      className="bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                      Cancel
                    </motion.button>
                  </div>
                  
                  {/* Video Status Indicator */}
                  <div className="mt-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      isVideoReady 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isVideoReady ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
                      }`}></div>
                      {isVideoReady ? 'Camera Ready' : 'Loading Camera...'}
                    </div>
                  </div>
                </div>

                <canvas id="merchantCaptureCanvas" style={{ display: 'none' }} />
              </motion.div>
            )}

            {/* User Recognized - Welcome */}
            {paymentState.step === 'recognized' && userData && (
              <motion.div
                key="recognized"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="text-center"
                >
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">Welcome!</h2>
                  <h3 className="text-3xl font-semibold text-green-400 mb-2">{userData.name}</h3>
                  <p className="text-gray-300 mb-6">Wallet: {formatAddress(userData.walletAddress)}</p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPaymentState({ step: 'amount', progress: 0, message: 'Enter payment amount' })}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg"
                  >
                    Proceed to Payment
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            {/* Amount Entry */}
            {paymentState.step === 'amount' && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
              >
                <div className="text-center max-w-md mx-auto">
                  <h2 className="text-3xl font-bold text-white mb-6">Enter Payment Amount</h2>
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-4xl font-bold text-center bg-white/20 border-2 border-white/30 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                      />
                      <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-300">USDC</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startPaymentFlow}
                      disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Authorize Payment
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetFlow}
                      className="bg-gray-600 text-white px-6 py-4 rounded-2xl font-semibold"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Processing Steps */}
            {['authorizing', 'ble', 'security', 'biometric', 'processing'].includes(paymentState.step) && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-6">Processing Payment</h2>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-4 mb-8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${paymentState.progress}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 h-4 rounded-full"
                    />
                  </div>

                  {/* Status Message */}
                  <motion.p
                    key={paymentState.message}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl text-gray-300 mb-8"
                  >
                    {paymentState.message}
                  </motion.p>

                  {/* Biometric Camera */}
                  {paymentState.step === 'biometric' && isCameraOpen && (
                      <div className="max-w-md mx-auto mb-6">
                        <div className="bg-black rounded-2xl p-4 relative">
                          <video
                            id="biometricCameraVideo"
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-auto rounded-xl"
                          />
                        
                        {/* Countdown Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            key={biometricCountdown}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="text-6xl font-bold text-white bg-black/50 rounded-full w-24 h-24 flex items-center justify-center"
                          >
                            {biometricCountdown}
                          </motion.div>
                        </div>
                      </div>
                      <p className="text-cyan-400 mt-4 font-semibold">Look into camera with your emote (password)</p>
                    </div>
                  )}

                  {/* Processing Animation */}
                  {paymentState.step !== 'biometric' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 mx-auto border-4 border-cyan-400 border-t-transparent rounded-full"
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* Success */}
            {paymentState.step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-2xl rounded-3xl p-12 border border-emerald-400/20 shadow-2xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                  className="text-center"
                >
                  <motion.div 
                    className="w-40 h-40 mx-auto mb-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40"
                    animate={{ 
                      boxShadow: [
                        "0 25px 50px rgba(16, 185, 129, 0.4)",
                        "0 25px 50px rgba(16, 185, 129, 0.6)",
                        "0 25px 50px rgba(16, 185, 129, 0.4)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.svg
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="w-20 h-20 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </motion.svg>
                  </motion.div>
                  
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-5xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent mb-6"
                  >
                    Payment Successful!
                  </motion.h2>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/20"
                  >
                    <p className="text-3xl font-bold text-emerald-400 mb-2">${paymentAmount} USDC</p>
                    <p className="text-slate-300">Transaction completed successfully</p>
                  </motion.div>
                  
                  {/* PayWiser Token Rewards */}
                  {transactionResult?.payWiserTokensEarned && (
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.9, duration: 0.6 }}
                      className="bg-gradient-to-br from-purple-500/15 to-pink-500/15 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-purple-400/20 shadow-xl"
                    >
                      <div className="text-center">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.1, type: "spring" }}
                          className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30"
                        >
                          <span className="text-white font-bold text-2xl">₽</span>
                        </motion.div>
                        
                        <motion.h3 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 }}
                          className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4"
                        >
                          Rewards Earned!
                        </motion.h3>
                        
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.3 }}
                          className="text-purple-200 text-lg mb-4"
                        >
                          <span className="font-bold text-white">{transactionResult.customerName}</span> will receive
                        </motion.p>
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.4, type: "spring" }}
                          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-4 border border-white/20"
                        >
                          <p className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                            {transactionResult.payWiserTokensEarned} PWSR
                          </p>
                          <p className="text-purple-200">
                            PayWiser Tokens will be credited to customer's wallet
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {transactionResult?.blockExplorerUrl && (
                      <motion.a
                        href={transactionResult.blockExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 }}
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View on Explorer
                      </motion.a>
                    )}
                    
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.6 }}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetFlow}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>New Transaction</span>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Error */}
            {paymentState.step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-red-500/50"
              >
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Error</h2>
                  <p className="text-red-400 mb-8">{paymentState.message}</p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetFlow}
                    className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg"
                  >
                    Try Again
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// zkLogin configuration
const ZKLOGIN_CONFIG = {
  google: {
    clientId: "973332711614-hkcur3rlfuto87ta7qorjitvbnhiac7b.apps.googleusercontent.com",
    redirectUri: "http://localhost:3001/user",
    scope: "openid email profile"
  }
};

// Predefined wallet mapping for demo accounts
const WALLET_MAPPING = {
  "thehodophile10@gmail.com": {
    name: "Wallet A (Gas Sponsor)",
    address: "0xcb3fced2337776c984f220f27e97428f426f80e5b771a3e467b2d6f14597929c",
    privateKey: "3GInch4KuXu922aU4qCs9PmXgE59c/4S73OtzDStYVM=",
    publicKey: "eK+eSgV0QaKEZDDupmnNpm4lk5TgtjYODpVmU1GKpkA="
  },
  "atharvalade19@gmail.com": {
    name: "Wallet B (Sender)",
    address: "0x41fe7d24482047fac1cb08d5e2591eaee7941bc00fdb4d0edb9e0ff81c7f0cd4",
    privateKey: "VhjC/jLSrvo1rMtZrY7+5uwlhJX8tki5+mk3gM3jlCw=",
    publicKey: "WzoOZqqicdlXYe5nXflq6+JJQHsPzus4SzyKLNMxVIc="
  }
};

interface ZkLoginState {
  isConnected: boolean;
  provider: string | null;
  suiAddress: string | null;
  jwt: string | null;
  userEmail: string | null;
  userName: string | null;
  ephemeralKeyPair: any | null;
  userSalt: string | null;
  walletName: string | null;
  privateKey: string | null;
}

interface WalletBalance {
  sui: {
    balance: string;
    formatted: string;
  };
  usdc: {
    balance: string;
    formatted: string;
  };
  pwsr?: {
    balance: string;
    formatted: string;
  };
}

interface FaceEnrollmentStatus {
  isEnrolled: boolean;
  walletAddress: string;
  userName: string;
  luxandUuid: string | null;
  enrolledAt: string | null;
  lastChecked: string;
}

export default function UserPage() {
  const [zkLoginState, setZkLoginState] = useState<ZkLoginState>({
    isConnected: false,
    provider: null,
    suiAddress: null,
    jwt: null,
    userEmail: null,
    userName: null,
    ephemeralKeyPair: null,
    userSalt: null,
    walletName: null,
    privateKey: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showRewardsExchange, setShowRewardsExchange] = useState(false);

  // PayWiser Token & Cross-chain Configuration
  const PAYWISER_CONFIG = {
    tokenName: "PayWiser Token",
    tokenSymbol: "PWSR",
    packageId: "0x5ee7df19f113857e35fc001127a84d56d705a4ea8b0fc1d7cfff677e5d9076a4",
    mockBalance: 250 // Mock PWSR balance for demo
  };

  const WORMHOLE_NTT_CHAINS = [
    {
      name: "Arbitrum",
      chainId: 42161,
      icon: "🔵",
      color: "from-blue-500 to-blue-600",
      rewards: ["10% Trading Fee Discount", "Priority Support", "Exclusive NFTs"]
    },
    {
      name: "Sepolia",
      chainId: 11155111,
      icon: "🟡",
      color: "from-yellow-500 to-yellow-600",
      rewards: ["Testnet Rewards", "Developer Access", "Beta Features"]
    },
    {
      name: "Base",
      chainId: 8453,
      icon: "🔷",
      color: "from-blue-400 to-cyan-500",
      rewards: ["DeFi Yield Boost", "Governance Tokens", "Staking Rewards"]
    },
    {
      name: "Polygon",
      chainId: 137,
      icon: "🟣",
      color: "from-purple-500 to-purple-600",
      rewards: ["Gas Fee Rebates", "NFT Minting", "Cross-chain Bridge"]
    }
  ];
  
  // Face enrollment state
  const [faceEnrollmentStatus, setFaceEnrollmentStatus] = useState<FaceEnrollmentStatus | null>(null);
  const [faceEnrollmentLoading, setFaceEnrollmentLoading] = useState(false);
  const [faceEnrollmentError, setFaceEnrollmentError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    // Load saved zkLogin state
    const savedState = localStorage.getItem('zkLoginState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setZkLoginState(prevState => ({ ...prevState, ...parsedState }));
        
        // Fetch balance and check face enrollment if connected
        if (parsedState.isConnected && parsedState.suiAddress) {
          fetchWalletBalance(parsedState.suiAddress);
          if (parsedState.userName) {
            checkFaceEnrollmentStatus(parsedState.suiAddress, parsedState.userName, parsedState.userEmail);
          }
        }
      } catch (err) {
        console.error('Failed to parse saved zkLogin state:', err);
      }
    }

    // Check for OAuth callback
    checkForOAuthCallback();
  }, []);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const checkForOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError(`OAuth error: ${errorParam}`);
      return;
    }

    if (code && state === 'google') {
      setIsLoading(true);
      try {
        await handleOAuthCallback(code, 'google');
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        setError(`Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const generateEphemeralKeyPair = () => {
    // Simplified key pair generation for demo
    const privateKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const publicKey = Array.from(crypto.getRandomValues(new Uint8Array(33)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    return { privateKey, publicKey };
  };

  const generateNonce = (publicKey: string) => {
    // Create nonce with embedded public key
    return btoa(publicKey + Date.now().toString()).replace(/[+/=]/g, '').substring(0, 32);
  };

  const initiateGoogleLogin = () => {
    setIsLoading(true);
    setError(null);

    // Generate ephemeral key pair
    const ephemeralKeyPair = generateEphemeralKeyPair();
    const nonce = generateNonce(ephemeralKeyPair.publicKey);

    // Store ephemeral key pair
    const tempState = { ...zkLoginState, ephemeralKeyPair };
    localStorage.setItem('zkLoginState', JSON.stringify(tempState));

    const config = ZKLOGIN_CONFIG.google;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${config.clientId}&` +
      `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(config.scope)}&` +
      `nonce=${nonce}&` +
      `state=google`;

    window.location.href = authUrl;
  };

  const handleOAuthCallback = async (code: string, provider: string) => {
    try {
      // Exchange code for access token and get real user info
      const tokenResponse = await exchangeCodeForToken(code);
      const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token);
      
      // Create JWT-like structure with real user data
      const userJWT = createUserJWT(userInfo, tokenResponse.id_token);
      await processJWT(userJWT, provider, userInfo);
    } catch (error) {
      throw new Error(`Failed to process OAuth callback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const exchangeCodeForToken = async (code: string) => {
    // Exchange authorization code for tokens
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: ZKLOGIN_CONFIG.google.clientId,
        client_secret: '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', // In production, this should be on server-side
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: ZKLOGIN_CONFIG.google.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  };

  const fetchGoogleUserInfo = async (accessToken: string) => {
    // Fetch user information from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error(`Failed to fetch user info: ${userInfoResponse.statusText}`);
    }

    return await userInfoResponse.json();
  };

  const createUserJWT = (userInfo: any, idToken?: string) => {
    // If we have an ID token, use it; otherwise create a structure with user info
    if (idToken) {
      return idToken;
    }
    
    // Create a JWT-like structure for processing
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "google_key" }));
    const payload = btoa(JSON.stringify({
      iss: "https://accounts.google.com",
      aud: ZKLOGIN_CONFIG.google.clientId,
      sub: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce: "real_nonce"
    }));
    const signature = btoa("google_signature");
    
    return `${header}.${payload}.${signature}`;
  };

  const processJWT = async (jwt: string, provider: string, userInfo?: any) => {
    try {
      // Decode JWT
      const [, payloadBase64] = jwt.split('.');
      const payload = JSON.parse(atob(payloadBase64));

      // Check if this email is in our predefined wallet mapping
      const userEmail = payload.email;
      const mappedWallet = WALLET_MAPPING[userEmail as keyof typeof WALLET_MAPPING];

      let suiAddress: string;
      let walletName: string;
      let privateKey: string | null = null;
      let userSalt: string;

      if (mappedWallet) {
        // Use predefined wallet for demo accounts
        suiAddress = mappedWallet.address;
        walletName = mappedWallet.name;
        privateKey = mappedWallet.privateKey;
        userSalt = "predefined_salt_" + userEmail;
      } else {
        // Generate zkLogin address for other accounts
        userSalt = await generateUserSalt(payload.sub, payload.iss, payload.aud);
        suiAddress = await generateZkLoginAddress(payload.sub, payload.iss, payload.aud, userSalt);
        walletName = "zkLogin Wallet";
      }

      // Update state with real user data
      const newState = {
        ...zkLoginState,
        isConnected: true,
        provider: provider,
        suiAddress: suiAddress,
        jwt: jwt,
        userEmail: payload.email,
        userName: payload.name,
        userSalt: userSalt,
        walletName: walletName,
        privateKey: privateKey
      };

      setZkLoginState(newState);
      localStorage.setItem('zkLoginState', JSON.stringify(newState));

          // Fetch balance and check face enrollment for the connected wallet
          if (suiAddress) {
            await fetchWalletBalance(suiAddress);
            await checkFaceEnrollmentStatus(suiAddress, payload.name, payload.email);
          }

    } catch (error) {
      throw new Error(`Failed to process JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateUserSalt = async (sub: string, iss: string, aud: string): Promise<string> => {
    // Create a more deterministic salt based on user identifiers
    // In production, this would be fetched from a salt service
    const saltInput = `${sub}:${iss}:${aud}:${Date.now()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(saltInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  };

  const generateZkLoginAddress = async (sub: string, iss: string, aud: string, salt: string): Promise<string> => {
    // Simplified zkLogin address derivation
    // In production, this would use proper Sui SDK and cryptographic functions
    const addressInput = `zklogin:${sub}:${iss}:${aud}:${salt}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(addressInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    // Take first 20 bytes for address (Sui addresses are 32 bytes, but this is simplified)
    const addressBytes = hashArray.slice(0, 20);
    return '0x' + addressBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const fetchWalletBalance = async (address: string) => {
    try {
      setBalanceLoading(true);
      const response = await fetch('http://localhost:3000/api/wallet/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      console.log('Balance API response:', data);
      if (data.success) {
        console.log('Balance data:', data.data.balances);
        setBalance(data.data.balances);
      } else {
        throw new Error(data.error || 'Failed to fetch balance');
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
      setError(`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBalanceLoading(false);
    }
  };

  const refreshBalance = () => {
    if (zkLoginState.suiAddress) {
      fetchWalletBalance(zkLoginState.suiAddress);
    }
  };

  // Face enrollment functions
  const checkFaceEnrollmentStatus = async (walletAddress: string, userName: string, userEmail: string) => {
    try {
      setFaceEnrollmentLoading(true);
      setFaceEnrollmentError(null);
      
      const response = await fetch('http://localhost:3000/api/face/check-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          userName,
          userEmail
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check enrollment status');
      }

      const data = await response.json();
      console.log('Face enrollment status:', data);
      
      if (data.success) {
        setFaceEnrollmentStatus(data.data);
      } else {
        throw new Error(data.error || 'Failed to check enrollment status');
      }
    } catch (error) {
      console.error('Face enrollment check error:', error);
      setFaceEnrollmentError(`Failed to check face enrollment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Set default status on error
      setFaceEnrollmentStatus({
        isEnrolled: false,
        walletAddress,
        userName,
        luxandUuid: null,
        enrolledAt: null,
        lastChecked: new Date().toISOString()
      });
    } finally {
      setFaceEnrollmentLoading(false);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      console.log('📹 Starting camera...');
      setCameraError(null);
      setFaceEnrollmentError(null);
      
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
        const videoElement = document.getElementById('cameraVideo') as HTMLVideoElement;
        if (videoElement) {
          console.log('📺 Setting video source...');
          videoElement.srcObject = mediaStream;
          
          // Add event listeners to ensure video is loaded
          videoElement.onloadedmetadata = () => {
            console.log('📺 Video metadata loaded, dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
          };
          
          videoElement.oncanplay = () => {
            console.log('📺 Video can play');
          };
          
          videoElement.onerror = (error) => {
            console.error('📺 Video error:', error);
            setFaceEnrollmentError('Video playback error');
          };
          
        } else {
          console.error('❌ Video element not found during camera start');
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Failed to access camera. Please check permissions.');
      setFaceEnrollmentError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    console.log('🛑 Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      console.log('📹 Stream stopped and cleared');
    }
    setIsCameraOpen(false);
    setCameraError(null);
    console.log('🛑 Camera stopped, isCameraOpen set to false');
    // NOTE: NOT clearing capturedImage here - that should persist after capture
  };

  const capturePhoto = () => {
    console.log('📸 Capture photo clicked');
    
    const videoElement = document.getElementById('cameraVideo') as HTMLVideoElement;
    const canvasElement = document.getElementById('captureCanvas') as HTMLCanvasElement;
    
    console.log('Video element:', videoElement);
    console.log('Canvas element:', canvasElement);
    
    if (!videoElement) {
      console.error('❌ Video element not found');
      setFaceEnrollmentError('Video element not found');
      return;
    }
    
    if (!canvasElement) {
      console.error('❌ Canvas element not found');
      setFaceEnrollmentError('Canvas element not found');
      return;
    }
    
    // Check if video is ready
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.error('❌ Video not ready, dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      setFaceEnrollmentError('Camera not ready, please wait a moment and try again');
      return;
    }
    
    console.log('📹 Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
    
    const context = canvasElement.getContext('2d');
    if (context) {
      try {
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
        
        // Set captured image and update UI state
        setCapturedImage(imageDataUrl);
        console.log('📱 Setting captured image state:', !!imageDataUrl);
        
        // Stop camera after capture
        stopCamera();
        console.log('📹 Camera stopped');
        
        setFaceEnrollmentError(null);
        console.log('✅ Photo capture completed, UI should update now');
        
        // Debug: Log current states after a brief delay
        setTimeout(() => {
          console.log('🔍 State check after capture:');
          console.log('  - isCameraOpen:', isCameraOpen);
          console.log('  - capturedImage exists:', !!capturedImage);
          console.log('  - capturedImage length:', capturedImage?.length || 0);
        }, 100);
        
      } catch (error) {
        console.error('❌ Error during photo capture:', error);
        setFaceEnrollmentError(`Photo capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.error('❌ Could not get 2D context from canvas');
      setFaceEnrollmentError('Could not initialize canvas for photo capture');
    }
  };

  const retakePhoto = () => {
    console.log('🔄 Retaking photo...');
    setCapturedImage(null);
    startCamera();
  };

  const cancelCamera = () => {
    console.log('❌ Canceling camera...');
    setCapturedImage(null);
    stopCamera();
  };

  const enrollFace = async () => {
    if (!capturedImage || !zkLoginState.suiAddress || !zkLoginState.userName || !zkLoginState.userEmail) {
      setFaceEnrollmentError('Please capture a photo first');
      return;
    }

    try {
      setEnrolling(true);
      setFaceEnrollmentError(null);

      // Convert base64 image to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('photo', blob, 'captured_photo.jpg');
      formData.append('walletAddress', zkLoginState.suiAddress);
      formData.append('userName', zkLoginState.userName);
      formData.append('userEmail', zkLoginState.userEmail);

      const enrollResponse = await fetch('http://localhost:3000/api/face/enroll', {
        method: 'POST',
        body: formData,
      });

      const data = await enrollResponse.json();
      console.log('Face enrollment result:', data);

      if (data.success) {
        // Update enrollment status
        setFaceEnrollmentStatus({
          isEnrolled: true,
          walletAddress: zkLoginState.suiAddress,
          userName: zkLoginState.userName,
          luxandUuid: data.data.luxandUuid,
          enrolledAt: data.data.enrolledAt,
          lastChecked: new Date().toISOString()
        });
        
        // Clear captured image
        setCapturedImage(null);
      } else {
        throw new Error(data.error || 'Face enrollment failed');
      }
    } catch (error) {
      console.error('Face enrollment error:', error);
      setFaceEnrollmentError(`Face enrollment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEnrolling(false);
    }
  };

  const refreshFaceEnrollmentStatus = () => {
    if (zkLoginState.suiAddress && zkLoginState.userName && zkLoginState.userEmail) {
      checkFaceEnrollmentStatus(zkLoginState.suiAddress, zkLoginState.userName, zkLoginState.userEmail);
    }
  };

  const disconnect = () => {
    setZkLoginState({
      isConnected: false,
      provider: null,
      suiAddress: null,
      jwt: null,
      userEmail: null,
      userName: null,
      ephemeralKeyPair: null,
      userSalt: null,
      walletName: null,
      privateKey: null
    });
    setBalance(null);
    setFaceEnrollmentStatus(null);
    setCapturedImage(null);
    cancelCamera(); // This will clear capturedImage and stop camera
    localStorage.removeItem('zkLoginState');
    setError(null);
    setFaceEnrollmentError(null);
  };

  const copyAddress = async () => {
    if (zkLoginState.suiAddress) {
      try {
        await navigator.clipboard.writeText(zkLoginState.suiAddress);
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Hero Section */}
      <section className="py-12 md:py-24">
        <div className="relative w-full flex flex-col items-center overflow-hidden pt-28 pb-20 md:pt-32 md:pb-28">
          {/* Background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ duration: 1.5 }}
              className="absolute top-[15%] -left-[5%] w-[45%] h-[45%] rounded-full bg-indigo-300/20 blur-[70px]"
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.12 }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="absolute top-1/3 right-[5%] w-[35%] h-[35%] rounded-full bg-purple-300/20 blur-[80px]"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-8"
            >
              Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-extrabold">PayWiser</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12"
            >
              Secure biometric payments powered by Sui blockchain. Connect with zkLogin to get started.
            </motion.p>

            {/* zkLogin Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="max-w-2xl mx-auto"
            >
              {!zkLoginState.isConnected ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-xl">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="12" fill="white" opacity="0.2"/>
                        <circle cx="12" cy="12" r="1.5" fill="white"/>
                        <circle cx="20" cy="12" r="1.5" fill="white"/>
                        <path d="M11 19 Q16 22 21 19" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-600">Use zkLogin to securely connect with your Google account</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={initiateGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-full px-6 py-4 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    {isLoading ? 'Connecting...' : 'Continue with Google'}
                  </button>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-8 shadow-xl">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Connected Successfully!</h3>
                    <p className="text-gray-600">Welcome, {zkLoginState.userName}</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <p className="text-gray-900">{zkLoginState.userEmail}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Wallet</label>
                      <p className="text-gray-900 font-medium">{zkLoginState.walletName}</p>
                      {zkLoginState.privateKey && (
                        <p className="text-sm text-green-600 mt-1">✅ Full access wallet</p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sui Address</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-gray-900 bg-white px-3 py-2 rounded border font-mono">
                          {zkLoginState.suiAddress}
                        </code>
                        <button
                          onClick={copyAddress}
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Copy address"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Balance Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-blue-900">Wallet Balance</label>
                        <button
                          onClick={refreshBalance}
                          disabled={balanceLoading}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                          title="Refresh balance"
                        >
                          <svg className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                      
                      {balanceLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className="ml-2 text-blue-600">Loading balance...</span>
                        </div>
                      ) : balance && balance.sui && balance.usdc ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">S</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">SUI</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{balance.sui.formatted || '0.000000000'}</p>
                            <p className="text-xs text-gray-500">SUI</p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">$</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">USDC</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{balance.usdc.formatted || '0.000000'}</p>
                            <p className="text-xs text-gray-500">USDC</p>
                          </div>

                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">₽</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">PWSR</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{PAYWISER_CONFIG.mockBalance}</p>
                            <p className="text-xs text-purple-500">PayWiser Tokens</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-blue-600">Click refresh to load balance</p>
                        </div>
                      )}
                    </div>

                    {/* PayWiser Token Rewards Exchange */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">₽</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-purple-900">PayWiser Rewards</h3>
                            <p className="text-sm text-purple-600">Exchange tokens for cross-chain rewards</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowRewardsExchange(!showRewardsExchange)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                        >
                          {showRewardsExchange ? 'Hide' : 'Exchange'}
                        </button>
                      </div>

                      {showRewardsExchange && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          {/* Wormhole NTT Header */}
                          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-200/50">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">W</span>
                              </div>
                              <h4 className="text-lg font-bold text-gray-900">Powered by Wormhole NTT</h4>
                            </div>
                            <p className="text-sm text-gray-600">
                              Native Token Transfers enable seamless cross-chain token bridging with enhanced security and native token standards.
                            </p>
                          </div>

                          {/* Exchange Rate */}
                          <div className="bg-white rounded-lg p-4 border border-purple-100">
                            <div className="text-center mb-4">
                              <p className="text-sm text-gray-600 mb-2">Exchange Rate</p>
                              <p className="text-2xl font-bold text-purple-900">100 PWSR = 1 Reward</p>
                              <p className="text-sm text-purple-600">Available: {PAYWISER_CONFIG.mockBalance} PWSR</p>
                            </div>
                          </div>

                          {/* Chain Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {WORMHOLE_NTT_CHAINS.map((chain) => (
                              <motion.div
                                key={chain.chainId}
                                whileHover={{ scale: 1.02 }}
                                className={`bg-gradient-to-r ${chain.color} rounded-lg p-4 text-white cursor-pointer hover:shadow-lg transition-all duration-300`}
                                onClick={() => {
                                  alert(`Exchanging 100 PWSR for rewards on ${chain.name}!\n\nThis would use Wormhole NTT to bridge tokens cross-chain.`);
                                }}
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="text-2xl">{chain.icon}</span>
                                  <div>
                                    <h5 className="font-bold text-lg">{chain.name}</h5>
                                    <p className="text-sm opacity-90">Chain ID: {chain.chainId}</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold mb-2">Available Rewards:</p>
                                  {chain.rewards.map((reward, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                      <span className="text-sm">{reward}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/20">
                                  <button className="w-full bg-white/20 hover:bg-white/30 rounded-lg py-2 px-4 font-semibold transition-all duration-300">
                                    Exchange 100 PWSR
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {/* Wormhole NTT Benefits */}
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                            <h5 className="font-bold text-indigo-900 mb-3">🌉 Wormhole NTT Benefits</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span className="text-indigo-700">Native Token Standards</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span className="text-indigo-700">Enhanced Security</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span className="text-indigo-700">Seamless Bridging</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Face Enrollment Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-purple-900">Face Recognition</label>
                        <button
                          onClick={refreshFaceEnrollmentStatus}
                          disabled={faceEnrollmentLoading}
                          className="p-1 text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50"
                          title="Refresh face enrollment status"
                        >
                          <svg className={`w-4 h-4 ${faceEnrollmentLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                      
                      {faceEnrollmentLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                          <span className="ml-2 text-purple-600">Checking enrollment...</span>
                        </div>
                      ) : faceEnrollmentError ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <p className="text-red-600 text-sm">{faceEnrollmentError}</p>
                          <button
                            onClick={refreshFaceEnrollmentStatus}
                            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                          >
                            Try again
                          </button>
                        </div>
                      ) : faceEnrollmentStatus ? (
                        faceEnrollmentStatus.isEnrolled ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-green-700 font-medium">Face Enrolled</span>
                            </div>
                            <p className="text-green-600 text-sm">
                              Your face is enrolled for biometric authentication
                            </p>
                            {faceEnrollmentStatus.enrolledAt && (
                              <p className="text-green-500 text-xs mt-1">
                                Enrolled: {new Date(faceEnrollmentStatus.enrolledAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <span className="text-yellow-700 font-medium">Face Not Enrolled</span>
                            </div>
                            <p className="text-yellow-600 text-sm mb-3">
                              Enroll your face for secure biometric payments
                            </p>
                            
                            <div className="space-y-3">
                              
                              {/* Camera Section */}
                              {!isCameraOpen && !capturedImage && (
                                <div className="text-center">
                                  <button
                                    onClick={startCamera}
                                    className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                                  >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Open Camera
                                  </button>
                                </div>
                              )}

                              {/* Live Camera View */}
                              {isCameraOpen && (
                                <div className="bg-black rounded-lg p-4 text-center">
                                  <div className="relative inline-block">
                                    <video
                                      id="cameraVideo"
                                      autoPlay
                                      playsInline
                                      muted
                                      className="rounded-lg max-w-full h-auto"
                                      style={{ maxHeight: '300px' }}
                                    />
                                    <div className="absolute inset-0 border-2 border-white border-dashed rounded-lg pointer-events-none opacity-30"></div>
                                  </div>
                                  {/* Hidden canvas for capturing image */}
                                  <canvas id="captureCanvas" style={{ display: 'none' }}></canvas>
                                  <div className="mt-4 flex gap-2 justify-center">
                                    <button
                                      onClick={capturePhoto}
                                      className="bg-green-600 text-white rounded-full px-6 py-2 font-medium hover:bg-green-700 transition-colors flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                      </svg>
                                      Capture
                                    </button>
                                    <button
                                      onClick={cancelCamera}
                                      className="bg-gray-600 text-white rounded-full px-6 py-2 font-medium hover:bg-gray-700 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Captured Image Preview */}
                              {capturedImage && (
                                <div className="text-center">
                                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                                    <img
                                      src={capturedImage}
                                      alt="Captured face"
                                      className="rounded-lg max-w-full h-auto mx-auto"
                                      style={{ maxHeight: '200px' }}
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-center mb-4">
                                    <button
                                      onClick={retakePhoto}
                                      className="bg-gray-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-gray-700 transition-colors flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Retake
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {/* Enrollment Button */}
                              <button
                                onClick={enrollFace}
                                disabled={!capturedImage || enrolling}
                                className="w-full bg-purple-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                {enrolling ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Enrolling Face...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Enroll Face
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-purple-600">Click refresh to check enrollment status</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-gray-900 capitalize">{zkLoginState.provider}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={disconnect}
                    className="w-full bg-gray-100 text-gray-700 rounded-full px-6 py-3 font-medium hover:bg-gray-200 transition-all duration-300"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

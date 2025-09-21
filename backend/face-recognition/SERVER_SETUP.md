# Server Setup for zkLogin OAuth

Your Google OAuth is configured for `http://localhost:5500`. Here's how to run the app on the correct port:

## 🚀 Quick Start

### Option 1: Using Live Server (VS Code Extension)
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. It should automatically open on `http://localhost:5500`

### Option 2: Using Python HTTP Server
```bash
cd face-recognition
python -m http.server 5500
```
Then open `http://localhost:5500` in your browser.

### Option 3: Using Node.js http-server
```bash
cd face-recognition
npx http-server -p 5500
```
Then open `http://localhost:5500` in your browser.

## ✅ Google OAuth Configuration Applied

Your Google OAuth settings:
- **Client ID**: `973332711614-hkcur3rlfuto87ta7qorjitvbnhiac7b.apps.googleusercontent.com`
- **Project ID**: `sui-mming`
- **Redirect URI**: `http://localhost:5500/face-recognition/`
- **JavaScript Origins**: `http://localhost:5500`

## 🔧 Testing zkLogin with Google

1. Start the server on port 5500
2. Open `http://localhost:5500/face-recognition/`
3. Click "Login with Google" button
4. You should be redirected to Google's OAuth consent screen
5. After authentication, you'll return to your app with zkLogin connected

## 🎯 Expected Flow

1. **Click Google Login** → Redirects to Google OAuth
2. **Google Authentication** → User logs in with Google account
3. **Redirect Back** → Returns to `http://localhost:5500/face-recognition/?id_token=...`
4. **Process JWT** → App extracts user info and generates Sui address
5. **Show Connected State** → Green status with generated Sui address

## ⚠️ Important Notes

- The app must be served from `http://localhost:5500` for Google OAuth to work
- Opening the HTML file directly (`file://`) will NOT work with OAuth
- Make sure no other service is using port 5500

## 🎉 Ready to Test!

Your Google OAuth is now properly configured. The other providers (Facebook, Twitch) still need setup if you want to test them, but Google should work immediately once you serve the app on the correct port.


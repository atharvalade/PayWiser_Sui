/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PayWiser - The Future of Biometric Payments";
export const contentType = "image/png";

export default async function OG() {
  const sfPro = await fetch(
    new URL("./fonts/SF-Pro-Display-Medium.otf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          backgroundImage:
            "linear-gradient(to bottom right, #E0E7FF 25%, #ffffff 50%, #CFFAFE 75%)",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            marginBottom: "16px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="white" opacity="0.2"/>
            <circle cx="18" cy="18" r="2" fill="white"/>
            <circle cx="30" cy="18" r="2" fill="white"/>
            <path d="M16 28 Q24 32 32 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
        <h1
          style={{
            fontSize: "100px",
            fontFamily: "SF Pro",
            background:
              "linear-gradient(to bottom right, #4F46E5 21.66%, #7C3AED 86.47%)",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: "5rem",
            letterSpacing: "-0.02em",
          }}
        >
          PayWiser
        </h1>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "SF Pro",
          data: sfPro,
        },
      ],
    },
  );
}

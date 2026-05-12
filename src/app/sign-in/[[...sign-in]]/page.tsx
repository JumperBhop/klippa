"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-void px-4 py-12">

      {/* Orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)", animation: "slowFloat 9s ease-in-out infinite" }} />
        <div className="absolute bottom-[-150px] right-[-150px] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 65%)", animation: "slowFloat 11s ease-in-out infinite reverse" }} />
        <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 65%)", animation: "slowFloat 7s ease-in-out infinite 2s" }} />
      </div>

      {/* Grid */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "linear-gradient(rgba(124,58,237,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.04) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

      <div className="relative z-10 flex flex-col items-center gap-7 w-full max-w-[400px]">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group select-none">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-2xl text-white transition-all duration-300 group-hover:scale-110"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 0 1px rgba(124,58,237,0.4), 0 0 30px rgba(124,58,237,0.5)" }}>
            K
          </div>
          <div>
            <div className="font-bold text-white text-2xl leading-none" style={{ fontFamily: "'Clash Display', sans-serif" }}>Klippa</div>
            <div className="text-[11px] text-white/40 mt-0.5 tracking-wide">Video rein. Virale Shorts raus.</div>
          </div>
        </Link>

        {/* Glowing border wrapper */}
        <div className="w-full relative">
          <div className="absolute -inset-[1px] rounded-[18px] opacity-60"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.8), rgba(168,85,247,0.4), rgba(124,58,237,0.8))", animation: "borderGlow 4s ease-in-out infinite", filter: "blur(1px)" }} />
          <div className="relative rounded-[18px] overflow-hidden"
            style={{ background: "rgba(12, 8, 24, 0.97)", backdropFilter: "blur(24px)" }}>
            <SignIn />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slowFloat {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-28px) scale(1.03); }
        }
        @keyframes borderGlow {
          0%,100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }

        /* Card */
        .cl-card {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 18px !important;
        }
        .cl-cardBox { border-radius: 18px !important; }

        /* Header */
        .cl-headerTitle { color: #ffffff !important; font-size: 20px !important; font-weight: 700 !important; }
        .cl-headerSubtitle { color: rgba(255,255,255,0.45) !important; font-size: 13px !important; }

        /* Social buttons */
        .cl-socialButtonsBlockButton {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          color: #e0e0e0 !important;
          transition: all 0.2s ease !important;
          height: 44px !important;
        }
        .cl-socialButtonsBlockButton:hover {
          background: rgba(124,58,237,0.12) !important;
          border-color: rgba(124,58,237,0.5) !important;
          transform: translateY(-1px) !important;
        }
        .cl-socialButtonsBlockButtonText { color: #e0e0e0 !important; font-weight: 500 !important; }

        /* Divider */
        .cl-dividerLine { background: rgba(255,255,255,0.07) !important; }
        .cl-dividerText { color: rgba(255,255,255,0.3) !important; font-size: 11px !important; }

        /* Form fields */
        .cl-formFieldLabel { color: rgba(255,255,255,0.5) !important; font-size: 11px !important; font-weight: 500 !important; letter-spacing: 0.05em !important; text-transform: uppercase !important; }
        .cl-formFieldInput {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: #ffffff !important;
          font-size: 14px !important;
          height: 44px !important;
          transition: all 0.2s ease !important;
          caret-color: #a78bfa !important;
        }
        .cl-formFieldInput:focus {
          border-color: rgba(124,58,237,0.7) !important;
          background: rgba(124,58,237,0.08) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important;
          outline: none !important;
        }
        .cl-formFieldInput::placeholder { color: rgba(255,255,255,0.2) !important; }

        /* OTP fields */
        .cl-otpCodeFieldInput {
          background: rgba(255,255,255,0.07) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 10px !important;
          color: #ffffff !important;
          font-size: 20px !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
        }
        .cl-otpCodeFieldInput:focus {
          border-color: rgba(124,58,237,0.8) !important;
          background: rgba(124,58,237,0.1) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.2) !important;
        }

        /* Primary button */
        .cl-formButtonPrimary {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
          border-radius: 12px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          height: 46px !important;
          box-shadow: 0 0 24px rgba(124,58,237,0.45) !important;
          transition: all 0.2s ease !important;
          border: none !important;
        }
        .cl-formButtonPrimary:hover {
          box-shadow: 0 0 36px rgba(124,58,237,0.7) !important;
          transform: translateY(-1px) !important;
        }

        /* Footer */
        .cl-footer { background: rgba(255,255,255,0.02) !important; border-top: 1px solid rgba(255,255,255,0.06) !important; }
        .cl-footerActionText { color: rgba(255,255,255,0.35) !important; font-size: 13px !important; }
        .cl-footerActionLink { color: #a78bfa !important; font-weight: 600 !important; transition: color 0.2s !important; }
        .cl-footerActionLink:hover { color: #c4b5fd !important; }

        /* Resend link */
        .cl-formResendCodeLink { color: #a78bfa !important; }

        /* Identity preview */
        .cl-identityPreviewText { color: rgba(255,255,255,0.7) !important; }
        .cl-identityPreviewEditButton { color: #a78bfa !important; }

        /* Alert */
        .cl-formFieldErrorText { color: #f87171 !important; font-size: 12px !important; }
        .cl-alertText { color: #f87171 !important; }

        /* Internal backgrounds */
        .cl-main, .cl-signIn-root, .cl-signUp-root { background: transparent !important; }
      `}</style>
    </div>
  );
}

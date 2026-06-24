"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    fetch(`${API_BASE}/api/auth/verify-email?token=${token}`)
      .then(res => {
        if (res.ok) {
          setStatus("success");
          setMessage("Email verified! You can now log in.");
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
          setMessage("Link expired or already used. Please request a new one.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Email Verification</h1>
        {status === "loading" && <p className="text-gray-400">Verifying your email...</p>}
        {status === "success" && (
          <p className="text-green-400">{message} Redirecting to login...</p>
        )}
        {status === "error" && (
          <>
            <p className="text-red-400 mb-4">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// useSearchParams must sit inside a Suspense boundary or `next build` fails
// with "Missing Suspense boundary with useSearchParams" (Next.js 16).
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="bg-gray-900 p-8 rounded-2xl text-center max-w-md w-full">
            <h1 className="text-2xl font-bold text-white mb-4">Email Verification</h1>
            <p className="text-gray-400">Verifying your email...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
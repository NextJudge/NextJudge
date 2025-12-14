// eslint-disable-next-line @next/next/no-page-custom-font
// eslint-disable-next-line @next/next/no-img-element

import { Head, Tailwind } from "@react-email/components";
import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
  dev?: boolean;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  dev = false,
}) => (
  <>
    <Head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
        rel="stylesheet"
      />
      <style>
        {`
          body, .geistfont, .font-geist {
            font-family: 'Geist', 'Inter', 'Segoe UI', 'Arial', 'sans-serif' !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}
      </style>
    </Head>
    <Tailwind>
      <div
        className="min-h-screen flex flex-col items-center py-10 geistfont"
        style={{
          fontFamily: "'Geist', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'",
          background: "#f7f7fa",
        }}
      >
        <div
          className="shadow-md rounded-lg p-6 max-w-2xl w-full bg-white"
          style={{
            fontFamily: "'Geist', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'",
            boxShadow: "0 4px 28px 0 rgba(24,39,75,0.10)",
            border: "1px solid #ececec",
            position: "relative",
          }}
        >
          {/* Header: Logo top-right and Title */}
          <div
            className="flex items-center justify-between mb-4"
            style={{ marginBottom: 32, alignItems: "center" }}
          >
            <h2
              className="text-2xl font-bold"
              style={{
                fontFamily: "'Geist', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'",
                margin: 0,
              }}
            >
              Welcome to the NextJudge Community
            </h2>
            <img
              src="https://nextjudge.net/nextjudge.png"
              alt="NextJudge Logo"
              width={48}
              height={48}
              style={{
                borderRadius: 12,
                boxShadow: "none",
                background: "none",
                marginLeft: 20,
                border: "none",
                display: "block"
              }}
            />
          </div>

          <p className="mb-4">Hi {firstName},</p>
          <p className="mb-4">
            Thank you for signing up. We’re glad you’re here. NextJudge is being
            built to make competitive programming more intuitive, more social, and
            simply more fun. By joining the newsletter you’ve secured a front-row
            seat as we polish the last pieces.
          </p>
          <p className="mb-4">
            From us, expect short, infrequent updates that matter – release dates, new
            judge features, and first-look invites to test the platform.
          </p>

          <h2
            className="text-xl font-semibold mb-2 mt-6"
            style={{
              fontFamily: "'Geist', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'",
              color: "#FF6600",
              marginBottom: 10,
              marginTop: 32,
            }}
          >
            What happens next
          </h2>
          <div className="mb-4 space-y-2">
            <div>
              <strong>Early access:</strong> soon, you’ll receive a private link to the platform to be one of our early testers.
            </div>
            <div>
              <strong>Admin stuff:</strong> want to run your own contests or
              help write problems on our site? We'd love to have you! Reply to this e-mail or write to{" "}
              <a
                href="mailto:hello@nextjudge.net"
                className="text-orange-600 underline"
                style={{
                  color: "#FF6600",
                  textDecoration: "underline",
                  fontFamily: "'Geist', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'",
                }}
              >
                hello@nextjudge.net
              </a>{" "}
              with “Admin Request” in the subject and we’ll walk you through the
              short approval process.
            </div>
            <div>
              <strong>Product updates:</strong> concise changelogs and
              behind the scenes notes delivered straight to your inbox.
            </div>
          </div>

          <p className="mb-4">
            Questions, ideas, or just want to say hi? We read every message sent
            to{" "}
            <a
              href="mailto:hello@nextjudge.net"
              className="text-orange-600 underline"
              style={{
                color: "#FF6600",
                textDecoration: "underline",
                fontFamily: "'Geist', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'",
              }}
            >
              hello@nextjudge.net
            </a>
            .
          </p>

          <p className="mb-1">Looking forward to building together,</p>
          <p className="mb-4">
            <strong>The NextJudge Team</strong>
          </p>

          {/* Footer with logo and support/info links */}
          <div
            className="mt-6 border-t pt-4 text-center text-gray-600 text-sm"
            style={{
              borderTop: "1px solid #ECECEC",
              marginTop: 32,
              paddingTop: 20,
              color: "#6B7280",
              textAlign: "center",
              fontSize: 14,
              letterSpacing: "0.01em",
              background: "transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <img
                src="https://nextjudge.net/nextjudge.png"
                alt="NextJudge Footer Icon"
                width={32}
                height={32}
                style={{
                  borderRadius: 8,
                  background: "none",
                  border: "none",
                  marginRight: 8,
                  boxShadow: "none"
                }}
              />
              <a
                href="https://nextjudge.net"
                className="underline text-orange-600"
                style={{
                  color: "#FF6600",
                  textDecoration: "underline",
                  fontFamily: "'Geist', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'",
                  fontWeight: 600,
                  fontSize: 16,
                  marginRight: 0,
                }}
              >
                NextJudge
              </a>
              <span style={{ color: "#bbb", marginLeft: 2 }}>|</span>
              <span style={{ marginLeft: 3 }}>Competitive Programming Platform</span>
            </div>
            <p style={{margin: 0}}>
              Support:{" "}
              <a
                href={`mailto:${dev ? "dev@nextjudge.net" : "hello@nextjudge.net"}`}
                className="text-orange-600 underline"
                style={{
                  color: "#FF6600",
                  textDecoration: "underline",
                  fontFamily: "'Geist', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'",
                }}
              >
                {dev ? "dev@nextjudge.net" : "hello@nextjudge.net"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </Tailwind>
  </>
);
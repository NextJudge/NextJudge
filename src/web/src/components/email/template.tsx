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
      <div className="min-h-screen bg-[#f7f7fa] flex items-center justify-center geistfont">
        <div className="shadow-md rounded-lg p-6 max-w-2xl w-full bg-white border border-[#ececec] relative">
          {/* Header: Logo top-right and Title */}
          <div className="flex flex-row items-start mb-6 w-full">
            <h2 className="text-2xl font-bold font-geist m-0 flex-1">
              Welcome to the NextJudge Community
            </h2>
            <span className="inline-block ml-5 flex-none self-start">
              <img
                src="https://nextjudge.net/nextjudge.png"
                alt="NextJudge Logo"
                width={48}
                height={48}
                className="rounded-xl block"
              />
            </span>
          </div>
          <p className="mb-4">{firstName},</p>
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
          <h2 className="text-xl font-semibold mb-2 mt-8 text-[#FF6600] font-geist">
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
                className="text-orange-600 underline font-geist"
              >
                hello@nextjudge.net
              </a>{" "}
              with “Admin Request” in the subject and we’ll walk you through the
              short approval process.
            </div>
            <div>
              <strong>Product updates:</strong> concise changelogs and behind the scenes notes delivered straight to your inbox.
            </div>
          </div>
          <p className="mb-4">
            Questions, ideas, or just want to say hi? We read every message sent to{" "}
            <a
              href="mailto:hello@nextjudge.net"
              className="text-orange-600 underline font-geist"
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
          <div className="mt-8 border-t pt-5 text-center text-gray-600 text-sm bg-transparent" style={{letterSpacing: "0.01em"}}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <img
                src="https://nextjudge.net/nextjudge.png"
                alt="NextJudge Footer Icon"
                width={32}
                height={32}
                className="rounded-lg mr-2"
              />
              <a
                href="https://nextjudge.net"
                className="underline text-orange-600 font-geist font-semibold text-base"
              >
                NextJudge
              </a>
              <span className="text-gray-300 mx-1">|</span>
              <span className="ml-1">Competitive Programming Platform</span>
            </div>
            <p className="m-0">
              Support:{" "}
              <a
                href={`mailto:${dev ? "dev@nextjudge.net" : "hello@nextjudge.net"}`}
                className="text-orange-600 underline font-geist"
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
import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
}) => (
  <div className="w-full md:w-1/2 mx-auto p-8">
    <div className="font-sans text-neutral-800 bg-neutral-50 p-6">
      <p className="text-lg font-semibold">Hi, {firstName}!</p>
      <p className="mt-4">
        Thank you for signing up for early access to NextJudge. Your support is
        crucial as we build a community of inital users who will help shape the
        future of competitive programming.
      </p>
      <p className="mt-2">
        We're hard at work creating a platform that's not only intuitive but
        also packed with features to help you improve your coding skills and
        compete with the best.
      </p>
      <h2 className="mt-6 text-neutral-800 font-semibold">What to Expect?</h2>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li>Regular updates on our progress</li>
        <li>Exclusive early access to new features</li>
        <li>Opportunities to influence the development with your feedback</li>
      </ul>
      <p className="mt-4">
        We believe that your input can significantly impact our community's
        success. Stay tuned for more information as we get closer to our launch!
      </p>
      <p className="mt-4">
        If you have any questions or suggestions, feel free to reply to this
        email. We're always here to help!
      </p>
      <p className="mt-4 font-bold">Warm regards,</p>
      <p className="font-bold text-neutral-900">The NextJudge Team</p>
    </div>
  </div>
);

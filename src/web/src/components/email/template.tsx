import * as React from "react";

interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
}) => (
  <div className="min-h-screen flex flex-col items-center py-10">
    <div className="shadow-md rounded-lg p-6 max-w-2xl w-full">
      <h2 className="text-2xl font-bold  mb-4">
        Welcome to the NextJudge Community!
      </h2>
      <p className=" mb-4">Hi {firstName},</p>
      <p className=" mb-4">
        Thank you for your interest in NextJudge and for joining our newsletter!
        We are thrilled to have you as part of our growing community of
        competitive programming enthusiasts.
      </p>
      <p className=" mb-4">
        Our team is dedicated to revolutionizing the world of competitive
        programming by providing an innovative and seamless platform for coders
        of all levels. Now that you're on our mailing list, you'll be among the
        first to experience our application designed to both enhance your coding
        skills and challenge your abilities.
      </p>
      <h2 className="text-xl font-semibold  mb-2">
        Here's what you can expect from us next:
      </h2>
      <ul className="list-disc list-inside mb-4 ">
        <li>
          <strong>Early Access:</strong> Get exclusive early access to NextJudge
          before it becomes available to the general public.
        </li>
        <li>
          <strong>Admin Requests:</strong> Become a NextJudge admin by
          submitting a request to the NextJudge team. Admins have the ability to
          create contests and manage users.
        </li>

        <li>
          <strong>Product Updates and Announcements:</strong> Stay informed
          about the latest product updates, features, and announcements from our
          team. We'll keep you in the loop every step of the way.
        </li>
      </ul>
      <p className=" mb-4">
        As soon as we're ready to onboard new users, we will contact you. In the
        meantime, feel free to reach out to us with any questions or suggestions
        at{" "}
        <a
          href="mailto:nyumat@nextjudge.org"
          className="text-orange-600 underline"
        >
          hello@nextjudge.org
        </a>
        .
      </p>
      <p className=" mb-4">
        Once again, thank you for your support and visiting our platform. We
        can't wait to share NextJudge with you!
      </p>
      <p className="">All the best,</p>
      <p className=" mb-4">
        <strong>The NextJudge Team</strong>
      </p>

      <div className="mt-6 border-t pt-4 text-center text-gray-600 text-sm">
        <p>
          <a href="https://nextjudge.net" className="underline text-orange-600">
            NextJudge
          </a>{" "}
          | Competitive Programming Platform
        </p>
        <p>
          For any queries, contact us at{" "}
          <a
            href="mailto:hello@nextjudge.org"
            className="text-orange-600 underline"
          >
            hello@nextjudge.org
          </a>
        </p>
      </div>
    </div>
  </div>
);

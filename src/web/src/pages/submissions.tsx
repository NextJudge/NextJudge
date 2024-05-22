// web/src/pages/submissions.tsx
import { useEffect, useState } from "react";
import { getBridgeUrl } from "@/lib/utils";

export default function Submissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSubmissions() {
      const response = await fetch("http://localhost:3000/submission");
      const data = await response.json();
      setSubmissions(data);
    }

    fetchSubmissions();
  }, []);

  return (
    <div>
      <h1>Submissions</h1>
      <ul>
        {submissions.map((submission) => (
          <li key={submission.id}>
            <p>ID: {submission.id}</p>
            <p>Code: {submission.code}</p>
            <p>Language: {submission.language}</p>
            <p>Problem ID: {submission.problemId}</p>
            <p>Timestamp: {submission.timestamp}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

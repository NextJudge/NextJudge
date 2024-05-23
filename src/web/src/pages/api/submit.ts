import type { NextApiRequest, NextApiResponse } from 'next';

let submissions: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { code, language, problemId } = req.body;

    const submission = {
      id: submissions.length + 1,
      code,
      language,
      problemId,
      timestamp: new Date().toISOString(),
    };

    submissions.push(submission);

    res.status(201).json({ message: 'Submission received', submission });
  } else if (req.method === 'GET') {
    res.status(200).json(submissions);
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

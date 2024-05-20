import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../prisma/prismaClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const languages = await prisma.languages.findMany();
      res.status(200).json(languages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch languages' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

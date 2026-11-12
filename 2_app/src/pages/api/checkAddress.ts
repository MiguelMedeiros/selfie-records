import { getRecords } from "@synonymdev/selfie-records";

import { parseCheckAddressQuery } from "@/lib/checkAddressQuery";

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const parsed = parseCheckAddressQuery(req.query);
  if (!parsed.ok) {
    return res.status(parsed.status).json({ error: parsed.error });
  }

  try {
    const records = await getRecords(parsed.value);

    res.status(200).json({ records });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch records" });
  }
}

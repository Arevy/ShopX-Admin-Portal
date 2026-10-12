import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	res.setHeader("Cache-Control", "no-store");
	if (req.method !== "GET")
		return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
	const origin = process.env.SHOPX_PLATFORM_API_ORIGIN;
	if (!origin) return res.json({ configuration: null });
	try {
		const response = await fetch(new URL("/platform-config", origin), {
			signal: AbortSignal.timeout(5000),
		});
		const body = await response.json();
		if (
			!response.ok ||
			body.configuration?.platformId !== process.env.SHOPX_PLATFORM_ID
		)
			throw new Error("Platform identity mismatch");
		return res.json(body);
	} catch {
		return res.status(503).json({ error: "PLATFORM_CONFIG_UNAVAILABLE" });
	}
}

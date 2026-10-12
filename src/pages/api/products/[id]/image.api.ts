import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const origin = process.env.SHOPX_PLATFORM_API_ORIGIN,
		id = req.query.id;
	if (req.method !== "GET") return res.status(405).end();
	if (!origin || typeof id !== "string" || !/^\d+$/.test(id))
		return res.status(404).end();
	try {
		const response = await fetch(
			new URL("/products/" + id + "/image", origin),
			{ signal: AbortSignal.timeout(10000) }
		);
		if (!response.ok) return res.status(response.status).end();
		const type = response.headers.get("content-type") || "";
		if (!/^image\/(jpeg|png|webp)$/.test(type)) return res.status(502).end();
		res.setHeader("Content-Type", type);
		res.setHeader("Cache-Control", "no-cache");
		res.send(Buffer.from(await response.arrayBuffer()));
	} catch {
		res.status(502).end();
	}
}

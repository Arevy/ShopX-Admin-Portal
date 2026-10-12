import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	res.setHeader("Cache-Control", "no-store");
	if (process.env.SHOPX_ADMIN_MODE !== "control") return res.status(404).end();
	const route = Array.isArray(req.query.path) ? req.query.path.join("/") : "";
	const valid =
		(req.method === "GET" &&
			/^(platforms|accounts|operations\/[a-f0-9-]{36})$/.test(route)) ||
		(req.method === "POST" &&
			/^(login|logout|invitations|invitations\/accept|invitations\/[a-f0-9-]{36}\/revoke|accounts\/[a-f0-9-]{36}\/status|account\/password|platform-plans|platforms|platforms\/sx_[a-f0-9]{12}\/operations)$/.test(
				route
			));
	if (!valid) return res.status(404).end();
	if (
		req.method === "POST" &&
		req.headers.origin !== process.env.SHOPX_CONTROL_ORIGIN
	)
		return res.status(403).json({ error: "ORIGIN_REJECTED" });
	try {
		const response = await fetch(
			new URL("/v1/" + route, process.env.SHOPX_CONTROL_API_ORIGIN),
			{
				method: req.method,
				headers: {
					"Content-Type": "application/json",
					cookie: req.headers.cookie || "",
					origin: req.headers.origin || "",
					"Idempotency-Key":
						typeof req.headers["idempotency-key"] === "string"
							? req.headers["idempotency-key"]
							: "",
				},
				body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
				signal: AbortSignal.timeout(10000),
				redirect: "error",
			}
		);
		const cookie = response.headers.get("set-cookie");
		if (cookie) res.setHeader("Set-Cookie", cookie);
		return res.status(response.status).json(await response.json());
	} catch {
		return res.status(503).json({ error: "CONTROL_UNAVAILABLE" });
	}
}
export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };

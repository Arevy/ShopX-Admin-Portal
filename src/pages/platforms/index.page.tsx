import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { observer } from "mobx-react-lite";
import { ControlStore } from "@/stores/controlStore";
import {
	ManagementAuth,
	AccountSecurity,
} from "@/components/control/AccessPanel";
import { PlatformForm } from "@/components/control/PlatformForm";
import styles from "./platforms.module.scss";

const Console = observer(() => {
	const [store] = useState(() => new ControlStore());
	useEffect(() => {
		const invitation = new URLSearchParams(window.location.hash.slice(1)).get(
			"invite"
		);
		if (invitation) {
			store.setInvitationToken(invitation);
			window.history.replaceState(null, "", window.location.pathname);
		}
		void store.refresh();
		const tick = setInterval(() => {
			if (document.visibilityState === "visible" && store.authenticated)
				void store.refresh();
		}, 5000);
		return () => clearInterval(tick);
	}, [store]);
	return (
		<main className={styles.console}>
			<Head>
				<title>ShopX · Platform console</title>
				<meta name="robots" content="noindex,nofollow" />
			</Head>
			<header className={styles.header}>
				<div>
					<span className={styles.eyebrow}>SHOPX / CONTROL</span>
					<h1>
						Your businesses.
						<br />
						<span>One clear view.</span>
					</h1>
					<p>
						Create independent stores and follow every deployment from one
						place.
					</p>
				</div>
				{store.authenticated && (
					<div className={styles.identity}>
						<span>{store.email}</span>
						<button onClick={() => void store.logout()} disabled={store.busy}>
							Sign out
						</button>
					</div>
				)}
			</header>
			{store.error && (
				<p role="alert" className={styles.error}>
					{store.error}
				</p>
			)}
			{store.notice && (
				<p role="status" className={styles.notice}>
					{store.notice}
				</p>
			)}
			{store.authenticated && store.invitationToken && (
				<p role="status">
					Sign out to accept this invitation with a separate account.
				</p>
			)}
			{store.initializing ? (
				<p role="status">Connecting to the platform registry…</p>
			) : !store.authenticated ? (
				<ManagementAuth store={store} />
			) : (
				<>
					<section className={styles.metrics} aria-label="Platform overview">
						{Object.entries(store.counts).map(([label, value]) => (
							<div key={label}>
								<strong>{value}</strong>
								<span>{label}</span>
							</div>
						))}
					</section>
					{store.initialShop && (
						<section className={styles.legacy} aria-label="Original shop">
							<div>
								<span className={styles.eyebrow}>
									EXISTING BUSINESS / PRESERVED
								</span>
								<h2>{store.initialShop.name}</h2>
								<p>
									Your original catalog, accounts and orders remain in the
									original store. New demo stores use a separate content pack.
									This store is outside factory lifecycle management.
								</p>
							</div>
							<nav
								className={styles.links}
								aria-label="Original shop applications"
							>
								<a
									href={store.initialShop.storefront}
									target="_blank"
									rel="noreferrer"
								>
									Original storefront ↗
								</a>
								<a
									href={store.initialShop.admin}
									target="_blank"
									rel="noreferrer"
								>
									Original admin ↗
								</a>
							</nav>
						</section>
					)}
					<div className={styles.workspace}>
						<section aria-labelledby="platforms-title">
							<div className={styles.sectionTitle}>
								<h2 id="platforms-title">Your platforms</h2>
								<span>{store.remainingSlots} available host slots</span>
							</div>
							{!store.platforms.length && (
								<div className={styles.panel}>
									<h3>Room for your next idea</h3>
									<p>
										Create a store with its own products, customers, orders and
										administration.
									</p>
								</div>
							)}
							<div className={styles.cards}>
								{store.platforms.map((p) => {
									const busy = ["queued", "running"].includes(
										p.operation?.status || ""
									);
									const stale =
										!p.checkedAt ||
										Date.now() - Date.parse(p.checkedAt) > 90000;
									const status = stale ? "unknown" : p.observed;
									const domain = p.manifest.slug + ".localhost:" + p.port;
									return (
										<article
											className={styles.card}
											key={p.id}
											style={{ borderTopColor: p.manifest.branding.accent }}
										>
											<div className={styles.sectionTitle}>
												<h3>{p.manifest.displayName}</h3>
												<span className={styles.status} data-status={status}>
													{status}
												</span>
											</div>
											<p>
												{p.manifest.slug} · EUR · VAT included ·{" "}
												{p.manifest.seedMode === "empty"
													? "Started empty"
													: "Demo starter"}
											</p>
											<div className={styles.services}>
												{Object.entries(p.services || {}).map(
													([name, ready]) => (
														<span key={name}>
															{name}:{" "}
															{stale
																? "unknown"
																: ready
																? "ready"
																: "unavailable"}
														</span>
													)
												)}
											</div>
											<p role="status">
												{p.operation?.status}: {p.operation?.step}
												{p.operation?.error &&
													" · " +
														p.operation.error.toLowerCase().replace(/_/g, " ")}
											</p>
											<small>
												Last checked:{" "}
												{p.checkedAt
													? new Date(p.checkedAt).toLocaleTimeString()
													: "waiting for worker"}
											</small>
											{p.provisionedAt && (
												<nav
													className={styles.links}
													aria-label={p.manifest.displayName + " applications"}
												>
													<a
														href={"http://" + domain}
														target="_blank"
														rel="noreferrer"
													>
														Storefront ↗
													</a>
													<a
														href={"http://admin." + domain}
														target="_blank"
														rel="noreferrer"
													>
														Store admin ↗
													</a>
													<a
														href={"http://api." + domain + "/health/ready"}
														target="_blank"
														rel="noreferrer"
													>
														API health ↗
													</a>
												</nav>
											)}
											{store.role !== "GLOBAL_VIEWER" && (
												<div className={styles.actions}>
													{p.operation?.status === "failed" &&
														["GLOBAL_ADMIN", "PLATFORM_CREATOR"].includes(
															store.role
														) && (
															<button
																disabled={store.busy || busy}
																onClick={() => void store.action(p.id, "retry")}
															>
																Retry failed operation
															</button>
														)}
													{p.operation?.status === "failed" &&
														!p.provisionedAt &&
														store.role === "GLOBAL_ADMIN" && (
															<button
																disabled={store.busy || busy}
																onClick={() =>
																	void store.action(p.id, "rebase")
																}
															>
																Use current release and retry
															</button>
														)}
													{p.provisionedAt && (
														<>
															<button
																disabled={store.busy || busy}
																onClick={() => void store.action(p.id, "start")}
															>
																Start
															</button>
															<button
																disabled={store.busy || busy}
																onClick={() =>
																	void store.action(p.id, "restart")
																}
															>
																Restart
															</button>
														</>
													)}
													<button
														disabled={store.busy || busy}
														onClick={() => void store.action(p.id, "stop")}
													>
														Stop services
													</button>
												</div>
											)}
											<small>
												Native apps: not requested · Stop preserves all data.
											</small>
										</article>
									);
								})}
							</div>
						</section>
						{["GLOBAL_ADMIN", "PLATFORM_CREATOR"].includes(store.role) && (
							<PlatformForm store={store} />
						)}
					</div>
					<AccountSecurity store={store} />
				</>
			)}
		</main>
	);
});
const Page = () => <Console />;
Page.useAppShell = false;
export default Page;
export const getServerSideProps: GetServerSideProps = async () =>
	process.env.SHOPX_ADMIN_MODE === "control"
		? { props: {} }
		: { notFound: true };

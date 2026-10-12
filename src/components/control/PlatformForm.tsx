import { FormEvent, useRef, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { ControlStore } from "@/stores/controlStore";
import styles from "@/pages/platforms/platforms.module.scss";

export const PlatformForm = observer(({ store }: { store: ControlStore }) => {
	const review = useRef<HTMLElement>(null);
	const [brand, setBrand] = useState({
		name: "Your next business",
		accent: "#c8ff5f",
		background: "#101112",
		surface: "#1a1d20",
	});
	const [seedMode, setSeedMode] = useState("empty");
	useEffect(() => {
		if (store.plan) review.current?.focus();
	}, [store.plan]);
	const preview = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		void store.preview({
			slug: data.get("slug"),
			displayName: data.get("name"),
			ownerEmail: data.get("owner"),
			locale: data.get("locale"),
			currency: "EUR",
			priceDisplay: "gross",
			template: "general-store-real-v1",
			seedMode: data.get("seedMode"),
			branding: {
				accent: data.get("accent"),
				background: data.get("background"),
				surface: data.get("surface"),
			},
		});
	};
	return (
		<aside className={styles.panel}>
			<span className={styles.eyebrow}>NEW PLATFORM</span>
			<h2>Launch a new store</h2>
			<p>
				Choose your identity, starting content and visual style. Review
				everything before creation.
			</p>
			<form onSubmit={preview} onChange={() => store.clearPlan()}>
				<fieldset disabled={store.busy}>
					<legend>01 / Business & owner</legend>
					<label>
						Business name
						<input
							name="name"
							autoComplete="organization"
							required
							maxLength={80}
							placeholder="Northstar Living"
							onChange={(e) =>
								setBrand({
									...brand,
									name: e.target.value || "Your next business",
								})
							}
						/>
					</label>
					<label>
						Store address
						<input
							name="slug"
							required
							autoComplete="off"
							autoCapitalize="none"
							spellCheck={false}
							pattern="[a-z][a-z0-9-]{2,30}[a-z0-9]"
							minLength={4}
							maxLength={32}
							placeholder="northstar-living"
							aria-describedby="slug-hint"
						/>
					</label>
					<small id="slug-hint">
						4–32 lowercase letters, numbers or hyphens. The address is reserved
						permanently. Local access links are shown in the review.
					</small>
					<label>
						Store owner email
						<input
							name="owner"
							type="email"
							autoComplete="section-store-owner email"
							required
							maxLength={254}
						/>
					</label>
					<small>
						This separate store administrator receives a new account.
						Management-console access does not grant a shopper session.
					</small>
				</fieldset>
				<fieldset disabled={store.busy}>
					<legend>02 / Content & market</legend>
					<label>
						Starting content
						<select
							name="seedMode"
							value={seedMode}
							onChange={(e) => setSeedMode(e.target.value)}
						>
							<option value="empty">Empty store — add your own products</option>
							<option value="demo">Demo store — reviewed catalog & CMS</option>
						</select>
					</label>
					<p>
						{seedMode === "demo"
							? "45 real-model products, reviewed images and starter CMS pages. Prices are a dated reference snapshot."
							: "Products, categories and CMS start empty. Add your own content from the store administration."}{" "}
						Both options start with a new owner and no customers, orders or
						reviews. Original ShopX data is never copied.
					</p>
					<label>
						Default language
						<select name="locale" defaultValue="en" autoComplete="language">
							<option value="en">English</option>
							<option value="ro">Română</option>
							<option value="de">Deutsch</option>
							<option value="fr">Français</option>
							<option value="ar">العربية</option>
							<option value="he">עברית</option>
						</select>
					</label>
					<div className={styles.fieldGrid}>
						<label>
							Currency
							<input value="EUR" readOnly aria-describedby="money-hint" />
						</label>
						<label>
							Price display
							<input value="VAT included" readOnly />
						</label>
					</div>
					<small id="money-hint">
						This template supports EUR with VAT-inclusive display. It does not
						configure a tax engine or charge payments.
					</small>
				</fieldset>
				<fieldset disabled={store.busy}>
					<legend>03 / Brand appearance</legend>
					<div className={styles.colors}>
						{(["accent", "background", "surface"] as const).map((key) => (
							<label key={key}>
								{key === "accent"
									? "Brand accent"
									: key === "background"
									? "Page background"
									: "Card surface"}
								<input
									name={key}
									type="color"
									value={brand[key]}
									onChange={(e) =>
										setBrand({ ...brand, [key]: e.target.value })
									}
								/>
								<small>{brand[key]}</small>
							</label>
						))}
					</div>
					<div
						className={styles.brandPreview}
						style={{ background: brand.background }}
						aria-label="Brand preview"
					>
						<span style={{ color: brand.accent }}>YOUR STORE</span>
						<strong>{brand.name}</strong>
						<div style={{ background: brand.surface }}>
							A space for your next collection.
						</div>
						<span
							className={styles.previewAction}
							style={{ background: brand.accent }}
						>
							Explore collection
						</span>
					</div>
				</fieldset>
				<fieldset disabled={store.busy || store.remainingSlots === 0}>
					<button className={styles.primary}>
						{store.busy ? "Preparing review…" : "Review platform"}
					</button>
				</fieldset>
				{store.remainingSlots === 0 && (
					<p role="status">
						Host capacity is fully reserved. Contact the global administrator.
					</p>
				)}
			</form>
			{store.plan && (
				<section
					ref={review}
					tabIndex={-1}
					className={styles.review}
					aria-labelledby="review-title"
				>
					<h3 id="review-title">
						Ready to create {store.plan.manifest.displayName}
					</h3>
					<dl>
						<dt>Store address</dt>
						<dd>{store.plan.addresses.storefront}</dd>
						<dt>Store owner</dt>
						<dd>{store.plan.manifest.ownerEmail}</dd>
						<dt>Content</dt>
						<dd>
							{store.plan.manifest.seedMode === "empty"
								? "Empty store"
								: "Demo catalog and CMS"}
						</dd>
						<dt>Language / currency</dt>
						<dd>{store.plan.manifest.locale} / EUR, VAT included</dd>
					</dl>
					<p>
						The address is estimated until creation reserves a port. Each store
						has its own storefront, administration, API and data.
					</p>
					<ul>
						{store.plan.notes.map((note) => (
							<li key={note}>{note}</li>
						))}
					</ul>
					<button
						className={styles.primary}
						disabled={store.busy}
						onClick={() => void store.create()}
					>
						Create platform
					</button>
					<button disabled={store.busy} onClick={() => store.clearPlan()}>
						Back to editing
					</button>
				</section>
			)}
		</aside>
	);
});

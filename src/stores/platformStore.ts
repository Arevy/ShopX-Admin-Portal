import { makeAutoObservable, runInAction } from "mobx";
import i18n from "../i18n/i18n";
import { LANGUAGE_STORAGE_KEY, LANGUAGES } from "../i18n/config";
export interface PlatformConfig {
	platformId: string;
	revision: number;
	displayName: string;
	locale: string;
	currency: "EUR";
	priceDisplay: "gross";
	branding: { accent: string; background: string; surface: string };
}
export class PlatformStore {
	configuration: PlatformConfig | null = null;
	private readonly hadLanguagePreference =
		typeof window === "undefined" ||
		Boolean(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
	constructor() {
		makeAutoObservable(this);
	}
	async refresh() {
		try {
			const response = await fetch("/api/platform-config", {
				cache: "no-store",
				signal: AbortSignal.timeout(5000),
			});
			if (!response.ok) return;
			const { configuration: c } = await response.json();
			if (
				!c ||
				!/^sx_[a-f0-9]{12}$/.test(c.platformId) ||
				c.currency !== "EUR" ||
				!Number.isSafeInteger(c.revision) ||
				typeof c.displayName !== "string" ||
				!["accent", "background", "surface"].every((k) =>
					/^#[a-fA-F0-9]{6}$/.test(c.branding?.[k])
				)
			)
				return;
			if (
				this.configuration &&
				this.configuration.platformId !== c.platformId
			) {
				window.location.reload();
				return;
			}
			const firstConfiguration = !this.configuration;
			runInAction(() => {
				this.configuration = c;
			});
			if (
				firstConfiguration &&
				!this.hadLanguagePreference &&
				LANGUAGES.includes(c.locale)
			)
				void i18n.changeLanguage(c.locale);
			for (const key of ["accent", "background", "surface"] as const) {
				document.documentElement.style.setProperty(
					"--platform-" + key,
					c.branding[key]
				);
			}
			document.title = c.displayName;
		} catch {
			/* A running client retains its last validated branding during an outage. */
		}
	}
	watch() {
		void this.refresh();
		const refresh = () => {
			if (document.visibilityState === "visible") void this.refresh();
		};
		const timer = setInterval(refresh, 30000);
		window.addEventListener("focus", refresh);
		return () => {
			clearInterval(timer);
			window.removeEventListener("focus", refresh);
		};
	}
}

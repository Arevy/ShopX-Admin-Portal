import { makeAutoObservable, runInAction } from "mobx";

export interface PlatformManifest {
	slug: string;
	displayName: string;
	ownerEmail: string;
	locale: string;
	currency: "EUR";
	priceDisplay: "gross";
	template: "general-store-real-v1";
	seedMode?: "empty" | "demo";
	branding: { accent: string; background: string; surface: string };
}
export interface PlatformRecord {
	id: string;
	port: number;
	manifest: PlatformManifest;
	observed: string;
	checkedAt?: string;
	provisionedAt?: string;
	services?: Record<string, boolean>;
	operation?: { status: string; step: string; error?: string };
}
interface Account {
	id: string;
	email: string;
	name: string;
	role: string;
	disabled: boolean;
}
interface Invitation {
	id: string;
	email: string;
	role: string;
	expires: number;
}
interface Plan {
	manifest: PlatformManifest;
	notes: string[];
	addresses: { storefront: string; admin: string };
	release: string;
}

export class ControlStore {
	platforms: PlatformRecord[] = [];
	counts = { registered: 0, provisioned: 0, online: 0 };
	authenticated = false;
	initializing = true;
	busy = false;
	error = "";
	notice = "";
	role = "";
	email = "";
	capacity = 0;
	remainingSlots = 0;
	plan: Plan | null = null;
	initialShop: { name: string; storefront: string; admin: string } | null =
		null;
	accounts: Account[] = [];
	invitations: Invitation[] = [];
	invitationUrl = "";
	invitationToken = "";
	private creationKey = "";
	private refreshing = false;
	private generation = 0;
	constructor() {
		makeAutoObservable(this);
	}
	clearIdentity() {
		this.authenticated = false;
		this.platforms = [];
		this.accounts = [];
		this.invitations = [];
		this.invitationUrl = "";
		this.initialShop = null;
		this.clearPlan();
		this.role = "";
		this.email = "";
	}
	async request(route: string, body?: unknown, key?: string) {
		const generation = this.generation;
		const response = await fetch("/api/control/" + route, {
			method: body === undefined ? "GET" : "POST",
			credentials: "same-origin",
			cache: "no-store",
			headers: {
				"Content-Type": "application/json",
				...(key ? { "Idempotency-Key": key } : {}),
			},
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(15000),
		});
		const data = await response.json();
		if (response.status === 401 && generation === this.generation)
			runInAction(() => this.clearIdentity());
		if (!response.ok) throw new Error(data.error || "REQUEST_FAILED");
		return data;
	}
	async refresh(force = false) {
		if (this.refreshing && !force) return;
		this.refreshing = true;
		const generation = this.generation;
		try {
			const data = await this.request("platforms");
			if (generation !== this.generation) return;
			runInAction(() => {
				this.platforms = data.platforms;
				this.counts = data.counts;
				this.capacity = data.capacity;
				this.remainingSlots = data.remainingSlots;
				this.role = data.user.role;
				this.email = data.user.email;
				this.authenticated = true;
				this.initialShop = data.initialShop;
			});
		} catch (e) {
			if (
				generation === this.generation &&
				(e as Error).message !== "AUTHENTICATION_REQUIRED"
			)
				runInAction(() => {
					this.error =
						"Status unavailable. The last displayed observation may be stale.";
				});
		} finally {
			runInAction(() => {
				this.initializing = false;
				this.refreshing = false;
			});
		}
	}
	async perform(fn: () => Promise<void>) {
		if (this.busy) return false;
		this.busy = true;
		this.error = "";
		this.notice = "";
		try {
			await fn();
			return true;
		} catch (e) {
			runInAction(() => {
				this.error = (e as Error).message.replace(/_/g, " ").toLowerCase();
			});
			return false;
		} finally {
			runInAction(() => {
				this.busy = false;
			});
		}
	}
	async login(email: string, password: string) {
		await this.perform(async () => {
			await this.request("login", { email, password });
			runInAction(() => {
				this.generation++;
			});
			await this.refresh(true);
		});
	}
	async logout() {
		await this.perform(async () => {
			await this.request("logout", {});
			runInAction(() => {
				this.generation++;
				this.clearIdentity();
			});
		});
	}
	setInvitationToken(token: string) {
		this.invitationToken = token;
	}
	async register(email: string, name: string, password: string) {
		return this.perform(async () => {
			await this.request("invitations/accept", {
				token: this.invitationToken,
				email,
				name,
				password,
			});
			runInAction(() => {
				this.invitationToken = "";
				this.notice = "Account created. Sign in with your new password.";
			});
		});
	}
	async password(currentPassword: string, password: string) {
		return this.perform(async () => {
			await this.request("account/password", { currentPassword, password });
			runInAction(() => {
				this.notice =
					"Password changed. Your other sessions have been signed out.";
			});
		});
	}
	async loadAccounts() {
		const generation = this.generation,
			data = await this.request("accounts");
		if (generation === this.generation)
			runInAction(() => {
				this.accounts = data.users;
				this.invitations = data.invitations;
			});
	}
	async invite(email: string, role: string) {
		return this.perform(async () => {
			runInAction(() => {
				this.invitationUrl = "";
			});
			const result = await this.request("invitations", { email, role });
			runInAction(() => {
				this.invitationUrl = result.url;
				this.notice =
					"Invitation created. Share the private link securely; it expires in 24 hours.";
			});
			await this.loadAccounts();
		});
	}
	async revokeInvitation(id: string) {
		await this.perform(async () => {
			await this.request("invitations/" + id + "/revoke", {});
			runInAction(() => {
				this.invitationUrl = "";
			});
			await this.loadAccounts();
		});
	}
	async accountStatus(id: string, disabled: boolean) {
		await this.perform(async () => {
			await this.request("accounts/" + id + "/status", { disabled });
			await this.loadAccounts();
		});
	}
	async preview(manifest: unknown) {
		await this.perform(async () => {
			const plan = await this.request("platform-plans", manifest);
			runInAction(() => {
				this.plan = plan;
				this.creationKey = crypto.randomUUID();
			});
		});
	}
	clearPlan() {
		this.plan = null;
		this.creationKey = "";
	}
	async create() {
		const plan = this.plan,
			key = this.creationKey;
		if (!plan) return;
		await this.perform(async () => {
			await this.request("platforms", plan.manifest, key);
			runInAction(() => this.clearPlan());
			await this.refresh();
		});
	}
	async action(id: string, action: string) {
		await this.perform(async () => {
			await this.request(
				"platforms/" + id + "/operations",
				{ action },
				crypto.randomUUID()
			);
			await this.refresh();
		});
	}
}

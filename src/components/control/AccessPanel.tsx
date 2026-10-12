import { FormEvent, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { ControlStore } from "@/stores/controlStore";
import styles from "@/pages/platforms/platforms.module.scss";

function Password({
	name,
	label,
	fresh = false,
}: {
	name: string;
	label: string;
	fresh?: boolean;
}) {
	const [visible, setVisible] = useState(false);
	return (
		<div>
			<label>
				{label}
				<input
					name={name}
					type={visible ? "text" : "password"}
					autoComplete={fresh ? "new-password" : "current-password"}
					required
					minLength={fresh ? 15 : undefined}
					maxLength={fresh ? 128 : 256}
				/>
			</label>
			<button
				type="button"
				aria-pressed={visible}
				onClick={() => setVisible(!visible)}
			>
				{visible ? "Hide" : "Show"} {label.toLowerCase()}
			</button>
			{fresh && (
				<small>
					Use a unique password or passphrase with 15–128 characters. Password
					managers and paste are supported.
				</small>
			)}
		</div>
	);
}

export const ManagementAuth = observer(({ store }: { store: ControlStore }) => {
	const accepting = Boolean(store.invitationToken);
	const submit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget,
			data = new FormData(form);
		if (accepting) {
			if (
				await store.register(
					String(data.get("email")),
					String(data.get("name")),
					String(data.get("password"))
				)
			)
				form.reset();
		} else
			await store.login(
				String(data.get("email")),
				String(data.get("password"))
			);
	};
	return (
		<form
			className={styles.panel}
			onSubmit={submit}
			key={accepting ? "accept" : "login"}
		>
			<span className={styles.eyebrow}>INVITATION-ONLY ACCESS</span>
			<h2>
				{accepting ? "Create your management account" : "Management sign in"}
			</h2>
			<p>
				{accepting
					? "Use the email address that received the invitation. Your permissions are assigned by the global administrator."
					: "Sign in to create and manage your platforms. Store accounts remain separate."}
			</p>
			<fieldset disabled={store.busy}>
				{accepting && (
					<label>
						Your name
						<input name="name" autoComplete="name" required maxLength={80} />
					</label>
				)}
				<label>
					Email
					<input
						name="email"
						type="email"
						autoComplete="username"
						spellCheck={false}
						required
						maxLength={254}
					/>
				</label>
				<Password name="password" label="Password" fresh={accepting} />
				<button className={styles.primary}>
					{store.busy
						? "Please wait…"
						: accepting
						? "Create account"
						: "Sign in"}
				</button>
			</fieldset>
			{accepting ? (
				<button
					type="button"
					onClick={() => store.setInvitationToken("")}
					disabled={store.busy}
				>
					Back to sign in
				</button>
			) : (
				<p>
					New here? Ask your global administrator for a private invitation link.
					Public registration is closed.
				</p>
			)}
		</form>
	);
});

export const AccountSecurity = observer(
	({ store }: { store: ControlStore }) => {
		const [copied, setCopied] = useState(false);
		useEffect(() => {
			if (store.role === "GLOBAL_ADMIN")
				void store.perform(() => store.loadAccounts());
		}, [store, store.role]);
		const changePassword = async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const form = e.currentTarget,
				data = new FormData(form);
			if (
				await store.password(
					String(data.get("currentPassword")),
					String(data.get("newPassword"))
				)
			)
				form.reset();
		};
		const invite = async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const form = e.currentTarget,
				data = new FormData(form);
			setCopied(false);
			if (
				await store.invite(String(data.get("email")), String(data.get("role")))
			)
				form.reset();
		};
		return (
			<section className={styles.access} aria-labelledby="access-title">
				<h2 id="access-title">Account & access</h2>
				<details className={styles.panel}>
					<summary>Change your password</summary>
					<form onSubmit={changePassword}>
						<fieldset disabled={store.busy}>
							<input
								name="username"
								type="email"
								autoComplete="username"
								value={store.email}
								readOnly
								hidden
							/>
							<Password name="currentPassword" label="Current password" />
							<Password name="newPassword" label="New password" fresh />
							<button className={styles.primary}>Change password</button>
						</fieldset>
					</form>
				</details>
				{store.role === "GLOBAL_ADMIN" && (
					<details className={styles.panel}>
						<summary>Invite people & manage access</summary>
						<form onSubmit={invite}>
							<fieldset disabled={store.busy}>
								<label>
									Invitation email
									<input
										name="email"
										type="email"
										autoComplete="off"
										required
										maxLength={254}
									/>
								</label>
								<label>
									Access role
									<select name="role" defaultValue="PLATFORM_CREATOR">
										<option value="PLATFORM_CREATOR">
											Platform creator — own stores only
										</option>
										<option value="GLOBAL_OPERATOR">
											Global operator — operate all stores
										</option>
										<option value="GLOBAL_VIEWER">
											Global viewer — read all stores
										</option>
									</select>
								</label>
								<small>
									Creators can create and operate their own stores. They cannot
									view other businesses or invite users. Invitations expire
									after 24 hours.
								</small>
								<button className={styles.primary}>Create invitation</button>
							</fieldset>
						</form>
						{store.invitationUrl && (
							<div className={styles.review}>
								<p>
									This link is shown once. A replacement invitation invalidates
									the previous link for that email.
								</p>
								<label>
									Private invitation link
									<input
										type="password"
										readOnly
										value={store.invitationUrl}
										autoComplete="off"
									/>
								</label>
								<button
									type="button"
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(store.invitationUrl);
											setCopied(true);
										} catch {
											setCopied(false);
										}
									}}
								>
									{copied ? "Copied" : "Copy private link"}
								</button>
							</div>
						)}
						<h3>Pending invitations</h3>
						{!store.invitations.length && <p>No pending invitations.</p>}
						{store.invitations.map((invitation) => (
							<div className={styles.member} key={invitation.id}>
								<span>
									{invitation.email}
									<small>
										Expires {new Date(invitation.expires).toLocaleString()}
									</small>
								</span>
								<button
									disabled={store.busy}
									onClick={() => void store.revokeInvitation(invitation.id)}
								>
									Revoke invitation
								</button>
							</div>
						))}
						<h3>Management accounts</h3>
						{store.accounts.map((account) => (
							<div className={styles.member} key={account.id}>
								<span>
									{account.name || account.email}
									<small>
										{account.email} ·{" "}
										{account.role.toLowerCase().replace(/_/g, " ")} ·{" "}
										{account.disabled ? "disabled" : "active"}
									</small>
								</span>
								{account.role !== "GLOBAL_ADMIN" && (
									<button
										disabled={store.busy}
										onClick={() =>
											void store.accountStatus(account.id, !account.disabled)
										}
									>
										{account.disabled ? "Enable account" : "Disable account"}
									</button>
								)}
							</div>
						))}
						<p>
							Disabling an account signs it out immediately. Its stores keep
							running and remain accessible to the global administrator.
						</p>
					</details>
				)}
			</section>
		);
	}
);

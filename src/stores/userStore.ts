import { makeAutoObservable, runInAction } from "mobx";

import {
	MutationCustomerSupportCreateUser,
	MutationCustomerSupportDeleteUser,
	MutationCustomerSupportUpdateUser,
	MutationCustomerSupportLogoutUserSessions,
	MutationCustomerSupportImpersonateUser,
	MutationCustomerSupportUpdateOrderStatus,
	QueryCustomerSupportOrderDetail,
	QueryCustomerSupportOrders,
	QueryCustomerSupportUsers,
} from "@/graphql/customerSupport";
import {
	normalizeOrderVariables,
	normalizeUserVariables,
} from "@/graphql/customerSupport/normalizers";
import {
	MutationAdminPortalLogin,
	MutationAdminPortalLogout,
	MutationUpdateUserProfile,
	MutationChangeUserPassword,
} from "@/graphql/auth";
import type { RootStore } from "@/stores/rootStore";
import { getUserFriendlyMessage } from "@/lib/getUserFriendlyMessage";
import { Order, User, UserRole } from "@/types/domain";
import type {
	AdminPortalLoginVariables,
	CustomerSupportCreateUserVariables,
	CustomerSupportOrderDetailVariables,
	CustomerSupportUpdateOrderStatusVariables,
	CustomerSupportUpdateUserVariables,
	CustomerSupportLogoutUserSessionsResponse,
	CustomerSupportLogoutUserSessionsVariables,
	CustomerSupportImpersonateUserResponse,
	CustomerSupportImpersonateUserVariables,
} from "@/types/graphql";

interface UserFilters {
	email?: string;
	role?: UserRole;
}

interface CreateUserInput {
	email: string;
	password: string;
	name?: string;
	role: UserRole;
}

interface UpdateUserInput {
	email?: string;
	password?: string;
	name?: string;
	role?: UserRole;
}

interface OrderFilters {
	userId?: string;
	status?: string;
	limit?: number;
	offset?: number;
}

export class UserStore {
	private readonly root: RootStore;
	users: User[] = [];
	loading = false;
	error: string | null = null;
	filters: UserFilters = {};
	sessionUser: User | null = null;
	authLoading = false;
	authError: string | null = null;
	lastLoginAt: number | null = null;
	orders: Order[] = [];
	selectedOrder: Order | null = null;
	ordersLoading = false;
	ordersError: string | null = null;
	orderFilters: OrderFilters = { limit: 20, offset: 0 };
	profileSaving = false;
	profileError: string | null = null;
	passwordChanging = false;
	passwordError: string | null = null;

	constructor(root: RootStore) {
		this.root = root;
		makeAutoObservable(this, {}, { autoBind: true });
	}

	async fetchUsers(filters?: UserFilters) {
		this.loading = true;
		this.error = null;

		const merged: UserFilters = {
			...this.filters,
			...filters,
		};

		const sanitized = normalizeUserVariables(merged);
		this.filters = sanitized;

		try {
			const response = await this.root.apiService.executeGraphQL(
				QueryCustomerSupportUsers,
				sanitized
			);

			runInAction(() => {
				this.users = response.data?.customerSupport.users ?? [];
			});
		} catch (error) {
			runInAction(() => {
				this.error = getUserFriendlyMessage(
					error,
					"Unexpected error fetching users."
				);
				this.users = [];
			});
		} finally {
			runInAction(() => {
				this.loading = false;
			});
		}
	}

	async createUser(input: CreateUserInput) {
		const variables: CustomerSupportCreateUserVariables = {
			email: input.email,
			password: input.password,
			name: input.name,
			role: input.role,
		};

		const response = await this.root.apiService.executeGraphQL(
			MutationCustomerSupportCreateUser,
			variables
		);

		if (response.errors?.length) {
			throw new Error(response.errors.map((err) => err.message).join("; "));
		}

		await this.fetchUsers(this.filters);
	}

	async updateUser(id: string, input: UpdateUserInput) {
		const variables: CustomerSupportUpdateUserVariables = {
			id,
			email: input.email,
			name: input.name,
			role: input.role,
			password: input.password,
		};

		const response = await this.root.apiService.executeGraphQL(
			MutationCustomerSupportUpdateUser,
			variables
		);

		if (response.errors?.length) {
			throw new Error(response.errors.map((err) => err.message).join("; "));
		}

		await this.fetchUsers(this.filters);
	}

	async deleteUser(id: string) {
		const response = await this.root.apiService.executeGraphQL(
			MutationCustomerSupportDeleteUser,
			{ id }
		);

		if (response.errors?.length) {
			throw new Error(response.errors.map((err) => err.message).join("; "));
		}

		await this.fetchUsers(this.filters);
	}

	async logoutUserSessions(userId: string): Promise<boolean> {
		const response = await this.root.apiService.executeGraphQL<
			CustomerSupportLogoutUserSessionsResponse,
			CustomerSupportLogoutUserSessionsVariables
		>(MutationCustomerSupportLogoutUserSessions, { userId });

		if (response.errors?.length) {
			throw new Error(response.errors.map((err) => err.message).join("; "));
		}

		await this.fetchUsers(this.filters);
		return Boolean(response.data?.customerSupport.logoutUserSessions);
	}

	async impersonateUser(userId: string) {
		const response = await this.root.apiService.executeGraphQL<
			CustomerSupportImpersonateUserResponse,
			CustomerSupportImpersonateUserVariables
		>(MutationCustomerSupportImpersonateUser, { userId });

		if (response.errors?.length) {
			throw new Error(response.errors.map((err) => err.message).join("; "));
		}

		return response.data?.customerSupport.impersonateUser ?? null;
	}

	clearAuthError() {
		this.authError = null;
	}

	setSessionUser(user: User | null) {
		this.sessionUser = user;
	}

	clearProfileFeedback() {
		this.profileError = null;
		this.passwordError = null;
	}

	async login(email: string, password: string) {
		this.authLoading = true;
		this.authError = null;

		const variables: AdminPortalLoginVariables = {
			email: email.trim(),
			password,
		};

		try {
			const response = await this.root.apiService.executeGraphQL(
				MutationAdminPortalLogin,
				variables
			);

			const session = response.data?.login;
			if (!session?.user) {
				throw new Error("Login failed.");
			}

			const authenticatedUser: User = {
				id: String(session.user.id),
				email: session.user.email,
				name: session.user.name ?? null,
				role: session.user.role,
			};

			runInAction(() => {
				this.sessionUser = authenticatedUser;
				this.lastLoginAt = Date.now();
				this.profileSaving = false;
				this.profileError = null;
				this.passwordChanging = false;
				this.passwordError = null;
			});

			this.root.setAuthToken(session.token);

			return authenticatedUser;
		} catch (error) {
			const message = getUserFriendlyMessage(
				error,
				"Unexpected error signing in.",
				{
					knownMessages: [
						{ match: /invalid email/i, value: "Invalid email or password." },
						{
							match: /support authentication required/i,
							value: "Invalid email or password.",
						},
					],
				}
			);
			runInAction(() => {
				this.authError = message;
				this.sessionUser = null;
			});
			throw new Error(message);
		} finally {
			runInAction(() => {
				this.authLoading = false;
			});
		}
	}

	async logout() {
		try {
			await this.root.apiService.executeGraphQL(MutationAdminPortalLogout);
			runInAction(() => {
				this.sessionUser = null;
				this.lastLoginAt = null;
				this.orders = [];
				this.selectedOrder = null;
				this.orderFilters = { limit: 20, offset: 0 };
				this.ordersError = null;
				this.ordersLoading = false;
				this.profileSaving = false;
				this.profileError = null;
				this.passwordChanging = false;
				this.passwordError = null;
			});
			this.root.setAuthToken(undefined);
		} catch (error) {
			const message = getUserFriendlyMessage(error, "Failed to sign out.");
			throw new Error(message);
		}
	}

	async updateProfile(input: {
		name?: string | null;
		email?: string;
		currentPassword: string;
	}): Promise<{ user: User; message: string } | null> {
		if (!this.sessionUser) {
			throw new Error("Authentication required.");
		}

		const currentName = this.sessionUser.name ?? "";
		const currentEmail = this.sessionUser.email ?? "";
		const trimmedName = input.name?.trim() ?? "";
		const trimmedEmail = input.email?.trim() ?? "";
		const trimmedPassword = input.currentPassword.trim();

		const payload: {
			name?: string | null;
			email?: string;
			currentPassword: string;
		} = {
			currentPassword: trimmedPassword,
		};

		if (!trimmedPassword) {
			this.profileError = "Please confirm the change with your password.";
			return null;
		}

		if (Object.prototype.hasOwnProperty.call(input, "name") && trimmedName !== currentName) {
			payload.name = trimmedName.length ? trimmedName : null;
		}

		if (Object.prototype.hasOwnProperty.call(input, "email")) {
			if (!trimmedEmail) {
				this.profileError = "Email address cannot be empty.";
				return null;
			}
			if (trimmedEmail !== currentEmail) {
				payload.email = trimmedEmail;
			}
		}

    if (payload.name === undefined && payload.email === undefined) {
      return null;
    }

		this.profileSaving = true;
		this.profileError = null;

		try {
			const response = await this.root.apiService.executeGraphQL(
				MutationUpdateUserProfile,
				{ input: payload }
			);

			const updated = response.data?.updateUserProfile;
			if (!updated?.user) {
				throw new Error("Profile update did not return user details.");
			}

			const normalized: User = {
				id: String(updated.user.id),
				email: updated.user.email,
				name: updated.user.name ?? null,
				role: updated.user.role,
			};

			runInAction(() => {
				this.sessionUser = normalized;
				this.profileError = null;
			});

			return {
				user: normalized,
				message: updated.message ?? 'Profile updated successfully.',
			};
		} catch (error) {
			const message = getUserFriendlyMessage(
				error,
				"We couldn't update your profile. Please try again.",
				{
					knownMessages: [
						{
							match: /email already registered/i,
							value: "Another account already uses this email address.",
						},
						{
							match: /password confirmation is required/i,
							value: "Please enter your password to confirm these changes.",
						},
						{
							match: /current password is incorrect/i,
							value: "The password you provided is incorrect.",
						},
					],
				}
			);

			this.profileError = message;
			return null;
		} finally {
			this.profileSaving = false;
		}
	}

	async changePassword(currentPassword: string, newPassword: string) {
		if (!this.sessionUser) {
			throw new Error("Authentication required.");
		}

		this.passwordChanging = true;
		this.passwordError = null;

		try {
			await this.root.apiService.executeGraphQL(
				MutationChangeUserPassword,
				{ currentPassword, newPassword }
			);

			return true;
		} catch (error) {
			const message = getUserFriendlyMessage(
				error,
				"We couldn't update your password. Please try again.",
				{
					knownMessages: [
						{
							match: /incorrect/i,
							value: "The current password you entered is incorrect.",
						},
						{
							match: /at least 8/i,
							value: "Password should be at least 8 characters long.",
						},
					],
				}
			);
			this.passwordError = message;
			return false;
		} finally {
			this.passwordChanging = false;
		}
	}

	async fetchOrders(filters?: OrderFilters) {
		this.ordersLoading = true;
		this.ordersError = null;

		const merged: OrderFilters = {
			...this.orderFilters,
			...filters,
		};

		const normalized = normalizeOrderVariables(merged);
		this.orderFilters = normalized.sanitized;

		if (normalized.errorMessage) {
			runInAction(() => {
				this.orders = [];
				this.ordersLoading = false;
				this.ordersError = normalized.errorMessage ?? null;
			});
			return;
		}

		try {
			const response = await this.root.apiService.executeGraphQL(
				QueryCustomerSupportOrders,
				normalized.sanitized
			);

			runInAction(() => {
				this.orders = response.data?.customerSupport.orders ?? [];
				this.ordersError = null;
			});
		} catch (error) {
			runInAction(() => {
				this.ordersError = getUserFriendlyMessage(
					error,
					"Unexpected error fetching orders."
				);
				this.orders = [];
			});
		} finally {
			runInAction(() => {
				this.ordersLoading = false;
			});
		}
	}

	async loadOrder(orderId: string) {
		const variables: CustomerSupportOrderDetailVariables = { orderId };
		const response = await this.root.apiService.executeGraphQL(
			QueryCustomerSupportOrderDetail,
			variables
		);

		if (response.errors?.length) {
			throw new Error(response.errors.map((err) => err.message).join("; "));
		}

		runInAction(() => {
			this.selectedOrder = response.data?.customerSupport.order ?? null;
		});
	}

	async updateOrderStatus(orderId: string, status: string) {
		const variables: CustomerSupportUpdateOrderStatusVariables = {
			orderId,
			status,
		};

		const response = await this.root.apiService.executeGraphQL(
			MutationCustomerSupportUpdateOrderStatus,
			variables
		);

		if (response.errors?.length) {
			throw new Error(response.errors.map((err) => err.message).join("; "));
		}

		await this.fetchOrders(this.orderFilters);
		if (this.selectedOrder?.id === orderId) {
			await this.loadOrder(orderId);
		}
	}
}

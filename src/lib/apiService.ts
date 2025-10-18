import { GraphQLClient, ClientError } from "graphql-request";
import type { Variables } from "graphql-request";

import type { QueryFactory } from "@/graphql/utils/QueryFactory";
import type {
	GraphQLResponse,
	GraphQLResponseError,
} from "@/graphql/utils/GraphQLResponse";
import type { RootStore } from "@/stores/rootStore";
import {
	getGraphqlClientEndpoint,
	getGraphqlUpstreamEndpoint,
	getUseSupportServices,
} from "@/config/env";
import { createCacheKey } from "@/lib/cacheKeys";

export class ApiService {
	private readonly client: GraphQLClient;
	private readonly useSupportServices: boolean;

	constructor(private readonly rootStore: RootStore, endpoint?: string) {
		const useSupportServices = getUseSupportServices();
		this.useSupportServices = useSupportServices;

		let resolvedEndpoint =
			endpoint ??
			(useSupportServices
				? getGraphqlClientEndpoint()
				: getGraphqlUpstreamEndpoint());

		if (typeof window !== "undefined" && resolvedEndpoint.startsWith("/")) {
			resolvedEndpoint = `${window.location.origin}${resolvedEndpoint}`;
		}

		if (typeof window === "undefined") {
			// eslint-disable-next-line no-console
			console.info(
				"[ApiService] GraphQL endpoint resolved to",
				resolvedEndpoint
			);
		}

		this.client = new GraphQLClient(resolvedEndpoint, {
			credentials: "include",
		});
	}

	// Session cookies carry authentication; retaining this method keeps backwards compatibility.
	setAuthToken(token?: string) {
		if (token) {
			void token;
		}
	}

	async executeGraphQL<
		R,
		V extends object | undefined = Record<string, unknown>
	>(
		queryFactory: QueryFactory<R, V>,
		variables?: V
	): Promise<GraphQLResponse<R>> {
		let processedVariables = variables;

		if (processedVariables && queryFactory.preProcess) {
			const normalizedVariables = await queryFactory.preProcess(
				this.rootStore,
				processedVariables as NonNullable<V>
			);
			processedVariables = normalizedVariables as V;
		}

		if (processedVariables && queryFactory.preProcessClient) {
			const normalizedVariables = await queryFactory.preProcessClient(
				this.rootStore,
				processedVariables as NonNullable<V>
			);
			processedVariables = normalizedVariables as V;
		}

		try {
			const requestVariables = (processedVariables ?? undefined) as
				| Variables
				| undefined;
			const cacheOptions = queryFactory.cacheOptions;
			const cacheable =
				this.useSupportServices &&
				queryFactory.operationType === "query" &&
				Boolean(cacheOptions?.cacheable);

			let requestHeaders: Record<string, string> | undefined;

			if (this.useSupportServices) {
				requestHeaders = {};

				if (cacheable) {
					const resolvedVariables = processedVariables as V | undefined;
					let computedCacheKey: string | undefined;

					if (typeof cacheOptions?.cacheKey === "function") {
						computedCacheKey = cacheOptions.cacheKey(resolvedVariables);
					} else if (typeof cacheOptions?.cacheKey === "string") {
						computedCacheKey = cacheOptions.cacheKey;
					} else {
						computedCacheKey = createCacheKey(
							queryFactory.queryName,
							resolvedVariables as unknown as
								| Record<string, unknown>
								| undefined
						);
					}

					if (computedCacheKey) {
						requestHeaders["x-cache-key"] = computedCacheKey;
						if (cacheOptions?.cacheTTL) {
							requestHeaders["x-cache-ttl"] = `${cacheOptions.cacheTTL}`;
						}
					}
				}

				if (!cacheable) {
					requestHeaders["x-cache-skip"] = "1";
				}
			}

			const data = requestVariables
				? await this.client.request<R>(
						queryFactory.queryString,
						requestVariables,
						requestHeaders
				  )
				: await this.client.request<R>(
						queryFactory.queryString,
						undefined,
						requestHeaders
				  );

			let response: GraphQLResponse<R> = { data };

			if (processedVariables && queryFactory.postProcess) {
				response = await queryFactory.postProcess(
					this.rootStore,
					response,
					processedVariables as NonNullable<V>
				);
			}

			if (queryFactory.postProcessClient) {
				response = await queryFactory.postProcessClient(
					this.rootStore,
					response
				);
			}

			return response;
		} catch (error) {
			if (error instanceof ClientError) {
				const graphQLErrors: GraphQLResponseError[] | undefined =
					error.response.errors?.map((graphQLError) => ({
						message: graphQLError.message,
						locations: graphQLError.locations,
						path: graphQLError.path,
						extensions: graphQLError.extensions,
					}));

				const response: GraphQLResponse<R> = {
					data: error.response.data as R,
					errors: graphQLErrors,
				};

				if (queryFactory.throwOnErrors) {
					throw error;
				}

				if (processedVariables && queryFactory.postProcess) {
					return queryFactory.postProcess(
						this.rootStore,
						response,
						processedVariables as NonNullable<V>
					);
				}

				return response;
			}

			throw error;
		}
	}
}

export default ApiService;

"use client";

import { useRootStore } from "@/stores/StoreProvider";

export const useStores = () => {
	const rootStore = useRootStore();
	return {
		rootStore,
		platformStore: rootStore.platformStore,
		productStore: rootStore.productStore,
		userStore: rootStore.userStore,
		supportStore: rootStore.supportStore,
		cmsStore: rootStore.cmsStore,
	};
};

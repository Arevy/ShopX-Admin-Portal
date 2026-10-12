import type { GetServerSideProps } from "next";

const IndexPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
	return {
		redirect: {
			destination:
				process.env.SHOPX_ADMIN_MODE === "control"
					? "/platforms"
					: "/dashboard",
			permanent: false,
		},
	};
};

export default IndexPage;

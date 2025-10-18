import type { GetServerSideProps } from 'next'

const IndexPage = () => null

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard',
      permanent: false,
    },
  }
}

export default IndexPage

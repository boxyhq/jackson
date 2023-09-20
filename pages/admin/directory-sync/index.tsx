import type { GetStaticPropsContext, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
// import DirectoryList from '@components/dsync/DirectoryList';
import { DirectoriesWrapper } from "@boxyhq/react-ui/sso";
// import { useRouter } from 'next/router';

const DirectoryIndexPage: NextPage = () => {
  // return <DirectoryList />

  return <DirectoriesWrapper componentProps={{
    directoryList: {
      cols: ["name", "tenant", "product", "type"],
      urls: { directories: '/api/admin/directory-sync', providers: '/api/admin/directory-sync/providers' }
    },
    createDirectory: {
      urls: {
        post: '/api/admin/directory-sync',
        providers: '/api/admin/directory-sync/providers'
      },
    },
    editDirectory: {
      urls: {
        patch: '/api/admin/directory-sync',
        delete: '/api/admin/directory-sync',
        get: '/api/admin/directory-sync/providers'
      },
    },
  }} />
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default DirectoryIndexPage;

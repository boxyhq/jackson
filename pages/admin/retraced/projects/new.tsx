import type { NextPage } from 'next';
import AddProject from '@components/retraced/AddProject';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const NewProject: NextPage = () => {
  return <AddProject />;
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default NewProject;

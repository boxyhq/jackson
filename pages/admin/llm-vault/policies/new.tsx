import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AddPolicyForm from '../../../../components/terminus/policies/AddPolicyForm';

const NewPolicy = () => {
  return <AddPolicyForm />;
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default NewPolicy;

import type { GetServerSidePropsContext, NextPage } from 'next';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { fetcher } from '@lib/ui/utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Loading } from '@boxyhq/internal-ui';
import { errorToast } from '@components/Toaster';
import EditPolicyForm from '@components/terminus/policies/EditPolicyForm';

const EditPIIPolicy: NextPage = () => {
  const router = useRouter();

  const { product } = router.query as { product: string };

  const { data, error, isLoading } = useSWR(
    product ? `/api/admin/llm-vault/policies/${product}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <EditPolicyForm
      piiPolicy={data.data.piiPolicy}
      product={data.data.product}
      language={data.data.language}
      piiEntities={data.data.piiEntities}
      accessControlPolicy={data.data.accessControlPolicy}
    />
  );
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default EditPIIPolicy;

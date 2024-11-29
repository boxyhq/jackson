import type { NextPage } from 'next';
import { Trash2, Pencil } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { Table, LinkPrimary, ConfirmationModal, EmptyState, Loading, Error } from '@boxyhq/internal-ui';
import { useEffect, useState } from 'react';
import router from 'next/router';
import { errorToast, successToast } from '@components/Toaster';
import { LanguageKey, SupportedLanguages } from 'internal-ui/src/chat/types';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useFetch } from 'internal-ui/src/hooks';

export type policy = {
  createdAt: string;
  updatedAt: string;
  product: string;
  piiPolicy: string;
  piiEntities: string;
  language: string;
};

const Policies: NextPage = () => {
  const { t } = useTranslation('common');

  const { data, isLoading, error, refetch } = useFetch<{ data: Array<policy> }>({
    url: `/api/admin/llm-vault/policies`,
  });

  const [policies, setPolicies] = useState(data?.data);
  const [delModalVisible, setDelModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState('');

  const getPolicies = async () => {
    refetch();
    setPolicies(data?.data);
  };

  useEffect(() => {
    setPolicies(data?.data);
  }, [data]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={t('error_loading_page')} />;
  }

  const LANGUAGE_CODE_MAP: { [key: string]: LanguageKey } = Object.entries(SupportedLanguages).reduce(
    (acc, [key, value]) => {
      acc[value] = key as LanguageKey;
      return acc;
    },
    {} as { [key: string]: LanguageKey }
  );

  const getLanguageName = (language: string): string | undefined => {
    return LANGUAGE_CODE_MAP[language];
  };

  const deleteApp = async () => {
    try {
      const response = await fetch(`/api/admin/llm-vault/policies/${productToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        successToast(t('llm_policy_deletion_success_toast'));
      }
      if (!response.ok) {
        errorToast('Failed to delete piiPolicy');
      }
      setDelModalVisible(false);
      setProductToDelete('');
      getPolicies();
    } catch (error: any) {
      errorToast(error);
    }
  };

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('policies')}</h2>
        <LinkPrimary href={'/admin/llm-vault/policies/new'}>{t('llm_new_policy')}</LinkPrimary>
      </div>
      <>
        {policies && policies?.length > 0 ? (
          <Table
            cols={[
              t('bui-shared-product'),
              t('llm_pii_policy'),
              t('language'),
              t('created_at'),
              t('updated_at'),
              t('bui-shared-actions'),
            ]}
            body={policies.map((policy) => {
              return {
                id: policy.product,
                cells: [
                  {
                    wrap: true,
                    text: policy.product,
                  },
                  {
                    wrap: true,
                    text: policy.piiPolicy,
                  },
                  {
                    wrap: true,
                    text: getLanguageName(policy.language),
                  },
                  {
                    wrap: true,
                    text: new Date(policy.createdAt).toLocaleString(),
                  },
                  {
                    wrap: true,
                    text: new Date(policy.updatedAt).toLocaleString(),
                  },
                  {
                    actions: [
                      {
                        text: t('bui-shared-edit'),
                        onClick: () => {
                          router.push(`/admin/llm-vault/policies/edit/${policy.product}`);
                        },
                        icon: <Pencil className='h-5 w-5' />,
                      },
                      {
                        text: t('bui-shared-delete'),
                        onClick: () => {
                          setDelModalVisible(true);
                          setProductToDelete(policy.product);
                        },
                        icon: <Trash2 className='h-5 w-5' />,
                      },
                    ],
                  },
                ],
              };
            })}></Table>
        ) : (
          <EmptyState title={t('llm_no_policies')} description={t('llm_no_policies_desc')} />
        )}
        <ConfirmationModal
          title={t('llm_delete_policy_title')}
          description={t('llm_delete_policy_desc')}
          visible={delModalVisible}
          onConfirm={() => deleteApp()}
          onCancel={() => setDelModalVisible(false)}
        />
      </>
    </div>
  );
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default Policies;

import type { NextPage } from 'next';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import { PencilIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { Table, LinkPrimary, ConfirmationModal, EmptyState } from '@boxyhq/internal-ui';
import { useEffect, useState } from 'react';
import router from 'next/router';
import { successToast } from '@components/Toaster';

export type policy = {
  createdAt: string;
  updatedAt: string;
  product: string;
  piiPolicy: string;
  piiEntities: string;
  language: string;
};
const Policies: NextPage = () => {
  const [policies, setPolicies] = useState<Array<policy>>([]);
  const [delModalVisible, setDelModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState('');

  const { t } = useTranslation('common');

  useEffect(() => {
    getPolicies();
  }, []);

  const getPolicies = async () => {
    const policiesResp = await fetch(`/api/admin/llm-vault/policies`);
    const policiesList = (await policiesResp.json())?.data;
    setPolicies(policiesList);
  };

  const deleteApp = async () => {
    try {
      const response = await fetch(`/api/admin/llm-vault/policies/${productToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        successToast(t('policy_deletion_success_toast'));
      }
      if (!response.ok) throw new Error('Failed to delete piiPolicy');
      setDelModalVisible(false);
      setProductToDelete('');
      getPolicies();
    } catch (error: any) {
      console.log(error);
    }
  };

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('policies')}</h2>
        <LinkPrimary href={'/admin/llm-vault/policies/new'}>{t('new_policy')}</LinkPrimary>
      </div>
      <>
        {policies?.length > 0 ? (
          <Table
            cols={[
              t('bui-shared-product'),
              t('bui-chat-pii-policy'),
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
                    text: policy.language,
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
                        icon: <PencilIcon className='h-5 w-5' />,
                      },
                      {
                        text: t('bui-shared-delete'),
                        onClick: () => {
                          setDelModalVisible(true);
                          setProductToDelete(policy.product);
                        },
                        icon: <TrashIcon className='h-5 w-5' />,
                      },
                    ],
                  },
                ],
              };
            })}></Table>
        ) : (
          <EmptyState title={t('bui-llm-no-policies')} description={t('bui-llm-no-policies-desc')} />
        )}
        <ConfirmationModal
          title={t('bui-fs-delete-policy-title')}
          description={t('bui-fs-delete-policy-desc')}
          visible={delModalVisible}
          onConfirm={() => deleteApp()}
          onCancel={() => setDelModalVisible(false)}
        />
      </>
    </div>
  );
};

export default Policies;

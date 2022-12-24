import { ClipboardDocumentIcon, PlusIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import EmptyState from '@components/EmptyState';
import { useTranslation } from 'next-i18next';
import ConfirmationModal from '@components/ConfirmationModal';
import { useState, useEffect } from 'react';
import { successToast } from '@components/Toaster';
import { copyToClipboard, fetcher } from '@lib/ui/utils';
import useSWR from 'swr';
import { deleteLink, regenerateLink } from '@components/connection/utils';
import { LinkPrimary } from '@components/LinkPrimary';
import { Pagination, pageLimit } from '@components/Pagination';
import { IconButton } from '@components/IconButton';

const LinkList = ({ service }) => {
  const { t } = useTranslation('common');
  const [queryParam, setQueryParam] = useState('');
  const [paginate, setPaginate] = useState({ offset: 0 });

  useEffect(() => {
    setQueryParam(`?service=${service}`);
  }, [service]);

  const { data, mutate } = useSWR(queryParam ? [`/api/admin/setup-links`, queryParam] : [], fetcher, {
    revalidateOnFocus: false,
  });

  const links = data?.data;
  const [showDelConfirmModal, setShowDelConfirmModal] = useState(false);
  const [showRegenConfirmModal, setShowRegenConfirmModal] = useState(false);
  const toggleDelConfirmModal = () => setShowDelConfirmModal(!showDelConfirmModal);
  const toggleRegenConfirmModal = () => setShowRegenConfirmModal(!showRegenConfirmModal);
  const [actionId, setActionId] = useState(0);
  const invokeRegenerate = async () => {
    await regenerateLink(links[actionId], service);
    toggleRegenConfirmModal();
    await mutate();
    successToast(t('link_regenerated'));
  };
  const invokeDelete = async () => {
    await deleteLink(links[actionId].setupID);
    toggleDelConfirmModal();
    await mutate();
    successToast(t('deleted'));
  };

  if (!links) {
    return null;
  }
  return (
    <div>
      <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>
        {t('setup_links') + ' (' + (service === 'sso' ? t('enterprise_sso') : t('directory_sync')) + ')'}
      </h2>

      <div className='mb-5 flex items-center justify-between'>
        <h3>{service === 'sso' ? t('setup_link_sso_description') : t('setup_link_dsync_description')}</h3>
        <div>
          <LinkPrimary
            Icon={PlusIcon}
            href={`/admin/${
              service === 'sso' ? 'sso-connection' : service === 'dsync' ? 'directory-sync' : ''
            }/setup-link/new`}
            data-test-id='create-setup-link'>
            {t('new_setup_link')}
          </LinkPrimary>
        </div>
      </div>
      {links.length === 0 ? (
        <EmptyState
          title={t('no_setup_links_found')}
          href={`/admin/${
            service === 'sso' ? 'sso-connection' : service === 'dsync' ? 'directory-sync' : ''
          }/setup-link/new`}
        />
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr>
                  <th scope='col' className='px-6 py-3'>
                    {t('tenant')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('product')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('validity')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {links.map((link, idx) => {
                  return (
                    <tr
                      key={link.setupID}
                      className='border-b bg-white last:border-b-0 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900 dark:text-white'>
                        {link.tenant}
                      </td>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        {link.product}
                      </td>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        <p className={new Date(link.validTill) < new Date() ? `text-red-400` : ``}>
                          {new Date(link.validTill).toString()}
                        </p>
                      </td>
                      <td className='px-6 py-3'>
                        <span className='inline-flex items-baseline'>
                          <IconButton
                            tooltip={t('copy')}
                            Icon={ClipboardDocumentIcon}
                            className='mr-3 hover:text-green-200'
                            onClick={() => {
                              copyToClipboard(link.url);
                              successToast(t('copied'));
                            }}
                          />
                          <IconButton
                            tooltip={t('regenerate')}
                            Icon={ArrowPathIcon}
                            className='mr-3 hover:text-green-200'
                            onClick={() => {
                              setActionId(idx);
                              toggleRegenConfirmModal();
                            }}
                          />
                          <IconButton
                            tooltip={t('delete')}
                            Icon={TrashIcon}
                            className='mr-3 hover:text-red-900'
                            onClick={() => {
                              setActionId(idx);
                              toggleDelConfirmModal();
                            }}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            itemsCount={links.length}
            offset={paginate.offset}
            onPrevClick={() => {
              setPaginate({
                offset: paginate.offset - pageLimit,
              });
            }}
            onNextClick={() => {
              setPaginate({
                offset: paginate.offset + pageLimit,
              });
            }}
          />
        </>
      )}
      <ConfirmationModal
        title='Regenerate this setup link?'
        description='This action cannot be undone. This will permanently delete the old setup link.'
        visible={showRegenConfirmModal}
        onConfirm={invokeRegenerate}
        actionButtonText={t('regenerate')}
        onCancel={toggleRegenConfirmModal}></ConfirmationModal>
      <ConfirmationModal
        title='Delete this setup link?'
        description='This action cannot be undone. This will permanently delete the setup link.'
        visible={showDelConfirmModal}
        onConfirm={invokeDelete}
        onCancel={toggleDelConfirmModal}></ConfirmationModal>
    </div>
  );
};

export default LinkList;

import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@components/EmptyState';
import { useTranslation } from 'next-i18next';
import ConfirmationModal from '@components/ConfirmationModal';
import { useState, useEffect } from 'react';
import { successToast } from '@components/Toast';
import { copyToClipboard, fetcher } from '@lib/ui/utils';
import useSWR from 'swr';
import { deleteLink, regenerateLink } from '@components/connection/utils';

const LinkList = ({ service }) => {
  const [queryParam, setQueryParam] = useState('');
  useEffect(() => {
    setQueryParam(`?service=${service}`);
  }, [service]);
  const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });
  const { data, mutate } = useSWR<any>(queryParam ? [`/api/admin/setup-links`, queryParam] : [], fetcher, {
    revalidateOnFocus: false,
  });
  const links = data?.data;
  const { t } = useTranslation('common');
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
          <Link
            href={`/admin/${
              service === 'sso' ? 'sso-connection' : service === 'dsync' ? 'directory-sync' : ''
            }/setup-link/new`}
            className='btn-primary btn m-2'
            data-test-id='create-setup-link'>
            <PlusIcon className='mr-1 h-5 w-5' /> {t('new_setup_link')}
          </Link>
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
                          <div className='tooltip' data-tip={t('copy')}>
                            <ClipboardDocumentIcon
                              className='mr-3 h-5 w-5 cursor-pointer text-secondary hover:text-green-200'
                              onClick={() => {
                                copyToClipboard(link.url);
                                successToast(t('copied'));
                              }}
                            />
                          </div>
                          <div className='tooltip' data-tip={t('regenerate')}>
                            <ArrowPathIcon
                              className='mr-3 h-5 w-5 cursor-pointer text-secondary hover:text-green-200'
                              onClick={() => {
                                setActionId(idx);
                                toggleRegenConfirmModal();
                              }}
                            />
                          </div>
                          <div className='tooltip' data-tip={t('delete')}>
                            <TrashIcon
                              className='h-5 w-5 cursor-pointer text-secondary hover:text-red-900'
                              onClick={() => {
                                setActionId(idx);
                                toggleDelConfirmModal();
                              }}
                            />
                          </div>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className='mt-4 flex justify-center'>
            <button
              type='button'
              className='btn-outline btn'
              disabled={paginate.page === 0}
              aria-label={t('previous')}
              onClick={() =>
                setPaginate((curState) => ({
                  ...curState,
                  pageOffset: (curState.page - 1) * paginate.pageLimit,
                  page: curState.page - 1,
                }))
              }>
              <ArrowLeftIcon className='mr-1 h-5 w-5' aria-hidden />
              {t('prev')}
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button
              type='button'
              className='btn-outline btn'
              disabled={links.length === 0 || links.length < paginate.pageLimit}
              onClick={() =>
                setPaginate((curState) => ({
                  ...curState,
                  pageOffset: (curState.page + 1) * paginate.pageLimit,
                  page: curState.page + 1,
                }))
              }>
              <ArrowRightIcon className='mr-1 h-5 w-5' aria-hidden />
              {t('next')}
            </button>
          </div>
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

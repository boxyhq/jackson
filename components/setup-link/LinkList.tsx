import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@components/EmptyState';
import { useTranslation } from 'next-i18next';
import ConfirmationModal from '@components/ConfirmationModal';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { fetcher } from '@lib/ui/utils';
import useSWR from 'swr';
import { deleteLink, regenerateLink } from '@components/connection/utils';

const LinkList = ({ service }) => {
  const [queryParam] = useState(`?service=${service}`);
  const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });
  const { data: setupLinks, mutate } = useSWR<any>([`/api/admin/setup-links`, queryParam], fetcher, {
    revalidateOnFocus: false,
  });
  const links = setupLinks?.data;
  const { t } = useTranslation('common');
  const [showDelConfirmModal, setShowDelConfirmModal] = useState(false);
  const [showRegenConfirmModal, setShowRegenConfirmModal] = useState(false);
  const toggleDelConfirmModal = () => setShowDelConfirmModal(!showDelConfirmModal);
  const toggleRegenConfirmModal = () => setShowRegenConfirmModal(!showRegenConfirmModal);
  const [actionId, setActionId] = useState(0);
  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
  };
  const invokeRegenerate = async () => {
    await regenerateLink(links[actionId], service);
    toggleRegenConfirmModal();
    await mutate();
    toast.success('Regenerated!');
  };
  const invokeDelete = async () => {
    await deleteLink(links[actionId].setupID, service);
    toggleDelConfirmModal();
    await mutate();
    toast.success('Deleted!');
  };

  if (!links) {
    return null;
  }
  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('setup_links')}</h2>
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
                          <ClipboardDocumentListIcon
                            className='mr-3 h-5 w-5 text-secondary hover:text-green-200'
                            onClick={() => {
                              copyUrl(link.url);
                              toast.success('Copied!');
                            }}
                          />
                          <ArrowPathIcon
                            className='mr-3 h-5 w-5 text-secondary hover:text-green-200'
                            onClick={() => {
                              setActionId(idx);
                              toggleRegenConfirmModal();
                            }}
                          />
                          <TrashIcon
                            className='h-5 w-5 text-secondary hover:text-green-200'
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
        actionButtonText={'Regenerate'}
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

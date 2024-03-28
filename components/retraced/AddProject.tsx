import { useState } from 'react';
import classNames from 'classnames';
import { useRouter } from 'next/router';
import { successToast, errorToast } from '@components/Toaster';
import { LinkBack } from '@boxyhq/internal-ui';
import { useTranslation } from 'next-i18next';

const AddProject = () => {
  const router = useRouter();
  const { t } = useTranslation('common');

  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState({
    name: '',
  });

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setProject({
      ...project,
      [target.id]: target.value,
    });
  };

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const response = await fetch('/api/admin/retraced/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    setLoading(false);

    if (!response.ok) {
      errorToast('ERROR');
      return;
    }

    const { data, error } = await response.json();

    if (error) {
      errorToast('ERROR');
      return;
    }

    if (data && data.project) {
      successToast(t('retraced_project_created'));
      router.replace(`/admin/retraced/projects/${data.project.id}`);
    }
  };

  return (
    <>
      <LinkBack href='/admin/retraced/projects' />
      <div className='mt-5'>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>
          {t('create_project')}
        </h2>
        <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 md:w-3/4 md:max-w-lg'>
          <form onSubmit={createProject}>
            <div className='flex flex-col space-y-3'>
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text'>{t('project_name')}</span>
                </label>
                <input
                  type='text'
                  id='name'
                  className='input-bordered input w-full'
                  required
                  onChange={onChange}
                />
              </div>
              <div>
                <button className={classNames('btn-primary btn', loading ? 'loading' : '')}>
                  {t('create_project')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddProject;

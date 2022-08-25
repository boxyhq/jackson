import Link from 'next/link';
import { useState } from 'react';
import classNames from 'classnames';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

import type { ApiResponse, Project } from 'types';

const AddProject = () => {
  const router = useRouter();

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

    const response = await fetch('/api/retraced/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    setLoading(false);

    if (!response.ok) {
      toast.error('ERROR');
      return;
    }

    const { data, error } = (await response.json()) as ApiResponse<{ project: Project }>;

    if (error) {
      toast.error('ERROR');
      return;
    }

    if (data && data.project) {
      toast.success('Project created successfully.');
      router.replace(`/admin/retraced/projects/${data.project.id}`);
    }
  };

  return (
    <>
      <Link href='/admin/retraced/projects'>
        <a className='btn btn-outline items-center space-x-2'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4' />
          <span>Back</span>
        </a>
      </Link>
      <div>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 dark:text-white md:text-xl'>Create Project</h2>
        <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 md:w-3/4 md:max-w-lg'>
          <form onSubmit={createProject}>
            <div className='flex flex-col space-y-3'>
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text'>Project name</span>
                </label>
                <input
                  type='text'
                  id='name'
                  className='input input-bordered w-full'
                  required
                  onChange={onChange}
                />
              </div>
              <div>
                <button className={classNames('btn btn-primary', loading ? 'loading' : '')}>
                  Create Project
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

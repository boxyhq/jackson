import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import type { Project } from 'types';
import env from '@lib/env';
import CodeSnippet from '@components/retraced/CodeSnippet';

const ProjectDetails = (props: { project: Project }) => {
  const { project } = props;
  const { environments, tokens } = project;

  const baseUrl = `${env.retraced.host}/publisher/v1/project/${project.id}`;

  return (
    <>
      <div className='grid grid-cols-1 gap-3 border p-3 md:grid-cols-2'>
        <div className='form-control w-full'>
          <label className='label pl-0 font-semibold'>
            <span className='label-text'>Project ID</span>
            <ClipboardButton text={project.id} />
          </label>
          <input type='text' className='input input-bordered w-full' defaultValue={project.id} />
        </div>
        <div className='form-control w-full'>
          <label className='label pl-0 font-semibold'>
            <span className='label-text'>Publisher API Base URL</span>
            <ClipboardButton text={baseUrl} />
          </label>
          <input type='text' className='input input-bordered w-full' defaultValue={baseUrl} />
        </div>
        <div className='form-control w-full'>
          <label className='label pl-0 font-semibold'>
            <span className='label-text'>{environments[0].name} Token</span>
            <ClipboardButton text={tokens[0].token} />
          </label>
          <input type='text' className='input input-bordered w-full' defaultValue={tokens[0].token} />
        </div>
        <div className='form-control w-full'>
          <label className='label pl-0 font-semibold'>
            <span className='label-text'>{environments[1].name} Token</span>
            <ClipboardButton text={tokens[1].token} />
          </label>
          <input type='text' className='input input-bordered w-full' defaultValue={tokens[1].token} />
        </div>
      </div>
      <div className='mt-5 border p-3'>
        <CodeSnippet token={project.tokens[1].token} baseUrl={baseUrl} />
      </div>
    </>
  );
};

const ClipboardButton = ({ text }: { text: string }) => {
  const showCopied = () => {
    toast.success('Copied to clipboard.');
  };

  return (
    <CopyToClipboard text={text} onCopy={showCopied}>
      <ClipboardIcon className='h-5 w-5 cursor-pointer text-secondary' />
    </CopyToClipboard>
  );
};

export default ProjectDetails;

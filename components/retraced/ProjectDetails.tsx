import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ClipboardCopyIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';

import type { Project } from 'types';

const ProjectDetails = (props: { project: Project }) => {
  const { project } = props;
  const { environments, tokens } = project;

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2'>
        <div className='space-y-3 border p-3'>
          <div className='flex items-center'>
            <div className='form-control w-full'>
              <label className='label pl-0 font-semibold'>
                <span className='label-text'>Project ID</span>
                <ClipboardButton text={project.id} />
              </label>
              <input type='text' className='input input-bordered w-full' defaultValue={project.id} />
            </div>
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
      <ClipboardCopyIcon className='h-5 w-5 cursor-pointer text-secondary' />
    </CopyToClipboard>
  );
};

export default ProjectDetails;

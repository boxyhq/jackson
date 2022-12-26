import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { successToast } from '@components/Toaster';
import { copyToClipboard } from '@lib/ui/utils';

import type { Project } from 'types/retraced';
import { retracedOptions } from '@lib/env';
import CodeSnippet from '@components/retraced/CodeSnippet';
import { IconButton } from '@components/IconButton';
import { useState } from 'react';
import { Select } from 'react-daisyui';

const ProjectDetails = (props: { project: Project }) => {
  const { project } = props;
  const { environments, tokens } = project;

  const [selectedIndex, setSelectedIndex] = useState(0);

  const baseUrl = `${retracedOptions?.host}/publisher/v1/project/${project.id}`;

  return (
    <>
      <div className='form-control mb-5 max-w-xs'>
        <label className='label pl-0'>
          <span className='label-text'>Environment</span>
        </label>
        <Select
          value={selectedIndex}
          onChange={(idx) => {
            setSelectedIndex(idx);
          }}>
          {environments.map((env, i) => (
            <option key={env.id} value={i}>
              {env.name}
            </option>
          ))}
        </Select>
      </div>

      <div className='grid grid-cols-1 gap-3 border p-3 md:grid-cols-2'>
        <div className='form-control w-full'>
          <label className='label pl-0 font-semibold'>
            <span className='label-text'>Project ID</span>
            <ClipboardButton text={project.id} />
          </label>
          <input type='text' className='input-bordered input w-full' value={project.id} readOnly />
        </div>
        <div className='form-control w-full'>
          <label className='label pl-0 font-semibold'>
            <span className='label-text'>Publisher API Base URL</span>
            <ClipboardButton text={baseUrl} />
          </label>
          <input type='text' className='input-bordered input w-full' value={baseUrl} readOnly />
        </div>
        <div className='form-control w-full'>
          <label className='label pl-0 font-semibold'>
            <span className='label-text'>{environments[selectedIndex].name} Token</span>
            <ClipboardButton text={tokens[selectedIndex].token} />
          </label>
          <input
            type='text'
            className='input-bordered input w-full'
            value={tokens[selectedIndex].token}
            readOnly
          />
        </div>
      </div>
      <div className='mt-5 border p-3'>
        <CodeSnippet token={tokens[selectedIndex].token} baseUrl={baseUrl} />
      </div>
    </>
  );
};

const ClipboardButton = ({ text }: { text: string }) => {
  return (
    <IconButton
      tooltip='Copy'
      Icon={ClipboardDocumentIcon}
      className='hover:text-green-400'
      onClick={() => {
        copyToClipboard(text);
        successToast('Copied');
      }}
    />
  );
};

export default ProjectDetails;

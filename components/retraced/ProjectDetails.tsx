import type { Project } from 'types/retraced';
import CodeSnippet from '@components/retraced/CodeSnippet';
import { useState } from 'react';
import { Select } from 'react-daisyui';
import { InputWithCopyButton } from '@boxyhq/internal-ui';
import { useTranslation } from 'next-i18next';

const ProjectDetails = (props: { project: Project; host?: string }) => {
  const { t } = useTranslation('common');

  const { project, host } = props;
  const { environments, tokens } = project;

  const [selectedIndex, setSelectedIndex] = useState(0);

  const baseUrl = `${host!}/publisher/v1/project/${project.id}`;

  return (
    <>
      <div className='form-control mb-5 max-w-xs'>
        <label className='label pl-0'>
          <span className='label-text'>{t('environment')}</span>
        </label>
        <Select
          value={selectedIndex}
          onChange={(event) => {
            setSelectedIndex(Number(event.target.value));
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
          <InputWithCopyButton text={project.id} label={t('project_id')} />
        </div>
        <div className='form-control w-full'>
          <InputWithCopyButton text={baseUrl} label={t('publisher_api_base_url')} />
        </div>
        <div className='form-control w-full'>
          <InputWithCopyButton
            text={tokens[selectedIndex].token}
            label={environments[selectedIndex].name + ' Token'}
          />
        </div>
      </div>
      <div className='mt-5 border p-3'>
        <CodeSnippet token={tokens[selectedIndex].token} baseUrl={baseUrl} />
      </div>
    </>
  );
};

export default ProjectDetails;

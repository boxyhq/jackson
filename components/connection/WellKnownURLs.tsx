import ArrowTopRightOnSquareIcon from '@heroicons/react/20/solid/ArrowTopRightOnSquareIcon';
import { useTranslation } from 'next-i18next';
import { LinkOutline } from '@components/LinkOutline';
import { useState } from 'react';

const WellKnownURLs = () => {
  const { t } = useTranslation('common');

  const viewText = t('view');
  const downloadText = t('download');

  const [view, setView] = useState<'idp-config' | 'auth' | 'saml-fed'>('idp-config');

  const links = [
    {
      title: t('sp_metadata'),
      description: t('sp_metadata_description'),
      href: '/.well-known/sp-metadata',
      buttonText: viewText,
      type: 'idp-config',
    },
    {
      title: t('saml_configuration'),
      description: t('sp_config_description'),
      href: '/.well-known/saml-configuration',
      buttonText: viewText,
      type: 'idp-config',
    },
    {
      title: t('saml_public_cert'),
      description: t('saml_public_cert_description'),
      href: '/.well-known/saml.cer',
      buttonText: downloadText,
      type: 'idp-config',
    },
    {
      title: t('oidc_configuration'),
      description: t('oidc_config_description'),
      href: '/.well-known/oidc-configuration',
      buttonText: viewText,
      type: 'idp-config',
    },
    {
      title: t('oidc_discovery'),
      description: t('oidc_discovery_description'),
      href: '/.well-known/openid-configuration',
      buttonText: viewText,
      type: 'auth',
    },
    {
      title: t('idp_metadata'),
      description: t('idp_metadata_description'),
      href: '/.well-known/idp-metadata',
      buttonText: viewText,
      type: 'saml-fed',
    },
    {
      title: t('idp_configuration'),
      description: t('idp_config_description'),
      href: '/.well-known/idp-configuration',
      buttonText: viewText,
      type: 'saml-fed',
    },
  ];

  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>
          {t('here_are_the_set_of_uris_you_would_need_access_to')}:
        </h2>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Tab
          isActive={view === 'idp-config'}
          setIsActive={() => setView('idp-config')}
          title={'title_idp_configuration'}
          description={'description_idp_configuration'}
          label={'label_idp_configuration'}
        />
        <Tab
          isActive={view === 'auth'}
          setIsActive={() => setView('auth')}
          title={t('title_auth_integration')}
          description={t('description_auth_integration')}
          label={t('label_auth_integration')}
        />
        <Tab
          isActive={view === 'saml-fed'}
          setIsActive={() => setView('saml-fed')}
          title={t('title_saml_fed_configuration')}
          description={t('description_saml_fed_configuration')}
          label={t('label_saml_fed_configuration')}
        />
      </div>
      <div className='space-y-3 mt-8'>
        {links
          .filter((link) => link.type === view)
          .map((link) => (
            <LinkCard
              key={link.href}
              title={link.title}
              description={link.description}
              href={link.href}
              buttonText={link.buttonText}
            />
          ))}
      </div>
    </>
  );
};

const Tab = ({ isActive, setIsActive, title, description, label }) => {
  return (
    <button
      type='button'
      className={`w-full text-left rounded-lg focus:outline-none focus:ring focus:ring-teal-200 border hover:border-teal-800 p-6${
        isActive ? ' bg-teal-50 opacity-100' : ' opacity-50'
      }`}
      onClick={setIsActive}
      aria-label={label}>
      <span className='flex flex-col items-end'>
        <span className='font-semibold'>{title}</span>
        <span>{description}</span>
      </span>
    </button>
  );
};

const LinkCard = ({
  title,
  description,
  href,
  buttonText,
}: {
  title: string;
  description: string;
  href: string;
  buttonText: string;
}) => {
  return (
    <div className='space-y-2 rounded-md border p-4 hover:border-gray-400'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <h3 className='font-bold'>{title}</h3>
          <p className='text-[15px]'>{description}</p>
        </div>
        <div className='mx-4'>
          <LinkOutline
            className='btn btn-secondary btn-sm w-32'
            href={href}
            target='_blank'
            rel='noreferrer'
            Icon={ArrowTopRightOnSquareIcon}>
            {buttonText}
          </LinkOutline>
        </div>
      </div>
    </div>
  );
};

export default WellKnownURLs;

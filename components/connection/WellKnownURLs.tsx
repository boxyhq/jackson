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
      title: 'SP Metadata',
      description: t('sp_metadata_description'),
      href: '/.well-known/sp-metadata',
      buttonText: viewText,
      type: 'idp-config',
    },
    {
      title: 'SAML Configuration',
      description: t('sp_config_description'),
      href: '/.well-known/saml-configuration',
      buttonText: viewText,
      type: 'idp-config',
    },
    {
      title: 'SAML Public Certificate',
      description: t('saml_public_cert_description'),
      href: '/.well-known/saml.cer',
      buttonText: downloadText,
      type: 'idp-config',
    },
    {
      title: 'OpenID Configuration',
      description: t('oidc_config_description'),
      href: '/.well-known/openid-configuration',
      buttonText: viewText,
      type: 'auth',
    },
    {
      title: 'IdP Metadata',
      description: t('idp_metadata_description'),
      href: '/.well-known/idp-metadata',
      buttonText: viewText,
      type: 'saml-fed',
    },
    {
      title: 'IdP Configuration',
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
          title='Identity Provider Configuration'
          description='Links for SAML/OIDC IdP setup'
          label='Identity Provider Configuration links'
        />
        <Tab
          isActive={view === 'auth'}
          setIsActive={() => setView('auth')}
          title='Auth integration'
          description='Links for OAuth 2.0/OpenID Connect auth'
          label='Auth integration links'
        />
        <Tab
          isActive={view === 'saml-fed'}
          setIsActive={() => setView('saml-fed')}
          title='SAML Federation'
          description='Links for SAML Federation app setup'
          label='SAML Federation links'
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
            className='w-32'
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

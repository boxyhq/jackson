import ArrowTopRightOnSquareIcon from '@heroicons/react/20/solid/ArrowTopRightOnSquareIcon';
import { useTranslation } from 'next-i18next';
import { LinkOutline } from '@components/LinkOutline';
import { useState } from 'react';

const WellKnownURLs = () => {
  const { t } = useTranslation('common');

  const viewText = t('view');
  const downloadText = t('download');

  const [view, setView] = useState<'auth' | 'idp-config'>('auth');

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
      type: 'auth',
    },
    {
      title: 'IdP Configuration',
      description: t('idp_config_description'),
      href: '/.well-known/idp-configuration',
      buttonText: viewText,
      type: 'auth',
    },
  ];

  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>
          {t('here_are_the_set_of_uris_you_would_need_access_to')}:
        </h2>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
        <div
          className='w-full text-left rounded-lg border hover:border-gray-400 p-6 cursor-pointer'
          onClick={() => setView('auth')}>
          <p>Auth integration</p>
        </div>
        <div
          className='w-full text-left rounded-lg border hover:border-gray-400 p-6 cursor-pointer'
          onClick={() => setView('idp-config')}>
          Identity Provider Configuration
        </div>
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

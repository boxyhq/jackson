import { ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const links = [
  {
    title: 'SP Metadata',
    description:
      'The metadata file that your customers who use federated management systems like OpenAthens and Shibboleth will need to configure your service.',
    href: '/.well-known/sp-metadata',
  },
  {
    title: 'SAML Configuration',
    description:
      'The configuration setup guide that your customers will need to refer to when setting up SAML application with their Identity Provider.',
    href: '/.well-known/saml-configuration',
  },
  {
    title: 'SAML Public Certificate',
    description: 'The SAML Public Certificate if you want to enable encryption with your Identity Provider.',
    href: '/.well-known/saml.cer',
  },
  {
    title: 'OpenID Configuration',
    description:
      'Our OpenID configuration URI which your customers will need if they are connecting via OAuth 2.0 or Open ID Connect.',
    href: '/.well-known/openid-configuration',
  },
];

const WellKnownURLs = ({ className }: { className?: string }) => {
  const { t } = useTranslation('common');
  return (
    <div className={className}>
      <p>{t('here_are_the_set_of_uris_you_would_need_access_to')}:</p>
      <br />
      <ul className='flex flex-col space-y-1'>
        {links.map((link) => {
          return (
            <li key={link.href} className='text-sm'>
              <p>{link.description}</p>
              <Link href={link.href} target='_blank' rel='noreferrer'>
                <div className='link flex'>
                  <ArrowRightOnRectangleIcon className='mr-1 h-5 w-5' /> {link.title}
                </div>
              </Link>
              <br />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WellKnownURLs;

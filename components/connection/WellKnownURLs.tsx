import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const links = [
  {
    title: 'SP Metadata',
    description:
      'The metadata file that your customers who use federated management systems like OpenAthens and Shibboleth will need to configure your service.',
    href: '/.well-known/sp-metadata',
    buttonText: 'View',
  },
  {
    title: 'SAML Configuration',
    description:
      'The configuration setup guide that your customers will need to refer to when setting up SAML application with their Identity Provider.',
    href: '/.well-known/saml-configuration',
    buttonText: 'View',
  },
  {
    title: 'OpenID Configuration',
    description:
      'Our OpenID configuration URI which your customers will need if they are connecting via OAuth 2.0 or Open ID Connect.',
    href: '/.well-known/openid-configuration',
    buttonText: 'View',
  },
  {
    title: 'IdP Metadata',
    description:
      'The metadata file that your customers who use our SAML federation feature will need to set up SAML SP configuration on their application.',
    href: '/.well-known/idp-metadata',
    buttonText: 'View',
  },
  {
    title: 'IdP Configuration',
    description:
      'The configuration setup guide that your customers who use our SAML federation feature will need to set up SAML SP configuration on their application.',
    href: '/.well-known/idp-configuration',
    buttonText: 'View',
  },
  {
    title: 'SAML Public Certificate',
    description: 'The SAML Public Certificate if you want to enable encryption with your Identity Provider.',
    href: '/.well-known/saml.cer',
    buttonText: 'Download',
  },
];

type LinkCardProps = {
  title: string;
  description: string;
  href: string;
  buttonText: string;
};

const WellKnownURLs = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>
          {t('here_are_the_set_of_uris_you_would_need_access_to')}:
        </h2>
      </div>
      <div className='space-y-3'>
        {links.map((link) => (
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

const LinkCard = ({ title, description, href, buttonText }: LinkCardProps) => {
  return (
    <div className='space-y-2 rounded-md border p-4 hover:border-gray-400'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <h3 className='font-bold'>{title}</h3>
          <p className='text-[15px]'>{description}</p>
        </div>
        <div className='mx-4'>
          <Link href={href} target='_blank' rel='noreferrer' className='btn-outline btn-xs btn w-32'>
            <ArrowTopRightOnSquareIcon className='mr-1 h-5 w-5' />
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WellKnownURLs;

import { ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const links = [
  {
    title: 'SP Metadata',
    description:
      'The metadata file that your customers who use federated management systems like OpenAthens and Shibboleth will need to configure your service.',
    href: '/.well-known/sp-metadata',
    buttonText: 'Download',
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
  {
    title: 'IdP Metadata',
    description:
      'The metadata file that your customers who use our SAML federation feature will need to set up SAML SP configuration on their application.',
    href: '/.well-known/idp-metadata',
  },
  {
    title: 'IdP Configuration',
    description:
      'The configuration setup guide that your customers who use our SAML federation feature will need to set up SAML SP configuration on their application.',
    href: '/.well-known/idp-configuration',
  },
];

const WellKnownURLs = ({ className }: { className?: string }) => {
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
          <LinkCard key={link.href} title={link.title} description={link.description} href={link.href} />
        ))}
      </div>
    </>
  );

  // return (
  //   <div className={className}>
  //     <p>{t('here_are_the_set_of_uris_you_would_need_access_to')}:</p>
  //     <br />
  //     <ul className='flex flex-col space-y-1'>
  //       {links.map((link) => {
  //         return (
  //           <li key={link.href} className='text-sm'>
  //             <p>{link.description}</p>
  //             <Link href={link.href} target='_blank' rel='noreferrer'>
  //               <div className='link flex'>
  //                 <ArrowRightOnRectangleIcon className='mr-1 h-5 w-5' /> {link.title}
  //               </div>
  //             </Link>
  //             <br />
  //           </li>
  //         );
  //       })}
  //     </ul>
  //   </div>
  // );
};

const LinkCard = ({ title, description, href }: { title: string; description: string; href: string }) => {
  return (
    <div className='space-y-1 rounded-md border p-4'>
      <div className='flex justify-between'>
        <div>
          <h3 className='font-bold'>{title}</h3>
          <p className='text-[15px]'>{description}</p>
        </div>
        <div className='items-center'>
          <Link href={href} target='_blank' rel='noreferrer' className='btn-outline btn-sm btn'>
            Download
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WellKnownURLs;

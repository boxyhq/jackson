import { ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid';

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
    title: 'OpenID Configuration',
    description:
      'Our OpenID configuration URI which your customers will need if they are connecting via OAuth 2.0 or Open ID Connect.',
    href: '/.well-known/openid-configuration',
  },
];

const WellKnownURLs = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      <p>Here are the set of URIs you would need access to:</p>
      <br />
      <ul className='flex flex-col space-y-1'>
        {links.map((link) => {
          return (
            <li key={link.href} className='text-sm'>
              <p>{link.description}</p>
              <a href={link.href} target='_blank' rel='noreferrer'>
                <div className='link flex'>
                  <ArrowRightOnRectangleIcon className='mr-1 h-5 w-5' /> {link.title}
                </div>
              </a>
              <br />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WellKnownURLs;

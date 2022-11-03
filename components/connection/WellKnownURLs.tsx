import { ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid';

const links = [
  {
    title: 'SP Metadata',
    href: '/.well-known/sp-metadata',
  },
  {
    title: 'SAML Configuration',
    href: '/.well-known/saml-configuration',
  },
  {
    title: 'OpenID Configuration',
    href: '/.well-known/openid-configuration',
  },
];

const WellKnownURLs = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      <ul className='flex flex-col space-y-1'>
        {links.map((link) => {
          return (
            <li key={link.href} className='link text-sm'>
              <a href={link.href} target='_blank' rel='noreferrer'>
                <div className='flex'>
                  <ArrowRightOnRectangleIcon className='mr-1 h-5 w-5' /> {link.title}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WellKnownURLs;

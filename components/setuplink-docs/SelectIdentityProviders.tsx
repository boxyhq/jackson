import { useRouter } from 'next/router';

const identityProviders = [
  {
    name: 'Auth0',
    id: 'auth0',
  },
  {
    name: 'Azure',
    id: 'azure',
  },
  {
    name: 'Generic SAML 2.0',
    id: 'generic-saml',
  },
  {
    name: 'Google',
    id: 'google',
  },
  {
    name: 'JumpCloud',
    id: 'jumpcloud',
  },
  {
    name: 'Microsoft AD FS',
    id: 'microsoft-adfs',
  },
  {
    name: 'Okta',
    id: 'okta',
  },
  {
    name: 'OneLogin',
    id: 'onelogin',
  },
  {
    name: 'OpenID Connect',
    id: 'openid-connect',
  },
  {
    name: 'PingOne',
    id: 'pingone',
  },
  {
    name: 'Rippling',
    id: 'rippling',
  },
];

const SelectIdentityProviders = () => {
  const router = useRouter();

  const onClick = (id: string) => {
    const params = new URLSearchParams({
      idp: id,
      step: '1',
    });

    router.push(router.asPath + '?' + params.toString());
  };

  return (
    <>
      <h1 className='text-xl font-medium antialiased mb-4'>Choose your identity provider</h1>
      <div className='grid gap-4 grid-cols-2 w-full'>
        {identityProviders.map((provider) => (
          <button
            key={provider.id}
            className='text-left border p-4 rounded hover:border-gray-400 font-bold'
            onClick={() => onClick(provider.id)}>
            {provider.name}
          </button>
        ))}
      </div>
    </>
  );
};

export default SelectIdentityProviders;

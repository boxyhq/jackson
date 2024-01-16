import { useRouter } from 'next/router';

import { CreateSAMLConnection as CreateSAML, CreateOIDCConnection as CreateOIDC } from '@boxyhq/react-ui/sso';
import styles from 'styles/sdk-override.module.css';
import { errorToast } from '@components/Toaster';

interface CreateSSOConnectionProps {
  setupLinkToken: string;
  idpType: 'saml' | 'oidc';
}

const CreateSSOConnection = ({ setupLinkToken, idpType }: CreateSSOConnectionProps) => {
  const router = useRouter();

  const onSuccess = () => {
    router.push({
      pathname: '/setup/[token]/sso-connection',
      query: { token: setupLinkToken },
    });
  };

  const onError = (message: string) => {
    errorToast(message);
  };

  const urls = {
    post: `/api/setup/${setupLinkToken}/sso-connection`,
  };

  const _CSS = {
    input: `${styles['sdk-input']} input input-bordered`,
    button: { ctoa: 'btn btn-primary' },
    textarea: styles['sdk-input'],
  };

  return idpType === 'saml' ? (
    <CreateSAML
      variant='basic'
      urls={urls}
      successCallback={onSuccess}
      errorCallback={onError}
      classNames={_CSS}
      displayHeader={false}
    />
  ) : (
    <CreateOIDC
      variant='basic'
      urls={urls}
      successCallback={onSuccess}
      errorCallback={onError}
      classNames={_CSS}
      displayHeader={false}
    />
  );
};

export default CreateSSOConnection;

import { useRouter } from 'next/router';

import { ButtonOutline } from '@components/ButtonOutline';

const PreviousButton = () => {
  const router = useRouter();

  const onClick = () => {
    const { idp, step, token } = router.query as { idp: string; step: string; token: string };

    router.push({
      pathname: router.pathname,
      query: {
        idp,
        step: parseInt(step) - 1,
        token,
      },
    });
  };

  return (
    <div>
      <ButtonOutline onClick={onClick}>Previous Step</ButtonOutline>
    </div>
  );
};

export default PreviousButton;

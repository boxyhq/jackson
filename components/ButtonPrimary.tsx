import { Button } from 'react-daisyui';

export const ButtonPrimary = ({ children, ...others }) => {
  return (
    <Button className='m-2' color='primary' {...others}>
      {children}
    </Button>
  );
};

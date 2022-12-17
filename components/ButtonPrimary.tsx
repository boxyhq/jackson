import { Button } from 'react-daisyui';

export const ButtonPrimary = ({ children, onClick = () => {}, ...others }) => {
  return (
    <Button className='m-2' color='primary' onClick={onClick} {...others}>
      {children}
    </Button>
  );
};

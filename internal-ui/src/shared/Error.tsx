import { Card } from 'react-daisyui';

export const Error = ({ message }: { message: string }) => {
  return (
    <Card className='border-red-400'>
      <Card.Body>
        <p className='leading-none'>{message}</p>
      </Card.Body>
    </Card>
  );
};

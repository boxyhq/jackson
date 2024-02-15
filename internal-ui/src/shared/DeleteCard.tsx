import { Card, Button } from 'react-daisyui';

export const DeleteCard = ({
  title,
  description,
  buttonLabel,
}: {
  title: string;
  description: string;
  buttonLabel: string;
}) => {
  return (
    <Card className='border-red-400'>
      <Card.Body>
        <div className='flex flex-col gap-3'>
          <h6 className='text-xl font-medium leading-none tracking-tight'>{title}</h6>
          <p className='text-gray-600 dark:text-gray-400 text-sm'>{description}</p>
          <div>
            <Button color='warning' className='btn btn-md btn-error text-white'>
              {buttonLabel}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

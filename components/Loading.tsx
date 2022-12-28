import { ButtonPrimary } from './ButtonPrimary';

const Loading = () => {
  return (
    <div className='flex items-center justify-center'>
      <ButtonPrimary className='btn-xl' color='ghost' loading={true}></ButtonPrimary>
    </div>
  );
};

export default Loading;

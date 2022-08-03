import React from 'react';

const Modal = (props: {
  visible: boolean;
  title: string;
  description: string;
  children?: React.ReactNode;
  // customFooter?: React.ReactNode;
}) => {
  const { visible, title, description, children } = props;

  const [open, setOpen] = React.useState(visible ? visible : false);

  React.useEffect(() => {
    setOpen(visible);
  }, [visible]);

  return (
    <div className={`modal ${open ? 'modal-open' : ''}`}>
      <div className='modal-box'>
        <h3 className='text-lg font-bold'>{title}</h3>
        <p className='py-4'>{description}</p>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;

{
  /* <div className='modal-action'>
<button className='btn btn-outline'>Cancel</button>
<button className='btn btn-error'>Delete</button>
</div> */
}

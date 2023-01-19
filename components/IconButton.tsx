import classNames from 'classnames';

export const IconButton = ({ Icon, tooltip, onClick, className, ...other }) => {
  return (
    <div className='tooltip' data-tip={tooltip}>
      <Icon
        className={classNames('hover:scale-115 h-5 w-5 cursor-pointer text-secondary', className)}
        onClick={onClick}
        {...other}
      />
    </div>
  );
};

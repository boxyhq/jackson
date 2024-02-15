import classNames from 'classnames';
import { BadgeProps, Badge as BaseBadge } from 'react-daisyui';

export const Badge = ({ children, className, ...props }: BadgeProps) => {
  return (
    <>
      <BaseBadge {...props} className={classNames('rounded text-xs py-2 text-white', className)}>
        {children}
      </BaseBadge>
    </>
  );
};

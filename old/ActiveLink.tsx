import { useRouter } from 'next/router';
import Link from 'next/link';
import { Children, cloneElement, ReactElement } from 'react';

const ActiveLink = ({
  children,
  activeClassName,
  href,
  ...props
}: {
  children: ReactElement<HTMLAnchorElement>;
  activeClassName: string;
  href: string;
} & Record<string, any>) => {
  const { asPath } = useRouter();
  const child = Children.only(children);
  const childClassName = child.props.className || '';

  // pages/index.js will be matched via props.href
  // pages/about.js will be matched via props.href
  // pages/[slug].js will be matched via props.as
  const className =
    asPath === href || asPath === props.as ? `${childClassName} ${activeClassName}`.trim() : childClassName;

  return (
    <Link href={href} {...props}>
      {cloneElement(child as ReactElement, {
        className: className || null,
      })}
    </Link>
  );
};

export default ActiveLink;

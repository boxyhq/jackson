import { Typography } from '@supabase/ui';
import Link from 'next/link';

const EmptyState = ({ title, href }: { title: string, href?: string }) => {
  return (
    <div className="w-3/4 flex space-y-3 flex-col items-center justify-center border py-40 rounded">
      <Typography.Title level={4} className="text-center">{title}</Typography.Title>
      { href &&  <Link href={href}>
        <a className="btn-primary">
          + Create New
        </a>
      </Link>}
    </div>
  )
}

export default EmptyState;
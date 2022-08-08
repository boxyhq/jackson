import { NextPage } from 'next';
import ViewToken from '@components/retraced/ViewToken';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';

const InfoProject: NextPage = () => {
  const router = useRouter();
  const id = router.query.id;
  const projectInfo = useSWR([`/api/retraced/projectInfo/${id}`], fetcher, {
    revalidateOnFocus: false,
  });

  if (!projectInfo.data) {
    return null;
  }

  if (projectInfo.error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
        Something went wrong!
      </div>
    );
  }

  return <ViewToken project={projectInfo.data.project} />;
};

export default InfoProject;

import { ConnectionNotifications } from '@components/notification-center/connection-notifications';
import { ExpiredCertificates } from '@components/notification-center/expired-certificates';
import jackson from '@lib/jackson';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@boxyhq/internal-ui';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function NotificationCenter() {
  return (
    <div className='container py-10'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>{'Notification Center'}</h1>
        <p className='text-muted-foreground mt-2'>
          {
            'Manage connection-specific notification preferences and view connections with expired certificates.'
          }
        </p>
      </div>

      <Tabs defaultValue='expired' className='w-full'>
        <TabsList className='mb-4'>
          <TabsTrigger value='expired'>{'Expired Certificates'}</TabsTrigger>
          <TabsTrigger value='settings'>{'Notification Settings'}</TabsTrigger>
        </TabsList>
        <TabsContent value='expired'>
          <ExpiredCertificates />
        </TabsContent>
        <TabsContent value='settings'>
          <ConnectionNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  const { checkLicense } = await jackson();

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      hasValidLicense: await checkLicense(),
    },
  };
}

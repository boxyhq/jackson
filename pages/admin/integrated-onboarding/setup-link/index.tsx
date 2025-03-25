import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@boxyhq/internal-ui/src/shared/react/card';
import { Checkbox } from '@boxyhq/internal-ui/src/shared/react/checkbox';
import { Label } from '@boxyhq/internal-ui/src/shared/react/label';
import { Button } from 'internal-ui/src/shared/react/button';
import { Input } from 'internal-ui/src/shared/react/input';

export default function NewSetupLinkPage() {
  return (
    <div className='container mx-auto py-8'>
      <div className='flex items-center mb-6'>
        <Link href='/onboarding' className='text-primary mr-4'>
          {'← Back to Setup Links'}
        </Link>
        <h1 className='text-3xl font-bold'>{'Create New Setup Link'}</h1>
      </div>

      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle>{'New Setup Link'}</CardTitle>
          <CardDescription>
            {'Create a new setup link for your customers to configure their integration.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='name'>{'Link Name'}</Label>
            <Input id='name' placeholder='e.g., Acme Corp Setup' />
          </div>

          <div className='space-y-2'>
            <Label>{'Services'}</Label>
            <p className='text-sm text-muted-foreground mb-2'>
              {'Select which services to include in this setup link'}
            </p>

            <div className='space-y-3'>
              <div className='flex items-start space-x-3'>
                <Checkbox id='sso' />
                <div>
                  <Label htmlFor='sso' className='font-medium'>
                    {'Enterprise SSO'}
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    {'Allow customers to configure Single Sign-On'}
                  </p>
                </div>
              </div>

              <div className='flex items-start space-x-3'>
                <Checkbox id='dsync' />
                <div>
                  <Label htmlFor='dsync' className='font-medium'>
                    {'Directory Sync'}
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    {'Allow customers to configure Directory Synchronization'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='tenant'>{'Tenant ID (Optional)'}</Label>
            <Input id='tenant' placeholder='tenant-123' />
            <p className='text-xs text-muted-foreground'>
              {'If provided, this setup link will be associated with the specified tenant'}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='expiry'>{'Expiry (Optional)'}</Label>
            <Input id='expiry' type='date' />
            <p className='text-xs text-muted-foreground'>
              {'If set, this setup link will expire on the specified date'}
            </p>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end space-x-2'>
          <Button variant='outline' asChild>
            <Link href='/onboarding'>{'Cancel'}</Link>
          </Button>
          <Button>{'Create Setup Link'}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return { props: { ...(locale ? await serverSideTranslations(locale, ['common']) : {}) } };
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Trash, RefreshCw, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@boxyhq/internal-ui/src/shared/react/dialog';
import { toast } from '@boxyhq/internal-ui/src/hooks/use-toast';
import { Checkbox } from '@boxyhq/internal-ui/src/shared/react/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@boxyhq/internal-ui/src/shared/react/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@boxyhq/internal-ui/src/shared/react/card';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'react-i18next';
import { Label } from '@boxyhq/internal-ui/src/shared/react/label';
import { Button } from '@boxyhq/internal-ui/src/shared/react/button';

interface SetupLink {
  id: string;
  url: string;
  service: 'sso' | 'dsync' | 'integrated';
  name: string;
  createdAt: string;
}

export default function OnboardingClient() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [setupLinks, setSetupLinks] = useState<SetupLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ssoSelected, setSsoSelected] = useState(false);
  const [dsyncSelected, setDsyncSelected] = useState(false);

  useEffect(() => {
    // Fetch setup links
    fetchSetupLinks();
  }, []);

  const fetchSetupLinks = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would be an API call
      // For demo purposes, we'll use mock data
      const mockLinks: SetupLink[] = [
        {
          id: '1',
          url: 'https://example.com/setup/sso/abc123',
          service: 'sso',
          name: 'Enterprise SSO Setup',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          url: 'https://example.com/setup/dsync/def456',
          service: 'dsync',
          name: 'Directory Sync Setup',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          url: 'https://example.com/setup/integrated/ghi789',
          service: 'integrated',
          name: 'Integrated Setup',
          createdAt: new Date().toISOString(),
        },
      ];

      setSetupLinks(mockLinks);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch setup links',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSetupLink = async () => {
    try {
      // Determine which type of link to create based on selections
      let service: 'sso' | 'dsync' | 'integrated';

      if (ssoSelected && dsyncSelected) {
        service = 'integrated';
      } else if (ssoSelected) {
        service = 'sso';
      } else if (dsyncSelected) {
        service = 'dsync';
      } else {
        toast({
          title: 'Error',
          description: 'Please select at least one option',
          variant: 'destructive',
        });
        return;
      }

      // In a real implementation, this would be an API call
      // For demo purposes, we'll create a mock link
      const newLink: SetupLink = {
        id: Math.random().toString(36).substring(7),
        url: `https://example.com/setup/${service}/${Math.random().toString(36).substring(7)}`,
        service,
        name:
          service === 'integrated'
            ? 'Integrated Setup'
            : service === 'sso'
              ? 'Enterprise SSO Setup'
              : 'Directory Sync Setup',
        createdAt: new Date().toISOString(),
      };

      setSetupLinks([...setupLinks, newLink]);

      toast({
        title: 'Success',
        description: 'Setup link created successfully',
      });

      setIsDialogOpen(false);
      setSsoSelected(false);
      setDsyncSelected(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create setup link',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Success',
      description: 'Setup link copied to clipboard',
    });
  };

  const deleteLink = (id: string) => {
    try {
      // In a real implementation, this would be an API call
      setSetupLinks(setupLinks.filter((link) => link.id !== id));

      toast({
        title: 'Success',
        description: 'Setup link deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete setup link',
        variant: 'destructive',
      });
    }
  };

  const regenerateLink = (id: string) => {
    try {
      // In a real implementation, this would be an API call
      const updatedLinks = setupLinks.map((link) => {
        if (link.id === id) {
          return {
            ...link,
            url: `https://example.com/setup/${link.service}/${Math.random().toString(36).substring(7)}`,
          };
        }
        return link;
      });

      setSetupLinks(updatedLinks);

      toast({
        title: 'Success',
        description: 'Setup link regenerated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to regenerate setup link: ${error}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>{t('setup_links')}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              {t('bui-sl-create-link')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('bui-sl-new-link')}</DialogTitle>
              <DialogDescription>{t('bui-shared-select-services')}</DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='sso'
                  checked={ssoSelected}
                  onCheckedChange={(checked) => setSsoSelected(checked === true)}
                />
                <Label htmlFor='sso'>{t('enterprise_sso')}</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='dsync'
                  checked={dsyncSelected}
                  onCheckedChange={(checked) => setDsyncSelected(checked === true)}
                />
                <Label htmlFor='dsync'>{t('directory_sync')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={createSetupLink}>{t('bui-sl-create-link')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue='all'>
        <TabsList>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='sso'>Enterprise SSO</TabsTrigger>
          <TabsTrigger value='dsync'>Directory Sync</TabsTrigger>
          <TabsTrigger value='integrated'>Integrated</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className='flex justify-center items-center h-40'>
            <p>Loading setup links...</p>
          </div>
        ) : (
          <>
            <TabsContent value='all' className='space-y-4 mt-4'>
              {setupLinks.length === 0 ? (
                <p className='text-center text-muted-foreground py-8'>{t('bui-sl-no-links-desc')}</p>
              ) : (
                setupLinks.map((link) => (
                  <SetupLinkCard
                    key={link.id}
                    link={link}
                    onCopy={copyToClipboard}
                    onDelete={deleteLink}
                    onRegenerate={regenerateLink}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value='sso' className='space-y-4 mt-4'>
              {setupLinks.filter((link) => link.service === 'sso').length === 0 ? (
                <p className='text-center text-muted-foreground py-8'>No Enterprise SSO setup links found</p>
              ) : (
                setupLinks
                  .filter((link) => link.service === 'sso')
                  .map((link) => (
                    <SetupLinkCard
                      key={link.id}
                      link={link}
                      onCopy={copyToClipboard}
                      onDelete={deleteLink}
                      onRegenerate={regenerateLink}
                    />
                  ))
              )}
            </TabsContent>

            <TabsContent value='dsync' className='space-y-4 mt-4'>
              {setupLinks.filter((link) => link.service === 'dsync').length === 0 ? (
                <p className='text-center text-muted-foreground py-8'>No Directory Sync setup links found</p>
              ) : (
                setupLinks
                  .filter((link) => link.service === 'dsync')
                  .map((link) => (
                    <SetupLinkCard
                      key={link.id}
                      link={link}
                      onCopy={copyToClipboard}
                      onDelete={deleteLink}
                      onRegenerate={regenerateLink}
                    />
                  ))
              )}
            </TabsContent>

            <TabsContent value='integrated' className='space-y-4 mt-4'>
              {setupLinks.filter((link) => link.service === 'integrated').length === 0 ? (
                <p className='text-center text-muted-foreground py-8'>No Integrated setup links found</p>
              ) : (
                setupLinks
                  .filter((link) => link.service === 'integrated')
                  .map((link) => (
                    <SetupLinkCard
                      key={link.id}
                      link={link}
                      onCopy={copyToClipboard}
                      onDelete={deleteLink}
                      onRegenerate={regenerateLink}
                    />
                  ))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

interface SetupLinkCardProps {
  link: SetupLink;
  onCopy: (url: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
}

function SetupLinkCard({ link, onCopy, onDelete, onRegenerate }: SetupLinkCardProps) {
  const serviceLabel =
    link.service === 'sso'
      ? 'Enterprise SSO'
      : link.service === 'dsync'
        ? 'Directory Sync'
        : 'Integrated (SSO + Directory Sync)';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{link.name}</CardTitle>
        <CardDescription>
          <span className='inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mr-2'>
            {serviceLabel}
          </span>
          Created on {formatDate(link.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='bg-muted p-3 rounded-md overflow-x-auto'>
          <code className='text-sm'>{link.url}</code>
        </div>
      </CardContent>
      <CardFooter className='flex justify-end space-x-2'>
        <Button variant='outline' size='sm' onClick={() => onCopy(link.url)}>
          <Copy className='h-4 w-4 mr-2' />
          Copy
        </Button>
        <Button variant='outline' size='sm' onClick={() => onRegenerate(link.id)}>
          <RefreshCw className='h-4 w-4 mr-2' />
          Regenerate
        </Button>
        <Button variant='outline' size='sm' onClick={() => onDelete(link.id)}>
          <Trash className='h-4 w-4 mr-2' />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return { props: { ...(locale ? await serverSideTranslations(locale, ['common']) : {}) } };
}

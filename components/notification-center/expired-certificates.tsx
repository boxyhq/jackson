'use client';

import { useEffect, useState } from 'react';
import {
  CustomCard as Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CustomBadge as Badge,
  CustomButton as Button,
} from '@boxyhq/internal-ui';
import { AlertTriangle, RefreshCw, ExternalLink, Building, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NotificationAdapter from './actions';

type Certificate = {
  thumbprint: string;
  tenant: string;
  product: string;
  clientId: string;
  validTo: string;
};

export function ExpiredCertificates() {
  const [expiredCerts, setExpiredCerts] = useState<Certificate[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useTranslation('common');

  const getExpiredCerts = async () => {
    const notificationAdpater = NotificationAdapter();
    const expiredCerts = await notificationAdpater.getExpiredCertificates();
    setExpiredCerts(expiredCerts);
  };

  useEffect(() => {
    // getExpiredCerts();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Group certificates by tenant
  const certsByTenant = expiredCerts.reduce(
    (acc, cert) => {
      if (!acc[cert.tenant]) {
        acc[cert.tenant] = [];
      }
      acc[cert.tenant].push(cert);
      return acc;
    },
    {} as Record<string, Certificate[]>
  );

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>{t('Connections with Expired Certificates')}</h2>
        <Button variant='outline' size='sm' onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('Refresh')}
        </Button>
      </div>

      {expiredCerts.length === 0 ? (
        <Card>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <div className='rounded-full bg-primary/10 p-3 mb-4'>
                <AlertTriangle className='h-6 w-6 text-primary' />
              </div>
              <h3 className='text-lg font-medium'>{t('No expired certificates')}</h3>
              <p className='text-sm text-muted-foreground mt-1'>
                {t('All your connections have valid certificates.')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-8'>
          {Object.entries(certsByTenant).map(([tenant, certs]) => (
            <div key={tenant} className='space-y-3'>
              <h3 className='text-sm font-medium text-muted-foreground flex items-center'>
                <Building className='h-4 w-4 mr-1.5' />
                {tenant}
              </h3>

              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {certs.map((cert) => (
                  <Card key={`${cert.clientId}`} className='border-destructive/20'>
                    <CardHeader className='pb-2'>
                      <div className='flex justify-between items-start'>
                        <CardTitle className='text-base'>{cert.tenant}</CardTitle>
                        <Badge variant='destructive'>{t('Expired')}</Badge>
                      </div>
                      <CardDescription>{cert.product}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        <div className='flex items-center text-sm text-muted-foreground mb-2'>
                          <Package className='h-3.5 w-3.5 mr-1.5' />
                          {cert.product}
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span className='text-muted-foreground'>{'Expired on:'}</span>
                          <span>{cert.validTo}</span>
                        </div>
                        {/* <div className='flex justify-between text-sm'>
                          <span className='text-muted-foreground'>{'Days expired:'}</span>
                          <span className='font-medium text-destructive'>
                            {cert.daysExpired} {'days'}
                          </span>
                        </div> */}
                        <Button variant='outline' size='sm' className='w-full mt-4'>
                          <ExternalLink className='mr-2 h-4 w-4' />
                          {'View Connection'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

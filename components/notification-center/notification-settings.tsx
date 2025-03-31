'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  CustomButton as Button,
  CustomCard as Card,
  CardContent,
  CardHeader,
  CustomAlert as Alert,
  AlertTitle,
  AlertDescription,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Switch,
  CardFooter,
  CardDescription,
  CardTitle,
} from '@boxyhq/internal-ui';
import { Mail, Webhook, AlertTriangle } from 'lucide-react';
import { toast } from 'internal-ui/src/hooks';

// Form schema for email notifications
const emailFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  enableExpiry: z.boolean().default(true),
  enableRenewal: z.boolean().default(true),
  enableWeekly: z.boolean().default(false),
});

// Form schema for webhook notifications
const webhookFormSchema = z.object({
  webhookUrl: z.string().url({ message: 'Please enter a valid webhook URL' }),
  secret: z.string().min(1, { message: 'Secret key is required' }),
  enableExpiry: z.boolean().default(true),
  enableRenewal: z.boolean().default(true),
});

// Mock data for connection notification settings
const MOCK_CONNECTION_SETTINGS: Record<
  string,
  {
    email?: {
      email: string;
      enableExpiry: boolean;
      enableRenewal: boolean;
      enableWeekly: boolean;
    };
    webhook?: {
      webhookUrl: string;
      secret: string;
      enableExpiry: boolean;
      enableRenewal: boolean;
    };
  }
> = {
  'conn-1': {
    email: {
      email: 'admin@acmecorp.com',
      enableExpiry: true,
      enableRenewal: true,
      enableWeekly: false,
    },
    webhook: {
      webhookUrl: 'https://hooks.acmecorp.com/certificates',
      secret: 'secret-key-123',
      enableExpiry: true,
      enableRenewal: false,
    },
  },
  'conn-3': {
    email: {
      email: 'alerts@globexinc.com',
      enableExpiry: true,
      enableRenewal: false,
      enableWeekly: false,
    },
  },
  'conn-5': {
    webhook: {
      webhookUrl: 'https://initech.com/api/webhooks/certs',
      secret: 'initech-webhook-key',
      enableExpiry: true,
      enableRenewal: true,
    },
  },
};

interface NotificationSettingsProps {
  connectionId: string;
}

export function NotificationSettings({ connectionId }: NotificationSettingsProps) {
  const [activeTab, setActiveTab] = useState('email');
  const connectionSettings = MOCK_CONNECTION_SETTINGS[connectionId] || {};

  // Email form
  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: connectionSettings.email || {
      email: '',
      enableExpiry: true,
      enableRenewal: true,
      enableWeekly: false,
    },
  });

  // Webhook form
  const webhookForm = useForm<z.infer<typeof webhookFormSchema>>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: connectionSettings.webhook || {
      webhookUrl: '',
      secret: '',
      enableExpiry: true,
      enableRenewal: true,
    },
  });

  function onEmailSubmit(data: z.infer<typeof emailFormSchema>) {
    // In a real app, this would save to the server with the connectionId
    console.log(`Email notification settings for connection ${connectionId}:`, data);
    toast({
      title: 'Email notification settings updated',
      description: 'Your connection-specific email notification preferences have been saved.',
    });
  }

  function onWebhookSubmit(data: z.infer<typeof webhookFormSchema>) {
    // In a real app, this would save to the server with the connectionId
    console.log(`Webhook notification settings for connection ${connectionId}:`, data);
    toast({
      title: 'Webhook notification settings updated',
      description: 'Your connection-specific webhook notification preferences have been saved.',
    });
  }

  return (
    <div className='space-y-6'>
      <Alert>
        <AlertTriangle className='h-4 w-4' />
        <AlertTitle>{'Connection-specific notifications'}</AlertTitle>
        <AlertDescription>
          {
            'These notification settings apply only to this specific connection and override any global settings.'
          }
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='email' className='flex items-center'>
            <Mail className='mr-2 h-4 w-4' />
            {'Email'}
          </TabsTrigger>
          <TabsTrigger value='webhook' className='flex items-center'>
            <Webhook className='mr-2 h-4 w-4' />
            {'Webhook'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='email'>
          <Card>
            <CardHeader>
              <CardTitle>{'Email Notifications'}</CardTitle>
              <CardDescription>
                {"Configure email notifications for this connection's certificate events."}
              </CardDescription>
            </CardHeader>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
                <CardContent className='space-y-4'>
                  <FormField
                    control={emailForm.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{'Email Address'}</FormLabel>
                        <FormControl>
                          <Input placeholder='your@email.com' {...field} />
                        </FormControl>
                        <FormDescription>
                          {"We'll send notifications for this connection to this email address."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='space-y-4 pt-2'>
                    <h4 className='font-medium'>{'Notification Types'}</h4>

                    <FormField
                      control={emailForm.control}
                      name='enableExpiry'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className='space-y-0.5'>
                            <FormLabel>{'Certificate Expiry'}</FormLabel>
                            <FormDescription>
                              {'Get notified when this connections certificate is about to expire.'}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name='enableRenewal'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className='space-y-0.5'>
                            <FormLabel>{'Certificate Renewal'}</FormLabel>
                            <FormDescription>
                              {"Get notified when this connection's certificate is renewed."}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name='enableWeekly'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className='space-y-0.5'>
                            <FormLabel>{'Weekly Summary'}</FormLabel>
                            <FormDescription>
                              {"Receive a weekly summary of this connection's certificate status."}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type='submit'>{'Save Email Settings'}</Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value='webhook'>
          <Card>
            <CardHeader>
              <CardTitle>{'Webhook Notifications'}</CardTitle>
              <CardDescription>
                {'Configure webhook notifications for this connections certificate events.'}
              </CardDescription>
            </CardHeader>
            <Form {...webhookForm}>
              <form onSubmit={webhookForm.handleSubmit(onWebhookSubmit)}>
                <CardContent className='space-y-4'>
                  <FormField
                    control={webhookForm.control}
                    name='webhookUrl'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{'Webhook URL'}</FormLabel>
                        <FormControl>
                          <Input placeholder='https://your-server.com/webhook' {...field} />
                        </FormControl>
                        <FormDescription>
                          {"The URL where we'll send webhook notifications for this connection."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={webhookForm.control}
                    name='secret'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{'Secret Key'}</FormLabel>
                        <FormControl>
                          <Input placeholder='your-secret-key' type='password' {...field} />
                        </FormControl>
                        <FormDescription>
                          {'Used to verify webhook requests are coming from us.'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='space-y-4 pt-2'>
                    <h4 className='font-medium'>{'Notification Types'}</h4>

                    <FormField
                      control={webhookForm.control}
                      name='enableExpiry'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className='space-y-0.5'>
                            <FormLabel>{'Certificate Expiry'}</FormLabel>
                            <FormDescription>
                              {"Send webhook when this connection's certificate is about to expire."}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={webhookForm.control}
                      name='enableRenewal'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className='space-y-0.5'>
                            <FormLabel>{'Certificate Renewal'}</FormLabel>
                            <FormDescription>
                              {"Send webhook when this connection's certificate is renewed."}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type='submit'>{'Save Webhook Settings'}</Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

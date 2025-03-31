'use client';

import { useState } from 'react';
import {
  CustomBadge as Badge,
  Input,
  CustomButton as Button,
  CustomCard as Card,
  CardContent,
} from '@boxyhq/internal-ui';
import { Search, Building, Package, ChevronRight } from 'lucide-react';
import { NotificationSettings } from './notification-settings';

// Define types for our data
type Connection = {
  id: string;
  name: string;
  domain: string;
  tenant: string;
  product: string;
  hasNotifications: boolean;
};

export function ConnectionNotifications() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

  // Filter connections based on search query
  const filteredConnections = connections.filter(
    (conn) =>
      conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group connections by tenant
  const connectionsByTenant = filteredConnections.reduce(
    (acc, conn) => {
      if (!acc[conn.tenant]) {
        acc[conn.tenant] = [];
      }
      acc[conn.tenant].push(conn);
      return acc;
    },
    {} as Record<string, Connection[]>
  );

  // Handle selecting a connection
  const handleSelectConnection = (connection: Connection) => {
    setSelectedConnection(connection);
  };

  // Handle going back to connection list
  const handleBackToList = () => {
    setSelectedConnection(null);
  };

  if (selectedConnection) {
    return (
      <div className='space-y-6'>
        <Button variant='ghost' onClick={handleBackToList} className='mb-4 -ml-2'>
          {'← Back to connections'}
        </Button>

        <div className='flex items-center gap-4 mb-6'>
          <div className='flex-1'>
            <h2 className='text-xl font-semibold'>{selectedConnection.name}</h2>
            <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
              <span>{selectedConnection.domain}</span>
              <span>•</span>
              <span className='flex items-center'>
                <Building className='h-3.5 w-3.5 mr-1' />
                {selectedConnection.tenant}
              </span>
              <span>•</span>
              <span className='flex items-center'>
                <Package className='h-3.5 w-3.5 mr-1' />
                {selectedConnection.product}
              </span>
            </div>
          </div>
        </div>

        <NotificationSettings connectionId={selectedConnection.id} />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>{'Connection Notification Settings'}</h2>
      </div>

      <div className='relative'>
        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search connections by name, domain, tenant or product...'
          className='pl-9'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {Object.keys(connectionsByTenant).length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
            <p className='text-muted-foreground'>{'No connections found matching your search.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {Object.entries(connectionsByTenant).map(([tenant, connections]) => (
            <div key={tenant} className='space-y-3'>
              <h3 className='text-sm font-medium text-muted-foreground flex items-center'>
                <Building className='h-4 w-4 mr-1.5' />
                {tenant}
              </h3>

              <Card>
                {connections.map((connection, index) => (
                  <div key={connection.id}>
                    {index > 0 && <div className='mx-6 border-t' />}
                    <CardContent className='p-4 sm:p-6'>
                      <button
                        className='w-full flex items-center justify-between py-2 text-left'
                        onClick={() => handleSelectConnection(connection)}>
                        <div className='flex-1'>
                          <div className='flex items-center'>
                            <h4 className='font-medium'>{connection.name}</h4>
                            {connection.hasNotifications && (
                              <Badge variant='outline' className='ml-2 bg-primary/10 text-primary text-xs'>
                                {'Notifications Active'}
                              </Badge>
                            )}
                          </div>
                          <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                            <span>{connection.domain}</span>
                            <span>•</span>
                            <span className='flex items-center'>
                              <Package className='h-3.5 w-3.5 mr-1' />
                              {connection.product}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className='h-5 w-5 text-muted-foreground' />
                      </button>
                    </CardContent>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

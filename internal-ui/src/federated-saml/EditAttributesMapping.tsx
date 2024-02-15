import { Button } from 'react-daisyui';
import { useTranslation } from 'next-i18next';
import { SAMLFederationApp } from '@boxyhq/saml-jackson';
import { useFormik } from 'formik';
import { defaultHeaders } from '../utils/request';
import { Card } from '../shared';
import { AttributesMapping } from './AttributesMapping';

type Mappings = Pick<SAMLFederationApp, 'mappings'>;

export const EditAttributesMapping = ({
  app,
  urls,
  onSuccess,
  onError,
}: {
  app: Mappings;
  urls: { patch: string };
  onSuccess?: (data: SAMLFederationApp) => void;
  onError?: (error: Error) => void;
}) => {
  const { t } = useTranslation('common');

  const formik = useFormik<Mappings>({
    initialValues: {
      mappings: app.mappings || [],
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      const rawResponse = await fetch(urls.patch, {
        method: 'PATCH',
        body: JSON.stringify(values),
        headers: defaultHeaders,
      });

      const response = await rawResponse.json();

      if (rawResponse.ok) {
        onSuccess?.(response.data);
      } else {
        onError?.(response.error);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} method='POST'>
      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('bui-fs-attribute-mappings')}</Card.Title>
            <Card.Description>{t('bui-fs-attribute-mappings-desc')}</Card.Description>
          </Card.Header>
          <AttributesMapping
            mappings={formik.values.mappings || []}
            onAttributeMappingsChange={(newAttributeMappings) => {
              formik.setFieldValue('mappings', newAttributeMappings);
            }}
          />
        </Card.Body>
        <Card.Footer>
          <Button
            type='submit'
            className='btn btn-primary btn-md'
            loading={formik.isSubmitting}
            disabled={!formik.dirty || !formik.isValid}>
            {t('bui-fs-save-changes')}
          </Button>
        </Card.Footer>
      </Card>
    </form>
  );
};

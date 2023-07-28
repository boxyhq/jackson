import { ButtonLink } from '@components/ButtonLink';
import { Dispatch, FormEvent, SetStateAction, useMemo } from 'react';
import { EditViewOnlyFields, getCommonFields } from './fieldCatalog';
import { CopyToClipboardButton } from '@components/ClipboardButton';

export const saveConnection = async ({
  formObj,
  isEditView,
  connectionIsSAML,
  connectionIsOIDC,
  setupLinkToken,
  callback,
}: {
  formObj: FormObj;
  isEditView?: boolean;
  connectionIsSAML: boolean;
  connectionIsOIDC: boolean;
  setupLinkToken?: string;
  callback: (res: Response) => Promise<void>;
}) => {
  const {
    rawMetadata,
    redirectUrl,
    oidcDiscoveryUrl,
    oidcMetadata,
    oidcClientId,
    oidcClientSecret,
    metadataUrl,
    ...rest
  } = formObj;

  const encodedRawMetadata = btoa((rawMetadata as string) || '');
  const redirectUrlList = (redirectUrl as string)?.split(/\r\n|\r|\n/);

  const res = await fetch(
    setupLinkToken ? `/api/setup/${setupLinkToken}/sso-connection` : '/api/admin/connections',
    {
      method: isEditView ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...rest,
        encodedRawMetadata: connectionIsSAML ? encodedRawMetadata : undefined,
        oidcDiscoveryUrl: connectionIsOIDC ? oidcDiscoveryUrl : undefined,
        oidcMetadata: connectionIsOIDC ? oidcMetadata : undefined,
        oidcClientId: connectionIsOIDC ? oidcClientId : undefined,
        oidcClientSecret: connectionIsOIDC ? oidcClientSecret : undefined,
        redirectUrl: redirectUrl && redirectUrlList ? JSON.stringify(redirectUrlList) : undefined,
        metadataUrl: connectionIsSAML ? metadataUrl : undefined,
      }),
    }
  );
  callback(res);
};

export function fieldCatalogFilterByConnection(connection) {
  return ({ attributes }) =>
    attributes.connection && connection !== null ? attributes.connection === connection : true;
}

/** If a field item has a fallback attribute, only render it if the form state has the field item */
export function excludeFallback(formObj: FormObj) {
  return ({ key, fallback }: FieldCatalogItem) => {
    if (typeof fallback === 'object') {
      if (!(key in formObj)) {
        return false;
      }
    }
    return true;
  };
}

export function getHandleChange(
  setFormObj: Dispatch<SetStateAction<FormObj>>,
  opts: { key?: string; formObjParentKey?: string } = {}
) {
  return (event: FormEvent) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    setFormObj((cur) =>
      opts.formObjParentKey
        ? {
            ...cur,
            [opts.formObjParentKey]: {
              ...(cur[opts.formObjParentKey] as FormObj),
              [target.id]: target[opts.key || 'value'],
            },
          }
        : { ...cur, [target.id]: target[opts.key || 'value'] }
    );
  };
}

type fieldAttributes = {
  required?: boolean;
  maxLength?: number;
  editable?: boolean;
  isArray?: boolean;
  rows?: number;
  accessor?: (any) => unknown;
  formatForDisplay?: (value) => string;
  isHidden?: (value) => boolean;
  showWarning?: (value) => boolean;
  hideInSetupView: boolean;
  connection?: string;
  'data-testid'?: string;
};

export type FieldCatalogItem = {
  key: string;
  label?: string;
  type: 'url' | 'object' | 'pre' | 'text' | 'password' | 'textarea' | 'checkbox';
  placeholder?: string;
  attributes: fieldAttributes;
  members?: FieldCatalogItem[];
  fallback?: {
    key: string;
    activateCondition?: (fieldValue) => boolean;
    switch: { label: string; 'data-testid'?: string };
  };
};

export type AdminPortalSSODefaults = {
  tenant: string;
  product: string;
  redirectUrl: string;
  defaultRedirectUrl: string;
};

type FormObjValues = string | boolean | string[];

export type FormObj = Record<string, FormObjValues | Record<string, FormObjValues>>;

export const useFieldCatalog = ({
  isEditView,
  isSettingsView,
}: {
  isEditView?: boolean;
  isSettingsView?: boolean;
}) => {
  const fieldCatalog = useMemo(() => {
    if (isEditView) {
      return [...getCommonFields({ isEditView: true, isSettingsView }), ...EditViewOnlyFields];
    }
    return [...getCommonFields({ isSettingsView })];
  }, [isEditView, isSettingsView]);
  return fieldCatalog;
};

export function renderFieldList(args: {
  isEditView?: boolean;
  formObj: FormObj;
  setFormObj: Dispatch<SetStateAction<FormObj>>;
  formObjParentKey?: string;
  activateFallback: (activeKey, fallbackKey) => void;
}) {
  const FieldList = ({
    key,
    placeholder,
    label,
    type,
    members,
    attributes: {
      isHidden,
      isArray,
      rows,
      formatForDisplay,
      editable,
      maxLength,
      showWarning,
      required = true,
      'data-testid': dataTestId,
    },
    fallback,
  }: FieldCatalogItem) => {
    const readOnly = editable === false;
    const value =
      readOnly && typeof formatForDisplay === 'function'
        ? formatForDisplay(
            args.formObjParentKey ? args.formObj[args.formObjParentKey]?.[key] : args.formObj[key]
          )
        : args.formObjParentKey
        ? args.formObj[args.formObjParentKey]?.[key]
        : args.formObj[key];

    if (type === 'object') {
      return (
        <div key={key}>
          {typeof fallback === 'object' &&
            (typeof fallback.activateCondition === 'function' ? fallback.activateCondition(value) : true) && (
              <ButtonLink
                className='mb-2 px-0'
                type='button'
                data-testid={fallback.switch['data-testid']}
                onClick={() => {
                  /** Switch to fallback.key*/
                  args.activateFallback(key, fallback.key);
                }}>
                {fallback.switch.label}
              </ButtonLink>
            )}
          {members?.map(
            renderFieldList({
              ...args,
              formObjParentKey: key,
            })
          )}
        </div>
      );
    }

    const isHiddenClassName =
      typeof isHidden === 'function' && isHidden(args.formObj[key]) == true ? ' hidden' : '';

    return (
      <div className='mb-6 ' key={key}>
        {type !== 'checkbox' && (
          <div className='flex items-center justify-between'>
            <label
              htmlFor={key}
              className={
                'mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300' + isHiddenClassName
              }>
              {label}
            </label>
            {readOnly && type === 'password' && <CopyToClipboardButton text={value} />}
            {typeof fallback === 'object' &&
              (typeof fallback.activateCondition === 'function'
                ? fallback.activateCondition(value)
                : true) && (
                <ButtonLink
                  className='mb-2 px-0'
                  type='button'
                  data-testid={fallback.switch['data-testid']}
                  onClick={() => {
                    /** Switch to fallback.key*/
                    args.activateFallback(key, fallback.key);
                  }}>
                  {fallback.switch.label}
                </ButtonLink>
              )}
          </div>
        )}
        {type === 'pre' ? (
          <pre
            className={
              'block w-full overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500' +
              isHiddenClassName +
              (typeof showWarning === 'function' && showWarning(args.formObj[key])
                ? ' border-2 border-rose-500'
                : '')
            }
            data-testid={dataTestId}>
            {value}
          </pre>
        ) : type === 'textarea' ? (
          <textarea
            id={key}
            placeholder={placeholder}
            value={(value as string) || ''}
            required={required}
            readOnly={readOnly}
            maxLength={maxLength}
            onChange={getHandleChange(args.setFormObj, { formObjParentKey: args.formObjParentKey })}
            className={
              'textarea-bordered textarea h-24 w-full' +
              (isArray ? ' whitespace-pre' : '') +
              isHiddenClassName +
              (readOnly ? ' bg-gray-50' : '')
            }
            rows={rows}
            data-testid={dataTestId}
          />
        ) : type === 'checkbox' ? (
          <>
            <label
              htmlFor={key}
              className={
                'inline-block align-middle text-sm font-medium text-gray-900 dark:text-gray-300' +
                isHiddenClassName
              }>
              {label}
            </label>
            <input
              id={key}
              type={type}
              checked={!!value}
              required={required}
              readOnly={readOnly}
              maxLength={maxLength}
              onChange={getHandleChange(args.setFormObj, {
                key: 'checked',
                formObjParentKey: args.formObjParentKey,
              })}
              className={'checkbox-primary checkbox ml-5 align-middle' + isHiddenClassName}
              data-testid={dataTestId}
            />
          </>
        ) : (
          <input
            id={key}
            type={type}
            placeholder={placeholder}
            value={(value as string) || ''}
            required={required}
            readOnly={readOnly}
            maxLength={maxLength}
            onChange={getHandleChange(args.setFormObj, { formObjParentKey: args.formObjParentKey })}
            className={'input-bordered input w-full' + isHiddenClassName + (readOnly ? ' bg-gray-50' : '')}
            data-testid={dataTestId}
          />
        )}
      </div>
    );
  };
  return FieldList;
}

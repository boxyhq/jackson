import {
  IAdminController,
  Storable,
  SAMLSSORecord,
  OIDCSSORecord,
  SSOTracerInstance,
  Records,
  Trace,
} from '../typings';
import { JacksonError } from './error';
import { transformConnections } from './utils';

export class AdminController implements IAdminController {
  private connectionStore: Storable;
  private ssoTracer: SSOTracerInstance;

  constructor({ connectionStore, ssoTracer }) {
    this.connectionStore = connectionStore;
    this.ssoTracer = ssoTracer;
  }

  public async getAllConnection(pageOffset?: number, pageLimit?: number, pageToken?: string) {
    const { data: connectionList, pageToken: nextPageToken } = (await this.connectionStore.getAll(
      pageOffset,
      pageLimit,
      pageToken
    )) as Records<SAMLSSORecord | OIDCSSORecord>;

    if (!connectionList || !connectionList.length) {
      return { data: [] };
    }

    return { data: transformConnections(connectionList), pageToken: nextPageToken };
  }

  public async getAllSSOTraces(pageOffset: number, pageLimit: number, pageToken?: string) {
    const { data: traces, pageToken: nextPageToken } = (await this.ssoTracer.getAllTraces(
      pageOffset,
      pageLimit,
      pageToken
    )) as Records<Trace>;

    if (!traces || !traces.length) {
      return { data: [] };
    }

    return { data: traces, pageToken: nextPageToken };
  }

  public async getSSOTraceById(traceId: string) {
    const trace = await this.ssoTracer.getByTraceId(traceId);

    if (!trace) {
      throw new JacksonError(`Trace with id ${traceId} not found`, 404);
    }

    return trace;
  }

  public async getTracesByProduct(
    product: string,
    pageOffset: number,
    pageLimit: number,
    pageToken?: string
  ) {
    return await this.ssoTracer.getTracesByProduct({ product, pageOffset, pageLimit, pageToken });
  }
}

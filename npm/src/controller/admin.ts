import {
  IAdminController,
  Storable,
  SAMLSSORecord,
  OIDCSSORecord,
  SAMLTracerInstance,
  Records,
  Trace,
} from '../typings';
import { IndexNames, transformConnections } from './utils';

export class AdminController implements IAdminController {
  private connectionStore: Storable;
  private samlTracer: SAMLTracerInstance;

  constructor({ connectionStore, samlTracer }) {
    this.connectionStore = connectionStore;
    this.samlTracer = samlTracer;
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

  public async getAllSAMLTraces(pageOffset: number, pageLimit: number, pageToken?: string) {
    const { data: traces, pageToken: nextPageToken } = (await this.samlTracer.getAllTraces(
      pageOffset,
      pageLimit,
      pageToken
    )) as Records<Trace>;

    if (!traces || !traces.length) {
      return { data: [] };
    }

    return { data: traces, pageToken: nextPageToken };
  }

  public async getSAMLTraceById(traceId: string) {
    const trace = await this.samlTracer.getByTraceId(traceId);

    return trace;
  }

  public async getConnectionsByProduct(
    product: string,
    pageOffset?: number,
    pageLimit?: number,
    pageToken?: string
  ) {
    const connections = await this.connectionStore.getByIndex(
      {
        name: IndexNames.Product,
        value: product,
      },
      pageOffset,
      pageLimit,
      pageToken
    );

    return { data: transformConnections(connections.data), pageToken };
  }
}

import { IAdminController, Storable, SAMLSSORecord, OIDCSSORecord, SAMLTracerInstance } from '../typings';
import { transformConnections } from './utils';

export class AdminController implements IAdminController {
  private connectionStore: Storable;
  private samlTracer: SAMLTracerInstance;

  constructor({ connectionStore, samlTracer }) {
    this.connectionStore = connectionStore;
    this.samlTracer = samlTracer;
  }

  public async getAllConnection(pageOffset?: number, pageLimit?: number) {
    const connectionList = (await this.connectionStore.getAll(pageOffset, pageLimit)) satisfies Array<
      SAMLSSORecord | OIDCSSORecord
    >;

    if (!connectionList || !connectionList.length) {
      return [];
    }

    return transformConnections(connectionList);
  }

  public async getAllSAMLTraces(pageOffset: number, pageLimit: number) {
    const traces = await this.samlTracer.getAllTraces(pageOffset, pageLimit);

    if (!traces || !traces.length) {
      return [];
    }

    return traces;
  }

  public async getSAMLTraceById(traceId: string) {
    const trace = await this.samlTracer.getByTraceId(traceId);

    return trace;
  }
}

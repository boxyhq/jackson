import type {
  DirectorySyncResponse,
  IDirectoryGroups,
  IDirectoryUsers,
  EventCallback,
  DirectorySyncRequest,
} from '../typings';

export class RequestHandler {
  constructor(
    private directoryUsers: IDirectoryUsers,
    private directoryGroups: IDirectoryGroups
  ) {}

  async handle(request: DirectorySyncRequest, callback?: EventCallback): Promise<DirectorySyncResponse> {
    const resourceType = request.resourceType.toLowerCase();

    if (resourceType === 'users') {
      return await this.directoryUsers.handleRequest(request, callback);
    } else if (resourceType === 'groups') {
      return await this.directoryGroups.handleRequest(request, callback);
    }

    return { status: 404, data: {} };
  }
}

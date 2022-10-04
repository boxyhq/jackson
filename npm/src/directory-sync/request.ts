import type {
  DirectorySyncResponse,
  IDirectoryGroups,
  IDirectoryUsers,
  EventCallback,
  DirectorySyncRequest,
} from '../typings';

export class DirectorySyncRequestHandler {
  constructor(private directoryUsers: IDirectoryUsers, private directoryGroups: IDirectoryGroups) {}

  async handle(request: DirectorySyncRequest, callback?: EventCallback): Promise<DirectorySyncResponse> {
    if (request.resourceType === 'users') {
      return await this.directoryUsers.handleRequest(request, callback);
    } else if (request.resourceType === 'groups') {
      return await this.directoryGroups.handleRequest(request, callback);
    }

    return { status: 404, data: {} };
  }
}

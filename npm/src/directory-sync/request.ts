import type {
  DirectorySyncResponse,
  IDirectoryGroups,
  IDirectoryUsers,
  EventCallback,
  DirectorySyncRequest,
} from '../typings';

export class RequestHandler {
  constructor(private directoryUsers: IDirectoryUsers, private directoryGroups: IDirectoryGroups) {}

  async handle(request: DirectorySyncRequest): Promise<DirectorySyncResponse> {
    const resourceType = request.resourceType.toLowerCase();

    if (resourceType === 'users') {
      return await this.directoryUsers.handleRequest(request);
    } else if (resourceType === 'groups') {
      return await this.directoryGroups.handleRequest(request);
    }

    return { status: 404, data: {} };
  }
}

import type {
  DirectorySyncUserRequest,
  DirectorySyncResponse,
  IDirectoryGroups,
  IDirectoryUsers,
  DirectorySyncGroupRequest,
  EventCallback,
} from '../typings';

export class UsersRequestHandler {
  constructor(private directoryUsers: IDirectoryUsers) {}

  async handle(request: DirectorySyncUserRequest, callback?: EventCallback): Promise<DirectorySyncResponse> {
    return await this.directoryUsers.handleRequest(request, callback);
  }
}

export class GroupsRequestHandler {
  constructor(private directoryGroups: IDirectoryGroups) {}

  async handle(request: DirectorySyncGroupRequest, callback?: EventCallback): Promise<DirectorySyncResponse> {
    return await this.directoryGroups.handleRequest(request);
  }
}

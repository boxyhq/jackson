import type {
  DirectorySyncRequest,
  DirectorySyncResponse,
  DirectoryGroups,
  DirectoryUsers,
} from '../typings';

export class UsersRequestHandler {
  private directoryUsers: DirectoryUsers;

  constructor({ directoryUsers }: { directoryUsers: DirectoryUsers }) {
    this.directoryUsers = directoryUsers;
  }

  async handle(request: DirectorySyncRequest): Promise<DirectorySyncResponse> {
    return await this.directoryUsers.handleRequest(request);
  }
}

export class GroupsRequestHandler {
  private directoryGroups: DirectoryGroups;

  constructor({ directoryGroups }: { directoryGroups: DirectoryGroups }) {
    this.directoryGroups = directoryGroups;
  }

  async handle(request: DirectorySyncRequest): Promise<DirectorySyncResponse> {
    return await this.directoryGroups.handleRequest(request);
  }
}

import type {
  DirectorySyncUserRequest,
  DirectorySyncResponse,
  DirectoryGroups,
  DirectoryUsers,
  DirectorySyncGroupRequest,
} from '../typings';

export class UsersRequestHandler {
  private directoryUsers: DirectoryUsers;

  constructor({ directoryUsers }: { directoryUsers: DirectoryUsers }) {
    this.directoryUsers = directoryUsers;
  }

  async handle(request: DirectorySyncUserRequest): Promise<DirectorySyncResponse> {
    return await this.directoryUsers.handleRequest(request);
  }
}

export class GroupsRequestHandler {
  private directoryGroups: DirectoryGroups;

  constructor({ directoryGroups }: { directoryGroups: DirectoryGroups }) {
    this.directoryGroups = directoryGroups;
  }

  async handle(request: DirectorySyncGroupRequest): Promise<DirectorySyncResponse> {
    return await this.directoryGroups.handleRequest(request);
  }
}

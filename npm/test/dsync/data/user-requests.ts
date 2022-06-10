const requests = {
  // POST /Users
  create: (directoryId: string, user: any) => {
    return {
      directory_id: directoryId,
      method: 'POST',
      body: user,
    };
  },

  // GET /Users?filter=userName eq "userName"
  filterByUsername: (directoryId: string, userName: string) => {
    return {
      directory_id: directoryId,
      method: 'GET',
      query_params: {
        filter: `userName eq "${userName}"`,
        count: 1,
        startIndex: 1,
      },
    };
  },

  // GET /Users/{userId}
  getById: (directoryId: string, userId: string) => {
    return {
      directory_id: directoryId,
      method: 'GET',
      user_id: userId,
    };
  },

  // PUT /Users/{userId}
  updateById: (directoryId: string, userId: string, user: any) => {
    return {
      directory_id: directoryId,
      method: 'PUT',
      user_id: userId,
      body: user,
    };
  },

  // PATCH /Users/{userId}
  updateOperationById: (directoryId: string, userId: string) => {
    return {
      directory_id: directoryId,
      method: 'PATCH',
      user_id: userId,
      body: {
        Operations: [
          {
            op: 'replace',
            value: {
              active: false,
            },
          },
        ],
      },
    };
  },

  // GET /Users/
  getAll: (directoryId: string) => {
    return {
      directory_id: directoryId,
      method: 'GET',
      query_params: {
        count: 1,
        startIndex: 1,
      },
    };
  },

  // DELETE /Users/{userId}
  deleteById: (directoryId: string, userId: string) => {
    return {
      directory_id: directoryId,
      method: 'DELETE',
      user_id: userId,
    };
  },
};

export default requests;

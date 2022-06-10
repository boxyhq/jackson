const requests = {
  // POST /Users
  create: (directoryId: string, user: any) => {
    return {
      method: 'POST',
      body: user,
      query: {
        directory_id: directoryId,
      },
    };
  },

  // GET /Users?filter=userName eq "userName"
  filterByUsername: (directoryId: string, userName: string) => {
    return {
      method: 'GET',
      query: {
        filter: `userName eq "${userName}"`,
        count: 1,
        startIndex: 1,
        directory_id: directoryId,
      },
    };
  },

  // GET /Users/{userId}
  getById: (directoryId: string, userId: string) => {
    return {
      method: 'GET',
      query: {
        directory_id: directoryId,
        user_id: userId,
      },
    };
  },

  // PUT /Users/{userId}
  updateById: (directoryId: string, userId: string, user: any) => {
    return {
      method: 'PUT',
      body: user,
      query: {
        directory_id: directoryId,
        user_id: userId,
      },
    };
  },

  // PATCH /Users/{userId}
  updateOperationById: (directoryId: string, userId: string) => {
    return {
      method: 'PATCH',
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
      query: {
        directory_id: directoryId,
        user_id: userId,
      },
    };
  },

  // GET /Users/
  getAll: (directoryId: string) => {
    return {
      method: 'GET',
      query: {
        count: 1,
        startIndex: 1,
        directory_id: directoryId,
      },
    };
  },

  // DELETE /Users/{userId}
  deleteById: (directoryId: string, userId: string) => {
    return {
      method: 'DELETE',
      query: {
        directory_id: directoryId,
        user_id: userId,
      },
    };
  },
};

export default requests;

const requests = {
  create: (directoryId: string, group: any) => {
    return {
      method: 'POST',
      body: group,
      query: {
        directory_id: directoryId,
      },
    };
  },

  getById: (directoryId: string, groupId: string) => {
    return {
      method: 'GET',
      query: {
        directory_id: directoryId,
        group_id: groupId,
      },
    };
  },

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
};

export default requests;

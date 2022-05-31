const transformUser = (payload: any) => {
  return {
    id: payload.id,
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
    active: payload.raw.active,
    raw: payload.raw,
  };
};

const transformGroup = (payload: any) => {
  return {
    id: payload.id,
    name: payload.name,
  };
};

const transformUserGroup = (payload: any) => {
  return {
    id: payload.id,
    name: payload.name,
  };
};

export { transformUser, transformGroup, transformUserGroup };

const rolesAllowedOperations = {
  admin: ["create", "read", "update", "delete", "deleteAll","readAll"],
  user: ["create", "read", "update", "deleteOne"],
};

module.exports.authorize = (userNameToAuthorize, role, action, req) => {
  if (!role || !action || !userNameToAuthorize || !req) {
    console.log(`Invalid info`);
    return false;
  }
  if (!(action in rolesAllowedOperations[role])) {
    return false;
  }
  if( userNameToAuthorize === req.userName){
    console.log(`user is not authorized`);
    return;
  }
  next();
};

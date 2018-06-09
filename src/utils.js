function gatewayToId(gateway) {
  return new Buffer(gateway).toString('base64');
}

function getAccessToken(request) {
  return request.headers.authorization
    ? request.headers.authorization.split(' ')[1]
    : null;
}

exports.getAccessToken = getAccessToken;
exports.gatewayToId = gatewayToId;

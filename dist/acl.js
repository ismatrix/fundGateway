'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// roles       {String|Array} Role(s) to check the permissions for.
// permissions {String|Array} asked permissions.
// resource    {String} resource to ask permissions for.
let can = (() => {
  var _ref = _asyncToGenerator(function* (roles, permissions, resource) {
    try {
      const isRoleAuthorized = yield acl.areAnyRolesAllowed(roles, resource, permissions);
      return isRoleAuthorized;
    } catch (error) {
      debug('can() Error: %o', error);
      throw error;
    }
  });

  return function can(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();

let grpcCan = (() => {
  var _ref2 = _asyncToGenerator(function* (ctx, permissions, resource) {
    try {
      const user = yield jwt.verifyAsync(ctx.metadata.get('Authorization')[0], _config.jwtSecret);

      const roles = user.dpt ? user.dpt.concat(user.userid) : [].concat(user.userid);
      debug(roles);

      const hasRight = yield can(roles, permissions, resource);

      if (!hasRight) {
        throw new Error(`${ user.userid } is member of '${ roles }'.\
   Not enough to '${ permissions }' the '${ resource }'.)`);
      }
      return true;
    } catch (error) {
      debug('grpcCan() Error: %o', error);
      const err = new Error('Access forbidden');
      err.code = _grpc2.default.status.UNAUTHENTICATED;
      throw err;
    }
  });

  return function grpcCan(_x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
})();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _grpc = require('grpc');

var _grpc2 = _interopRequireDefault(_grpc);

var _acl = require('acl');

var _acl2 = _interopRequireDefault(_acl);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _config = require('./config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _bluebird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _bluebird2.default.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debug2.default)('acl');
const NodeAcl = _bluebird2.default.promisifyAll(_acl2.default);
const jwt = _bluebird2.default.promisifyAll(_jsonwebtoken2.default);
const acl = new NodeAcl(new NodeAcl.memoryBackend());

// Departments permissions
acl.allow([{
  roles: ['系统部'],
  allows: [{ resources: 'reports/it', permissions: ['read', 'write', 'delete'] }, { resources: 'users', permissions: ['read', 'write', 'delete'] }] }, {
  roles: ['市场部'],
  allows: [{ resources: 'reports/marketing', permissions: ['read', 'write', 'delete'] }] }, {
  roles: ['交易部'],
  allows: [{ resources: 'reports/trading', permissions: ['read', 'write', 'delete'] }] }, {
  roles: ['财务部'],
  allows: [{ resources: 'reports/finance', permissions: ['read', 'write', 'delete'] }] }, {
  roles: ['总经办'],
  allows: [{ resources: 'reports/management', permissions: ['read', 'write', 'delete'] }] }, {
  roles: ['客户'],
  allows: [{ resources: 'reports/customers', permissions: ['read'] }] }]);

// Users permissions
acl.allow([{
  roles: ['victor'],
  allows: [{ resources: 'getOrders', permissions: ['read', 'write', 'delete'] }, { resources: 'funds/:fundid', permissions: ['read', 'write', 'delete'] }] }]);exports.default = grpcCan;
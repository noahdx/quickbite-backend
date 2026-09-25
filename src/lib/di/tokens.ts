export const tokens = {
  // Services
  AuthService: Symbol.for('AuthService'),
  BranchService: Symbol.for('BranchService'),
  CustomerAddressService: Symbol.for('CustomerAddressService'),
  ProductService: Symbol.for('ProductService'),
  MemberService: Symbol.for('MemberService'),
  PermissionCacheService: Symbol.for('PermissionCacheService'),
  RestaurantAccessService: Symbol.for('RestaurantAccessService'),
  RestaurantService: Symbol.for('RestaurantService'),
  UserService: Symbol.for('UserService'),
  CredentialsService: Symbol.for('CredentialsService'),

  // Controllers
  AuthController: Symbol.for('AuthController'),
  BranchController: Symbol.for('BranchController'),
  CustomerAddressController: Symbol.for('CustomerAddressController'),
  ProductController: Symbol.for('ProductController'),
  MemberController: Symbol.for('MemberController'),
  RestaurantController: Symbol.for('RestaurantController'),
  UserController: Symbol.for('UserController'),

  //   lib/infra
  Logger: Symbol.for('Logger'),
  CacheProvider: Symbol.for('CacheProvider'),
  EmailProvider: Symbol.for('EmailProvider'),
};

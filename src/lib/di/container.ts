import { container } from 'tsyringe';
import { tokens } from './tokens';
import { AuthService } from '../../app/auth/service/auth.service';
import { BranchService } from '../../app/branch/service/branch.service';
import { CustomerAddressService } from '../../app/customer-address/service/customer-address.service';
import { ProductService } from '../../app/product/service/product.service';
import { MemberService } from '../../app/rbac/service/member.service';
import { PermissionCacheService } from '../../app/rbac/service/permission-cache.service';
import { RestaurantAccessService } from '../../app/restaurant/service/restaurant-access.service';
import { RestaurantService } from '../../app/restaurant/service/restaurant.service';
import { UserService } from '../../app/user/service/user.service';

import { AuthController } from '../../app/auth/controller/auth.controller';
import { BranchController } from '../../app/branch/controller/branch.controller';
import { CustomerAddressController } from '../../app/customer-address/controller/customer-address.controller';
import { ProductController } from '../../app/product/controller/product.controller';
import { MemberController } from '../../app/rbac/controller/member.controller';
import { RestaurantController } from '../../app/restaurant/controller/restaurant.controller';
import { UserController } from '../../app/user/controller/user.controller';
import { Logger } from '../logger/logger';
import { CredentialsService } from '../../app/auth/service/credentials.service';
import { RedisProvider } from '../cache/init';

// Services
container.registerSingleton<AuthService>(tokens.AuthService, AuthService);
container.registerSingleton<BranchService>(tokens.BranchService, BranchService);
container.registerSingleton<CustomerAddressService>(tokens.CustomerAddressService, CustomerAddressService);
container.registerSingleton<ProductService>(tokens.ProductService, ProductService);
container.registerSingleton<MemberService>(tokens.MemberService, MemberService);
container.registerSingleton<PermissionCacheService>(tokens.PermissionCacheService, PermissionCacheService);
container.registerSingleton<RestaurantAccessService>(tokens.RestaurantAccessService, RestaurantAccessService);
container.registerSingleton<RestaurantService>(tokens.RestaurantService, RestaurantService);
container.registerSingleton<UserService>(tokens.UserService, UserService);
container.registerSingleton<CredentialsService>(tokens.CredentialsService, CredentialsService);

// Controllers
container.registerSingleton<AuthController>(tokens.AuthController, AuthController);
container.registerSingleton<BranchController>(tokens.BranchController, BranchController);
container.registerSingleton<CustomerAddressController>(
  tokens.CustomerAddressController,
  CustomerAddressController,
);
container.registerSingleton<ProductController>(tokens.ProductController, ProductController);
container.registerSingleton<MemberController>(tokens.MemberController, MemberController);
container.registerSingleton<RestaurantController>(tokens.RestaurantController, RestaurantController);
container.registerSingleton<UserController>(tokens.UserController, UserController);

//   lib/infra
container.registerSingleton<Logger>(tokens.Logger, Logger);
container.registerInstance(tokens.CacheProvider, RedisProvider);

export { container };

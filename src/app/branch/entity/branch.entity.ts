import { Currency } from '../enums';

export class Branch {
  id: number;
  restaurantId: number;
  countryCode: string;
  addressText: string;
  label: string;
  lat: number;
  lng: number;
  isActive: boolean;
  acceptOrders: boolean;
  opensAt: string;
  closesAt: string;
  deliveryRadius: number; // km
  currency: Currency;
  commission: number;
  createdAt: Date;
  updatedAt: Date;
  location?: String;

  constructor(data: Partial<Branch>) {
    this.id = data.id!;
    this.restaurantId = data.restaurantId!;
    this.countryCode = data.countryCode!;
    this.addressText = data.addressText!;
    this.label = data.label!;
    this.lng = data.lng!;
    this.lat = data.lat!;
    this.isActive = data.isActive!;
    this.acceptOrders = data.acceptOrders!;
    this.opensAt = data.opensAt!;
    this.closesAt = data.closesAt!;
    this.currency = data.currency!;
    this.commission = data.commission ?? 0;
    this.deliveryRadius = data.deliveryRadius ?? 0;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }
}

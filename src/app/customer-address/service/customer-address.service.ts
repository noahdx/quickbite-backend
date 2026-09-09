import { injectable } from 'tsyringe';
import { CreateAddressDTO, UpdateAddressDTO } from '../dto/customer-address.dto';
import { AddressNotFoundError } from '../errors';
import {
  clearDefaultByUserId,
  createAddress,
  deleteAddress,
  findAddressById,
  findAddressesByUserId,
  updateAddress,
} from '../repository/customer-address.repository';

function toResponse(address: any) {
  return {
    id: address.id,
    label: address.label,
    country: address.country,
    city: address.city,
    street: address.street,
    building: address.building,
    apartmentNumber: address.apartmentNumber,
    type: address.type,
    lat: address.lat,
    lng: address.lng,
    isDefault: address.isDefault,
  };
}

@injectable()
export class CustomerAddressService {
  getByUserId = async (userId: number) => {
    const result = await findAddressesByUserId(userId);
    const addresses = result.map(toResponse);

    return {
      message: 'Addresses retrieved successfully',
      data: addresses,
    };
  };

  create = async (userId: number, data: CreateAddressDTO) => {
    if (data.isDefault) clearDefaultByUserId(userId);
    const address = await createAddress({ userId, ...data });

    return {
      message: 'Address created successfully',
      data: toResponse(address),
    };
  };

  update = async (userId: number, addressId: number, data: UpdateAddressDTO) => {
    const address = await findAddressById(addressId);
    if (!address || address.userId !== userId) {
      throw AddressNotFoundError;
    }

    if (data.isDefault) clearDefaultByUserId(userId);

    const updated = await updateAddress(addressId, data);

    return {
      message: 'Address updated successfully',
      data: updated,
    };
  };

  remove = async (userId: number, addressId: number) => {
    const address = await findAddressById(addressId);
    if (!address || address.userId !== userId) throw AddressNotFoundError;

    await deleteAddress(addressId);

    return {
      message: 'Address deleted successfully',
    };
  };
}

export const customerAddressService = new CustomerAddressService();

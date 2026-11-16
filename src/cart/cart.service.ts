import {BadRequestException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressesService } from '../buyers/addresses.service.js';
import { BuyersService } from '../buyers/buyers.service.js';
import { ProductStatus } from '../common/enums/product-status.enum.js';
import { Product } from '../products/entities/product.entity.js';
import {
  calculateDeliveryFee,
  roundMoney,
  roundQuantity,
} from './cart-math.js';
import { AddCartItemDto } from './dtos/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto.js';
import { CartItem } from './entities/cart-item.entity.js';
import { Cart } from './entities/cart.entity.js';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly buyersService: BuyersService,
    private readonly addressesService: AddressesService,
  ) {}

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.itemRepo.find({
      where: { cartId: cart.id },
      relations: { product: { farmer: true } },
      withDeleted: true,
      order: { createdAt: 'ASC' },
    });

    const address = await this.addressesService.getDefaultAddress(userId);
    const addressDistrict = address ? address.district : null;

    const groups: {
      farmerId: string;
      farmName: string | null;
      farmerDistrict: string | null;
      items: object[];
      subtotal: number;
      deliveryFee: number | null;
    }[] = [];

    for (const item of items) {
      const product = item.product;
      let group = groups.find((g) => g.farmerId === product.farmerId);
      if (!group) {
        group = {
          farmerId: product.farmerId,
          farmName: product.farmer.farmName,
          farmerDistrict: product.farmer.district,
          items: [],
          subtotal: 0,
          deliveryFee: null,
        };
        groups.push(group);
      }

      const lineTotal = roundMoney(product.pricePerUnit * item.quantity);
      group.items.push({
        id: item.id,
        productId: product.id,
        name: product.name,
        unit: product.unit,
        pricePerUnit: product.pricePerUnit,
        quantity: item.quantity,
        lineTotal,
        minOrderQuantity: product.minOrderQuantity,
        availableQuantity: product.availableQuantity,
        isAvailable:
          product.status === ProductStatus.ACTIVE && product.deletedAt === null,
      });
      group.subtotal = roundMoney(group.subtotal + lineTotal);
    }

    let itemsTotal = 0;
    let deliveryTotal = 0;
    for (const group of groups) {
      itemsTotal = roundMoney(itemsTotal + group.subtotal);
      if (addressDistrict) {
        group.deliveryFee = calculateDeliveryFee(
          group.farmerDistrict,
          addressDistrict,
        );
        deliveryTotal = roundMoney(deliveryTotal + group.deliveryFee);
      }
    }

    return {
      id: cart.id,
      deliveryDistrict: addressDistrict,
      groups,
      itemsTotal,
      deliveryTotal: addressDistrict ? deliveryTotal : null,
      grandTotal: addressDistrict ? roundMoney(itemsTotal + deliveryTotal) : null,
      message: addressDistrict
        ? null
        : 'Add a default delivery address to see the delivery fee',
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });
    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.itemRepo.findOne({
      where: { cartId: cart.id, productId: product.id },
    });
    const newQuantity = roundQuantity(
      existing ? existing.quantity + dto.quantity : dto.quantity,
    );
    this.checkMinQuantity(product, newQuantity);

    if (existing) {
      existing.quantity = newQuantity;
      await this.itemRepo.save(existing);
    } else {
      const item = this.itemRepo.create({
        cartId: cart.id,
        productId: product.id,
        quantity: newQuantity,
      });
      await this.itemRepo.save(item);
    }
    return await this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.findOwnItem(userId, itemId);

    const product = await this.productRepo.findOne({
      where: { id: item.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    this.checkMinQuantity(product, dto.quantity);

    item.quantity = dto.quantity;
    await this.itemRepo.save(item);
    return await this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.findOwnItem(userId, itemId);
    await this.itemRepo.remove(item);
    return await this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.itemRepo.delete({ cartId: cart.id });
    return await this.getCart(userId);
  }

  private async getOrCreateCart(userId: string): Promise<Cart> {
    const profile = await this.buyersService.getOrCreateProfile(userId);
    const existing = await this.cartRepo.findOne({
      where: { buyerId: profile.id },
    });
    if (existing) {
      return existing;
    }
    const cart = this.cartRepo.create({ buyerId: profile.id });
    return await this.cartRepo.save(cart);
  }

  private async findOwnItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.itemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    return item;
  }

  private checkMinQuantity(product: Product, quantity: number) {
    if (quantity < product.minOrderQuantity) {
      throw new BadRequestException(
        `Minimum order quantity for this product is ${product.minOrderQuantity}`,
      );
    }
  }
}
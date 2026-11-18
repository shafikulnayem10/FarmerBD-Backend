import {BadRequestException,ConflictException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Between,DataSource,EntityManager,FindOptionsWhere,In,LessThanOrEqual,MoreThanOrEqual, Repository,} from 'typeorm';
import { DeliveryAddress } from '../buyers/entities/delivery-address.entity.js';
import { BuyersService } from '../buyers/buyers.service.js';
import { calculateDeliveryFee, roundMoney } from '../cart/cart-math.js';
import { CartItem } from '../cart/entities/cart-item.entity.js';
import { Cart } from '../cart/entities/cart.entity.js';
import { OrderStatus } from '../common/enums/order-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { FarmerProfile } from '../farmers/entities/farmer-profile.entity.js';
import { FarmersService } from '../farmers/farmers.service.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { Product } from '../products/entities/product.entity.js';
import type { StockItem } from '../products/interfaces/stock-item.interface.js';
import { ProductsService } from '../products/products.service.js';
import { BuyerOrdersQueryDto } from './dtos/buyer-orders-query.dto.js';
import { CancelOrderDto } from './dtos/cancel-order.dto.js';
import { CheckoutDto } from './dtos/checkout.dto.js';
import { toOrderResponse } from './order-response.js';

@Injectable()
export class BuyerOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly buyersService: BuyersService,
    private readonly farmersService: FarmersService,
    private readonly productsService: ProductsService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const profile = await this.buyersService.getOrCreateProfile(userId);

    return await this.dataSource.transaction(async (manager) => {
      const address = await manager.findOne(DeliveryAddress, {
        where: { id: dto.addressId, buyerId: profile.id },
      });
      if (!address) {
        throw new NotFoundException('Address not found');
      }

      const cart = await manager.findOne(Cart, {
        where: { buyerId: profile.id },
      });
      const cartItems = cart
        ? await manager.find(CartItem, {
            where: { cartId: cart.id },
            order: { createdAt: 'ASC' },
          })
        : [];
      if (!cart || cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const stockItems = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      const products = await this.productsService.reserveStock(
        manager,
        stockItems,
        userId,
      );

      const farmerIds = [...new Set(products.map((p) => p.farmerId))];
      const farmers = await manager.find(FarmerProfile, {
        where: { id: In(farmerIds) },
      });

      const createdOrders: ReturnType<typeof toOrderResponse>[] = [];

      for (const farmerId of farmerIds) {
        const farmer = farmers.find((f) => f.id === farmerId);
        if (!farmer) {
          throw new ConflictException('Farmer not found');
        }

        let subtotal = 0;
        const lines: { product: Product; quantity: number; lineTotal: number }[] =
          [];
        for (let i = 0; i < products.length; i++) {
          if (products[i].farmerId !== farmerId) {
            continue;
          }
          const quantity = cartItems[i].quantity;
          const lineTotal = roundMoney(products[i].pricePerUnit * quantity);
          subtotal = roundMoney(subtotal + lineTotal);
          lines.push({ product: products[i], quantity, lineTotal });
        }

        const deliveryFee = calculateDeliveryFee(
          farmer.district,
          address.district,
        );

        const order = manager.create(Order, {
          orderNumber: this.generateOrderNumber(),
          buyerId: profile.id,
          farmerId,
          status: OrderStatus.PENDING,
          subtotal,
          deliveryFee,
          totalAmount: roundMoney(subtotal + deliveryFee),
          paymentMethod: 'CASH_ON_DELIVERY',
          paymentStatus: 'UNPAID',
          shipRecipientName: address.recipientName,
          shipPhone: address.phone,
          shipDivision: address.division,
          shipDistrict: address.district,
          shipUpazila: address.upazila,
          shipAddressLine: address.addressLine,
          note: dto.note ?? null,
        });
        const savedOrder = await manager.save(order);

        const orderItems = lines.map((line) =>
          manager.create(OrderItem, {
            orderId: savedOrder.id,
            productId: line.product.id,
            productName: line.product.name,
            unit: line.product.unit,
            unitPrice: line.product.pricePerUnit,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          }),
        );
        const savedItems = await manager.save(orderItems);

        savedOrder.farmer = farmer;
        createdOrders.push(toOrderResponse(savedOrder, savedItems));
      }

      await manager.delete(CartItem, { cartId: cart.id });
      return createdOrders;
    });
  }

  async getMyOrders(userId: string, query: BuyerOrdersQueryDto) {
    const profile = await this.buyersService.getOrCreateProfile(userId);

    const fromDate = query.from ? new Date(query.from) : undefined;
    let toDate: Date | undefined = undefined;
    if (query.to) {
      toDate = new Date(query.to);
      toDate.setUTCHours(23, 59, 59, 999);
    }
    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('from cannot be later than to');
    }

    const where: FindOptionsWhere<Order> = { buyerId: profile.id };
    if (query.status) {
      where.status = query.status;
    }
    if (fromDate && toDate) {
      where.createdAt = Between(fromDate, toDate);
    } else if (fromDate) {
      where.createdAt = MoreThanOrEqual(fromDate);
    } else if (toDate) {
      where.createdAt = LessThanOrEqual(toDate);
    }

    const [orders, total] = await this.orderRepo.findAndCount({
      where,
      relations: { items: true, farmer: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const data = orders.map((order) => toOrderResponse(order, order.items));

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getOrderById(userId: string, role: Role, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { items: true, farmer: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    let isOwner = false;
    if (role === Role.FARMER) {
      const farmerProfile = await this.farmersService.getOrCreateProfile(userId);
      isOwner = order.farmerId === farmerProfile.id;
    } else {
      const buyerProfile = await this.buyersService.getOrCreateProfile(userId);
      isOwner = order.buyerId === buyerProfile.id;
    }
    if (!isOwner) {
      throw new NotFoundException('Order not found');
    }

    return toOrderResponse(order, order.items);
  }

  async cancelOrder(userId: string, orderId: string, dto: CancelOrderDto) {
    const profile = await this.buyersService.getOrCreateProfile(userId);

    return await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnOrder(manager, profile.id, orderId);

      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictException(
          `Only a PENDING order can be cancelled. Current status: ${order.status}`,
        );
      }

      const orderItems = await manager.find(OrderItem, {
        where: { orderId: order.id },
      });
      const stockItems: StockItem[] = orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      await this.productsService.restoreStock(manager, stockItems, userId);

      order.status = OrderStatus.CANCELLED;
      order.cancellationReason = dto.reason;
      const saved = await manager.save(order);
      return this.toOrderSummary(saved);
    });
  }

  async confirmDelivery(userId: string, orderId: string) {
    const profile = await this.buyersService.getOrCreateProfile(userId);

    return await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnOrder(manager, profile.id, orderId);

      if (order.status !== OrderStatus.DELIVERED) {
        throw new ConflictException(
          `Only a DELIVERED order can be confirmed. Current status: ${order.status}`,
        );
      }

      order.status = OrderStatus.COMPLETED;
      const saved = await manager.save(order);
      return this.toOrderSummary(saved);
    });
  }

  private async lockOwnOrder(
    manager: EntityManager,
    buyerProfileId: string,
    orderId: string,
  ) {
    const order = await manager.findOne(Order, {
      where: { id: orderId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!order || order.buyerId !== buyerProfileId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private toOrderSummary(order: Order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      cancellationReason: order.cancellationReason,
      updatedAt: order.updatedAt,
    };
  }

  private generateOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(100000 + Math.random() * 900000);
    return `FBD-${date}-${random}`;
  }
}
import {BadRequestException,ConflictException, Injectable, NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {Between,DataSource,EntityManager, FindOptionsWhere,LessThanOrEqual, MoreThanOrEqual, Repository,} from 'typeorm';
import { OrderStatus } from '../common/enums/order-status.enum.js';
import { FarmersService } from '../farmers/farmers.service.js';
import { Order } from '../orders/entities/order.entity.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { ProductsService } from '../products/products.service.js';
import type { StockItem } from '../products/interfaces/stock-item.interface.js';
import { FarmerOrdersQueryDto } from './dtos/farmer-orders-query.dto.js';
import { RejectOrderDto } from './dtos/reject-order.dto.js';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto.js';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.ACCEPTED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY_FOR_PICKUP,
  [OrderStatus.READY_FOR_PICKUP]: OrderStatus.DELIVERED,
};

@Injectable()
export class FarmerOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly farmersService: FarmersService,
    private readonly productsService: ProductsService,
    private readonly dataSource: DataSource,
  ) {}

  async getMyOrders(userId: string, query: FarmerOrdersQueryDto) {
    const profile = await this.farmersService.getOrCreateProfile(userId);

    const fromDate = query.from ? new Date(query.from) : undefined;
    let toDate: Date | undefined = undefined;
    if (query.to) {
      toDate = new Date(query.to);
      toDate.setUTCHours(23, 59, 59, 999);
    }
    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('from cannot be later than to');
    }

    const where: FindOptionsWhere<Order> = { farmerId: profile.id };
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
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const data = [];
    for (const order of orders) {
      data.push(this.toOrderResponse(order));
    }

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

  async acceptOrder(userId: string, orderId: string) {
    const profile = await this.farmersService.getOrCreateProfile(userId);

    return await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnOrder(manager, profile.id, orderId);

      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictException(
          `Only a PENDING order can be accepted. Current status: ${order.status}`,
        );
      }

      order.status = OrderStatus.ACCEPTED;
      const saved = await manager.save(order);
      return this.toOrderSummary(saved);
    });
  }

  async rejectOrder(userId: string, orderId: string, dto: RejectOrderDto) {
    const profile = await this.farmersService.getOrCreateProfile(userId);

    return await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnOrder(manager, profile.id, orderId);

      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictException(
          `Only a PENDING order can be rejected. Current status: ${order.status}`,
        );
      }

      const orderItems = await manager.find(OrderItem, {
        where: { orderId: order.id },
      });
      const stockItems: StockItem[] = [];
      for (const item of orderItems) {
        stockItems.push({ productId: item.productId, quantity: item.quantity });
      }
      await this.productsService.restoreStock(manager, stockItems);

      order.status = OrderStatus.REJECTED;
      order.rejectionReason = dto.reason;
      const saved = await manager.save(order);
      return this.toOrderSummary(saved);
    });
  }

  async updateStatus(userId: string, orderId: string, dto: UpdateOrderStatusDto) {
    const profile = await this.farmersService.getOrCreateProfile(userId);

    return await this.dataSource.transaction(async (manager) => {
      const order = await this.lockOwnOrder(manager, profile.id, orderId);

      if (NEXT_STATUS[order.status] !== dto.status) {
        throw new ConflictException(
          `Cannot change order status from ${order.status} to ${dto.status}`,
        );
      }

      order.status = dto.status;
      const saved = await manager.save(order);
      return this.toOrderSummary(saved);
    });
  }

  private async lockOwnOrder(
    manager: EntityManager,
    farmerProfileId: string,
    orderId: string,
  ) {
    const order = await manager.findOne(Order, {
      where: { id: orderId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!order || order.farmerId !== farmerProfileId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private toOrderSummary(order: Order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      rejectionReason: order.rejectionReason,
      updatedAt: order.updatedAt,
    };
  }

  private toOrderResponse(order: Order) {
    const items = [];
    for (const item of order.items) {
      items.push({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      });
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shipping: {
        recipientName: order.shipRecipientName,
        phone: order.shipPhone,
        division: order.shipDivision,
        district: order.shipDistrict,
        upazila: order.shipUpazila,
        addressLine: order.shipAddressLine,
      },
      note: order.note,
      rejectionReason: order.rejectionReason,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
      items,
    };
  }
}
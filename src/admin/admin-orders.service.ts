import { BadRequestException, ConflictException, Injectable, NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, EntityManager, FindOptionsWhere, In, LessThanOrEqual, MoreThanOrEqual, Repository,} from 'typeorm';
import { toOrderResponse } from '../buyer-orders/order-response.js';
import { AdminAction } from '../common/enums/admin-action.enum.js';
import { DeliveryStatus } from '../common/enums/delivery-status.enum.js';
import { OrderStatus } from '../common/enums/order-status.enum.js';
import { UserStatus } from '../common/enums/user-status.enum.js';
import { VerificationStatus } from '../common/enums/verification-status.enum.js';
import { Delivery } from '../deliveries/entities/delivery.entity.js';
import { FarmerProfile } from '../farmers/entities/farmer-profile.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { PricingService } from '../pricing/pricing.service.js';
import type { StockItem } from '../products/interfaces/stock-item.interface.js';
import { ProductsService } from '../products/products.service.js';
import { TransporterProfile } from '../transporters/entities/transporter-profile.entity.js';
import { AdminLogsService } from './admin-logs.service.js';
import { AdminOrdersQueryDto } from './dtos/admin-orders-query.dto.js';
import { AdminReasonDto } from './dtos/admin-reason.dto.js';
import { AssignTransporterDto } from './dtos/assign-transporter.dto.js';

const CANCELLABLE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
];

@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    private readonly dataSource: DataSource,
    private readonly productsService: ProductsService,
    private readonly pricingService: PricingService,
    private readonly adminLogsService: AdminLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getOrders(query: AdminOrdersQueryDto) {
    const fromDate = query.from ? new Date(query.from) : undefined;
    let toDate: Date | undefined = undefined;
    if (query.to) {
      toDate = new Date(query.to);
      toDate.setUTCHours(23, 59, 59, 999);
    }
    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('from cannot be later than to');
    }

    const where: FindOptionsWhere<Order> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.farmerId) {
      where.farmerId = query.farmerId;
    }
    if (query.buyerId) {
      where.buyerId = query.buyerId;
    }
    if (query.district) {
      where.shipDistrict = query.district;
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

    const deliveries = orders.length
      ? await this.deliveryRepo.find({
          where: { orderId: In(orders.map((order) => order.id)) },
        })
      : [];

    const data = orders.map((order) =>
      this.toAdminOrderResponse(
        order,
        deliveries.find((delivery) => delivery.orderId === order.id) ?? null,
      ),
    );

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

  async getOrderById(orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { items: true, farmer: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const delivery = await this.deliveryRepo.findOne({
      where: { orderId: order.id },
      relations: { transporter: { user: true } },
    });
    return this.toAdminOrderResponse(order, delivery);
  }


  async assignTransporter(adminId: string, orderId: string, dto: AssignTransporterDto) {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      if (order.status !== OrderStatus.READY_FOR_PICKUP) {
        throw new ConflictException(
          `Only a READY_FOR_PICKUP order can be assigned. Current status: ${order.status}`,
        );
      }

      const transporter = await manager.findOne(TransporterProfile, {
        where: { id: dto.transporterId },
        relations: { user: true },
      });
      if (!transporter) {
        throw new NotFoundException('Transporter not found');
      }
      if (
        transporter.verificationStatus !== VerificationStatus.VERIFIED ||
        transporter.user.status !== UserStatus.ACTIVE
      ) {
        throw new ConflictException('Only a verified, active transporter can be assigned');
      }

      let delivery = await manager.findOne(Delivery, {
        where: { orderId: order.id },
        lock: { mode: 'pessimistic_write' },
      });
      let previousTransporterId: string | null = null;

      if (!delivery) {
        const farmer = await manager.findOne(FarmerProfile, {
          where: { id: order.farmerId },
        });
        if (!farmer || !farmer.district) {
          throw new ConflictException('The farmer has no district for pickup');
        }
        const fare = await this.pricingService.calculateFare(
          manager,
          farmer.district,
          order.shipDistrict,
        );
        delivery = manager.create(Delivery, {
          orderId: order.id,
          transporterId: transporter.id,
          status: DeliveryStatus.ASSIGNED,
          pickupDistrict: farmer.district,
          dropDistrict: order.shipDistrict,
          distanceKm: fare.distanceKm,
          fuelPriceSnapshot: fare.fuelPrice,
          fareAmount: fare.fareAmount,
          assignedBy: adminId,
          assignedAt: new Date(),
        });
      } else {
      
        if (
          delivery.status !== DeliveryStatus.ASSIGNED &&
          delivery.status !== DeliveryStatus.FAILED
        ) {
          throw new ConflictException(
            `The delivery is already ${delivery.status} and can't be reassigned`,
          );
        }
        if (
          delivery.status === DeliveryStatus.ASSIGNED &&
          delivery.transporterId === transporter.id
        ) {
          throw new ConflictException('The order is already assigned to this transporter');
        }
        if (delivery.status === DeliveryStatus.ASSIGNED) {
          previousTransporterId = delivery.transporterId;
        }
        delivery.transporterId = transporter.id;
        delivery.status = DeliveryStatus.ASSIGNED;
        delivery.assignedBy = adminId;
        delivery.assignedAt = new Date();
        delivery.failureReason = null;
        delivery.pickedUpAt = null;
      }

      const saved = await manager.save(delivery);

      await this.adminLogsService.log(
        manager,
        adminId,
        AdminAction.ASSIGN_TRANSPORTER,
        'ORDER',
        order.id,
        previousTransporterId
          ? `Reassigned from transporter ${previousTransporterId} to ${transporter.id}`
          : `Assigned to transporter ${transporter.id}`,
      );

      
      await this.notificationsService.notify(manager, {
        userId: transporter.userId,
        type: 'JOB_ASSIGNED',
        title: 'New delivery job assigned',
        message: `Order ${order.orderNumber} from ${saved.pickupDistrict} to ${saved.dropDistrict} was assigned to you by an Admin.`,
        resourceType: 'DELIVERY',
        resourceId: saved.id,
      });
      if (previousTransporterId) {
        await this.notifyJobCancelled(manager, previousTransporterId, order, saved.id);
      }

      return this.toDeliveryResponse(saved);
    });
  }

  async cancelOrder(adminId: string, orderId: string, dto: AdminReasonDto) {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      if (!CANCELLABLE_STATUSES.includes(order.status)) {
        throw new ConflictException(
          `An order with status ${order.status} can't be cancelled`,
        );
      }

  
      const delivery = await manager.findOne(Delivery, {
        where: { orderId: order.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        delivery &&
        delivery.status !== DeliveryStatus.ASSIGNED &&
        delivery.status !== DeliveryStatus.FAILED
      ) {
        throw new ConflictException(
          `The delivery is already ${delivery.status}, so the order can't be cancelled`,
        );
      }

      const orderItems = await manager.find(OrderItem, {
        where: { orderId: order.id },
      });
      const stockItems: StockItem[] = orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      await this.productsService.restoreStock(manager, stockItems, adminId);

      order.status = OrderStatus.CANCELLED;
      order.cancellationReason = dto.reason;
      const saved = await manager.save(order);

      if (delivery && delivery.status === DeliveryStatus.ASSIGNED) {
        delivery.status = DeliveryStatus.FAILED;
        delivery.failureReason = `Order cancelled by Admin: ${dto.reason}`;
        await manager.save(delivery);
        await this.notifyJobCancelled(manager, delivery.transporterId, order, delivery.id);
      }

      await this.adminLogsService.log(
        manager,
        adminId,
        AdminAction.CANCEL_ORDER,
        'ORDER',
        order.id,
        dto.reason,
      );

      return {
        id: saved.id,
        orderNumber: saved.orderNumber,
        status: saved.status,
        cancellationReason: saved.cancellationReason,
        updatedAt: saved.updatedAt,
      };
    });
  }

  private async notifyJobCancelled(
    manager: EntityManager,
    transporterId: string,
    order: Order,
    deliveryId: string,
  ) {
    const transporter = await manager.findOne(TransporterProfile, {
      where: { id: transporterId },
    });
    if (!transporter) {
      return;
    }
    await this.notificationsService.notify(manager, {
      userId: transporter.userId,
      type: 'JOB_CANCELLED',
      title: 'Delivery job cancelled',
      message: `Order ${order.orderNumber} is no longer assigned to you.`,
      resourceType: 'DELIVERY',
      resourceId: deliveryId,
    });
  }

  private toAdminOrderResponse(order: Order, delivery: Delivery | null) {
    return {
      ...toOrderResponse(order, order.items),
      buyerId: order.buyerId,
      delivery: delivery ? this.toDeliveryResponse(delivery) : null,
    };
  }

  private toDeliveryResponse(delivery: Delivery) {
    return {
      id: delivery.id,
      orderId: delivery.orderId,
      transporterId: delivery.transporterId,
      transporterName: delivery.transporter?.user?.fullName ?? null,
      status: delivery.status,
      pickupDistrict: delivery.pickupDistrict,
      dropDistrict: delivery.dropDistrict,
      distanceKm: delivery.distanceKm,
      fuelPriceSnapshot: delivery.fuelPriceSnapshot,
      fareAmount: delivery.fareAmount,
      assignedBy: delivery.assignedBy,
      failureReason: delivery.failureReason,
      assignedAt: delivery.assignedAt,
      pickedUpAt: delivery.pickedUpAt,
      deliveredAt: delivery.deliveredAt,
    };
  }
}

import { BadRequestException, ConflictException,Injectable, NotFoundException,} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { DeliveryAddress } from '../buyers/entities/delivery-address.entity.js';
import { BuyersService } from '../buyers/buyers.service.js';
import { calculateDeliveryFee, roundMoney } from '../cart/cart-math.js';
import { CartItem } from '../cart/entities/cart-item.entity.js';
import { Cart } from '../cart/entities/cart.entity.js';
import { OrderStatus } from '../common/enums/order-status.enum.js';
import { FarmerProfile } from '../farmers/entities/farmer-profile.entity.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { ProductsService } from '../products/products.service.js';
import { CheckoutDto } from './dtos/checkout.dto.js';
import { toOrderResponse } from './order-response.js';

@Injectable()
export class BuyerOrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly buyersService: BuyersService,
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

  private generateOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(100000 + Math.random() * 900000);
    return `FBD-${date}-${random}`;
  }
}
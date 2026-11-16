import { OrderItem } from '../orders/entities/order-item.entity.js';
import { Order } from '../orders/entities/order.entity.js';

export function toOrderResponse(order: Order, items: OrderItem[]) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    farmerId: order.farmerId,
    farmName: order.farmer ? order.farmer.farmName : null,
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
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
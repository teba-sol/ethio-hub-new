import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/order.model';
import Booking from '@/models/booking.model';
import Payment from '@/models/payment.model';
import Wallet from '@/models/wallet.model';
import Product from '@/models/artisan/product.model';

import Transaction from '@/models/transaction.model';
import mongoose from 'mongoose';

const COMMISSION_RATE = 0.10; // 10% admin commission
const CHAPA_API_URL = 'https://api.chapa.co';

export async function processSuccessfulPayment(txRef: string, metadata?: any) {
  console.log(`[PaymentService] Processing successful payment for txRef: ${txRef}`);
  try {
    await connectDB();
    console.log(`[PaymentService] Connected to database: ${mongoose.connection.name}`);

    // 1. Verify with Chapa if metadata is not provided
    if (!metadata) {
      console.log(`[PaymentService] No metadata provided, verifying with Chapa for txRef: ${txRef}`);
      const response = await fetch(`${CHAPA_API_URL}/v1/transaction/verify/${txRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(`[PaymentService] Chapa raw response:`, JSON.stringify(data));
      if (!response.ok || (data.status !== 'success' && data.data?.status !== 'success')) {
        console.error(`[PaymentService] Chapa verification failed for ${txRef}:`, data.message);
        return { success: false, message: data.message || 'Payment verification failed' };
      }
      metadata = data.data;
      console.log(`[PaymentService] Chapa verification successful`);
    }

    // Normalize metadata payload from Chapa
    let metadataPayload = metadata;
    if (metadataPayload?.data) {
      metadataPayload = metadataPayload.data;
    }
    const metadataObject = metadataPayload?.metadata ? metadataPayload.metadata : metadataPayload;

    // Get Admin User for transactions
    const adminUser = await User.findOne({ role: 'admin' });
    const adminId = adminUser ? adminUser._id : null;
    console.log(`[PaymentService] Admin ID: ${adminId}, Admin User exists: ${!!adminUser}`);
    
    // 1. Find the payment and associated order/booking
    const payment = await Payment.findOne({ transactionRef: txRef });
    console.log(`[PaymentService] Found payment: ${payment ? payment._id : 'Not Found'}`, payment ? { orderId: payment.orderId, bookingId: payment.bookingId } : null);

    let order = await Order.findOne({ paymentRef: txRef });
    console.log(`[PaymentService] Found order by paymentRef: ${order ? order._id : 'Not Found'}`, order ? { artisan: order.artisan, tourist: order.tourist, totalPrice: order.totalPrice } : null);

    let booking = await Booking.findOne({ paymentRef: txRef });
    console.log(`[PaymentService] Found booking by paymentRef: ${booking ? booking._id : 'Not Found'}`);

    // If not found by paymentRef, try finding by IDs stored in payment
    if (!order && !booking && payment) {
      if (payment.orderId) {
        order = await Order.findById(payment.orderId);
        console.log(`[PaymentService] Found order by payment.orderId: ${order ? order._id : 'Not Found'}`);
      }
      if (!order && payment.bookingId) {
        booking = await Booking.findById(payment.bookingId);
        console.log(`[PaymentService] Found booking by payment.bookingId: ${booking ? booking._id : 'Not Found'}`);
      }
    }

    // If still not found, try using metadata from Chapa
    if (!order && !booking && metadataPayload) {
      console.log(`[PaymentService] Attempting to find by metadata:`, JSON.stringify(metadataPayload, null, 2));
      const metadataOrderId =
        metadataObject?.orderId ||
        metadataPayload?.orderId ||
        metadataObject?.order_id ||
        metadataPayload?.order_id;
      const metadataBookingId =
        metadataObject?.bookingId ||
        metadataPayload?.bookingId ||
        metadataObject?.booking_id ||
        metadataPayload?.booking_id;

      console.log(`[PaymentService] Extracted metadataOrderId: ${metadataOrderId}, metadataBookingId: ${metadataBookingId}`);

      if (metadataOrderId) {
        order = await Order.findById(metadataOrderId);
        console.log(`[PaymentService] Found order by metadata: ${order ? order._id : 'Not Found'}`);
      }
      if (!order && metadataBookingId) {
        booking = await Booking.findById(metadataBookingId);
        console.log(`[PaymentService] Found booking by metadata: ${booking ? booking._id : 'Not Found'}`);
      }
    }

    if (!order && !booking) {
      console.error(`[PaymentService] No associated order or booking found for txRef: ${txRef}`);
      return { success: false, message: 'No associated order or booking found' };
    }

    const cartOrders = await Order.find({ paymentRef: txRef });
    if (cartOrders.length > 1) {
      console.log(`[PaymentService] Processing cart payment with ${cartOrders.length} orders for txRef: ${txRef}`);
      let paymentTotal = 0;

      for (const cartOrder of cartOrders) {
        const totalAmount = cartOrder.totalPrice || 0;
        const commissionRate = cartOrder.commissionRate || 0.10;
        let adminCommission = cartOrder.adminCommission;
        let artisanEarnings = cartOrder.artisanEarnings;

        if (adminCommission === undefined || artisanEarnings === undefined || adminCommission === 0) {
          adminCommission = Math.round(totalAmount * commissionRate * 100) / 100;
          artisanEarnings = Math.round((totalAmount - adminCommission) * 100) / 100;
        }

        paymentTotal += totalAmount;
        cartOrder.paymentStatus = 'paid';
        cartOrder.status = 'confirmed';
        cartOrder.paymentDate = new Date();
        cartOrder.adminCommission = adminCommission;
        cartOrder.artisanEarnings = artisanEarnings;
        
        // Decrease product stock
        try {
          await Product.findByIdAndUpdate(cartOrder.product, {
            $inc: { stock: -Math.abs(cartOrder.quantity || 1) }
          });
          console.log(`[PaymentService] Decreased stock for product ${cartOrder.product} by ${cartOrder.quantity}`);
        } catch (stockErr) {
          console.error(`[PaymentService] Failed to decrease stock for product ${cartOrder.product}:`, stockErr);
        }

        await cartOrder.save();

        const artisanId = cartOrder.artisan;
        const existingArtisanTx = await Transaction.findOne({
          paymentRef: txRef,
          orderId: cartOrder._id,
          type: 'ORDER_PAYMENT',
          userId: artisanId,
        });

        let artisanWallet = await Wallet.findOne({ userId: artisanId });
        if (!artisanWallet) {
          artisanWallet = new Wallet({
            userId: artisanId,
            userRole: 'artisan',
            pendingBalance: 0,
            availableBalance: 0,
            lifetimeEarned: 0,
            lifetimePaidOut: 0,
            lifetimeRefunded: 0,
            currency: 'ETB',
          });
        }

        if (!existingArtisanTx || existingArtisanTx.status !== 'COMPLETED') {
          const originalPendingBalance = artisanWallet.pendingBalance || 0;
          artisanWallet.pendingBalance = originalPendingBalance >= artisanEarnings
            ? originalPendingBalance - artisanEarnings
            : 0;
          artisanWallet.availableBalance = (artisanWallet.availableBalance || 0) + artisanEarnings;
          artisanWallet.lifetimeEarned = (artisanWallet.lifetimeEarned || 0) + artisanEarnings;
          await artisanWallet.save();

          if (existingArtisanTx) {
            existingArtisanTx.quantity = cartOrder.quantity;
            existingArtisanTx.unitPrice = cartOrder.unitPrice;
            existingArtisanTx.status = 'COMPLETED';
            existingArtisanTx.metadata = {
              ...existingArtisanTx.metadata,
              quantity: cartOrder.quantity,
              unitPrice: cartOrder.unitPrice,
              completedAt: new Date(),
              paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
            };
            await existingArtisanTx.save();
          } else {
            await Transaction.create({
              walletId: artisanWallet._id,
              userId: artisanId,
              orderId: cartOrder._id,
              productId: cartOrder.product,
              quantity: cartOrder.quantity,
              unitPrice: cartOrder.unitPrice,
              type: 'ORDER_PAYMENT',
              amount: artisanEarnings,
              currency: 'ETB',
              status: 'COMPLETED',
              paymentRef: txRef,
              metadata: {
                orderId: cartOrder._id,
                productId: cartOrder.product,
                quantity: cartOrder.quantity,
                unitPrice: cartOrder.unitPrice,
                totalAmount,
                commissionRate,
                paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
                payerId: cartOrder.tourist,
                receiverId: artisanId,
                role: 'artisan'
              },
            });
          }
        }

        if (adminId) {
          let adminWallet = await Wallet.findOne({ userId: adminId, userRole: 'admin' });
          if (!adminWallet) {
            adminWallet = new Wallet({
              userId: adminId,
              userRole: 'admin',
              pendingBalance: 0,
              availableBalance: 0,
              lifetimeEarned: 0,
              lifetimePaidOut: 0,
              lifetimeRefunded: 0,
              currency: 'ETB',
            });
          }

          const existingAdminTx = await Transaction.findOne({
            walletId: adminWallet._id,
            paymentRef: txRef,
            orderId: cartOrder._id,
            type: 'ADMIN_COMMISSION',
            userId: adminId,
          });

          if (!existingAdminTx || existingAdminTx.status !== 'COMPLETED') {
            const originalPendingAdmin = adminWallet.pendingBalance || 0;
            adminWallet.pendingBalance = originalPendingAdmin >= adminCommission
              ? originalPendingAdmin - adminCommission
              : 0;
            adminWallet.availableBalance = (adminWallet.availableBalance || 0) + adminCommission;
            adminWallet.lifetimeEarned = (adminWallet.lifetimeEarned || 0) + adminCommission;
            await adminWallet.save();

            if (existingAdminTx) {
              existingAdminTx.quantity = cartOrder.quantity;
              existingAdminTx.unitPrice = cartOrder.unitPrice;
              existingAdminTx.status = 'COMPLETED';
              existingAdminTx.metadata = {
                ...existingAdminTx.metadata,
                quantity: cartOrder.quantity,
                unitPrice: cartOrder.unitPrice,
                completedAt: new Date(),
                paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
              };
              await existingAdminTx.save();
            } else {
              await Transaction.create({
                walletId: adminWallet._id,
                userId: adminId,
                orderId: cartOrder._id,
                productId: cartOrder.product,
                quantity: cartOrder.quantity,
                unitPrice: cartOrder.unitPrice,
                type: 'ADMIN_COMMISSION',
                amount: adminCommission,
                currency: 'ETB',
                status: 'COMPLETED',
                paymentRef: txRef,
                metadata: {
                  orderId: cartOrder._id,
                  productId: cartOrder.product,
                  quantity: cartOrder.quantity,
                  unitPrice: cartOrder.unitPrice,
                  totalAmount,
                  commissionRate,
                  artisanId: cartOrder.artisan,
                  paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
                  payerId: cartOrder.tourist,
                  receiverId: adminId,
                  role: 'artisan'
                },
              });
            }
          }
        }
      }

      if (payment) {
        payment.status = 'Success';
        payment.userId = payment.userId || cartOrders[0].tourist;
        payment.amount = payment.amount || paymentTotal;
        payment.method = payment.method || 'chapa';
        payment.paymentGatewayId = payment.paymentGatewayId || metadataPayload?.reference || metadataObject?.reference;
        payment.invoiceUrl = payment.invoiceUrl || metadataPayload?.checkout_url || metadataObject?.checkout_url;
        await payment.save();
      } else {
        await Payment.create({
          userId: cartOrders[0].tourist,
          transactionRef: txRef,
          paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
          method: 'chapa',
          amount: paymentTotal,
          status: 'Success',
          invoiceUrl: metadataPayload?.checkout_url || metadataObject?.checkout_url,
        });
      }

      return { success: true, orders: cartOrders };
    }

    // 2. Process Order Payment
    if (order) {
      console.log(`[PaymentService] Processing order: ${order._id}`);
      console.log(`[PaymentService] Order details - artisan: ${order.artisan}, tourist: ${order.tourist}, total: ${order.totalPrice}`);
       
      // Check if already processed fully
      const existingArtisanTx = await Transaction.findOne({ 
        paymentRef: txRef, 
        orderId: order._id,
        type: 'ORDER_PAYMENT',
        userId: order.artisan
      });

      if (existingArtisanTx && existingArtisanTx.status === 'COMPLETED') {
        console.log(`[PaymentService] Order already completed (tx exists): ${order._id}`);
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.status = 'confirmed';
          await order.save();
        }
        if (payment && payment.status !== 'Success') {
          payment.status = 'Success';
          payment.paymentGatewayId = payment.paymentGatewayId || metadataPayload?.reference || metadataObject?.reference;
          await payment.save();
        }
        return { success: true, message: 'Order already processed', order };
      }

      console.log(`[PaymentService] Proceeding with wallet/tx creation or completion for order: ${order._id}`);

      // Use stored earnings/commission if available, otherwise calculate
      const totalAmount = order.totalPrice || 0;
      const commissionRate = order.commissionRate || 0.10;
      
      let adminCommission = order.adminCommission;
      let artisanEarnings = order.artisanEarnings;

      // If not stored in order, calculate now
      if (adminCommission === undefined || artisanEarnings === undefined || adminCommission === 0) {
        adminCommission = Math.round(totalAmount * commissionRate * 100) / 100;
        artisanEarnings = Math.round((totalAmount - adminCommission) * 100) / 100;
      }

      console.log(`[PaymentService] Total: ${totalAmount}, Admin: ${adminCommission}, Artisan: ${artisanEarnings}`);

      // 3. Update Order Status
      order.paymentStatus = 'paid';
      order.status = 'Paid';
      order.paymentDate = new Date();
      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        status: 'Paid',
        date: new Date(),
        note: 'Payment confirmed via Chapa.'
      });
      order.adminCommission = adminCommission;
      order.artisanEarnings = artisanEarnings;

      // Decrease product stock
      try {
        await Product.findByIdAndUpdate(order.product, {
          $inc: { stock: -Math.abs(order.quantity || 1) }
        });
        console.log(`[PaymentService] Decreased stock for product ${order.product} by ${order.quantity}`);
      } catch (stockErr) {
        console.error(`[PaymentService] Failed to decrease stock for product ${order.product}:`, stockErr);
      }

      await order.save();
      console.log(`[PaymentService] Order status updated to paid`);

      // 4. Update or create Payment record for this order
      if (payment) {
        payment.status = 'Success';
        payment.orderId = payment.orderId || order._id;
        payment.userId = payment.userId || order.tourist;
        payment.amount = payment.amount || totalAmount;
        payment.method = payment.method || 'chapa';
        payment.paymentGatewayId = payment.paymentGatewayId || metadataPayload?.reference || metadataObject?.reference;
        payment.invoiceUrl = payment.invoiceUrl || metadataPayload?.checkout_url || metadataObject?.checkout_url;
        await payment.save();
        console.log(`[PaymentService] Payment record updated to Success`);
      } else {
        await Payment.create({
          userId: order.tourist,
          orderId: order._id,
          transactionRef: txRef,
          paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
          method: 'chapa',
          amount: totalAmount,
          status: 'Success',
          invoiceUrl: metadataPayload?.checkout_url || metadataObject?.checkout_url,
        });
        console.log(`[PaymentService] Payment record created for order: ${txRef}`);
      }

      // 5. Update Artisan Wallet
      const artisanId = order.artisan;
      console.log(`[PaymentService] Looking for artisan wallet with userId: ${artisanId}`);
      let artisanWallet = await Wallet.findOne({ userId: artisanId });
       
      if (!artisanWallet) {
        console.log(`[PaymentService] Creating new wallet for artisan: ${artisanId}`);
        artisanWallet = new Wallet({ 
          userId: artisanId, 
          userRole: 'artisan', 
          pendingBalance: 0, 
          availableBalance: 0, 
          lifetimeEarned: 0, 
          lifetimePaidOut: 0, 
          lifetimeRefunded: 0, 
          currency: 'ETB', 
        });
      }

      const originalPendingBalance = artisanWallet.pendingBalance || 0;
      artisanWallet.pendingBalance = originalPendingBalance + artisanEarnings;
      // artisanWallet.availableBalance = (artisanWallet.availableBalance || 0) + artisanEarnings; // MOVED TO DELIVERY VERIFICATION
      artisanWallet.lifetimeEarned = (artisanWallet.lifetimeEarned || 0) + artisanEarnings;
      await artisanWallet.save();
      console.log(`[PaymentService] Artisan wallet updated: ${artisanWallet._id}`, { availableBalance: artisanWallet.availableBalance, pendingBalance: artisanWallet.pendingBalance, lifetimeEarned: artisanWallet.lifetimeEarned });

      // 5. Create or finalize Transaction Record for Artisan
      const existingPendingArtisanTx = existingArtisanTx && existingArtisanTx.status !== 'COMPLETED' ? existingArtisanTx : null;
      if (existingPendingArtisanTx) {
        existingPendingArtisanTx.quantity = order.quantity;
        existingPendingArtisanTx.unitPrice = order.unitPrice;
        existingPendingArtisanTx.status = 'COMPLETED';
        existingPendingArtisanTx.metadata = {
          ...existingPendingArtisanTx.metadata,
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          completedAt: new Date(),
          paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
        };
        await existingPendingArtisanTx.save();
        console.log(`[PaymentService] Artisan pending transaction completed: ${existingPendingArtisanTx._id}`);
      } else {
        console.log(`[PaymentService] Creating artisan transaction...`);
        try {
          const artisanTx = await Transaction.create({
            walletId: artisanWallet._id,
            userId: artisanId,
            orderId: order._id,
            productId: order.product,
            quantity: order.quantity,
            unitPrice: order.unitPrice,
            type: 'ORDER_PAYMENT',
            amount: artisanEarnings,
            currency: 'ETB',
            status: 'COMPLETED',
            paymentRef: txRef,
            metadata: {
              orderId: order._id,
              productId: order.product,
              quantity: order.quantity,
              unitPrice: order.unitPrice,
              totalAmount,
              commissionRate,
              paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
              payerId: order.tourist,
              receiverId: artisanId,
              role: 'artisan'
            },
          });
          console.log(`[PaymentService] Artisan transaction created: ${artisanTx._id}`);
        } catch (txError: any) {
          console.error(`[PaymentService] ERROR creating artisan transaction:`, txError.message, txError);
        }
      }

      // 6. Update Admin Wallet
      if (!adminId) {
        console.error(`[PaymentService] No admin user found, cannot update admin wallet - SKIPPING admin transaction`);
      } else {
        console.log(`[PaymentService] Looking for admin wallet with userId: ${adminId}`);
        let adminWallet = await Wallet.findOne({ userId: adminId, userRole: 'admin' });
        if (!adminWallet && adminId) {
          console.log(`[PaymentService] Creating new admin wallet for admin: ${adminId}`);
          adminWallet = new Wallet({
            userId: adminId,
            userRole: 'admin',
            pendingBalance: 0,
            availableBalance: 0,
            lifetimeEarned: 0,
            lifetimePaidOut: 0,
            lifetimeRefunded: 0,
            currency: 'ETB',
          });
        }

        if (adminWallet) {
          const originalPendingAdmin = adminWallet.pendingBalance || 0;
          adminWallet.pendingBalance = originalPendingAdmin + adminCommission;
          // adminWallet.availableBalance = (adminWallet.availableBalance || 0) + adminCommission; // MOVED TO DELIVERY VERIFICATION
          // adminWallet.lifetimeEarned = (adminWallet.lifetimeEarned || 0) + adminCommission; // MOVED TO DELIVERY VERIFICATION
          await adminWallet.save();
          console.log(`[PaymentService] Admin wallet updated: ${adminWallet._id}`, { availableBalance: adminWallet.availableBalance, pendingBalance: adminWallet.pendingBalance, lifetimeEarned: adminWallet.lifetimeEarned });

          const existingAdminTx = await Transaction.findOne({
            walletId: adminWallet._id,
            paymentRef: txRef,
            orderId: order._id,
            type: 'ADMIN_COMMISSION',
            userId: adminId,
          });

          if (existingAdminTx && existingAdminTx.status !== 'COMPLETED') {
            existingAdminTx.quantity = order.quantity;
            existingAdminTx.unitPrice = order.unitPrice;
            existingAdminTx.status = 'COMPLETED';
            existingAdminTx.metadata = {
              ...existingAdminTx.metadata,
              quantity: order.quantity,
              unitPrice: order.unitPrice,
              completedAt: new Date(),
              paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
            };
            await existingAdminTx.save();
            console.log(`[PaymentService] Admin pending transaction completed: ${existingAdminTx._id}`);
          } else if (!existingAdminTx) {
            console.log(`[PaymentService] Creating admin transaction...`);
            try {
              const adminTx = await Transaction.create({
                walletId: adminWallet._id,
                userId: adminId,
                orderId: order._id,
                productId: order.product,
                quantity: order.quantity,
                unitPrice: order.unitPrice,
                type: 'ADMIN_COMMISSION',
                amount: adminCommission,
                currency: 'ETB',
                status: 'COMPLETED',
                paymentRef: txRef,
                metadata: {
                  orderId: order._id,
                  productId: order.product,
                  quantity: order.quantity,
                  unitPrice: order.unitPrice,
                  totalAmount,
                  commissionRate,
                  artisanId: order.artisan,
                  paymentGatewayId: metadataPayload?.reference || metadataObject?.reference,
                  payerId: order.tourist,
                  receiverId: adminId,
                  role: 'artisan'
                },
              });
              console.log(`[PaymentService] Admin transaction created: ${adminTx._id}`);
            } catch (txError: any) {
              console.error(`[PaymentService] ERROR creating admin transaction:`, txError.message, txError);
            }
          }
        }
      }

      return { success: true, order };
    }

    // 3. Process Booking Payment
    if (booking) {
      // Check if we've already processed this transaction for the organizer
      const existingOrganizerTx = await Transaction.findOne({ 
        paymentRef: txRef, 
        type: 'ORDER_PAYMENT',
        userId: booking.organizer
      });

      if (existingOrganizerTx) {
        console.log(`[PaymentService] Booking ${booking._id} already processed for organizer.`);
        
        // Ensure booking status is correct even if transaction exists
        if (booking.paymentStatus !== 'paid') {
          booking.paymentStatus = 'paid';
          booking.status = 'confirmed';
          await booking.save();
        }
        
        return { success: true, message: 'Booking already processed', booking };
      }

      const totalAmount = booking.totalPrice;
      const adminCommission = Math.round(totalAmount * COMMISSION_RATE * 100) / 100;
      const organizerEarnings = Math.round((totalAmount - adminCommission) * 100) / 100;

      // Update Booking
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      booking.paymentDate = new Date();
      booking.adminCommission = adminCommission;
      booking.organizerEarnings = organizerEarnings;
      booking.commissionRate = COMMISSION_RATE;
      if (metadata?.reference) booking.paymentReference = metadata.reference;
      await booking.save();

      // Update or create Payment record for this booking
      if (payment) {
        payment.status = 'Success';
        payment.bookingId = payment.bookingId || booking._id;
        payment.userId = payment.userId || booking.tourist;
        payment.amount = payment.amount || totalAmount;
        payment.method = payment.method || 'chapa';
        if (metadata?.reference) payment.paymentGatewayId = metadata.reference;
        await payment.save();
      } else {
        await Payment.create({
          userId: booking.tourist,
          bookingId: booking._id,
          transactionRef: txRef,
          paymentGatewayId: metadata?.reference,
          method: 'chapa',
          amount: totalAmount,
          status: 'Success',
        });
      }

      // Update Organizer Wallet
      const organizerId = booking.organizer;
      let organizerWallet = await Wallet.findOne({ userId: organizerId });
      if (!organizerWallet) {
        organizerWallet = new Wallet({
          userId: organizerId,
          userRole: 'organizer',
          pendingBalance: 0,
          availableBalance: 0,
          lifetimeEarned: 0,
          lifetimePaidOut: 0,
          lifetimeRefunded: 0,
          currency: 'ETB',
        });
      }
      organizerWallet.availableBalance = (organizerWallet.availableBalance || 0) + organizerEarnings;
      organizerWallet.lifetimeEarned = (organizerWallet.lifetimeEarned || 0) + organizerEarnings;
      await organizerWallet.save();

       // Create Organizer Transaction
        try {
          await Transaction.create({
            walletId: organizerWallet._id,
            userId: organizerId,
            bookingId: booking._id,
            type: 'ORDER_PAYMENT',
            amount: organizerEarnings,
            currency: 'ETB',
            status: 'COMPLETED',
            paymentRef: txRef,
            metadata: {
              bookingId: booking._id,
              totalAmount,
              commissionRate: COMMISSION_RATE,
              paymentGatewayId: metadata?.reference,
              payerId: booking.tourist,
              receiverId: organizerId,
              role: 'organizer'
            },
          });
        } catch (txError: any) {
          console.error(`[PaymentService] ERROR creating organizer transaction:`, txError.message, txError);
        }

      // Update Admin Wallet
      if (!adminId) {
        console.error(`[PaymentService] No admin user found, cannot update admin wallet for booking`);
      }
      
      let adminWallet = await Wallet.findOne({ userId: adminId, userRole: 'admin' });
      if (!adminWallet && adminId) {
        adminWallet = new Wallet({
          userId: adminId,
          userRole: 'admin',
          pendingBalance: 0,
          availableBalance: 0,
          lifetimeEarned: 0,
          lifetimePaidOut: 0,
          lifetimeRefunded: 0,
          currency: 'ETB',
        });
      }
      
      if (adminWallet) {
        adminWallet.availableBalance = (adminWallet.availableBalance || 0) + adminCommission;
        // adminWallet.lifetimeEarned = (adminWallet.lifetimeEarned || 0) + adminCommission; // MOVED TO BOOKING CONFIRMATION
        await adminWallet.save();
      }

        // Create Admin Transaction
        try {
          await Transaction.create({
            walletId: adminWallet?._id,
            userId: adminId,
            bookingId: booking._id,
            type: 'ADMIN_COMMISSION',
            amount: adminCommission,
            currency: 'ETB',
            status: 'COMPLETED',
            paymentRef: txRef,
            metadata: {
              bookingId: booking._id,
              totalAmount,
              commissionRate: COMMISSION_RATE,
              organizerId: organizerId,
              paymentGatewayId: metadata?.reference,
              payerId: booking.tourist,
              receiverId: adminId,
              role: 'organizer'
            },
          });
        } catch (txError: any) {
          console.error(`[PaymentService] ERROR creating admin transaction:`, txError.message, txError);
        }

      console.log(`[PaymentService] Successfully processed booking payment for ${txRef}`);
      return { success: true, booking };
    }

    return { success: false, message: 'Payment processing failed' };
  } catch (error: any) {
    console.error('[PaymentService] Error processing payment:', error);
    return { success: false, message: error.message };
  }
}

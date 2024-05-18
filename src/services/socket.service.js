const { socketAuthenticationMiddleware } = require('../middlewares/firebase-auth');

const notificationMessages = {
  verified: 'Order status was confirmed by the waiter',
  accepted: 'Kitchen has accepted the order status.',
  delivered: 'Changed order status to delivered by waiter',
  insert: 'New order received',
  delete: 'Order removed',
  completed: 'Order Bill paid',
};

class Socket {
  constructor(io) {
    this.io = io;
    io.use(socketAuthenticationMiddleware);

    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  handleConnection(socket) {
    console.log('Connected to WebSocket connection');

    const { _id } = socket.user;
    console.log({ _id });
    socket.join(`${_id}`);

    socket.on('disconnect', () => {
      console.log('Disconnected');
    });

    socket.on('error', (err) => {
      if (err && err.message === 'unauthorized event') {
        socket.disconnect();
      }
    });
  }

  sendNotification({ data, orderId, customer }) {
    try {
      console.log({ data });
      const { orderStatus } = data;
      const message = notificationMessages[orderStatus] || 'Order item status changed';

      console.log({ customer });
      this.sendNotificationToUser(customer, { orderId, message });
    } catch (error) {
      console.log(error);
    }
  }

  sendNotificationToUser(customer, sendData) {
    try {
      this.io.to(`${customer}`).emit('orderChanged', sendData);
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = Socket;

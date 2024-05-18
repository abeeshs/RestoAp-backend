/* eslint-disable no-unused-vars */
const { Order } = require('../models');
const { Socket } = require('../services');

const createSocketServer = (io) => {
  try {
    // connect socket
    const websocketServer = new Socket(io);
    // const orderStream = Order.watch([], { fullDocument: 'updateLookup' });

    // real-time order updates
    // orderStream.on('change', (change) => {
    //   const { documentKey, updateDescription, fullDocument, operationType } = change;

    //   if (operationType === 'update') {
    //     console.log({ customer: fullDocument.customer });
    //     data = updateDescription?.updatedFields;

    //     // send notification
    //     websocketServer.sendNotification({
    //       data,
    //       orderId: documentKey._id,
    //       customer: fullDocument?.customer,
    //     });
    //   }
    // });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { createSocketServer };

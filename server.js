const { PrismaClient } = require("@prisma/client");
const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = path.join(__dirname, "/proto/payments.proto");
const prisma = new PrismaClient();
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const paymentProto = grpc.loadPackageDefinition(packageDefinition).payment;

async function main() {
  async function insert(call, callback) {
    const paymentItem = {
      bookingId: call.request.bookingId,
      creditCardId: call.request.creditCardId,
      paymentStatus: "AGUARDO",
    };
    const payment = await prisma.payment.create({
      data: paymentItem,
    });
    if (payment) {
      callback(null, { paymentId: payment.paymentId });
    } else {
      callback({
        message: "Payment not found",
        code: grpc.status.INVALID_ARGUMENT,
      });
    }
  }

  async function find(call, callback) {
    const id = call.request.paymentId;
    const payment = await prisma.payment.findUnique({
      where: {
        paymentId: id,
      },
    });
    if (payment) {
      callback(null, { payment: payment });
    } else {
      callback({
        message: "Payment not found",
        code: grpc.status.NOT_FOUND,
      });
    }
  }

  async function list(call, callback) {
    const payments = await prisma.payment.findMany();
    if (payments) {
      callback(null, { payments: payments });
    } else {
      callback({
        message: "There are no payments in the database",
        code: grpc.status.NOT_FOUND,
      });
    }
  }

  async function update(call, callback) {
    const params = ({ paymentId, bookingId, creditCardId, paymentStatus } =
      call.request);
    let updatedObj = {};
    for (let param in params) {
      if (params[param]) {
        updatedObj[param] = params[param];
      }
    }
    const updatedPayment = await prisma.payment.update({
      data: updatedObj,
      where: {
        paymentId: paymentId,
      },
    });
    if (updatedPayment) {
      callback(null, { payment: updatedPayment });
    } else {
      callback({
        message: "Payment not found",
        code: grpc.status.NOT_FOUND,
      });
    }
  }

  async function remove(call, callback) {
    const id = call.request.paymentId;
    const deletedPayment = await prisma.payment.delete({
      where: {
        paymentId: id,
      },
    });
    if (deletedPayment) {
      callback({
        message: "Payment deleted successfully",
        code: grpc.status.OK,
      });
    } else {
      callback({
        message: "Payment not found",
        code: grpc.status.NOT_FOUND,
      });
    }
  }

  const server = new grpc.Server();
  server.addService(paymentProto.PaymentService.service, {
    insert: insert,
    find: find,
    list: list,
    update: update,
    remove: remove,
  });
  server.bindAsync(
    "localhost:50053",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) throw err;
      server.start();
    }
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

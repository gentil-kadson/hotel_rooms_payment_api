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

  const server = new grpc.Server();
  server.addService(paymentProto.PaymentService.service, {
    insert: insert,
  });
  server.bindAsync(
    "localhost:50051",
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
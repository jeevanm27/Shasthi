import { Kafka, Partitioners } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'user-service',
  brokers:  (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

let connected = false;

/**
 * Connect the Kafka producer. Call once on application startup.
 */
export async function connectProducer() {
  if (connected) return;
  await producer.connect();
  connected = true;
  console.log('[kafka] Producer connected');
}

/**
 * Disconnect the Kafka producer. Call on application shutdown.
 */
export async function disconnectProducer() {
  if (!connected) return;
  await producer.disconnect();
  connected = false;
  console.log('[kafka] Producer disconnected');
}

/**
 * Publish an order-created event to Kafka.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.userEmail
 * @param {Array}  params.items       - [{ productId, productName, quantityGrams, pricePerGram }]
 * @param {number} params.totalPrice
 * @returns {string} eventId (UUID)
 */
export async function sendOrderCreated({ userId, userEmail, items, totalPrice }) {
  const eventId = uuidv4();

  const payload = {
    eventId,
    userId,
    userEmail,
    items,
    totalPrice,
    createdAt: new Date().toISOString(),
  };

  await producer.send({
    topic: 'order-created',
    messages: [
      {
        key:   userId,                        // partition by userId for ordering
        value: JSON.stringify(payload),
      },
    ],
  });

  console.log(`[kafka] Emitted order-created | eventId=${eventId} | userId=${userId}`);
  return eventId;
}

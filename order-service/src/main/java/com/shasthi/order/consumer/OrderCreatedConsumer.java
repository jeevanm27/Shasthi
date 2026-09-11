package com.shasthi.order.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shasthi.order.model.OrderCreatedEvent;
import com.shasthi.order.service.OrderService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
public class OrderCreatedConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderCreatedConsumer.class);

    private final OrderService  orderService;
    private final ObjectMapper  objectMapper;

    public OrderCreatedConsumer(OrderService orderService, ObjectMapper objectMapper) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    /**
     * Kafka listener for the 'order-created' topic.
     *
     * ack-mode = MANUAL_IMMEDIATE:
     * - The offset is committed (ack.acknowledge()) ONLY after successful processing.
     * - If processing throws, the offset is NOT committed -> Kafka re-delivers the message.
     * - Combined with the idempotency key (event_id UNIQUE), re-delivery is safe.
     */
    @KafkaListener(topics = "order-created", groupId = "${KAFKA_GROUP_ID:order-service-group}")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String rawValue = record.value();
        log.debug("[kafka] Received order-created | partition={} offset={}", record.partition(), record.offset());

        try {
            OrderCreatedEvent event = objectMapper.readValue(rawValue, OrderCreatedEvent.class);
            orderService.processOrder(event);

            //  Acknowledge AFTER successful processing 
            ack.acknowledge();
            log.info("[kafka] ACK'd offset {} for eventId={}", record.offset(), event.getEventId());

        } catch (Exception ex) {
            // Log and do NOT acknowledge -> Kafka will re-deliver
            log.error("[kafka] Failed to process order-created at offset={}: {}",
                    record.offset(), ex.getMessage(), ex);
            // TODO: After max retries, route to a Dead Letter Topic (DLT)
        }
    }
}

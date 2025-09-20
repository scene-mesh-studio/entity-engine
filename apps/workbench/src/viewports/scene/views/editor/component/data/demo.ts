export const cepDemoData = {
  nodes: [
    {
      name: 'afterSaleGroup',
      quantifier: {
        consumingStrategy: 'SKIP_TILL_NEXT',
        innerConsumingStrategy: 'SKIP_TILL_NEXT',
        properties: ['TIMES'],
      },
      condition: null,
      graph: {
        nodes: [
          {
            name: 'post-purchase',
            quantifier: {
              consumingStrategy: 'SKIP_TILL_NEXT',
              innerConsumingStrategy: 'SKIP_TILL_NEXT',
              properties: ['SINGLE', 'OPTIONAL'],
            },
            condition: {
              expression:
                "event.eventType == 'review_product' || event.eventType == 'customer_service_contact'",
              type: 'AVIATOR',
            },
            times: null,
            untilCondition: null,
            window: null,
            afterMatchSkipStrategy: {
              type: 'NO_SKIP',
              patternName: null,
            },
            type: 'ATOMIC',
          },
          {
            name: 'delivery-received',
            quantifier: {
              consumingStrategy: 'SKIP_TILL_NEXT',
              innerConsumingStrategy: 'SKIP_TILL_NEXT',
              properties: ['SINGLE'],
            },
            condition: {
              expression: "event.eventType == 'delivery_confirmed'",
              type: 'AVIATOR',
            },
            times: null,
            untilCondition: null,
            window: null,
            afterMatchSkipStrategy: {
              type: 'NO_SKIP',
              patternName: null,
            },
            type: 'ATOMIC',
          },
          {
            name: 'order-tracking',
            quantifier: {
              consumingStrategy: 'STRICT',
              innerConsumingStrategy: 'SKIP_TILL_NEXT',
              properties: ['SINGLE'],
            },
            condition: {
              expression: "event.eventType == 'track_order'",
              type: 'AVIATOR',
            },
            times: null,
            untilCondition: null,
            window: null,
            afterMatchSkipStrategy: {
              type: 'NO_SKIP',
              patternName: null,
            },
            type: 'ATOMIC',
          },
        ],
        edges: [
          {
            source: 'delivery-received',
            target: 'post-purchase',
            type: 'SKIP_TILL_NEXT',
          },
          {
            source: 'order-tracking',
            target: 'delivery-received',
            type: 'SKIP_TILL_NEXT',
          },
        ],
      },
      times: {
        from: 1,
        to: 5,
        windowTime: null,
      },
      untilCondition: null,
      window: {
        type: 'FIRST_AND_LAST',
        time: {
          unit: 'DAYS',
          size: 7,
        },
      },
      afterMatchSkipStrategy: {
        type: 'NO_SKIP',
        patternName: null,
      },
      type: 'COMPOSITE',
    },
    {
      name: 'shoppingFlowGroup',
      quantifier: {
        consumingStrategy: 'STRICT',
        innerConsumingStrategy: 'SKIP_TILL_NEXT',
        properties: ['SINGLE'],
      },
      condition: null,
      graph: {
        nodes: [
          {
            name: 'checkoutGroup',
            quantifier: {
              consumingStrategy: 'SKIP_TILL_NEXT',
              innerConsumingStrategy: 'SKIP_TILL_NEXT',
              properties: ['SINGLE'],
            },
            condition: null,
            graph: {
              nodes: [
                {
                  name: 'order-confirmation',
                  quantifier: {
                    consumingStrategy: 'SKIP_TILL_NEXT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['SINGLE'],
                  },
                  condition: {
                    expression: "event.eventType == 'order_confirmed'",
                    type: 'AVIATOR',
                  },
                  times: null,
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
                {
                  name: 'payment-processing',
                  quantifier: {
                    consumingStrategy: 'SKIP_TILL_NEXT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['SINGLE'],
                  },
                  condition: {
                    expression: "event.eventType == 'process_payment'",
                    type: 'AVIATOR',
                  },
                  times: null,
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
                {
                  name: 'shipping-selection',
                  quantifier: {
                    consumingStrategy: 'SKIP_TILL_NEXT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['SINGLE'],
                  },
                  condition: {
                    expression: "event.eventType == 'select_shipping'",
                    type: 'AVIATOR',
                  },
                  times: null,
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
                {
                  name: 'start-checkout',
                  quantifier: {
                    consumingStrategy: 'STRICT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['SINGLE'],
                  },
                  condition: {
                    expression: "event.eventType == 'start_checkout'",
                    type: 'AVIATOR',
                  },
                  times: null,
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
              ],
              edges: [
                {
                  source: 'payment-processing',
                  target: 'order-confirmation',
                  type: 'SKIP_TILL_NEXT',
                },
                {
                  source: 'shipping-selection',
                  target: 'payment-processing',
                  type: 'SKIP_TILL_NEXT',
                },
                {
                  source: 'start-checkout',
                  target: 'shipping-selection',
                  type: 'SKIP_TILL_NEXT',
                },
              ],
            },
            times: null,
            untilCondition: null,
            window: {
              type: 'FIRST_AND_LAST',
              time: {
                unit: 'MINUTES',
                size: 15,
              },
            },
            afterMatchSkipStrategy: {
              type: 'NO_SKIP',
              patternName: null,
            },
            type: 'COMPOSITE',
          },
          {
            name: 'cartGroup',
            quantifier: {
              consumingStrategy: 'SKIP_TILL_NEXT',
              innerConsumingStrategy: 'SKIP_TILL_NEXT',
              properties: ['SINGLE'],
            },
            condition: null,
            graph: {
              nodes: [
                {
                  name: 'cart-review',
                  quantifier: {
                    consumingStrategy: 'SKIP_TILL_NEXT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['SINGLE'],
                  },
                  condition: {
                    expression: "event.eventType == 'view_cart'",
                    type: 'AVIATOR',
                  },
                  times: null,
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
                {
                  name: 'modify-cart',
                  quantifier: {
                    consumingStrategy: 'SKIP_TILL_NEXT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['SINGLE', 'OPTIONAL'],
                  },
                  condition: {
                    expression:
                      "event.eventType == 'cart_update' && (event.properties.action == 'quantity_change' || event.properties.action == 'remove_item')",
                    type: 'AVIATOR',
                  },
                  times: null,
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
                {
                  name: 'add-items',
                  quantifier: {
                    consumingStrategy: 'STRICT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['SINGLE'],
                  },
                  condition: {
                    expression: "event.eventType == 'add_to_cart'",
                    type: 'AVIATOR',
                  },
                  times: null,
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
              ],
              edges: [
                {
                  source: 'modify-cart',
                  target: 'cart-review',
                  type: 'SKIP_TILL_NEXT',
                },
                {
                  source: 'add-items',
                  target: 'modify-cart',
                  type: 'SKIP_TILL_NEXT',
                },
              ],
            },
            times: null,
            untilCondition: null,
            window: null,
            afterMatchSkipStrategy: {
              type: 'NO_SKIP',
              patternName: null,
            },
            type: 'COMPOSITE',
          },
          {
            name: 'browsingGroup',
            quantifier: {
              consumingStrategy: 'STRICT',
              innerConsumingStrategy: 'SKIP_TILL_NEXT',
              properties: ['SINGLE'],
            },
            condition: null,
            graph: {
              nodes: [
                {
                  name: 'compare-products',
                  quantifier: {
                    consumingStrategy: 'SKIP_TILL_NEXT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['SINGLE', 'OPTIONAL'],
                  },
                  condition: {
                    expression:
                      "event.eventType == 'compare' && event.properties.productCount >= 2",
                    type: 'AVIATOR',
                  },
                  times: null,
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
                {
                  name: 'product-view',
                  quantifier: {
                    consumingStrategy: 'SKIP_TILL_NEXT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['LOOPING'],
                  },
                  condition: {
                    expression: "event.eventType == 'view_product'",
                    type: 'AVIATOR',
                  },
                  times: {
                    from: 3,
                    to: 3,
                    windowTime: null,
                  },
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
                {
                  name: 'product-search',
                  quantifier: {
                    consumingStrategy: 'STRICT',
                    innerConsumingStrategy: 'SKIP_TILL_NEXT',
                    properties: ['SINGLE'],
                  },
                  condition: {
                    expression:
                      "event.eventType == 'search' && event.properties.category == 'electronics'",
                    type: 'AVIATOR',
                  },
                  times: null,
                  untilCondition: null,
                  window: null,
                  afterMatchSkipStrategy: {
                    type: 'NO_SKIP',
                    patternName: null,
                  },
                  type: 'ATOMIC',
                },
              ],
              edges: [
                {
                  source: 'product-view',
                  target: 'compare-products',
                  type: 'SKIP_TILL_NEXT',
                },
                {
                  source: 'product-search',
                  target: 'product-view',
                  type: 'SKIP_TILL_NEXT',
                },
              ],
            },
            times: null,
            untilCondition: null,
            window: null,
            afterMatchSkipStrategy: {
              type: 'NO_SKIP',
              patternName: null,
            },
            type: 'COMPOSITE',
          },
        ],
        edges: [
          {
            source: 'cartGroup',
            target: 'checkoutGroup',
            type: 'SKIP_TILL_NEXT',
          },
          {
            source: 'browsingGroup',
            target: 'cartGroup',
            type: 'SKIP_TILL_NEXT',
          },
        ],
      },
      times: null,
      untilCondition: null,
      window: null,
      afterMatchSkipStrategy: {
        type: 'NO_SKIP',
        patternName: null,
      },
      type: 'COMPOSITE',
    },
    {
      name: 'add-items-222',
      quantifier: {
        consumingStrategy: 'STRICT',
        innerConsumingStrategy: 'SKIP_TILL_NEXT',
        properties: ['SINGLE'],
      },
      condition: {
        expression: "event.eventType == 'add_to_cart'",
        type: 'AVIATOR',
      },
      times: null,
      untilCondition: null,
      window: null,
      afterMatchSkipStrategy: {
        type: 'NO_SKIP',
        patternName: null,
      },
      type: 'ATOMIC',
    },
  ],
  edges: [
    {
      source: 'shoppingFlowGroup',
      target: 'afterSaleGroup',
      type: 'SKIP_TILL_NEXT',
    },
    {
      source: 'afterSaleGroup',
      target: 'add-items-222',
      type: 'SKIP_TILL_NEXT',
    },
  ],
};

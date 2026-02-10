;; subscription-channel.clar
;; Bitcoin subscriptions via x402 on Stacks - BitSubs

;; Error codes
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-UNAUTHORIZED (err u403))
(define-constant ERR-INSUFFICIENT-BALANCE (err u402))
(define-constant ERR-CHANNEL-EXISTS (err u409))

;; Constants for force-close timeout
(define-constant FORCE-CLOSE-TIMEOUT u10)  ;; 10 blocks for testing
;; In production, use: (define-constant FORCE-CLOSE-TIMEOUT u1008) ;; ~7 days

;; Channel state (STX only for Day 1-4)
(define-map channels
  { subscriber: principal, service: principal }
  {
    deposit: uint,              ;; Original deposit amount (microSTX)
    rate-per-block: uint,       ;; Payment rate (microSTX per block)
    opened-at: uint             ;; Block height when opened
  }
)

;; Service registry (optional for future use)
(define-map services
  principal
  { active: bool }
)

;; Open a subscription channel
(define-public (open-channel
  (service principal)
  (deposit uint)
  (rate-per-block uint))
  (let (
    (channel-key { subscriber: tx-sender, service: service })
  )
    ;; Verify channel doesn't exist
    (asserts! (is-none (map-get? channels channel-key)) ERR-CHANNEL-EXISTS)

    ;; Transfer STX to contract (from user to contract)
    (try! (stx-transfer? deposit tx-sender (as-contract tx-sender)))

    ;; Create channel
    (ok (map-set channels channel-key {
      deposit: deposit,
      rate-per-block: rate-per-block,
      opened-at: block-height
    }))
  )
)

;; Verify subscription is active (READ-ONLY - NO WRITES)
(define-read-only (verify-payment
  (subscriber principal)
  (service principal))
  (let (
    (channel-key { subscriber: subscriber, service: service })
    (channel-data (unwrap! (map-get? channels channel-key) ERR-NOT-FOUND))
    (elapsed-blocks (- block-height (get opened-at channel-data)))
    (consumed-raw (* elapsed-blocks (get rate-per-block channel-data)))
    ;; CRITICAL: Prevent underflow
    (consumed (if (> consumed-raw (get deposit channel-data))
                  (get deposit channel-data)
                  consumed-raw))
    (remaining (- (get deposit channel-data) consumed))
  )
    (ok {
      active: (> remaining u0),
      remaining: remaining,
      deposit: (get deposit channel-data),
      rate: (get rate-per-block channel-data),
      opened-at: (get opened-at channel-data)
    })
  )
)

;; Close channel and settle balances
(define-public (close-channel (service principal))
  (let (
    (subscriber tx-sender)  ;; Save subscriber before as-contract
    (channel-key { subscriber: tx-sender, service: service })
    (channel-data (unwrap! (map-get? channels channel-key) ERR-NOT-FOUND))
    (elapsed-blocks (- block-height (get opened-at channel-data)))
    (consumed-raw (* elapsed-blocks (get rate-per-block channel-data)))
    (consumed (if (> consumed-raw (get deposit channel-data))
                  (get deposit channel-data)
                  consumed-raw))
    (remaining (- (get deposit channel-data) consumed))
  )
    ;; Transfer remaining balance back to subscriber
    (if (> remaining u0)
        (try! (as-contract (stx-transfer? remaining tx-sender subscriber)))
        true)

    ;; Transfer earned amount to service provider
    (if (> consumed u0)
        (try! (as-contract (stx-transfer? consumed tx-sender service)))
        true)

    ;; Delete channel
    (map-delete channels channel-key)

    (ok { consumed: consumed, refunded: remaining })
  )
)

;; Force close if service provider unresponsive
(define-public (force-close-channel (subscriber principal) (service principal))
  (let (
    (channel-key { subscriber: subscriber, service: service })
    (channel-data (unwrap! (map-get? channels channel-key) ERR-NOT-FOUND))
    (elapsed-blocks (- block-height (get opened-at channel-data)))
  )
    ;; Can only force-close after timeout
    (asserts! (>= elapsed-blocks FORCE-CLOSE-TIMEOUT) ERR-UNAUTHORIZED)

    ;; Calculate settlement same as regular close
    (let (
      (consumed-raw (* elapsed-blocks (get rate-per-block channel-data)))
      (consumed (if (> consumed-raw (get deposit channel-data))
                    (get deposit channel-data)
                    consumed-raw))
      (remaining (- (get deposit channel-data) consumed))
    )
      ;; Transfer remaining to subscriber
      (if (> remaining u0)
          (try! (as-contract (stx-transfer? remaining tx-sender subscriber)))
          true)

      ;; Transfer earned to service
      (if (> consumed u0)
          (try! (as-contract (stx-transfer? consumed tx-sender service)))
          true)

      ;; Delete channel
      (map-delete channels channel-key)

      (ok { consumed: consumed, refunded: remaining })
    )
  )
)

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

;; sBTC token principal (testnet - for demo purposes)
;; In production, use actual sBTC contract address
(define-constant SBTC-TOKEN 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token)

;; Channel state (supports both STX and sBTC)
(define-map channels
  { subscriber: principal, service: principal }
  {
    deposit: uint,              ;; Original deposit amount
    rate-per-block: uint,       ;; Payment rate per block
    opened-at: uint,            ;; Block height when opened
    token: (string-ascii 10)    ;; Token type: "STX" or "sBTC"
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
      opened-at: block-height,
      token: "STX"
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

;; ============================================
;; sBTC Support Functions
;; ============================================

;; Open subscription channel with sBTC
;; Note: For testnet demo, sBTC contract may not be available
;; In production, this will use the actual sBTC SIP-010 token
(define-public (open-channel-sbtc
  (service principal)
  (deposit uint)
  (rate-per-block uint))
  (let (
    (channel-key { subscriber: tx-sender, service: service })
  )
    ;; Verify channel doesn't exist
    (asserts! (is-none (map-get? channels channel-key)) ERR-CHANNEL-EXISTS)

    ;; Note: sBTC transfer would happen here via contract-call
    ;; For now, we'll use STX as placeholder for testnet demo
    ;; In production: (try! (contract-call? .sbtc-token transfer deposit tx-sender (as-contract tx-sender) none))
    (try! (stx-transfer? deposit tx-sender (as-contract tx-sender)))

    ;; Create channel with sBTC token type
    (ok (map-set channels channel-key {
      deposit: deposit,
      rate-per-block: rate-per-block,
      opened-at: block-height,
      token: "sBTC"
    }))
  )
)

;; Close sBTC channel and settle
(define-public (close-channel-sbtc (service principal))
  (let (
    (subscriber tx-sender)
    (channel-key { subscriber: tx-sender, service: service })
    (channel-data (unwrap! (map-get? channels channel-key) ERR-NOT-FOUND))
    (elapsed-blocks (- block-height (get opened-at channel-data)))
    (consumed-raw (* elapsed-blocks (get rate-per-block channel-data)))
    (consumed (if (> consumed-raw (get deposit channel-data))
                  (get deposit channel-data)
                  consumed-raw))
    (remaining (- (get deposit channel-data) consumed))
  )
    ;; Verify this is an sBTC channel
    (asserts! (is-eq (get token channel-data) "sBTC") ERR-UNAUTHORIZED)

    ;; Transfer remaining sBTC back to subscriber
    ;; For testnet demo using STX, in production use sBTC contract
    (if (> remaining u0)
        (try! (as-contract (stx-transfer? remaining tx-sender subscriber)))
        true)

    ;; Transfer earned sBTC to service
    (if (> consumed u0)
        (try! (as-contract (stx-transfer? consumed tx-sender service)))
        true)

    ;; Delete channel
    (map-delete channels channel-key)

    (ok { consumed: consumed, refunded: remaining })
  )
)

;; Get channel info (works for both STX and sBTC)
(define-read-only (get-channel-info
  (subscriber principal)
  (service principal))
  (let (
    (channel-key { subscriber: subscriber, service: service })
    (channel-data (unwrap! (map-get? channels channel-key) ERR-NOT-FOUND))
  )
    (ok {
      deposit: (get deposit channel-data),
      rate-per-block: (get rate-per-block channel-data),
      opened-at: (get opened-at channel-data),
      token: (get token channel-data)
    })
  )
)

# Vencimiento lives on the item variant, and only purchases write it

Physical expiry dates belong to batches: two deliveries of the same SKU expire on
different days. We nonetheless keep a single optional `expiration_date` on the item
variant, meaning *the date printed on the most recently received batch*. A proper
`batches` table was the alternative and was rejected: it turns stock from one integer
into a sum of lots, forces the POS to deduct first-expired-first-out, and drags
purchases, corrections and returns into lot targeting — a large amount of machinery
for a store that generally sells a delivery down before the next one arrives.

The consequence we accept: while two batches overlap on the shelf, the variant shows
the newer date and the older units go unflagged. This is bounded by suppressing the
cue entirely at zero stock, so a date never outlives the goods it describes.

The date is written **only** by the purchase path — the moment the operator is
physically holding the box. Defining a product cannot set it, and
`productRepository.Update` deliberately re-stamps the stored dates over whatever the
product form sends, because `FullSaveAssociations` would otherwise wipe every date on
an unrelated edit like a rename. Inline editing on the inventory row exists purely to
correct a typo, not as a second creation path.

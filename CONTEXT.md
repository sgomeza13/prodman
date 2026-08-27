# Prodman

Inventory and point-of-sale for a single Colombian veterinary store. Prices are held ex-IVA;
stock, purchases and sales all resolve to the item variant.

## Language

### Catalogue

**Product**:
The shared identity of a good — name, description, brand, category. Holds no stock and no price.
_Avoid_: Item, article

**Item Variant**:
One sellable version of a product, identified by SKU, carrying the stock, the prices and the
expiry. "Croquetas Adulto 3kg" is a variant of "Croquetas Adulto".
_Avoid_: Item, SKU (the SKU is a field on the variant, not the thing itself)

**Sizing**:
The label that distinguishes one variant from its siblings — `1kg`, `3kg`, `Grande`.
_Avoid_: Size, presentation

### Stock movement

**Purchase**:
One receipt of stock into a variant: a quantity at a unit cost, from a provider. Purchases are
history and survive deletion of the product they refer to.
_Avoid_: Restock, entry, intake

**Sale**:
One till transaction, holding snapshotted line items so history survives catalogue changes.
_Avoid_: Order, invoice, receipt (the receipt is the printed artefact of a sale)

**Provider**:
A business the store buys from, quoting prices per variant.
_Avoid_: Supplier, vendor, distributor

### Vencimiento (expiry)

**Vencimiento**:
The expiry date of a variant's stock, meaning **the date printed on the most recently received
batch** — not the earliest date physically on the shelf. Optional; absent means the goods do not
expire. Recorded when stock is received, never as part of defining the product.
_Avoid_: Caducidad, fecha límite, best-before

**Vigente**:
A variant whose vencimiento is beyond the aviso window, or which has none. Carries no visual cue.
_Avoid_: OK, fresh, good, valid

**Por vencer**:
A variant holding stock whose vencimiento falls within the aviso window. Amber cue.
_Avoid_: Expiring, near-expiry, próximo a vencer

**Vencido**:
A variant holding stock whose vencimiento has passed. Red cue.
_Avoid_: Expired, caducado, dead stock

**Días de aviso**:
Store-wide number of days before a vencimiento at which a variant becomes *por vencer*. Zero means
no advance warning: stock is flagged only from its vencimiento onward.
_Avoid_: Warning window, threshold, alert days

A variant holding no stock is neither *por vencer* nor *vencido*: its vencimiento describes goods
that have left the building.

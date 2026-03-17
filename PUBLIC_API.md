# Gym Pocket — Public API

A read-only JSON API for querying the products and recipes stored in Gym Pocket.

---

## Authentication

Authentication is **optional** and controlled by the `ALLOW_ENDPOINTS` environment variable.

| `ALLOW_ENDPOINTS` value | Behaviour |
|------------------------|-----------|
| Not set or `false` | All requests are accepted with no key required |
| `true` | Every request must include a valid API key matching `ENDPOINT_SECRET_KEY` |

### Supplying the API key (when required)

Pass the key using **any one** of the following methods:

```
# HTTP header (recommended)
x-api-key: <your-key>

# Authorization header
Authorization: Bearer <your-key>

# Query parameter
GET /api/public/products?key=<your-key>
```

### Error responses when auth fails

```json
{ "error": "Unauthorized: invalid or missing API key" }
```
HTTP status: `401`

---

## Endpoints

### `GET /api/public/products`

Returns all products.

**Response** — array of product objects:

```json
[
  {
    "id": "uuid",
    "name": "Chicken Breast",
    "type": "product",
    "calories": 165,
    "carbs_g": 0,
    "protein_g": 31,
    "fats_g": 3.6,
    "measure_g": 100
  }
]
```

> **`measure_g`** is `100` by default (values are per 100 g).
> If the product has a serving size configured, `measure_g` equals that serving size and all nutrition values are scaled to that serving accordingly.

---

### `GET /api/public/recipes`

Returns all recipes with their **total** nutrition (for the whole recipe batch).

**Response** — array of recipe objects:

```json
[
  {
    "id": "uuid",
    "name": "Protein Pancakes",
    "type": "recipe",
    "calories": 520.5,
    "carbs_g": 48.2,
    "protein_g": 42.1,
    "fats_g": 14.3,
    "measure_g": 380
  }
]
```

> **`measure_g`** is the total weight of the recipe in grams (sum of all ingredients).
> Nutrition values represent the totals for that entire weight.

---

### `GET /api/public/all`

Returns products and recipes combined in a single array, sorted alphabetically within each group (products first, then recipes).

**Response** — array mixing both types:

```json
[
  {
    "id": "uuid",
    "name": "Banana",
    "type": "product",
    "calories": 89,
    "carbs_g": 22.8,
    "protein_g": 1.1,
    "fats_g": 0.3,
    "measure_g": 100
  },
  {
    "id": "uuid",
    "name": "Protein Pancakes",
    "type": "recipe",
    "calories": 520.5,
    "carbs_g": 48.2,
    "protein_g": 42.1,
    "fats_g": 14.3,
    "measure_g": 380
  }
]
```

Use the `"type"` field (`"product"` | `"recipe"`) to distinguish between the two.

---

## Response fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `name` | string | Display name |
| `type` | `"product"` \| `"recipe"` | Item type |
| `calories` | number | Total calories for `measure_g` |
| `carbs_g` | number | Total carbohydrates in grams for `measure_g` |
| `protein_g` | number | Total protein in grams for `measure_g` |
| `fats_g` | number | Total fat in grams for `measure_g` |
| `measure_g` | number | The gram amount that the nutrition values represent |

All numeric nutrition values are rounded to 1 decimal place.

---

## Environment variables

Add these to your `.env.local`:

```env
# Optional: set to "true" to require an API key on public endpoints
ALLOW_ENDPOINTS=true

# Required when ALLOW_ENDPOINTS=true — the secret key clients must send
ENDPOINT_SECRET_KEY=your-secret-key-here
```

---

## HTTP status codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `401` | Missing or invalid API key |
| `500` | Server misconfiguration or database error |

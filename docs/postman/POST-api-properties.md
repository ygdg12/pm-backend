# POST /api/properties

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/properties
- Auth: Bearer manager token
- Content-Type: multipart/form-data

## Required fields (all must be present)

| Human label | Form field | Notes |
|-------------|------------|--------|
| Name of compound | `name_of_compound` | Text, non-empty |
| Name of property owner | `owner_name` | Text, non-empty |
| Street address | `street_address` | Text, non-empty |
| Square meters & lease price | `units` (required) | **Text** field (not File). Value must be a **JSON array string**, e.g. `[{"unit_label":"A1","square_meters":120,"lease_price":15000}]`. Alternate names: `property_units`, `unitList`. |
| Images | `images`, `image`, `photos`, etc. | At least **one** `image/*` file. Up to **10** files; any multipart **File** field name is accepted (Insomnia often uses `file`). |

### Example `units` value (string in multipart)

```json
[{"unit_label":"A1","square_meters":120,"lease_price":15000,"availability":true}]
```

## Body
```
name_of_compound, owner_name, street_address, units (JSON string), image files (any field names, e.g. images or file — max 10, image/* only)
```

## Expected Result
- **201** when all required fields are valid.
- **400** if anything is missing (error message lists what failed).

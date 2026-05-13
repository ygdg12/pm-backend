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
| Square meters & lease price | `units` | JSON array string; at least **one** unit, each with `unit_label`, `square_meters` (>0), `lease_price` (>0) |
| Images | `images` | At least **one** file (field name `images`; can add more up to 10) |

### Example `units` value (string in multipart)

```json
[{"unit_label":"A1","square_meters":120,"lease_price":15000,"availability":true}]
```

## Body
```
name_of_compound, owner_name, street_address, units (JSON string), images (file, at least 1)
```

## Expected Result
- **201** when all required fields are valid.
- **400** if anything is missing (error message lists what failed).

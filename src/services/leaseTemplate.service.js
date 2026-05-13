function renderLeaseHtml({ tenant, property, unit }) {
  const template = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Lease Agreement</title>
  </head>
  <body style="font-family: Arial, sans-serif; color:#111;">
    <h2>Digital Lease Agreement</h2>
    <p><b>Tenant:</b> {{tenant.fullName}} (Kebele ID: {{tenant.kebeleId}})</p>
    <p><b>Email:</b> {{tenant.email}}</p>
    <hr/>
    <h3>Property</h3>
    <p><b>Compound:</b> {{property.name_of_compound}}</p>
    <p><b>Owner:</b> {{property.owner_name}}</p>
    <p><b>Address:</b> {{property.street_address}}</p>
    <p><b>Unit:</b> {{unit.unit_label}}</p>
    <p><b>Size:</b> {{unit.square_meters}} sqm</p>
    <p><b>Lease Price:</b> {{unit.lease_price}}</p>
    <hr/>
    <p><b>Created at:</b> {{now}}</p>

    <h3>Signatures</h3>
    <p><b>Tenant Signature:</b> ____________________________</p>
    <p><b>Property Manager Signature:</b> ____________________________</p>
    <p style="font-size: 12px; color:#555;">This lease is digitally signed within the platform workflow.</p>
  </body>
</html>
`.trim();

  // Lazy import: handlebars is only used here.
  const handlebars = require("handlebars");
  const compile = handlebars.compile(template);
  return compile({
    tenant,
    property,
    unit,
    now: new Date().toISOString(),
  });
}

module.exports = { renderLeaseHtml };

